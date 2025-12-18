const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const GameState = require('../models/GameState');
const User = require('../models/User');
const { 
  sendWithdrawalSubmittedNotification
} = require('../services/notificationService');

// In-memory lock implementation
const locks = new Map();

const acquireLock = async (lockKey, timeoutMs = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (!locks.has(lockKey)) {
      locks.set(lockKey, Date.now());
      return true;
    }
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return false; // Failed to acquire lock within timeout
};

const releaseLock = async (lockKey) => {
  locks.delete(lockKey);
};

// @route   GET /api/transactions/:userId
// @desc    Get transactions for user
// @access  Public (should be protected in production)
router.get('/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        address: t.address,
        cryptoAddress: t.cryptoAddress,
        notes: t.notes,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// @route   POST /api/transactions/withdraw
// @desc    Create withdrawal request and deduct flowers or BVR
// @access  Public (should be protected in production)
router.post('/withdraw', async (req, res) => {
  let transactionCreated = null;
  try {
    const { userId, amount, currency, address, cryptoAddress, type } = req.body;

    if (!userId || !amount || !currency || (!address && !cryptoAddress)) {
      console.error('🟥 Missing required fields', { userId, amount, currency, address, cryptoAddress });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (userId, amount, currency, and address/cryptoAddress)'
      });
    }

    // Get game state to check balance
    const gameState = await GameState.findOne({ userId });
    if (!gameState) {
      console.error('🟥 Game state not found for userId:', userId);
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Determine what to deduct based on currency and CHECK BALANCE
    if (currency === 'BVR') {
      if (gameState.bvrCoins < amount) {
        console.error('🟥 Insufficient BVR', { current: gameState.bvrCoins, required: amount });
        return res.status(400).json({
          success: false,
          message: 'Insufficient BVR coins',
          current: gameState.bvrCoins,
          required: amount
        });
      }
      gameState.bvrCoins -= amount;
    } else {
      if (gameState.flowers < amount) {
        console.error('🟥 Insufficient flowers', { current: gameState.flowers, required: amount });
        return res.status(400).json({
          success: false,
          message: 'Insufficient flowers',
          current: gameState.flowers,
          required: amount
        });
      }
      gameState.flowers -= amount;
    }

    // Create withdrawal transaction
    const transactionData = {
      userId,
      type: type || 'withdrawal',
      amount,
      currency,
      address: address || null,
      cryptoAddress: cryptoAddress || null,
      status: 'pending'
    };

    // Add deposit-specific fields if provided
    if (req.body.flowersAmount !== undefined) transactionData.flowersAmount = req.body.flowersAmount;
    if (req.body.network) transactionData.network = req.body.network;
    if (req.body.walletAddress) transactionData.walletAddress = req.body.walletAddress;
    if (req.body.usdAmount !== undefined) transactionData.usdAmount = req.body.usdAmount;
    if (req.body.fees !== undefined) transactionData.fees = req.body.fees;
    if (req.body.receivedAmount !== undefined) transactionData.receivedAmount = req.body.receivedAmount;
    if (req.body.userEmail) transactionData.userEmail = req.body.userEmail;

    const transaction = new Transaction(transactionData);
    // Add a lock to prevent concurrent modifications to the same GameState
    const lockKey = `lock:${userId}`;
    const lockAcquired = await acquireLock(lockKey, 5000); // Acquire lock for 5 seconds
    if (!lockAcquired) {
      console.error('🟥 Failed to acquire lock for user:', userId);
      return res.status(429).json({
        success: false,
        message: 'Too many concurrent requests. Please try again later.'
      });
    }

    try {
      // Manual rollback approach: save gameState first, then transaction
      // If transaction fails, we'll rollback the gameState
      await gameState.save();
      transactionCreated = transaction;
      await transaction.save();

      const responseData = {
        success: true,
        message: 'Withdrawal request created successfully',
        transaction: {
          id: transaction._id.toString(),
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          address: transaction.address,
          cryptoAddress: transaction.cryptoAddress,
          createdAt: transaction.createdAt
        },
        remainingFlowers: gameState.flowers,
        remainingBVR: gameState.bvrCoins
      };
      res.status(201).json(responseData);
      // Send email notification after response (non-blocking)
      setImmediate(async () => {
        try {
          const user = await User.findById(userId);
          const adminEmail = process.env.ADMIN_EMAIL || 'martinremy100@gmail.com';
          if (user && user.email) {
            await sendWithdrawalSubmittedNotification(adminEmail, transaction, user.email);
          }
        } catch (emailError) {
          console.error('📧 Failed to send withdrawal notification email:', emailError.message);
        }
      });
    } catch (error) {
      console.error('Transaction error:', error.stack || error);
      // Manual rollback if transaction save fails
      if (transactionCreated && gameState) {
        try {
          // Delete the transaction that was created
          await Transaction.findByIdAndDelete(transactionCreated._id);
          // Restore the balance
          const { currency, amount } = req.body;
          const freshGameState = await GameState.findOne({ userId: req.body.userId });
          if (freshGameState) {
            if (currency === 'BVR') {
              freshGameState.bvrCoins += amount;
            } else {
              freshGameState.flowers += amount;
            }
            await freshGameState.save();
            console.log('🟩 Manual rollback successful');
          }
        } catch (rollbackError) {
          console.error('🟥 Manual rollback failed:', rollbackError);
        }
      }
      return res.status(500).json({
        success: false,
        message: 'Transaction failed',
        error: error.message
      });
    } finally {
      // Release the lock
      await releaseLock(lockKey);
    }
  } catch (error) {
    console.error('🟥 Withdrawal request error:', error.stack || error);
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Public (should be protected in production)
router.post('/', async (req, res) => {
  try {
    const { userId, type, amount, currency, address, cryptoAddress, notes, flowersAmount, ticketsAmount } = req.body;

    if (!userId || !type || !amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const transaction = new Transaction({
      userId,
      type,
      amount,
      currency,
      address: address || null,
      cryptoAddress: cryptoAddress || null,
      notes: notes || null,
      flowersAmount: flowersAmount || null,
      ticketsAmount: ticketsAmount || null,
      status: 'pending'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: {
        id: transaction._id.toString(),
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        address: transaction.address,
        cryptoAddress: transaction.cryptoAddress,
        notes: transaction.notes,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
});

// @route   PUT /api/transactions/:id/status
// @desc    Update transaction status (admin function)
// @access  Public (should be protected and admin-only in production)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Track refund details for email notification
    let refundedAmount = 0;
    let refundedCurrency = '';

    // Update transaction status first
    console.log(`🔄 Updating transaction ${req.params.id} status to: ${status}`);
    transaction.status = status;
    transaction.adminNotes = adminNotes || null;
    // Set processedAt when transaction is completed or cancelled
    if (status === 'completed' || status === 'cancelled') {
      transaction.processedAt = new Date();
    }
    
    try {
      const savedTransaction = await transaction.save();
      console.log(`✅ Transaction ${req.params.id} saved successfully. Status: ${savedTransaction.status}`);
    } catch (saveError) {
      console.error(`❌ CRITICAL: Failed to save transaction ${req.params.id}:`, saveError);
      throw saveError;
    }

    // AFTER transaction is saved, update user's GameState
    // If deposit is being completed, add flowers and/or tickets to user account
    // Handles: deposit_crypto, deposit, referral_deposit, transfer_deposit, referral_bonus, transfer_received, etc.
    const isDepositApproval = status === 'completed' && 
      (transaction.type === 'deposit_crypto' || 
       transaction.type === 'deposit' || 
       transaction.type.includes('deposit') ||
       transaction.type === 'referral_bonus' ||
       transaction.type === 'transfer_received');
    
    if (isDepositApproval) {
      console.log('\n\n🔴🔴🔴 DEPOSIT COMPLETION DEBUG 🔴🔴🔴');
      console.log('Transaction ID:', transaction._id);
      console.log('Transaction type:', transaction.type);
      console.log('Transaction status:', transaction.status);
      console.log('Flowers to add (flowersAmount):', transaction.flowersAmount);
      console.log('Tickets to add:', transaction.ticketsAmount || 'none');
      console.log('User ID:', transaction.userId);
      
      const gameState = await GameState.findOne({ userId: transaction.userId });
      if (gameState) {
        console.log('✅ GameState FOUND');
        console.log('Before deposit - flowers:', gameState.flowers);
        console.log('Before deposit - tickets:', gameState.tickets);
        console.log('Before deposit - bvrCoins:', gameState.bvrCoins);
        console.log('GameState _id:', gameState._id);
        console.log('GameState userId:', gameState.userId);
        
        // Add flowers based on USD deposit
        const flowersToAdd = transaction.flowersAmount || 0;
        const ticketsToAdd = transaction.ticketsAmount || 0;
        
        console.log('Adding flowers:', flowersToAdd);
        console.log('Adding tickets:', ticketsToAdd);
        
        gameState.flowers += flowersToAdd;
        gameState.tickets += ticketsToAdd;
        
        // Add bonus tickets based on USD amount: 1 ticket per $10 spent (only for real money deposits)
        if (transaction.usdAmount && transaction.usdAmount > 0 && transaction.type === 'deposit_crypto') {
          const bonusTickets = Math.floor(transaction.usdAmount / 10);
          gameState.tickets += bonusTickets;
          console.log(`💰 Adding ${bonusTickets} bonus tickets for $${transaction.usdAmount} purchase`);
        }
        
        gameState.lastUpdated = new Date();
        
        console.log('After addition (before save) - flowers:', gameState.flowers);
        console.log('After addition (before save) - tickets:', gameState.tickets);
        
        try {
          const savedState = await gameState.save();
          console.log('✅ GameState SAVED SUCCESSFULLY');
          console.log('After save - flowers:', savedState.flowers);
          console.log('After save - tickets:', savedState.tickets);
          console.log('After save - lastUpdated:', savedState.lastUpdated);
          console.log('🔴🔴🔴 DEPOSIT COMPLETE 🔴🔴🔴\n\n');
        } catch (saveError) {
          console.error('❌ CRITICAL: Failed to save GameState:', saveError);
          console.error('GameState ID:', gameState._id);
          console.error('User ID:', gameState.userId);
          console.error('Error name:', saveError.name);
          console.error('Error message:', saveError.message);
          throw saveError;
        }
      } else {
        console.log('❌ ERROR: GameState not found for deposit');
        console.log('Looking for userId:', transaction.userId);
        console.log('Searching with filter:', { userId: transaction.userId });
        
        // Try to find any GameStates to debug
        const allStates = await GameState.find().limit(3);
        console.log('Sample GameStates in DB:', allStates.map(s => ({ id: s._id, userId: s.userId, flowers: s.flowers, tickets: s.tickets })));
      }
    }

    // If withdrawal is being cancelled/failed, refund the resources
    if ((transaction.type === 'withdrawal' || transaction.type === 'withdrawal_diamond' || transaction.type === 'withdrawal_bvr') && 
        (status === 'cancelled' || status === 'failed')) {
      console.log('=== REFUND DEBUG ===');
      console.log('Transaction type:', transaction.type);
      console.log('Transaction currency:', transaction.currency);
      console.log('Transaction amount:', transaction.amount);
      
      const gameState = await GameState.findOne({ userId: transaction.userId });
      if (gameState) {
        console.log('Before refund - bvrCoins:', gameState.bvrCoins, 'flowers:', gameState.flowers);
        
        // Refund based on currency type
        if (transaction.currency === 'BVR') {
          gameState.bvrCoins += transaction.amount;
          refundedAmount = transaction.amount;
          refundedCurrency = 'BVR';
          console.log('Refunding BVR:', transaction.amount);
        } else {
          gameState.flowers += transaction.amount;
          refundedAmount = transaction.amount;
          refundedCurrency = 'USD';
          console.log('Refunding flowers:', transaction.amount);
        }
        
        gameState.lastUpdated = new Date();
        
        try {
          await gameState.save();
          console.log('✅ Refund GameState saved successfully');
          console.log('After refund - bvrCoins:', gameState.bvrCoins, 'flowers:', gameState.flowers);
          console.log('=== REFUND COMPLETE ===');
        } catch (saveError) {
          console.error('❌ CRITICAL: Failed to save refund GameState:', saveError);
          throw saveError;
        }
      } else {
        console.log('ERROR: GameState not found for refund');
      }
    }

    // No email notifications on approval/rejection - only on withdrawal request submission

    res.json({
      success: true,
      message: 'Transaction status updated',
      transaction: {
        id: transaction._id.toString(),
        status: transaction.status,
        adminNotes: transaction.adminNotes
      }
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
});

// @route   PUT /api/transactions/:id/approve
// @desc    Approve a flower purchase transaction
// @access  Admin
router.put('/:id/approve', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is not pending' });
    }

    // Update transaction status to completed
    transaction.status = 'completed';
    transaction.processedBy = req.user.id; // Assuming req.user contains the admin user
    transaction.processedAt = new Date();
    await transaction.save();

    // Update the user's game state
    const gameState = await GameState.findOne({ userId: transaction.userId });
    if (gameState) {
      gameState.flowers += transaction.flowersAmount || 0;
      gameState.tickets += transaction.ticketsAmount || 0;
      await gameState.save();
    }

    res.json({ success: true, message: 'Transaction approved successfully' });
  } catch (error) {
    console.error('Error approving transaction:', error);
    res.status(500).json({ success: false, message: 'Error approving transaction', error: error.message });
  }
});

// @route   GET /api/transactions/pending/all
// @desc    Get all pending transactions (admin)
// @access  Public (should be protected and admin-only in production)
router.get('/pending/all', async (req, res) => {
  try {
    const transactions = await Transaction.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('userId', 'email referralCode')
      .limit(100);

    res.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        userId: t.userId ? t.userId._id.toString() : 'Unknown',
        userEmail: t.userId ? t.userId.email : t.userEmail || 'Unknown',
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        address: t.address,
        cryptoAddress: t.cryptoAddress,
        notes: t.notes,
        createdAt: t.createdAt,
        flowersAmount: t.flowersAmount,
        usdAmount: t.usdAmount,
        network: t.network,
        walletAddress: t.walletAddress
      }))
    });
  } catch (error) {
    console.error('Get pending transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending transactions',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/history/all
// @desc    Get all processed transactions (completed/cancelled) (admin)
// @access  Public (should be protected and admin-only in production)
router.get('/history/all', async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      status: { $in: ['completed', 'cancelled', 'failed'] } 
    })
      .sort({ updatedAt: -1 })
      .populate('userId', 'email referralCode')
      .limit(100);

    res.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        userId: t.userId ? t.userId._id.toString() : 'Unknown',
        userEmail: t.userId ? t.userId.email : t.userEmail || 'Unknown',
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        address: t.address,
        cryptoAddress: t.cryptoAddress,
        notes: t.notes,
        processedAt: t.processedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        flowersAmount: t.flowersAmount,
        usdAmount: t.usdAmount,
        network: t.network,
        walletAddress: t.walletAddress
      }))
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction history',
      error: error.message
    });
  }
});

module.exports = router;



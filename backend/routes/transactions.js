const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const GameState = require('../models/GameState');

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
// @desc    Create withdrawal request and deduct flowers
// @access  Public (should be protected in production)
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, amount, currency, address, cryptoAddress } = req.body;

    if (!userId || !amount || !currency || (!address && !cryptoAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (userId, amount, currency, and address/cryptoAddress)'
      });
    }

    // Get game state to check balance and deduct flowers
    const gameState = await GameState.findOne({ userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Check if user has enough flowers
    if (gameState.flowers < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient flowers',
        current: gameState.flowers,
        required: amount
      });
    }

    // Deduct flowers from game state
    gameState.flowers -= amount;
    await gameState.save();

    // Create withdrawal transaction
    const transaction = new Transaction({
      userId,
      type: 'withdrawal',
      amount,
      currency,
      address: address || null,
      cryptoAddress: cryptoAddress || null,
      status: 'pending'
    });

    await transaction.save();

    res.status(201).json({
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
      remainingFlowers: gameState.flowers
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating withdrawal request',
      error: error.message
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Public (should be protected in production)
router.post('/', async (req, res) => {
  try {
    const { userId, type, amount, currency, address, cryptoAddress, notes } = req.body;

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

    // If withdrawal is being cancelled/failed, refund the flowers
    if (transaction.type === 'withdrawal' && 
        transaction.status === 'pending' && 
        (status === 'cancelled' || status === 'failed')) {
      const gameState = await GameState.findOne({ userId: transaction.userId });
      if (gameState) {
        gameState.flowers += transaction.amount;
        await gameState.save();
      }
    }

    transaction.status = status;
    transaction.adminNotes = adminNotes || null;
    // Set processedAt when transaction is completed or cancelled
    if (status === 'completed' || status === 'cancelled') {
      transaction.processedAt = new Date();
    }
    await transaction.save();

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
        userId: t.userId._id.toString(),
        userEmail: t.userId.email,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        address: t.address,
        cryptoAddress: t.cryptoAddress,
        notes: t.notes,
        createdAt: t.createdAt
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
      status: { $in: ['completed', 'cancelled'] } 
    })
      .sort({ updatedAt: -1 })
      .populate('userId', 'email referralCode')
      .limit(100);

    res.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        userId: t.userId ? t.userId._id.toString() : 'Unknown',
        userEmail: t.userId ? t.userId.email : 'Unknown',
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        address: t.address,
        cryptoAddress: t.cryptoAddress,
        notes: t.notes,
        processedAt: t.processedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
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


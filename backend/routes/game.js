const express = require('express');
const router = express.Router();
const GameState = require('../models/GameState');
const User = require('../models/User');

// @route   GET /api/game/:userId
// @desc    Get game state for user
// @access  Public (should be protected in production)
router.get('/:userId', async (req, res) => {
  try {
    let gameState = await GameState.findOne({ userId: req.params.userId });
    
    // Create default game state if doesn't exist
    if (!gameState) {
      gameState = new GameState({
        userId: req.params.userId
      });
      await gameState.save();
    }

    res.json({
      success: true,
      gameState: {
        userId: gameState.userId.toString(),
        honey: gameState.honey,
        flowers: gameState.flowers,
        diamonds: gameState.diamonds,
        tickets: gameState.tickets,
        bvrCoins: gameState.bvrCoins,
        bees: Object.fromEntries(gameState.bees),
        alveoles: Object.fromEntries(gameState.alveoles),
        invitedFriends: gameState.invitedFriends,
        claimedMissions: gameState.claimedMissions,
        referrals: gameState.referrals,
        totalReferralEarnings: gameState.totalReferralEarnings,
        hasPendingFunds: gameState.hasPendingFunds,
        transactions: gameState.transactions,
        diamondsThisYear: gameState.diamondsThisYear,
        yearStartDate: gameState.yearStartDate
      }
    });
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game state',
      error: error.message
    });
  }
});

// @route   PUT /api/game/:userId
// @desc    Update game state
// @access  Public (should be protected in production)
router.put('/:userId', async (req, res) => {
  try {
    const updates = req.body;
    
    const gameState = await GameState.findOneAndUpdate(
      { userId: req.params.userId },
      { 
        ...updates,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Game state updated successfully',
      gameState: {
        userId: gameState.userId.toString(),
        honey: gameState.honey,
        flowers: gameState.flowers,
        diamonds: gameState.diamonds,
        tickets: gameState.tickets,
        bvrCoins: gameState.bvrCoins,
        bees: Object.fromEntries(gameState.bees),
        alveoles: Object.fromEntries(gameState.alveoles),
        invitedFriends: gameState.invitedFriends,
        claimedMissions: gameState.claimedMissions,
        referrals: gameState.referrals,
        totalReferralEarnings: gameState.totalReferralEarnings,
        hasPendingFunds: gameState.hasPendingFunds,
        transactions: gameState.transactions,
        diamondsThisYear: gameState.diamondsThisYear,
        yearStartDate: gameState.yearStartDate
      }
    });
  } catch (error) {
    console.error('Update game state error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating game state',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/buy-bee
// @desc    Buy a bee with flowers
// @access  Public
router.post('/:userId/buy-bee', async (req, res) => {
  try {
    const { beeTypeId } = req.body;

    // Validation
    if (!beeTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Bee type ID is required'
      });
    }

    // Bee types with costs
    const BEE_COSTS = {
      baby: 2000,
      worker: 10000,
      elite: 50000,
      royal: 250000,
      queen: 1200000
    };

    // Validate bee type
    if (!BEE_COSTS[beeTypeId]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bee type'
      });
    }

    const cost = BEE_COSTS[beeTypeId];

    // Get current game state
    let gameState = await GameState.findOne({ userId: req.params.userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Check if user has enough flowers
    if (gameState.flowers < cost) {
      return res.status(400).json({
        success: false,
        message: `Not enough flowers. Need ${cost}, have ${gameState.flowers}`
      });
    }

    // Deduct flowers and add bee
    gameState.flowers -= cost;
    const currentBeeCount = gameState.bees.get(beeTypeId) || 0;
    gameState.bees.set(beeTypeId, currentBeeCount + 1);
    gameState.lastUpdated = new Date();

    await gameState.save();

    res.json({
      success: true,
      message: `Successfully purchased ${beeTypeId} bee`,
      gameState: {
        userId: gameState.userId.toString(),
        honey: gameState.honey,
        flowers: gameState.flowers,
        diamonds: gameState.diamonds,
        tickets: gameState.tickets,
        bvrCoins: gameState.bvrCoins,
        bees: Object.fromEntries(gameState.bees),
        alveoles: Object.fromEntries(gameState.alveoles),
        invitedFriends: gameState.invitedFriends,
        claimedMissions: gameState.claimedMissions,
        referrals: gameState.referrals,
        totalReferralEarnings: gameState.totalReferralEarnings,
        hasPendingFunds: gameState.hasPendingFunds,
        transactions: gameState.transactions,
        diamondsThisYear: gameState.diamondsThisYear,
        yearStartDate: gameState.yearStartDate
      }
    });
  } catch (error) {
    console.error('Buy bee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing bee',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/sell-honey
// @desc    Sell honey for diamonds, flowers, and BVR coins
// @access  Public
router.post('/:userId/sell-honey', async (req, res) => {
  try {
    const { amount } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Minimum honey requirement
    const MIN_HONEY = 300;
    if (amount < MIN_HONEY) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${MIN_HONEY} honey required to sell`
      });
    }

    // Get current game state
    let gameState = await GameState.findOne({ userId: req.params.userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Check if user has enough honey
    if (gameState.honey < amount) {
      return res.status(400).json({
        success: false,
        message: `Not enough honey. Have ${gameState.honey}, trying to sell ${amount}`
      });
    }

    // Calculate rewards (300 honey = 1 diamond + 1 flower + 2 BVR)
    const diamondsEarned = Math.floor(amount / 300);
    const flowersEarned = diamondsEarned;
    const bvrEarned = diamondsEarned * 2;

    // Update game state
    gameState.honey -= amount;
    gameState.diamonds += diamondsEarned;
    gameState.flowers += flowersEarned;
    gameState.bvrCoins += bvrEarned;
    gameState.diamondsThisYear += diamondsEarned;
    gameState.lastUpdated = new Date();

    await gameState.save();

    res.json({
      success: true,
      message: `Successfully sold ${amount} honey`,
      rewards: {
        diamonds: diamondsEarned,
        flowers: flowersEarned,
        bvr: bvrEarned
      },
      gameState: {
        userId: gameState.userId.toString(),
        honey: gameState.honey,
        flowers: gameState.flowers,
        diamonds: gameState.diamonds,
        tickets: gameState.tickets,
        bvrCoins: gameState.bvrCoins,
        bees: Object.fromEntries(gameState.bees),
        alveoles: Object.fromEntries(gameState.alveoles),
        invitedFriends: gameState.invitedFriends,
        claimedMissions: gameState.claimedMissions,
        referrals: gameState.referrals,
        totalReferralEarnings: gameState.totalReferralEarnings,
        hasPendingFunds: gameState.hasPendingFunds,
        transactions: gameState.transactions,
        diamondsThisYear: gameState.diamondsThisYear,
        yearStartDate: gameState.yearStartDate
      }
    });
  } catch (error) {
    console.error('Sell honey error:', error);
    res.status(500).json({
      success: false,
      message: 'Error selling honey',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/upgrade-alveole
// @desc    Upgrade alveole (placeholder)
// @access  Public
router.post('/:userId/upgrade-alveole', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Upgrade alveole feature not implemented yet'
  });
});

// @route   POST /api/game/:userId/collect-honey
// @desc    Collect honey (placeholder)
// @access  Public
router.post('/:userId/collect-honey', async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Collect honey feature not implemented yet'
  });
});

module.exports = router;


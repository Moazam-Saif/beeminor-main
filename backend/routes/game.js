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
// @desc    Upgrade/unlock alveole with flowers
// @access  Public
router.post('/:userId/upgrade-alveole', async (req, res) => {
  try {
    const { level } = req.body;

    // Validation
    if (!level || level < 1 || level > 6) {
      return res.status(400).json({
        success: false,
        message: 'Level must be between 1 and 6'
      });
    }

    // Alveole levels with costs and capacities
    const ALVEOLE_LEVELS = [
      { level: 1, capacity: 1000000, cost: 0 },
      { level: 2, capacity: 3000000, cost: 200000 },
      { level: 3, capacity: 6000000, cost: 500000 },
      { level: 4, capacity: 14000000, cost: 1250000 },
      { level: 5, capacity: 30000000, cost: 3500000 },
      { level: 6, capacity: 48000000, cost: 8000000 }
    ];

    const alveoleInfo = ALVEOLE_LEVELS.find(a => a.level === level);
    if (!alveoleInfo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alveole level'
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

    // Check if alveole is already unlocked
    if (gameState.alveoles.get(level.toString())) {
      return res.status(400).json({
        success: false,
        message: `Alveole level ${level} is already unlocked`
      });
    }

    // Check if user has enough flowers
    if (gameState.flowers < alveoleInfo.cost) {
      return res.status(400).json({
        success: false,
        message: `Not enough flowers. Need ${alveoleInfo.cost}, have ${gameState.flowers}`
      });
    }

    // Deduct flowers and unlock alveole
    gameState.flowers -= alveoleInfo.cost;
    gameState.alveoles.set(level.toString(), true);
    gameState.lastUpdated = new Date();

    await gameState.save();

    res.json({
      success: true,
      message: `Successfully unlocked alveole level ${level}`,
      alveole: {
        level: level,
        capacity: alveoleInfo.capacity,
        cost: alveoleInfo.cost
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
    console.error('Upgrade alveole error:', error);
    res.status(500).json({
      success: false,
      message: 'Error upgrading alveole',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/spin-roulette
// @desc    Spin roulette with server-side randomization
// @access  Public
router.post('/:userId/spin-roulette', async (req, res) => {
  try {
    // Get current game state
    let gameState = await GameState.findOne({ userId: req.params.userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Check if user has tickets
    if (gameState.tickets <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No tickets available'
      });
    }

    // Prize configuration (server-side - prevents client manipulation)
    const PRIZES = [
      { id: '1', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, weight: 25, rarity: 'common' },
      { id: '2', label: '1000', type: 'flowers', flowersAmount: 1000, weight: 22, rarity: 'common' },
      { id: '3', label: 'Abeille', type: 'bee', beeType: 'worker', beeCount: 1, weight: 20, rarity: 'uncommon' },
      { id: '4', label: '3000', type: 'flowers', flowersAmount: 3000, weight: 15, rarity: 'uncommon' },
      { id: '5', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, weight: 25, rarity: 'common' },
      { id: '6', label: 'Elite', type: 'bee', beeType: 'elite', beeCount: 1, weight: 8, rarity: 'rare' },
      { id: '7', label: 'Abeille', type: 'bee', beeType: 'worker', beeCount: 1, weight: 20, rarity: 'uncommon' },
      { id: '8', label: '1000', type: 'flowers', flowersAmount: 1000, weight: 22, rarity: 'common' },
      { id: '9', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, weight: 25, rarity: 'common' },
      { id: '10', label: '5000', type: 'flowers', flowersAmount: 5000, weight: 10, rarity: 'rare' },
      { id: '11', label: 'Abeille', type: 'bee', beeType: 'worker', beeCount: 1, weight: 20, rarity: 'uncommon' },
      { id: '12', label: 'Royal', type: 'bee', beeType: 'royal', beeCount: 1, weight: 5, rarity: 'epic' },
      { id: '13', label: 'Bébé', type: 'bee', beeType: 'baby', beeCount: 1, weight: 25, rarity: 'common' },
      { id: '14', label: '10000', type: 'flowers', flowersAmount: 10000, weight: 3, rarity: 'epic' },
      { id: '15', label: 'Elite', type: 'bee', beeType: 'elite', beeCount: 1, weight: 8, rarity: 'rare' },
      { id: '16', label: 'Reine', type: 'bee', beeType: 'queen', beeCount: 1, weight: 1, rarity: 'legendary' }
    ];

    // Server-side weighted random selection
    const totalWeight = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
    let random = Math.random() * totalWeight;
    let prizeIndex = 0;

    for (let i = 0; i < PRIZES.length; i++) {
      random -= PRIZES[i].weight;
      if (random <= 0) {
        prizeIndex = i;
        break;
      }
    }

    const prize = PRIZES[prizeIndex];

    // Deduct ticket
    gameState.tickets -= 1;

    // Award prize
    if (prize.type === 'bee' && prize.beeType && prize.beeCount) {
      const currentBeeCount = gameState.bees.get(prize.beeType) || 0;
      gameState.bees.set(prize.beeType, currentBeeCount + prize.beeCount);
    } else if (prize.type === 'flowers' && prize.flowersAmount) {
      gameState.flowers += prize.flowersAmount;
    }

    gameState.lastUpdated = new Date();
    await gameState.save();

    res.json({
      success: true,
      message: 'Roulette spin successful',
      prize: {
        index: prizeIndex,
        id: prize.id,
        label: prize.label,
        type: prize.type,
        beeType: prize.beeType,
        beeCount: prize.beeCount,
        flowersAmount: prize.flowersAmount,
        rarity: prize.rarity
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
    console.error('Spin roulette error:', error);
    res.status(500).json({
      success: false,
      message: 'Error spinning roulette',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/claim-mission
// @desc    Claim mission rewards with validation
// @access  Public
router.post('/:userId/claim-mission', async (req, res) => {
  try {
    const { missionId } = req.body;

    // Validation
    if (!missionId) {
      return res.status(400).json({
        success: false,
        message: 'Mission ID is required'
      });
    }

    // Mission configuration (server-side)
    const MISSIONS = [
      { id: 1, friendsRequired: 1, flowersReward: 500, ticketsReward: 0 },
      { id: 2, friendsRequired: 3, flowersReward: 1500, ticketsReward: 0 },
      { id: 3, friendsRequired: 10, flowersReward: 4000, ticketsReward: 0 },
      { id: 4, friendsRequired: 50, flowersReward: 12000, ticketsReward: 1 },
      { id: 5, friendsRequired: 100, flowersReward: 30000, ticketsReward: 2 },
      { id: 6, friendsRequired: 300, flowersReward: 70000, ticketsReward: 3 },
      { id: 7, friendsRequired: 500, flowersReward: 160000, ticketsReward: 5 }
    ];

    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mission ID'
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

    // Check if mission already claimed
    if (gameState.claimedMissions.includes(missionId)) {
      return res.status(400).json({
        success: false,
        message: 'Mission already claimed'
      });
    }

    // Check if user has enough invited friends
    if (gameState.invitedFriends < mission.friendsRequired) {
      return res.status(400).json({
        success: false,
        message: `Not enough invited friends. Need ${mission.friendsRequired}, have ${gameState.invitedFriends}`
      });
    }

    // Award mission rewards
    gameState.claimedMissions.push(missionId);
    gameState.flowers += mission.flowersReward;
    gameState.tickets += mission.ticketsReward;
    gameState.lastUpdated = new Date();

    await gameState.save();

    res.json({
      success: true,
      message: 'Mission claimed successfully',
      mission: {
        id: mission.id,
        flowersReward: mission.flowersReward,
        ticketsReward: mission.ticketsReward
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
    console.error('Claim mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error claiming mission',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/add-test-resources
// @desc    Add testing resources (for development only)
// @access  Public (should be removed in production)
router.post('/:userId/add-test-resources', async (req, res) => {
  try {
    const { honey, flowers, tickets, diamonds, bvrCoins } = req.body;

    // Get current game state
    let gameState = await GameState.findOne({ userId: req.params.userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Add resources
    if (honey) gameState.honey += honey;
    if (flowers) gameState.flowers += flowers;
    if (tickets) gameState.tickets += tickets;
    if (diamonds) gameState.diamonds += diamonds;
    if (bvrCoins) gameState.bvrCoins += bvrCoins;
    
    gameState.lastUpdated = new Date();
    await gameState.save();

    res.json({
      success: true,
      message: 'Test resources added successfully',
      added: { honey, flowers, tickets, diamonds, bvrCoins },
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
    console.error('Add test resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding test resources',
      error: error.message
    });
  }
});

module.exports = router;


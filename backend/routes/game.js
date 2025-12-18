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
        yearStartDate: gameState.yearStartDate,
        lastUpdated: gameState.lastUpdated || new Date()
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
    // console.log('\n\n🟦🟦🟦 PUT /api/game/:userId 🟦🟦🟦');
    // console.log('User ID:', req.params.userId);
    // console.log('Updates:', JSON.stringify(updates, null, 2));
    
    const gameState = await GameState.findOneAndUpdate(
      { userId: req.params.userId },
      { 
        ...updates,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );
    
    // console.log('Updated GameState:');
    // console.log('  - Flowers:', gameState.flowers);
    // console.log('  - BVRCoins:', gameState.bvrCoins);
    // console.log('  - LastUpdated:', gameState.lastUpdated);
    // console.log('🟦🟦🟦 PUT COMPLETE 🟦🟦🟦\n\n');

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
        yearStartDate: gameState.yearStartDate,
        lastUpdated: gameState.lastUpdated
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

// @route   POST /api/game/:userId/recreate-gamestate
// @desc    Delete and recreate game state with correct schema (for development only)
// @access  Public (should be removed in production)
router.post('/:userId/recreate-gamestate', async (req, res) => {
  try {
    // Get current game state values to preserve them
    const oldGameState = await GameState.findOne({ userId: req.params.userId });
    
    if (!oldGameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Save important values
    const savedData = {
      honey: oldGameState.honey,
      flowers: oldGameState.flowers,
      diamonds: oldGameState.diamonds,
      tickets: oldGameState.tickets,
      bvrCoins: oldGameState.bvrCoins,
      bees: oldGameState.bees,
      alveoles: oldGameState.alveoles,
      invitedFriends: oldGameState.invitedFriends,
      claimedMissions: oldGameState.claimedMissions,
      referrals: oldGameState.referrals,
      totalReferralEarnings: oldGameState.totalReferralEarnings,
      hasPendingFunds: oldGameState.hasPendingFunds,
      diamondsThisYear: oldGameState.diamondsThisYear,
      yearStartDate: oldGameState.yearStartDate
    };

    // Delete the old document
    await GameState.deleteOne({ userId: req.params.userId });

    // Create new document with correct schema
    const newGameState = new GameState({
      userId: req.params.userId,
      ...savedData,
      transactions: [] // This will now be an array
    });

    await newGameState.save();

    res.json({
      success: true,
      message: 'Game state recreated successfully with correct schema',
      gameState: {
        userId: newGameState.userId.toString(),
        honey: newGameState.honey,
        flowers: newGameState.flowers,
        diamonds: newGameState.diamonds,
        tickets: newGameState.tickets,
        transactions: newGameState.transactions
      }
    });
  } catch (error) {
    console.error('Recreate game state error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recreating game state',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/add-test-resources
// @desc    Add testing resources (for development only)
// @access  Public (should be removed in production)
router.post('/:userId/add-test-resources', async (req, res) => {
  try {
    const { honey, flowers, tickets, diamonds, bvrCoins, invitedFriends } = req.body;

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
    if (typeof invitedFriends === 'number') gameState.invitedFriends = invitedFriends;
    
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

// @route   POST /api/game/:userId/process-referral
// @desc    Process referral bonus when a user makes their first purchase
// @access  Public (should be protected in production)
router.post('/:userId/process-referral', async (req, res) => {
  try {
    const { purchaseAmount, purchaseType } = req.body; // flowers spent

    // Get the buyer's user info
    const buyer = await User.findById(req.params.userId);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if buyer has a sponsor
    if (!buyer.sponsorCode) {
      return res.json({
        success: true,
        message: 'No sponsor to reward',
        bonusAwarded: false
      });
    }

    // Find the sponsor
    const sponsor = await User.findOne({ referralCode: buyer.sponsorCode });
    if (!sponsor) {
      return res.json({
        success: true,
        message: 'Sponsor not found',
        bonusAwarded: false
      });
    }

    // Check if this is the buyer's first purchase (check if they already have a referral entry)
    const sponsorGameState = await GameState.findOne({ userId: sponsor._id });
    const buyerGameState = await GameState.findOne({ userId: buyer._id });
    
    if (!sponsorGameState || !buyerGameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Check if buyer already has a referral entry (meaning bonus was already given)
    const existingReferral = sponsorGameState.referrals.find(
      r => r.email === buyer.email
    );

    if (existingReferral && existingReferral.earnings > 0) {
      return res.json({
        success: true,
        message: 'Referral bonus already awarded',
        bonusAwarded: false
      });
    }

    // Calculate bonus: 10% of purchase amount in flowers
    const bonusAmount = Math.floor(purchaseAmount * 0.1);

    // Award bonus to sponsor
    sponsorGameState.flowers += bonusAmount;
    sponsorGameState.totalReferralEarnings += bonusAmount;

    // Update or create referral entry
    if (existingReferral) {
      existingReferral.earnings = bonusAmount;
    } else {
      sponsorGameState.referrals.push({
        email: buyer.email,
        referralCode: buyer.referralCode,
        joinedAt: buyer.createdAt,
        earnings: bonusAmount
      });
      sponsorGameState.invitedFriends += 1;
    }

    sponsorGameState.lastUpdated = new Date();
    await sponsorGameState.save();

    res.json({
      success: true,
      message: 'Referral bonus awarded',
      bonusAwarded: true,
      bonus: {
        sponsor: sponsor.email,
        amount: bonusAmount,
        type: 'flowers',
        purchaseType: purchaseType
      },
      sponsorNewBalance: {
        flowers: sponsorGameState.flowers,
        totalReferralEarnings: sponsorGameState.totalReferralEarnings,
        invitedFriends: sponsorGameState.invitedFriends
      }
    });
  } catch (error) {
    console.error('Process referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing referral',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/link-referral
// @desc    Link a user to their sponsor and increment invitedFriends
// @access  Public (should be protected in production)
router.post('/:userId/link-referral', async (req, res) => {
  try {
    // Get the user
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a sponsor
    if (!user.sponsorCode) {
      return res.json({
        success: true,
        message: 'No sponsor code found',
        linked: false
      });
    }

    // Find the sponsor
    const sponsor = await User.findOne({ referralCode: user.sponsorCode });
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    // Get sponsor's game state
    let sponsorGameState = await GameState.findOne({ userId: sponsor._id });
    if (!sponsorGameState) {
      sponsorGameState = new GameState({ userId: sponsor._id });
    }

    // Check if already linked
    const alreadyLinked = sponsorGameState.referrals.some(
      r => r.email === user.email
    );

    if (alreadyLinked) {
      return res.json({
        success: true,
        message: 'Referral already linked',
        linked: false
      });
    }

    // Add referral entry (without earnings yet)
    sponsorGameState.referrals.push({
      email: user.email,
      referralCode: user.referralCode,
      joinedAt: user.createdAt,
      earnings: 0
    });
    sponsorGameState.invitedFriends += 1;
    sponsorGameState.lastUpdated = new Date();
    await sponsorGameState.save();

    res.json({
      success: true,
      message: 'Referral linked successfully',
      linked: true,
      sponsor: {
        email: sponsor.email,
        invitedFriends: sponsorGameState.invitedFriends
      }
    });
  } catch (error) {
    console.error('Link referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Error linking referral',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/purchase-flowers
// @desc    Purchase flowers with USD (creates pending transaction, awards flowers and tickets)
// @access  Public (should be protected in production)
router.post('/:userId/purchase-flowers', async (req, res) => {
  try {
    const { amount, priceUSD, paymentMethod, transactionId } = req.body;

    if (!amount || !priceUSD) {
      return res.status(400).json({
        success: false,
        message: 'Amount and price are required'
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

    // Award flowers
    gameState.flowers += amount;

    // Award tickets (1 ticket per $10 spent)
    const ticketsEarned = Math.floor(priceUSD / 10);
    if (ticketsEarned > 0) {
      gameState.tickets += ticketsEarned;
    }

    // Clear pending funds flag
    gameState.hasPendingFunds = false;
    gameState.lastUpdated = new Date();
    await gameState.save();

    // Create transaction record in separate Transaction model (proper architecture)
    const Transaction = require('../models/Transaction');
    const transaction = new Transaction({
      userId: req.params.userId,
      type: 'flower_purchase',
      amount: priceUSD,
      currency: 'USD',
      status: 'pending', // Set status to pending for admin approval
      address: paymentMethod || '',
      notes: `Purchased ${amount} flowers, earned ${ticketsEarned} tickets`
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Flowers purchase request submitted for approval',
      purchase: {
        flowers: amount,
        price: priceUSD,
        ticketsEarned: ticketsEarned
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
      }
    });
  } catch (error) {
    console.error('Purchase flowers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing flowers',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/exchange
// @desc    Exchange diamonds or BVR for flowers
// @access  Public (should be protected in production)
router.post('/:userId/exchange', async (req, res) => {
  try {
    const { type, amount } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Type and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be positive'
      });
    }

    const gameState = await GameState.findOne({ userId: req.params.userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    let flowersReceived = 0;
    let exchangedResource = '';

    if (type === 'DIAMONDS_TO_FLOWERS') {
      if (gameState.diamonds < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient diamonds',
          current: gameState.diamonds,
          required: amount
        });
      }

      // 10% bonus: 1 diamond = 1.1 flowers
      flowersReceived = amount * 1.1;
      gameState.diamonds -= amount;
      gameState.flowers += flowersReceived;
      exchangedResource = `${amount} diamonds`;
    } else if (type === 'BVR_TO_FLOWERS') {
      if (gameState.bvrCoins < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient BVR',
          current: gameState.bvrCoins,
          required: amount
        });
      }

      if (amount < 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum 100 BVR required',
          current: amount
        });
      }

      // 100 BVR = 1 flower
      flowersReceived = amount / 100;
      gameState.bvrCoins -= amount;
      gameState.flowers += flowersReceived;
      exchangedResource = `${amount} BVR`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid exchange type'
      });
    }

    gameState.lastUpdated = new Date();
    await gameState.save();

    console.log('✅ Exchange completed:', {
      type,
      amount,
      flowersReceived,
      newBalances: {
        diamonds: gameState.diamonds,
        bvrCoins: gameState.bvrCoins,
        flowers: gameState.flowers
      }
    });

    res.json({
      success: true,
      message: `Exchanged ${exchangedResource} for ${flowersReceived} flowers`,
      flowersReceived,
      newBalances: {
        diamonds: gameState.diamonds,
        bvrCoins: gameState.bvrCoins,
        flowers: gameState.flowers
      }
    });
  } catch (error) {
    console.error('Exchange error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing exchange',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/set-pending-funds
// @desc    Mark that user has sent payment and funds are pending verification
// @access  Public (should be protected in production)
router.post('/:userId/set-pending-funds', async (req, res) => {
  try {
    const { hasPending } = req.body;

    // Get current game state
    let gameState = await GameState.findOne({ userId: req.params.userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    gameState.hasPendingFunds = hasPending !== undefined ? hasPending : true;
    gameState.lastUpdated = new Date();
    await gameState.save();

    res.json({
      success: true,
      message: 'Pending funds status updated',
      hasPendingFunds: gameState.hasPendingFunds
    });
  } catch (error) {
    console.error('Set pending funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pending funds status',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/admin/add-resources
// @desc    Admin: Add resources to user
// @access  Admin only (should be protected in production)
router.post('/:userId/admin/add-resources', async (req, res) => {
  try {
    const { userId } = req.params;
    const { flowers, tickets, diamonds, honey, bvrCoins } = req.body;

    const gameState = await GameState.findOne({ userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    // Add resources
    if (flowers) gameState.flowers += flowers;
    if (tickets) gameState.tickets += tickets;
    if (diamonds) gameState.diamonds += diamonds;
    if (honey) gameState.honey += honey;
    if (bvrCoins) gameState.bvrCoins += bvrCoins;

    await gameState.save();

    res.json({
      success: true,
      message: 'Resources added successfully',
      gameState: {
        flowers: gameState.flowers,
        tickets: gameState.tickets,
        diamonds: gameState.diamonds,
        honey: gameState.honey,
        bvrCoins: gameState.bvrCoins
      }
    });
  } catch (error) {
    console.error('Admin add resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding resources',
      error: error.message
    });
  }
});

// @route   POST /api/game/:userId/admin/set-invited-friends
// @desc    Admin: Set invited friends count
// @access  Admin only (should be protected in production)
router.post('/:userId/admin/set-invited-friends', async (req, res) => {
  try {
    const { userId } = req.params;
    const { count } = req.body;

    if (count === undefined || count < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid count'
      });
    }

    const gameState = await GameState.findOne({ userId });
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game state not found'
      });
    }

    gameState.invitedFriends = count;
    await gameState.save();

    res.json({
      success: true,
      message: 'Invited friends count updated',
      invitedFriends: gameState.invitedFriends
    });
  } catch (error) {
    console.error('Admin set invited friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting invited friends',
      error: error.message
    });
  }
});

module.exports = router;


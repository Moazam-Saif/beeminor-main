const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'withdrawal_diamond', 'withdrawal_bvr', 'exchange', 'flower_purchase', 'deposit_crypto', 'referral_bonus', 'transfer_received'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  address: {
    type: String,
    default: null
  },
  cryptoAddress: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  // Fields for deposit_crypto transactions
  flowersAmount: {
    type: Number,
    default: null
  },
  ticketsAmount: {
    type: Number,
    default: null
  },
  network: {
    type: String,
    default: null
  },
  walletAddress: {
    type: String,
    default: null
  },
  usdAmount: {
    type: Number,
    default: null
  },
  fees: {
    type: Number,
    default: null
  },
  receivedAmount: {
    type: Number,
    default: null
  },
  userEmail: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;


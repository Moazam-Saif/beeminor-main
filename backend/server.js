const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware - CORS configuration for cross-origin requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in production (you can restrict this later)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beeminor';
    
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  No MONGODB_URI found in .env, using default localhost connection');
    } else {
      // Mask password in logs for security
      const maskedURI = mongoURI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:****@');
      console.log(`📡 Connecting to MongoDB: ${maskedURI}`);
    }
    
    // Connection options for MongoDB Atlas
    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 connections
      retryWrites: true, // Retry failed writes
      w: 'majority', // Wait for majority of replica set nodes to acknowledge writes
      wtimeoutMS: 10000, // Timeout for write operations
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Ready to accept connections\n`);
    
    // Add connection event listeners for debugging
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    console.error('Error details:', error.name);
    
    if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.error('\n🔐 AUTHENTICATION FAILED - Troubleshooting steps:\n');
      console.error('1. ✅ Check MongoDB Atlas Network Access:');
      console.error('   → Go to: https://cloud.mongodb.com/');
      console.error('   → Click "Network Access" → "Add IP Address"');
      console.error('   → Add 0.0.0.0/0 (Allow from anywhere) for development');
      console.error('   → Wait 2 minutes after adding IP\n');
      
      console.error('2. ✅ Verify Database User Credentials:');
      console.error('   → Go to MongoDB Atlas → "Database Access"');
      console.error('   → Find user: abhipatel8675_db_user');
      console.error('   → Verify password matches: HBZ52Jv74nAIa3Yc');
      console.error('   → Check user has "Atlas Admin" role\n');
      
      console.error('3. ✅ Check Connection String in backend/.env:');
      console.error('   → Make sure MONGODB_URI is correct');
      console.error('   → No spaces or special characters');
      console.error('   → Format: mongodb+srv://USERNAME:PASSWORD@cluster/database\n');
      
      console.error('4. ✅ Test Connection:');
      console.error('   → Try connecting via MongoDB Compass or Atlas dashboard');
      console.error('   → Verify cluster is running (not paused)\n');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n🌐 NETWORK ERROR - Troubleshooting:\n');
      console.error('1. Check your internet connection');
      console.error('2. Verify MongoDB Atlas cluster is running');
      console.error('3. Check if firewall is blocking connections\n');
    }
    
    console.error('💡 For detailed help, see: backend/TROUBLESHOOTING.md\n');
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/game', require('./routes/game'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/support', require('./routes/support'));

// API base route
app.get('/api', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Beeminor API is running',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/users', 
      '/api/game',
      '/api/leaderboard',
      '/api/transactions',
      '/api/referrals',
      '/api/support'
    ]
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Beeminor API is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 3001;

// Start server
const startServer = async () => {
  await connectDB();
  
  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on 0.0.0.0:${PORT}`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
    console.log(`📍 Health check: http://localhost:${PORT}/`);
    
    // Verify email configuration in background (non-blocking)
    const { verifyEmailConfig } = require('./config/email');
    verifyEmailConfig().then(result => {
      if (result.success) {
        if (result.warning) {
          console.log('⚠️  Email verification completed with warnings');
        } else {
          console.log('✅ Email configuration verified successfully');
        }
      } else {
        console.log('ℹ️  Email notifications disabled - set EMAIL_USER and EMAIL_PASSWORD to enable');
      }
    }).catch(err => {
      console.error('⚠️  Email verification error (non-critical):', err.message);
    });
  });
};

startServer();

module.exports = app;


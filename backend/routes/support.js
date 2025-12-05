const express = require('express');
const router = express.Router();
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');

// @route   POST /api/support/messages
// @desc    Create a new support message
// @access  Public
router.post('/messages', async (req, res) => {
  try {
    const { subject, message, userEmail, userId } = req.body;

    if (!subject || !message || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Subject, message, and user email are required'
      });
    }

    const newMessage = new SupportMessage({
      subject,
      message,
      userEmail,
      userId: userId || null,
      read: false,
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Support message sent successfully',
      messageId: newMessage._id.toString(),
    });
  } catch (error) {
    console.error('Create support message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending support message',
      error: error.message
    });
  }
});

// @route   GET /api/support/messages
// @desc    Get all support messages (admin only)
// @access  Public (should be protected in production)
router.get('/messages', async (req, res) => {
  try {
    const messages = await SupportMessage.find()
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id.toString(),
        subject: msg.subject,
        message: msg.message,
        userEmail: msg.userEmail,
        userId: msg.userId ? msg.userId.toString() : null,
        read: msg.read,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
      }))
    });
  } catch (error) {
    console.error('Get support messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching support messages',
      error: error.message
    });
  }
});

// @route   GET /api/support/messages/unread
// @desc    Get unread support messages count (admin only)
// @access  Public (should be protected in production)
router.get('/messages/unread', async (req, res) => {
  try {
    const count = await SupportMessage.countDocuments({ read: false });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread messages count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread messages count',
      error: error.message
    });
  }
});

// @route   PATCH /api/support/messages/:id/read
// @desc    Mark a message as read
// @access  Public (should be protected in production)
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.read = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
});

// @route   DELETE /api/support/messages/:id
// @desc    Delete a support message
// @access  Public (should be protected in production)
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await SupportMessage.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete support message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
});

module.exports = router;

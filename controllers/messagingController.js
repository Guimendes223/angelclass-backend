const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all conversations where user is a participant and not deleted by user
    const conversations = await Conversation.find({
      participants: userId,
      [`isDeleted.${userId}`]: { $ne: true }
    })
    .populate('participants', 'firstName lastName email role')
    .populate('lastMessage.sender', 'firstName lastName')
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
};

// Get single conversation by ID
exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      [`isDeleted.${userId}`]: { $ne: true }
    })
    .populate('participants', 'firstName lastName email role');
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error while fetching conversation' });
  }
};

// Create new conversation
exports.createConversation = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { recipientId, initialMessage } = req.body;
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      [`isDeleted.${userId}`]: { $ne: true }
    });
    
    if (existingConversation) {
      return res.status(400).json({ 
        message: 'Conversation already exists', 
        conversationId: existingConversation._id 
      });
    }
    
    // Create new conversation
    const conversation = new Conversation({
      participants: [userId, recipientId],
      unreadCount: new Map([[recipientId.toString(), 1]]),
      lastMessage: {
        content: initialMessage,
        sender: userId,
        createdAt: Date.now()
      }
    });
    
    // Save conversation
    await conversation.save();
    
    // Create initial message
    const message = new Message({
      sender: userId,
      recipient: recipientId,
      conversation: conversation._id,
      content: initialMessage
    });
    
    // Save message
    await message.save();
    
    // Populate conversation with participant details
    await conversation.populate('participants', 'firstName lastName email role');
    
    res.status(201).json({
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error while creating conversation' });
  }
};

// Send message in conversation
exports.sendMessage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const conversationId = req.params.id;
    const { content, attachments } = req.body;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isBlocked: false
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or blocked' });
    }
    
    // Get recipient (the other participant)
    const recipientId = conversation.participants
      .find(participant => participant.toString() !== userId.toString());
    
    // Create new message
    const message = new Message({
      sender: userId,
      recipient: recipientId,
      conversation: conversationId,
      content,
      attachments: attachments || []
    });
    
    // Save message
    await message.save();
    
    // Update conversation
    conversation.lastMessage = {
      content,
      sender: userId,
      createdAt: Date.now()
    };
    
    // Increment unread count for recipient
    const currentUnreadCount = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), currentUnreadCount + 1);
    
    // If conversation was deleted by recipient, mark as not deleted
    if (conversation.isDeleted.get(recipientId.toString())) {
      conversation.isDeleted.set(recipientId.toString(), false);
    }
    
    // Save conversation
    await conversation.save();
    
    // Populate message with sender details
    await message.populate('sender', 'firstName lastName');
    
    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
};

// Get messages in conversation
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find messages
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('sender', 'firstName lastName');
    
    // Get total count for pagination
    const totalCount = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    // Mark messages as read if user is recipient
    await Message.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        readAt: null
      },
      {
        readAt: Date.now()
      }
    );
    
    // Reset unread count for user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    
    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
};

// Mark conversation as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        readAt: null
      },
      {
        readAt: Date.now()
      }
    );
    
    // Reset unread count for user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    
    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error while marking conversation as read' });
  }
};

// Delete conversation
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Mark conversation as deleted for user
    conversation.isDeleted.set(userId.toString(), true);
    
    // Check if both participants have deleted the conversation
    const allDeleted = conversation.participants.every(
      participant => conversation.isDeleted.get(participant.toString())
    );
    
    if (allDeleted) {
      // If both participants deleted, delete all messages
      await Message.updateMany(
        { conversation: conversationId },
        { isDeleted: true }
      );
      
      // Delete conversation
      await Conversation.deleteOne({ _id: conversationId });
      
      res.json({ message: 'Conversation permanently deleted' });
    } else {
      // Save conversation with updated deletion status
      await conversation.save();
      
      res.json({ message: 'Conversation deleted for you' });
    }
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server error while deleting conversation' });
  }
};

// Block conversation
exports.blockConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Block conversation
    conversation.isBlocked = true;
    conversation.blockedBy = userId;
    
    // Save conversation
    await conversation.save();
    
    res.json({ message: 'Conversation blocked successfully' });
  } catch (error) {
    console.error('Block conversation error:', error);
    res.status(500).json({ message: 'Server error while blocking conversation' });
  }
};

// Unblock conversation
exports.unblockConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    
    // Find conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      blockedBy: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or not blocked by you' });
    }
    
    // Unblock conversation
    conversation.isBlocked = false;
    conversation.blockedBy = undefined;
    
    // Save conversation
    await conversation.save();
    
    res.json({ message: 'Conversation unblocked successfully' });
  } catch (error) {
    console.error('Unblock conversation error:', error);
    res.status(500).json({ message: 'Server error while unblocking conversation' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all conversations for user
    const conversations = await Conversation.find({
      participants: userId,
      [`isDeleted.${userId}`]: { $ne: true }
    });
    
    // Calculate total unread count
    let totalUnread = 0;
    conversations.forEach(conversation => {
      totalUnread += conversation.unreadCount.get(userId.toString()) || 0;
    });
    
    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
};

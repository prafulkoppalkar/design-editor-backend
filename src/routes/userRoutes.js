const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /users
 * Get all users with optional search and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query)
      .select('name email avatar createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch users',
      details: error.message,
    });
  }
});


router.get('/search', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const users = await User.searchByName(q, parseInt(limit));

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SEARCH_ERROR',
      message: 'Failed to search users',
      details: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name email avatar createdAt updatedAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found',
        details: `No user found with id: ${req.params.id}`,
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch user',
      details: error.message,
    });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 'DUPLICATE_EMAIL',
        message: 'User with this email already exists',
        details: `Email ${email} is already registered`,
      });
    }

    const userData = { name, email };
    if (avatar) {
      userData.avatar = avatar;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Failed to create user',
      details: error.message,
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found',
        details: `No user found with id: ${req.params.id}`,
      });
    }

    // If email is being updated, check for duplicates
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({
        email: req.body.email.toLowerCase(),
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          code: 'DUPLICATE_EMAIL',
          message: 'Email already in use',
          details: `Email ${req.body.email} is already registered`,
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 'UPDATE_ERROR',
      message: 'Failed to update user',
      details: error.message,
    });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found',
        details: `No user found with id: ${req.params.id}`,
      });
    }


    // Check if user has comments
    // Alternatively we can delete comments when user is being deleted
    const Comment = require('../models/Comment');
    const commentCount = await Comment.countDocuments({
      authorId: req.params.id,
    });

    if (commentCount > 0) {
      return res.status(400).json({
        success: false,
        code: 'USER_HAS_COMMENTS',
        message: 'Cannot delete user with existing comments',
        details: `User has ${commentCount} comment(s). Delete comments first`,
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: req.params.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'DELETE_ERROR',
      message: 'Failed to delete user',
      details: error.message,
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

router.get('/', async (req, res) => {
  try {
    const { designId, authorId, page = 1, limit = 20 } = req.query;

    if (!designId && !authorId) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PARAMETER',
        message: 'Either designId or authorId is required',
        details: 'Please provide designId or authorId query parameter',
      });
    }

    let comments;
    let total;

    if (designId) {
      comments = await Comment.getByDesignId(designId, {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: true,
      });
      total = await Comment.countByDesignId(designId);
    } else if (authorId) {
      comments = await Comment.getByAuthorId(authorId, {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: true,
      });
      total = await Comment.countDocuments({ authorId });
    }

    res.json({
      success: true,
      count: comments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch comments',
      details: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('authorId', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('designId', 'name');

    if (!comment) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Comment not found',
        details: `No comment found with id: ${req.params.id}`,
      });
    }

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch comment',
      details: error.message,
    });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { designId, authorId, text, mentions = [] } = req.body;

    if (!designId || !authorId || !text) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Missing required fields',
        details: 'designId, authorId, and text are required',
      });
    }

    const commentData = {
      designId,
      authorId,
      text,
      mentions: mentions || [],
    };

    const comment = await Comment.create(commentData);

    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('designId', 'name');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: populatedComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Failed to create comment',
      details: error.message,
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Comment not found',
        details: `No comment found with id: ${req.params.id}`,
      });
    }

    const allowedUpdates = ['text', 'mentions'];
    const updates = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('authorId', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('designId', 'name');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 'UPDATE_ERROR',
      message: 'Failed to update comment',
      details: error.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Comment not found',
        details: `No comment found with id: ${req.params.id}`,
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      data: {
        id: req.params.id,
        text: comment.text,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'DELETE_ERROR',
      message: 'Failed to delete comment',
      details: error.message,
    });
  }
});

module.exports = router;


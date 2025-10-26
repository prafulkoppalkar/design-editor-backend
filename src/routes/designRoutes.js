const express = require('express');
const router = express.Router();
const Design = require('../models/Design');


router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const designs = await Design.find()
      .select('-elements')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Design.countDocuments();

    res.json({
      success: true,
      count: designs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: designs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch designs',
      details: error.message,
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const design = await Design.findById(req.params.id).lean();

    if (!design) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Design not found',
        details: `No design found with id: ${req.params.id}`,
      });
    }

    res.json({
      success: true,
      data: design,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'FETCH_ERROR',
      message: 'Failed to fetch design',
      details: error.message,
    });
  }
});


router.post('/create', async (req, res) => {
  try {
    const design = await Design.create(req.body);
    res.status(201).json({
      success: true,
      data: design,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Failed to create design',
      details: error.message,
    });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Design not found',
        details: `No design found with id: ${req.params.id}`,
      });
    }


    const updatedDesign = await Design.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: 'Design updated successfully',
      data: updatedDesign,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      code: 'UPDATE_ERROR',
      message: 'Failed to update design',
      details: error.message,
    });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Design not found',
        details: `No design found with id: ${req.params.id}`,
      });
    }

    await Design.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Design deleted successfully',
      data: {
        id: req.params.id,
        name: design.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'DELETE_ERROR',
      message: 'Failed to delete design',
      details: error.message,
    });
  }
});

module.exports = router;


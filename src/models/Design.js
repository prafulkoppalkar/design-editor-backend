const mongoose = require('mongoose');

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    width: {
      type: Number,
      default: 1080,
    },
    height: {
      type: Number,
      default: 1080,
    },
    canvasBackground: {
      type: String,
      default: '#FFFFFF',
    },
    elements: {
      type: Array,
      default: [],
    },
    version: {
      type: Number,
      default: 0,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

designSchema.index({ updatedAt: -1 });
designSchema.index({ createdAt: -1 });
designSchema.index({ name: 1 });

const Design = mongoose.model('Design', designSchema);

module.exports = Design;


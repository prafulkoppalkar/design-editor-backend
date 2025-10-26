const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a user in the system who can create designs and comments
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    avatar: {
      type: String,
      default: function () {
        // Generate default avatar using DiceBear API based on user's name
        const seed = this.name ? this.name.replace(/\s+/g, '') : 'default';
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 1 });

// Virtual field to get user's comments count
userSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'authorId',
  count: true,
});

// Method to get user's basic info (for API responses)
userSchema.methods.toBasicInfo = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
  };
};

// Static method to search users by name (for @mentions)
userSchema.statics.searchByName = function (query, limit = 10) {
  return this.find({
    name: { $regex: query, $options: 'i' }, // Case-insensitive search
  })
    .limit(limit)
    .select('name email avatar');
};

const User = mongoose.model('User', userSchema);

module.exports = User;


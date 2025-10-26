const mongoose = require('mongoose');

/**
 * Comment Schema
 * Represents a comment on a design with support for @mentions
 */
const commentSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: [true, 'Design ID is required'],
      index: true, // Index for fast lookup by design
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true, // Index for fast lookup by author
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Rename authorId to author in JSON response
        if (ret.authorId) {
          ret.author = ret.authorId;
          delete ret.authorId;
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        // Rename authorId to author in object response
        if (ret.authorId) {
          ret.author = ret.authorId;
          delete ret.authorId;
        }
        return ret;
      },
    },
  }
);

// Compound index for efficient queries (get comments for a design, sorted by date)
commentSchema.index({ designId: 1, createdAt: -1 });

// Index for getting all comments by a user
commentSchema.index({ authorId: 1, createdAt: -1 });

// Pre-save hook to validate that designId and authorId exist
commentSchema.pre('save', async function (next) {
  try {
    // Verify design exists
    const Design = mongoose.model('Design');
    const design = await Design.findById(this.designId);
    if (!design) {
      throw new Error('Design not found');
    }

    // Verify author exists
    const User = mongoose.model('User');
    const author = await User.findById(this.authorId);
    if (!author) {
      throw new Error('Author not found');
    }

    // Verify all mentioned users exist
    if (this.mentions && this.mentions.length > 0) {
      const mentionedUsers = await User.find({
        _id: { $in: this.mentions },
      });
      if (mentionedUsers.length !== this.mentions.length) {
        throw new Error('One or more mentioned users not found');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get comments for a design with pagination
commentSchema.statics.getByDesignId = function (
  designId,
  { page = 1, limit = 20, populate = true } = {}
) {
  const skip = (page - 1) * limit;

  let query = this.find({ designId })
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limit);

  if (populate) {
    query = query
      .populate('authorId', 'name email avatar')
      .populate('mentions', 'name email avatar');
  }

  return query;
};

// Static method to get comments by a user
commentSchema.statics.getByAuthorId = function (
  authorId,
  { page = 1, limit = 20, populate = true } = {}
) {
  const skip = (page - 1) * limit;

  let query = this.find({ authorId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (populate) {
    query = query
      .populate('designId', 'name')
      .populate('mentions', 'name email avatar');
  }

  return query;
};

// Static method to count comments for a design
commentSchema.statics.countByDesignId = function (designId) {
  return this.countDocuments({ designId });
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;


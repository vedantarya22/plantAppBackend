// models/comment.model.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            maxlength: 1000,
            trim: true,
        },
    },
    { timestamps: true }
);

// ✅ Load all comments for a post, oldest first
commentSchema.index({ postId: 1, createdAt: 1 });

export default mongoose.model('Comment', commentSchema);
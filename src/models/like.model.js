// models/like.model.js
import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// ✅ Enforces one like per user per post at DB level
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });
// ✅ "Did I like this post?" lookup
likeSchema.index({ userId: 1, postId: 1 });

export default mongoose.model('Like', likeSchema);
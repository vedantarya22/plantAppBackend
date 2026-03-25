
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        postImageString: { type: String, required: true },
        caption:         { type: String, default: '', maxlength: 2200 },
        
        //  Denormalized counts — updated atomically via $inc
        // Avoids COUNT queries on every feed load
        likesCount:    { type: Number, default: 0, min: 0 },
        commentsCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

// Feed sorted by newest first
postSchema.index({ createdAt: -1 });
// Profile page — all posts by a user
postSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
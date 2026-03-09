// models/post.model.js
import mongoose from 'mongoose';

// ── Comment sub-document ──────────────────────────────────────────────────────
// Mongoose auto-assigns _id to each comment entry.
const commentSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: false }, // _id is still auto-generated per sub-doc
);

// ── Post schema ───────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
    {
        // 👤 Author — populated via .populate('userId') to match Swift PostRepository hydration
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // 🖼️ Post content
        postImageString: { type: String, required: true },
        caption: { type: String, default: '' },

        // ⏱️ Backend is single source of truth for time (UTC)
        timestamp: { type: Date, default: Date.now },

        // ❤️ Replaces `isLiked` + `likesCount` on the frontend.
        // The API controller derives both fields dynamically from this array.
        likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        // 💬 Embedded comments array
        comments: { type: [commentSchema], default: [] },
    },
    { timestamps: true }, // createdAt / updatedAt managed by Mongoose
);

export default mongoose.model('Post', postSchema);

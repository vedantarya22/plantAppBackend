// controllers/like.controller.js
import Like from '../models/like.model.js';
import Post from '../models/post.model.js';

// ── Toggle Like (add or remove) ───────────────────────────────────────────────
export const toggleLike = async (req, res) => {
    try {
        const { id: postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const existing = await Like.findOne({ postId, userId: req.userId });

        if (existing) {
            // ✅ Unlike — remove like + decrement count atomically
            await Promise.all([
                existing.deleteOne(),
                Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }),
            ]);

            return res.status(200).json({
                isLiked:    false,
                likesCount: Math.max(0, post.likesCount - 1),
            });
        } else {
            // ✅ Like — create like + increment count atomically
            await Promise.all([
                Like.create({ postId, userId: req.userId }),
                Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }),
            ]);

            return res.status(200).json({
                isLiked:    true,
                likesCount: post.likesCount + 1,
            });
        }
    } catch (err) {
        // ✅ Duplicate key = user already liked (race condition) — treat as success
        if (err.code === 11000) {
            return res.status(200).json({ isLiked: true });
        }
        return res.status(500).json({ message: `Something went wrong: ${err.message}` });
    }
};

// ── Get Likers (who liked this post) ─────────────────────────────────────────
export const getLikers = async (req, res) => {
    try {
        const { id: postId } = req.params;

        const likes = await Like.find({ postId })
            .populate('userId', 'username profileImage')
            .sort({ createdAt: -1 })
            .limit(100); // cap for safety

        return res.status(200).json(likes.map(l => l.userId));
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err.message}` });
    }
};
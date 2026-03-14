// controllers/comment.controller.js
import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';

// ── Add Comment ───────────────────────────────────────────────────────────────
export const addComment = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // ✅ Create comment + increment count atomically
        const [comment] = await Promise.all([
            Comment.create({ postId, userId: req.userId, text: text.trim() }),
            Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }),
        ]);

        // ✅ Populate username for immediate display in Swift
        await comment.populate('userId', 'username profileImage');

        return res.status(201).json(comment);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err.message}` });
    }
};

// ── Get Comments (paginated, oldest first) ────────────────────────────────────
export const getComments = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip  = (page - 1) * limit;

        const comments = await Comment.find({ postId })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username profileImage');

        return res.status(200).json({
            comments,
            page,
            hasMore: comments.length === limit,
        });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err.message}` });
    }
};

// ── Delete Comment ────────────────────────────────────────────────────────────
export const deleteComment = async (req, res) => {
    try {
        const { id: postId, cid: commentId } = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // ✅ Only the comment author can delete
        if (comment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorised to delete this comment' });
        }

        // ✅ Delete comment + decrement count atomically
        await Promise.all([
            comment.deleteOne(),
            Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } }),
        ]);

        return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err.message}` });
    }
};
// controllers/post.controller.js
import Post from '../models/post.model.js';
import User from '../models/user.model.js';

// ─────────────────────────────────────────────
// Helper: format a post document for the client.
// Derives isLiked and likesCount from the likers array.
// ─────────────────────────────────────────────
const formatPost = (post, requestingUserId) => {
    const obj = post.toObject();
    obj.likesCount = obj.likers.length;
    obj.isLiked = requestingUserId
        ? obj.likers.map(id => id.toString()).includes(requestingUserId.toString())
        : false;
    return obj;
};

// ─────────────────────────────────────────────
// POST /api/posts
// Create a new post
// Body: { userId, postImageString, caption }
// ─────────────────────────────────────────────
export const createPost = async (req, res) => {
    try {
        const { userId, postImageString, caption } = req.body;

        if (!userId || !postImageString) {
            return res.status(400).json({ message: 'userId and postImageString are required.' });
        }

        const post = await Post.create({ userId, postImageString, caption });

        // Populate author so Swift gets the full User object immediately
        const populated = await post.populate('userId', 'name username profileImageString');

        return res.status(201).json(formatPost(populated, userId));
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// GET /api/posts/feed?requestingUserId=xxx
// All posts, newest first, with author populated
// ─────────────────────────────────────────────
export const getFeed = async (req, res) => {
    try {
        const { requestingUserId } = req.query;

        const posts = await Post.find()
            .sort({ timestamp: -1 })
            .populate('userId', 'name username profileImageString');

        return res.status(200).json(posts.map(p => formatPost(p, requestingUserId)));
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// GET /api/posts/user/:userId?requestingUserId=xxx
// All posts by one specific user
// ─────────────────────────────────────────────
export const getPostsByUser = async (req, res) => {
    try {
        const { requestingUserId } = req.query;

        const posts = await Post.find({ userId: req.params.userId })
            .sort({ timestamp: -1 })
            .populate('userId', 'name username profileImageString');

        return res.status(200).json(posts.map(p => formatPost(p, requestingUserId)));
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/posts/:id
// Delete a post — only the author can delete
// Body: { userId }
// ─────────────────────────────────────────────
export const deletePost = async (req, res) => {
    try {
        const { userId } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ message: 'Post not found.' });

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ message: 'You can only delete your own posts.' });
        }

        // 1️⃣ Delete the post itself
        await post.deleteOne();

        // 2️⃣ Scrub this post ID from EVERY user's savedPosts array
        // This ensures if Sarah deletes a post, it disappears from Vedant's saved list immediately
        await User.updateMany(
            { savedPosts: post._id },
            { $pull: { savedPosts: post._id } }
        );

        return res.status(200).json({ message: 'Post deleted.' });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// POST /api/posts/:id/like
// Toggle like — adds or removes userId from likers array
// Body: { userId }
// Returns: { isLiked, likesCount }
// ─────────────────────────────────────────────
export const toggleLike = async (req, res) => {
    try {
        const { userId } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        const alreadyLiked = post.likers.map(id => id.toString()).includes(userId);

        if (alreadyLiked) {
            // Unlike — pull the userId out
            await Post.findByIdAndUpdate(req.params.id, { $pull: { likers: userId } });
        } else {
            // Like — add the userId (addToSet prevents duplicates)
            await Post.findByIdAndUpdate(req.params.id, { $addToSet: { likers: userId } });
        }

        const updated = await Post.findById(req.params.id);
        return res.status(200).json({
            isLiked: !alreadyLiked,
            likesCount: updated.likers.length,
        });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// POST /api/posts/:id/comment
// Add a comment to a post
// Body: { username, text }
// ─────────────────────────────────────────────
export const addComment = async (req, res) => {
    try {
        const { username, text } = req.body;

        if (!username || !text) {
            return res.status(400).json({ message: 'username and text are required.' });
        }

        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { username, text, timestamp: new Date() } } },
            { returnDocument: 'after' }
        );

        if (!post) return res.status(404).json({ message: 'Post not found.' });

        // Return just the newest comment (last in array)
        return res.status(201).json(post.comments[post.comments.length - 1]);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/posts/:id/comment/:commentId
// Remove a specific comment by its _id
// ─────────────────────────────────────────────
export const deleteComment = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $pull: { comments: { _id: req.params.commentId } } },
            { returnDocument: 'after' }
        );

        if (!post) return res.status(404).json({ message: 'Post not found.' });

        return res.status(200).json({ message: 'Comment deleted.' });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// GET /api/posts/:id/comments
// Get all comments on a specific post, oldest first
// ─────────────────────────────────────────────
export const getComments = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select('comments');
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        // Sort oldest → newest so the UI renders in chronological order
        const sorted = [...post.comments].sort((a, b) => a.timestamp - b.timestamp);
        return res.status(200).json(sorted);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// POST /api/posts/:id/save
// Toggle save — adds or removes postId from user's savedPosts array
// Body: { userId }
// Returns: { isSaved }
// ─────────────────────────────────────────────
export const toggleSave = async (req, res) => {
    try {
        const { userId } = req.body;
        const postId = req.params.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const alreadySaved = user.savedPosts.map(id => id.toString()).includes(postId);

        if (alreadySaved) {
            await User.findByIdAndUpdate(userId, { $pull: { savedPosts: postId } });
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postId } });
        }

        return res.status(200).json({ isSaved: !alreadySaved });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// ─────────────────────────────────────────────
// GET /api/posts/saved?requestingUserId=xxx
// Get all private saved posts for the currently requesting user
// ─────────────────────────────────────────────
export const getSavedPosts = async (req, res) => {
    try {
        const { requestingUserId } = req.query;

        if (!requestingUserId) {
            return res.status(400).json({ message: 'requestingUserId is required.' });
        }

        const user = await User.findById(requestingUserId).populate({
            path: 'savedPosts',
            populate: { path: 'userId', select: 'name username profileImageString' }
        });

        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Filter out any null posts (in case a cleanup failed) and format
        const validSavedPosts = user.savedPosts.filter(p => p != null);

        // Reverse it so newest saved is at top, like IG
        const formatted = validSavedPosts.map(p => formatPost(p, requestingUserId)).reverse();

        return res.status(200).json(formatted);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

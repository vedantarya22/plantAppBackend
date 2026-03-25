
import Post    from '../models/post.model.js';
import Like    from '../models/like.model.js';
import Comment from '../models/comment.model.js';
import User    from '../models/user.model.js';

//  Hydrate post with isLikedByMe + isSaved
const hydratePost = (post, likedSet, savedSet) => ({
    ...post.toObject(),
    isLikedByMe: likedSet.has(post._id.toString()),
    isSaved:     savedSet.has(post._id.toString()),
});

//  Create Post 
export const createPost = async (req, res) => {
    try {
        const { postImageString, caption } = req.body;

        if (!postImageString) {
            return res.status(400).json({ message: 'postImageString is required' });
        }

        const post = await Post.create({
            userId: req.userId,   //  from JWT — not from body
            postImageString,
            caption: caption || '',
        });

        await post.populate('userId', 'name username profileImageString');

        return res.status(201).json({
            ...post.toObject(),
            isLikedByMe: false,
            isSaved:     false,
        });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// Get Feed (paginated, newest first)
export const getFeed = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip  = (page - 1) * limit;

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name username profileImageString');

        // Batch check — did I like / save any of these posts?
        const postIds = posts.map(p => p._id);

        const [userLikes, currentUser] = await Promise.all([
            Like.find({ postId: { $in: postIds }, userId: req.userId }).select('postId'),
            User.findById(req.userId).select('savedPosts'),
        ]);

        const likedSet = new Set(userLikes.map(l => l.postId.toString()));
        const savedSet = new Set((currentUser?.savedPosts || []).map(id => id.toString()));

        return res.status(200).json({
            posts:   posts.map(p => hydratePost(p, likedSet, savedSet)),
            page,
            hasMore: posts.length === limit,
        });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

//  Get Posts By User 
export const getPostsByUser = async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name username profileImageString');

        const postIds = posts.map(p => p._id);

        const [userLikes, currentUser] = await Promise.all([
            Like.find({ postId: { $in: postIds }, userId: req.userId }).select('postId'),
            User.findById(req.userId).select('savedPosts'),
        ]);

        const likedSet = new Set(userLikes.map(l => l.postId.toString()));
        const savedSet = new Set((currentUser?.savedPosts || []).map(id => id.toString()));

        return res.status(200).json(posts.map(p => hydratePost(p, likedSet, savedSet)));
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

//  Get Single Post 
export const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('userId', 'name username profileImageString');

        if (!post) return res.status(404).json({ message: 'Post not found' });

        const [liked, currentUser] = await Promise.all([
            Like.exists({ postId: post._id, userId: req.userId }),
            User.findById(req.userId).select('savedPosts'),
        ]);

        const savedSet = new Set((currentUser?.savedPosts || []).map(id => id.toString()));

        return res.status(200).json({
            ...post.toObject(),
            isLikedByMe: !!liked,
            isSaved:     savedSet.has(post._id.toString()),
        });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

//  Delete Post 
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorised' });
        }

        //  Clean up likes, comments, saved refs atomically
        await Promise.all([
            Like.deleteMany({ postId: post._id }),
            Comment.deleteMany({ postId: post._id }),
            User.updateMany({ savedPosts: post._id }, { $pull: { savedPosts: post._id } }),
            post.deleteOne(),
        ]);

        return res.status(200).json({ message: 'Post deleted' });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// Toggle Like 
export const toggleLike = async (req, res) => {
    try {
        const { id: postId } = req.params;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const existing = await Like.findOne({ postId, userId: req.userId });

        if (existing) {
            //  Unlike
            await Promise.all([
                existing.deleteOne(),
                Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }),
            ]);
            return res.status(200).json({
                isLiked:    false,
                likesCount: Math.max(0, post.likesCount - 1),
            });
        } else {
            //  Like
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
        if (err.code === 11000) {
            return res.status(200).json({ isLiked: true });
        }
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

//  Add Comment 
export const addComment = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const [comment] = await Promise.all([
            Comment.create({ postId, userId: req.userId, text: text.trim() }),
            Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }),
        ]);

        await comment.populate('userId', 'name username profileImageString');

        return res.status(201).json(comment);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

//  Get Comments (paginated)
export const getComments = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip  = (page - 1) * limit;

        const comments = await Comment.find({ postId: req.params.id })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name username profileImageString');

        return res.status(200).json({
            comments,
            page,
            hasMore: comments.length === limit,
        });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

//  Delete Comment 
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorised' });
        }

        await Promise.all([
            comment.deleteOne(),
            Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: -1 } }),
        ]);

        return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

//  Toggle Save 
export const toggleSave = async (req, res) => {
    try {
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const alreadySaved = user.savedPosts.map(id => id.toString()).includes(postId);

        if (alreadySaved) {
            await User.findByIdAndUpdate(req.userId, { $pull: { savedPosts: postId } });
        } else {
            await User.findByIdAndUpdate(req.userId, { $addToSet: { savedPosts: postId } });
        }

        return res.status(200).json({ isSaved: !alreadySaved });
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};

// Get Saved Posts 
export const getSavedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'savedPosts',
            populate: { path: 'userId', select: 'name username profileImageString' },
            options: { sort: { createdAt: -1 } },
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const validPosts = user.savedPosts.filter(Boolean);
        const postIds    = validPosts.map(p => p._id);

        const userLikes = await Like.find({
            postId: { $in: postIds },
            userId: req.userId,
        }).select('postId');

        const likedSet = new Set(userLikes.map(l => l.postId.toString()));
        const savedSet = new Set(postIds.map(id => id.toString()));

        return res.status(200).json(validPosts.map(p => hydratePost(p, likedSet, savedSet)));
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong: ${err}` });
    }
};
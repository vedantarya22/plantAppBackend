import User from '../models/user.model.js';
import UserPlant from "../models/userPlant.model.js";

const createUser = async (req, res) => {
    try {
        const { name, username, email, phoneNumber, dateOfBirth, profileImageString } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(200).json(existingUser);
        }
        const newUser = new User({ name, username, email, phoneNumber, dateOfBirth, profileImageString });
        const saved = await newUser.save();
        return res.status(201).json(saved);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        // Add live plant count to response
        const plantCount = await UserPlant.countDocuments({ userId: req.params.id });
        res.json({ ...user.toJSON(), plantCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// user.controller.js — small fix to getAllUser
const getAllUser = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.userId } })
            .select('-password')
            .sort({ name: 1 });

        // Add plantCount to each user
        const usersWithCount = await Promise.all(
            users.map(async (user) => {
                const plantCount = await UserPlant.countDocuments({ userId: user._id });
                return { ...user.toJSON(), plantCount };
            })
        );

        return res.status(200).json(usersWithCount);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
};


const updateUser = async (req, res) => {
    console.log(' updateUser hit — userId:', req.userId, 'paramId:', req.params.id);
    console.log(' body:', req.body);
    try {
        const { name, username, profileImageString } = req.body;
 
        // Only the user themselves can update their profile
        if (req.userId !== req.params.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
 
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { name, username, profileImageString },
            { new: true }           // return updated doc
        ).select('-password');
 
        if (!updated) return res.status(404).json({ message: 'User not found' });
 
        return res.status(200).json(updated);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
};

// MARK: - Delete User (account deletion)
// Removes the user + all their associated data atomically
 
const deleteUser = async (req, res) => {
    try {
        // MARK: Authorization — only the user themselves can delete their account
        if (req.userId !== req.params.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
 
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
 
        // MARK: Delete all associated data atomically
        await Promise.all([
            // User's plants
            UserPlant.deleteMany({ userId: req.params.id }),
 
            // User's posts + their likes and comments
            Post.find({ userId: req.params.id }).then(async (posts) => {
                const postIds = posts.map(p => p._id);
                await Promise.all([
                    Like.deleteMany({ postId: { $in: postIds } }),
                    Comment.deleteMany({ postId: { $in: postIds } }),
                    Post.deleteMany({ userId: req.params.id }),
                ]);
            }),
 
            // Likes the user gave on other posts
            Like.deleteMany({ userId: req.params.id }),
 
            // Comments the user made on other posts
            Comment.deleteMany({ userId: req.params.id }),
 
            // Remove from other users' savedPosts arrays
            User.updateMany(
                { savedPosts: { $exists: true } },
                { $pull: { savedPosts: { $in: [] } } }  // cleans stale refs
            ),
 
            // Finally delete the user
            User.findByIdAndDelete(req.params.id),
        ]);
 
        console.log(`✅ Account deleted: ${user.email}`);
        return res.status(200).json({ message: 'Account deleted successfully' });
 
    } catch (err) {
        console.error('❌ deleteUser error:', err);
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
};




export { createUser, getUserById,getAllUser,updateUser,deleteUser };



import User from '../models/user.model.js';

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
        const user = await User.findById(req.params.id).select('-password'); // ✅
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
};


// user.controller.js — small fix to getAllUser
const getAllUser = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.userId } })  // exclude self
            .select('-password')   //never send password hash
            .sort({ name: 1 });
        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
};



export { createUser, getUserById,getAllUser };



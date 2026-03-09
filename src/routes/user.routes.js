import { Router } from 'express';
import User from '../models/user.model.js';
const router = Router();

router.route('/')
    .post(async (req, res) => {
        try {
            const { name, username, email, phoneNumber, dateOfBirth, profileImageString } = req.body;

            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(200).json(existingUser);  // return existing instead of error
            }

            const newUser = new User({ name, username, email, phoneNumber, dateOfBirth, profileImageString });
            const saved = await newUser.save();
            return res.status(201).json(saved);

        } catch (err) {
            return res.status(500).json({ message: `Something went wrong ${err}` });
        }
    })
    .get(async (req, res) => {
        try {
            const users = await User.find();
            return res.status(200).json(users);
        } catch (err) {
            return res.status(500).json({ message: `Something went wrong ${err}` });
        }
    });

router.route('/:id').get(async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({ message: `Something went wrong ${err}` });
    }
});


export default router;
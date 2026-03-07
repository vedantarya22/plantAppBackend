// controllers/auth.controller.js
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import appleSignin from 'apple-signin-auth';

// ✅ Helper — generate JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// ✅ SIGNUP — Email + Password
const signup = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check existing user
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(409).json({
                message: existingUser.email === email
                    ? 'Email already in use'
                    : 'Username already taken'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name,
            username,
            email,
            password: hashedPassword,
            authProvider: 'local'
        });

        const token = generateToken(newUser._id);

        return res.status(201).json({
            token,
            user: {
                _id:      newUser._id,
                name:     newUser.name,
                username: newUser.username,
                email:    newUser.email
            }
        });

    } catch (err) {
        return res.status(500).json({ message: `Signup failed: ${err}` });
    }
};

// ✅ LOGIN — Email + Password
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        if (!user || user.authProvider !== 'local') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            token,
            user: {
                _id:      user._id,
                name:     user.name,
                username: user.username,
                email:    user.email
            }
        });

    } catch (err) {
        return res.status(500).json({ message: `Login failed: ${err}` });
    }
};

// ✅ SIGN IN WITH APPLE
const appleAuth = async (req, res) => {
    try {
        const { identityToken, fullName, email } = req.body;

        if (!identityToken) {
            return res.status(400).json({ message: 'Identity token required' });
        }

        // Verify Apple token
        const appleUser = await appleSignin.verifyIdToken(identityToken, {
            audience: 'com.yourapp.bundleId',   // ✅ replace with your Bundle ID
            ignoreExpiration: false
        });

        const appleId = appleUser.sub;  // Apple's unique user ID

        // Check if user exists
        let user = await User.findOne({ appleId });

        if (!user) {
            // First time Apple login — create user
            const name = fullName?.givenName
                ? `${fullName.givenName} ${fullName.familyName || ''}`.trim()
                : 'Apple User';

            user = await User.create({
                name,
                username:     `apple_${appleId.slice(0, 8)}`,
                email:        email || null,
                appleId,
                authProvider: 'apple',
                isVerified:   true    // Apple already verified the email
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            token,
            user: {
                _id:      user._id,
                name:     user.name,
                username: user.username,
                email:    user.email
            }
        });

    } catch (err) {
        return res.status(500).json({ message: `Apple auth failed: ${err}` });
    }
};

export { signup, login, appleAuth };

import User   from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.service.js';

// MARK: - Helpers

const generateToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });

const generateVerifyToken = () => ({
    token:  crypto.randomBytes(32).toString('hex'),
    expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)  // 24 hours from now
});

// MARK: - Signup

const signup = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // MARK: Validation
        if (!name || !username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // MARK: Duplicate Check
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({
                message: existingUser.email === email
                    ? 'Email already in use'
                    : 'Username already taken'
            });
        }

        // MARK: Hash Password
        const hashedPassword = await bcrypt.hash(password, 12);

        // MARK: Generate Verification Token
        const { token: verifyToken, expiry: verifyTokenExpiry } = generateVerifyToken();

        // MARK: Create User (unverified until email clicked)
        await User.create({
            name,
            username,
            email,
            password:          hashedPassword,
            authProvider:      'local',
            isVerified:        false,
            verifyToken,
            verifyTokenExpiry,
        });

        // MARK: Send Verification Email
        await sendVerificationEmail(email, verifyToken);
        console.log(` Signup — verification email sent to ${email}`);

        // Don't return a JWT until email is verified
        return res.status(201).json({
            message: 'Account created! Please check your email to verify your account.'
        });

    } catch (err) {
        console.error(' Signup error:', err);
        return res.status(500).json({ message: `Signup failed: ${err}` });
    }
};

// MARK: - Verify Email

const verifyEmail = async (req, res) => {
    try {
        // MARK: Find User by Token (must not be expired)
        const user = await User.findOne({
            verifyToken:       req.params.token,
            verifyTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).send(`
                <html>
                <body style="font-family:-apple-system,sans-serif;
                             text-align:center;padding:60px 20px;background:#fff5f5;">
                    <h2 style="color:#c62828;"> Invalid or Expired Link</h2>
                    <p style="color:#555;">
                        Please sign up again or request a new verification email.
                    </p>
                </body>
                </html>
            `);
        }

        // MARK: Mark Verified + Clear Token
        user.isVerified        = true;
        user.verifyToken       = undefined;
        user.verifyTokenExpiry = undefined;
        await user.save();

        console.log(`✅ Email verified for ${user.email}`);

        return res.status(200).send(`
            <html>
            <head>
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <style>
                    body { font-family:-apple-system,sans-serif;text-align:center;
                           padding:60px 20px;background:#f0f7f0; }
                    h2   { color:#2d7d32; }
                    p    { color:#555;font-size:16px; }
                </style>
            </head>
            <body>
                <h2> Email Verified!</h2>
                <p>Your Leafora account is now active.</p>
                <p>You can close this page and log in to the app.</p>
            </body>
            </html>
        `);

    } catch (err) {
        console.error('❌ Verify error:', err);
        return res.status(500).json({ message: `Verification failed: ${err}` });
    }
};

// MARK: - Login

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // MARK: Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // MARK: Find User
        const user = await User.findOne({ email });
        if (!user || user.authProvider !== 'local') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // MARK: Email Verification Check
        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in. Check your inbox.'
            });
        }

        // MARK: Password Check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // MARK: Generate JWT
        const token = generateToken(user._id);
        console.log(`Login — ${user.email}`);

        return res.status(200).json({
            token,
            user: {
                _id:                user._id,
                name:               user.name,
                username:           user.username,
                email:              user.email,
                profileImageString: user.profileImageString,
            }
        });

    } catch (err) {
        console.error('❌ Login error:', err);
        return res.status(500).json({ message: `Login failed: ${err}` });
    }
};

export { signup, login, verifyEmail };
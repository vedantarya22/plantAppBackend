import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,   // your Gmail address
        pass: process.env.EMAIL_PASS    // Gmail App Password (not your login password)
    }
});
 
export const sendVerificationEmail = async (toEmail, token) => {
    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify/${token}`;
 
    await transporter.sendMail({
        from:    `"Leafora 🌿" <${process.env.EMAIL_USER}>`,
        to:      toEmail,
        subject: 'Verify your Leafora account',
        html: `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;
                        margin:0 auto;padding:40px 20px;background:#f9fdf9;">
 
                <h1 style="color:#2d7d32;font-size:26px;margin-bottom:8px;">
                    Welcome to Leafora 🌿
                </h1>
 
                <p style="color:#444;font-size:16px;line-height:1.6;">
                    Thanks for signing up! Click the button below to verify
                    your email address and activate your account.
                </p>
 
                <a href="${verifyUrl}"
                   style="display:inline-block;margin:24px 0;
                          background:#2d7d32;color:white;
                          padding:14px 32px;border-radius:10px;
                          text-decoration:none;font-size:16px;font-weight:600;">
                    Verify Email
                </a>
 
                <p style="color:#888;font-size:13px;">
                    This link expires in 24 hours.<br>
                    If you didn't create an account, ignore this email.
                </p>
 
                <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
                <p style="color:#aaa;font-size:12px;">Leafora — Your Plant Care Companion</p>
            </div>
        `
    });
 
    console.log(`✅ Verification email sent to ${toEmail}`);
};
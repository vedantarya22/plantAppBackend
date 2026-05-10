export const sendVerificationEmail = async (toEmail, token) => {
    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify/${token}`;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept':       'application/json',
            'api-key':      process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender:      { email: process.env.EMAIL_USER, name: 'Leafora 🌿' },
            to:          [{ email: toEmail }],
            subject:     'Verify your Leafora account',
            htmlContent: `
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
        })
    });

    if (!response.ok) {
        const err = await response.json();
        console.error('❌ Brevo error:', err);
        throw new Error(`Email send failed: ${err.message}`);
    }

    console.log(`✅ Verification email sent to ${toEmail}`);
};
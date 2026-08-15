import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, verificationUrl } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const targetName = name || 'Pet Owner';
  const targetUrl =
    verificationUrl ||
    `https://hydro-nourish.vercel.app/owner/login?verified=true&email=${encodeURIComponent(email)}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.VITE_GMAIL_USER || 'heritagelink45@gmail.com',
      pass: process.env.VITE_GMAIL_APP_PASS || 'oolb brtm yybq usmf',
    },
  });

  const mailOptions = {
    from: '"HydroNourish Clinic" <heritagelink45@gmail.com>',
    to: email,
    subject: '🐾 Verify Your HydroNourish Pet Owner Account - Heritage Animal Clinic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 26px; font-weight: 800;">🐾 HydroNourish</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">Heritage Animal Clinic • Pet Health & Telemetry</p>
        </div>
        
        <div style="padding: 24px; background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Hello ${targetName},</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Thank you for registering on the <strong>HydroNourish Pet Owner Portal</strong>! Please click the verification button below to activate your account and monitor your pet's dietary and hydration telemetry.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${targetUrl}" 
               style="background-color: #0d9488; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);">
              ✓ Click Here to Verify Email
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0; line-height: 1.5;">
            Or copy and paste this link in your browser:<br/>
            <a href="${targetUrl}" style="color: #0d9488; word-break: break-all; font-weight: 600;">
              ${targetUrl}
            </a>
          </p>
        </div>
        
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
          Sent automatically from Heritage Animal Clinic (heritagelink45@gmail.com). If you did not create this account, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('SMTP Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
}

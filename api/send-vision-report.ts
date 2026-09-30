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

  const { email, name, petName, subject, htmlContent } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const targetName = name || 'Pet Owner';
  const targetSubject = subject || `Vision Analytics Report - ${petName}`;

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
    subject: targetSubject,
    html: htmlContent || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 26px; font-weight: 800;">📊 Vision Analytics Report</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">HydroNourish Smart Feeding System</p>
        </div>
        
        <div style="padding: 24px; background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Hello ${targetName},</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Here is the latest vision analytics report for <strong>${petName}</strong>.
          </p>
          
          <div style="margin: 24px 0; padding: 16px; background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Note: This email contains a summary of your pet's feeding and hydration activity detected by the AI vision system.
            </p>
          </div>
        </div>
        
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
          Sent automatically from Heritage Animal Clinic (heritagelink45@gmail.com).
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

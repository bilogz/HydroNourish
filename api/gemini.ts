import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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

  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Gemini API key is not configured.' });
  }

  const { prompt, base64Image, mimeType = 'image/jpeg', model = 'gemini-3.6-flash' } = req.body || {};

  if (!prompt && !base64Image) {
    return res.status(400).json({ error: 'Missing prompt or image content' });
  }

  try {
    const parts: any[] = [];
    if (prompt) {
      parts.push({ text: prompt });
    }
    if (base64Image) {
      const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64,
        },
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: `Gemini API error: ${errText}` });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      success: true,
      text,
      model,
      provider: 'Gemini 3.6 Flash',
    });
  } catch (err: any) {
    console.error('Gemini Server Proxy Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error processing AI request' });
  }
}

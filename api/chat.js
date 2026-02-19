// api/chat.js
export default async function handler(req, res) {
  // POST 요청이 아니면 에러 반환
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  
  // Vercel Settings에 저장한 키를 가져옵니다 (브라우저 노출 안됨)
  const apiKey = process.env.GEMINI_API_KEY; 

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'API 호출 중 오류가 발생했습니다.' });
  }
}

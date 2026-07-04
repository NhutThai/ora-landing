export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({ error: 'Missing GEMINI_API_KEY' });
  }

  const message = String(req.body?.message || '').trim().slice(0, 800);
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  const systemPrompt = `Bạn là trợ lý tư vấn sản phẩm ORA Ring bằng tiếng Việt.
Chỉ trả lời các câu hỏi liên quan đến nhẫn thông minh ORA, sức khỏe, tính năng, thông số, giá demo, mua hàng demo và đăng ký nhận tin.
Thông tin sản phẩm:
- ORA Ring là nhẫn thông minh theo dõi giấc ngủ, nhịp tim, HRV, SpO2, nhiệt độ da và điểm hồi phục.
- Pin khoảng 7 ngày, sạc đầy khoảng 2 giờ bằng đế sạc từ tính.
- Chống nước 10ATM, vỏ titan, trọng lượng khoảng 4g.
- Size US 6-13, có sizing kit miễn phí.
- Giá demo: Midnight/Sand 4.990.000đ, Rose Gold 5.290.000đ.
- Đây là landing page demo, chưa xử lý thanh toán thật.
Trả lời ngắn gọn, thân thiện, tối đa 4 câu. Không bịa thông số ngoài dữ liệu trên.`;

  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nCâu hỏi khách hàng: ${message}` }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 220,
        },
      }),
    });

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      return res.status(502).json({ error: 'Gemini API error', detail });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'Empty Gemini reply' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * BACKEND THAY THẾ — Vercel Serverless Function (tuỳ chọn nâng cao)
 * ---------------------------------------------------------------------------
 * Dùng file này nếu bạn muốn một lớp backend "thật sự" thay vì gọi thẳng
 * webhook từ trình duyệt — ví dụ để giấu URL lưu trữ, validate lại email ở
 * server, hoặc chặn spam. Với một landing page demo thì cách ở
 * backend/google-apps-script.js (gọi thẳng từ client) là đủ dùng; file này
 * dành cho ai muốn làm kỹ hơn.
 *
 * CÁCH BẬT:
 * 1. Copy file này vào  <thư mục gốc dự án>/api/subscribe.js
 *    (Vercel tự nhận mọi file trong /api làm serverless function).
 * 2. Trên Vercel: Project Settings → Environment Variables, thêm
 *    STORAGE_WEBHOOK_URL = URL của Google Apps Script Web App
 *    (xem backend/google-apps-script.js để tạo URL này).
 * 3. Trong js/main.js, đổi:
 *      const WEBHOOK_URL = '/api/subscribe';
 *    (đường dẫn tương đối, cùng domain nên không dính CORS).
 * 4. Deploy lại. Từ giờ trình duyệt gọi vào hàm này, hàm này mới là bên
 *    gọi tiếp sang nơi lưu trữ thật — client không biết URL lưu trữ thật.
 *
 * Lưu ý: đây là Vercel Serverless Function (Node.js runtime), không chạy nếu
 * bạn deploy trên Netlify/Cloudflare Pages — hai nền tảng đó dùng cú pháp
 * function riêng (Netlify Functions / Pages Functions), cấu trúc export
 * hơi khác nhưng cùng ý tưởng.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email, source, submitted_at } = req.body || {};
  const isValidEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    return res.status(400).json({ ok: false, error: 'Email không hợp lệ' });
  }

  const storageUrl = process.env.STORAGE_WEBHOOK_URL;

  // Chưa cấu hình env var — vẫn trả 200 để không chặn UI khi demo,
  // nhưng log rõ để bạn biết cần thêm STORAGE_WEBHOOK_URL trên Vercel.
  if (!storageUrl) {
    console.warn('[api/subscribe] Thiếu STORAGE_WEBHOOK_URL — bỏ qua bước lưu trữ.');
    return res.status(200).json({ ok: true, stored: false });
  }

  try {
    const upstream = await fetch(storageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source: source || 'ora-landing-page',
        submitted_at: submitted_at || new Date().toISOString(),
      }),
    });

    if (!upstream.ok) throw new Error(`Upstream trả về ${upstream.status}`);
    return res.status(200).json({ ok: true, stored: true });
  } catch (err) {
    console.error('[api/subscribe] Lỗi khi lưu dữ liệu:', err);
    return res.status(502).json({ ok: false, error: 'Không thể lưu dữ liệu lúc này' });
  }
}

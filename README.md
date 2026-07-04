# ORA Ring — Landing Page (bài test HELICORP Vòng 2)

Landing page giới thiệu **ORA Ring**, nhẫn thông minh theo dõi giấc ngủ, nhịp tim, HRV
và khả năng hồi phục. Xây dựng bằng **HTML/CSS/JS thuần** (không framework, không build step)
để tối đa hoá điểm Google PageSpeed Insights và dễ deploy lên các nền tảng static hosting.

## Cấu trúc thư mục

```
ora-landing/
├── index.html          # Toàn bộ cấu trúc trang + meta SEO/OG
├── css/styles.css       # Design tokens, layout, responsive, dark mode, animation
├── js/main.js           # Theme, reveal, ring, shop (cart/wishlist/recent), chatbot, form, tracking
├── assets/favicon.svg   # Favicon dạng vector
├── backend/              # Backend lưu trữ dữ liệu — KHÔNG deploy cùng site tĩnh
│   ├── google-apps-script.js   # Backend chính: dán vào Google Apps Script (miễn phí)
│   └── api-subscribe.js         # Backend thay thế: Vercel Serverless Function (nâng cao)
└── README.md
```

Dùng HTML/CSS/JS thuần (thay vì React/Vue) là lựa chọn có chủ đích: không tải thêm
framework runtime → giảm JS execution time → dễ đạt ≥ 85 điểm Mobile PageSpeed hơn.

## Chạy thử ở local

Không cần build. Chỉ cần một static server bất kỳ, ví dụ:

```bash
cd ora-landing
python3 -m http.server 5500
# hoặc
npx serve .
```

Mở `http://localhost:5500` để xem.

## Cấu hình Webhook / Backend lưu trữ dữ liệu (điểm cộng)

Mở `js/main.js`, sửa hằng số đầu file:

```js
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxsV5_BHyzFDWRCs7Ni5WAuEiiM0rgW5Hd_zG1IEtZVfm-brDwx57E-Qxn4er4dMzVx/exec';
```

Có 2 lựa chọn tuỳ mức độ bạn muốn làm:

**Cách nhanh — test bằng webhook.site:**
1. Vào https://docs.google.com/spreadsheets/d/1lRvkK-Umsza58pY2kug9-jTLxwLtOijpugpQUcK4jBg/edit?hl=vi&gid=0#gid=0 , copy "Your unique URL".
2. Dán vào `WEBHOOK_URL`.
3. Submit form trên trang → mở lại webhook.site để thấy payload JSON
   `{ email, source, submitted_at }` được gửi tới. Phù hợp để demo nhanh,
   nhưng dữ liệu không được lưu trữ lâu dài.

**Cách có lưu trữ thật — Google Sheet làm backend (khuyên dùng):**
Xem hướng dẫn chi tiết trong `backend/google-apps-script.js`. Tóm tắt: dán
đoạn code đó vào Google Apps Script gắn với một Google Sheet, Deploy dưới
dạng Web App, rồi lấy URL đó dán vào đúng `WEBHOOK_URL` như trên — không
cần sửa gì thêm trong `main.js`, mỗi lượt đăng ký sẽ tự thành một dòng mới
trong Sheet. Đây thực chất là một backend thật (có validate email, có lưu
trữ persistent), chỉ là không cần tự dựng server.

**Cách nâng cao — Vercel Serverless Function:**
Nếu muốn có hẳn một lớp API riêng (giấu URL lưu trữ thật, validate lại ở
server) thay vì gọi thẳng từ trình duyệt, xem `backend/api-subscribe.js`.
File có hướng dẫn cách bật ngay trong comment đầu file.

Nếu bạn có backend riêng khác (Make.com, một API tự viết…), chỉ cần thay
`WEBHOOK_URL` — form đã validate email phía client và gửi JSON qua `fetch()`.

## Đưa code lên GitHub

```bash
cd ora-landing
git commit -m "feat: initial ORA landing page (hero, features, specs, signup form)"
git branch -M main
git remote add origin https://github.com/nhutthai/ora-landing.git
git push -u origin main
```

Gợi ý chia nhánh khoa học nếu muốn thể hiện quy trình rõ ràng hơn:
- `main` — bản ổn định, dùng để deploy.
- `feature/hero-section`, `feature/signup-form`, `feature/dark-mode`… — mỗi nhánh một
  phần việc, sau đó merge/PR vào `main`.

Nhớ để repository ở chế độ **Public** trước khi nộp bài (Settings → General → Danger Zone → Change visibility).

## Deploy (chọn 1 trong 3, đều miễn phí)

### Vercel
1. https://vercel.com → New Project → Import repo GitHub vừa tạo.
2. Framework Preset: **Other** (static site).
3. Build Command: để trống. Output Directory: `.` (thư mục gốc).
4. Deploy.

### Netlify
1. https://app.netlify.com → Add new site → Import an existing project.
2. Chọn repo GitHub.
3. Build command: để trống. Publish directory: `.`
4. Deploy site.

### Cloudflare Pages
1. https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git.
2. Chọn repo.
3. Build command: để trống. Build output directory: `/`
4. Save and Deploy.

Sau khi deploy, cập nhật lại các URL tuyệt đối trong `index.html`
(`og:url`, `og:image`, `twitter:image`, `<link rel="canonical">`) thành domain thật
mà nền tảng cấp cho bạn, rồi commit + push lại — nếu không Open Graph sẽ trỏ về URL mẫu.

## Kiểm tra Google PageSpeed Insights

1. Vào https://pagespeed.web.dev
2. Dán link trang đã deploy → chọn tab **Mobile**.
3. Chụp màn hình điểm số để nộp kèm bài.

Một vài điều đã làm sẵn để hỗ trợ điểm số:
- Không dùng ảnh raster nặng — toàn bộ icon/hình minh hoạ là SVG inline (tải gần như tức thời).
- Font ngoài (`Fraunces`, `Inter`, `IBM Plex Mono`) có `preconnect` và `display=swap` để tránh
  chặn render.
- `main.js` gắn `defer`, không có JS chặn render.
- CSS không dùng framework ngoài, kích thước file nhỏ.

Nếu điểm chưa đạt 85+, việc đầu tiên nên kiểm tra là dung lượng font (có thể bỏ bớt
weight không dùng tới trong link Google Fonts) và bật thêm caching/compression phía
hosting (Vercel/Netlify/Cloudflare đều tự làm việc này, nhưng nên double-check trong
tab Network của DevTools).

## Ảnh OG (Open Graph)

File `assets/og-image.png` (1200×630) chưa được tạo sẵn trong bộ này vì cần công cụ
render ảnh riêng. Cách nhanh nhất: chụp screenshot phần Hero section sau khi deploy
(crop về đúng tỉ lệ 1200×630) và lưu vào `assets/og-image.png`, rồi cập nhật lại đường
dẫn trong các thẻ `og:image` / `twitter:image`.

## Các phần điểm cộng đã tích hợp

| Yêu cầu | Trạng thái |
|---|---|
| Dark Mode | ✅ Toggle ở nav, lưu lựa chọn qua `localStorage`, tôn trọng `prefers-color-scheme` lần đầu |
| Scroll Animation | ✅ Reveal on scroll bằng `IntersectionObserver`, có stagger nhẹ |
| Micro-interactions | ✅ Hover card, hover button, animation vòng tròn Readiness Ring, xoay icon theme toggle, hiệu ứng tim khi yêu thích, badge giỏ hàng nảy khi thêm |
| Skeleton Loading | ✅ Áp dụng ở section "Trong hộp" (gallery), shimmer trước khi hiện icon |
| Webhook + validate dữ liệu | ✅ Form validate email client-side, `fetch()` POST JSON tới `WEBHOOK_URL` |
| Backend lưu trữ dữ liệu | ✅ `backend/google-apps-script.js` (Google Sheet, khuyên dùng) + `backend/api-subscribe.js` (Vercel Function, nâng cao) |
| Theo dõi hành vi (click, scroll) | ✅ Ghi log console theo scroll-depth mốc 25/50/75/100% và click; hiển thị toast khi có tương tác quan trọng (đổi theme, thêm giỏ hàng, submit form) |
| Parallax nhẹ | ✅ Hero glow di chuyển theo scroll, tự tắt khi `prefers-reduced-motion` |
| Mini e-commerce | ✅ Section "Cửa hàng" — 6 sản phẩm (3 màu nhẫn + 3 phụ kiện), yêu thích, giỏ hàng (tăng/giảm số lượng, tổng tiền), "Đã xem" tự ghi nhận khi sản phẩm lướt vào màn hình. Tất cả lưu qua `localStorage`, mở trong drawer trượt từ nav. |
| Chatbot góc màn hình | ✅ Nút nổi góc dưới phải, trả lời tự động theo luật từ khoá (pin, giá, chống nước, giấc ngủ, size, giao hàng...) kèm gợi ý câu hỏi nhanh và hiệu ứng "đang gõ" |
| Scrollytelling toàn trang | ⛔ Chưa làm — xem giải thích + gợi ý mở rộng bên dưới |

### Vì sao chưa làm Scrollytelling đầy đủ

Trang hiện đã có reveal-on-scroll, parallax nhẹ ở Hero và animation vòng tròn
kích hoạt khi cuộn tới — đủ để cảm giác "sống" khi cuộn trang. Một
Scrollytelling đầy đủ (pin một section lại, kể chuyện theo từng đoạn cuộn,
kết hợp Parallax nhiều lớp) cần rất nhiều tinh chỉnh bằng mắt thật trên
trình duyệt thật để không bị giật/lệch — điều mình không thể kiểm chứng
đáng tin cậy trong môi trường không có trình duyệt đồ hoạ ở đây. Thêm vào
đó, lạm dụng hiệu ứng cuộn dễ khiến trang trông rối và "màu mè quá tay"
thay vì cao cấp. Nếu bạn muốn tự làm thêm, cách đơn giản nhất là gắn
`position: sticky` cho `.hero-visual` trong lúc `.hero-copy` cuộn qua nhiều
đoạn text — mở `css/styles.css`, phần `.hero-inner`, để bắt đầu thử nghiệm.

## Chatbot — nâng cấp lên API thật (tuỳ chọn)

Mặc định chatbot trả lời tự động bằng luật từ khoá cục bộ (không cần
internet, không cần API key) — đã tự đáp ứng đúng yêu cầu "hỗ trợ trả lời
tự động" trong đề bài. Nếu muốn nối API thật (OpenAI, Gemini):

- **Không** gọi API key trực tiếp từ `js/main.js` — API key sẽ lộ ra cho
  bất kỳ ai xem source trình duyệt.
- Thay vào đó, tạo một serverless function tương tự `backend/api-subscribe.js`
  (ví dụ `/api/chat.js`), để function đó giữ API key trong biến môi trường
  và gọi OpenAI/Gemini hộ, trả lời JSON về cho `main.js`.
- Trong `initChat()` (`js/main.js`), thay hàm `matchReply()` bằng một lời
  gọi `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message: text }) })`
  rồi hiển thị câu trả lời nhận được thay vì tra luật từ khoá.

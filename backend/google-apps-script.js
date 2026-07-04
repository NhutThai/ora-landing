/**
 * BACKEND LƯU TRỮ DỮ LIỆU — Google Apps Script (miễn phí, không cần server riêng)
 * ---------------------------------------------------------------------------
 * File này KHÔNG chạy trong dự án Vercel/Netlify. Đây là code bạn dán vào
 * Google Apps Script gắn với một Google Sheet, đóng vai trò "backend" thật sự
 * để lưu mọi lượt đăng ký email từ form trên landing page.
 *
 * CÁCH BẬT (khoảng 3 phút):
 * 1. Tạo một Google Sheet mới (sheets.new). Đổi tên sheet đầu tiên thành "Signups".
 * 2. Vào Extensions → Apps Script. Xoá code mẫu, dán toàn bộ nội dung file này vào.
 * 3. Bấm Deploy → New deployment → chọn loại "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 4. Bấm Deploy, cấp quyền khi được hỏi, rồi copy "Web app URL".
 * 5. Mở js/main.js, dán URL đó vào biến WEBHOOK_URL ở đầu file:
 *      const WEBHOOK_URL = 'https://script.google.com/macros/s/XXXX/exec';
 *    Form đăng ký trên trang đã gọi fetch() tới URL này sẵn rồi — không cần
 *    sửa gì thêm. Mỗi lượt đăng ký sẽ tự thành một dòng mới trong Sheet.
 *
 * Sheet sẽ có các cột: Thời gian | Email | Nguồn | Thời điểm gửi (client)
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Signups')
    || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ ok: false, error: 'Payload không hợp lệ' });
  }

  var email = (data.email || '').toString().trim();
  var isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    return respond({ ok: false, error: 'Email không hợp lệ' });
  }

  sheet.appendRow([
    new Date(),
    email,
    data.source || '',
    data.submitted_at || '',
  ]);

  return respond({ ok: true });
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

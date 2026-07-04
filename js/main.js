(() => {
  'use strict';

  /* ============================================================
     CONFIG — thay đường dẫn webhook thật của bạn ở đây.
     Có thể tạo nhanh 1 webhook test tại https://webhook.site
     hoặc dùng Google Apps Script / Make.com / Zapier webhook.
     ============================================================ */
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxsV5_BHyzFDWRCs7Ni5WAuEiiM0rgW5Hd_zG1IEtZVfm-brDwx57E-Qxn4er4dMzVx/exec';

  const root = document.documentElement;
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  /* ---------------- Toast helper ---------------- */
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ============================================================
     THEME TOGGLE (persisted, respects system preference on first visit)
     ============================================================ */
  function initTheme() {
    const stored = localStorage.getItem('ora-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    root.setAttribute('data-theme', theme);

    const toggle = document.getElementById('themeToggle');
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));

    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('ora-theme', next);
      toggle.setAttribute('aria-pressed', String(next === 'dark'));
      showToast(next === 'dark' ? 'Đã chuyển sang giao diện tối' : 'Đã chuyển sang giao diện sáng');
    });
  }

  /* ============================================================
     SCROLL REVEAL — IntersectionObserver, staggered within each section
     ============================================================ */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('in-view'), i * 60);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     HERO READINESS RING — animate stroke + counting number
     ============================================================ */
  function initRing() {
    const progress = document.getElementById('ringProgress');
    const valueEl = document.getElementById('ringValue');
    if (!progress || !valueEl) return;

    const CIRCUMFERENCE = 578; // 2 * PI * r(92), matches stroke-dasharray in CSS
    const TARGET = 87;

    const run = () => {
      const offset = CIRCUMFERENCE - (CIRCUMFERENCE * TARGET) / 100;
      progress.style.strokeDashoffset = String(offset);

      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        valueEl.textContent = String(Math.round(eased * TARGET));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { run(); obs.disconnect(); }
        });
      }, { threshold: 0.4 });
      obs.observe(progress);
    } else {
      run();
    }
  }

  /* ============================================================
     GALLERY — skeleton loading then reveal (simulated asset load)
     ============================================================ */
  function initGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const items = [
      { label: 'Nhẫn ORA', icon: '<circle cx="20" cy="20" r="13"/>' },
      { label: 'Đế sạc từ tính', icon: '<rect x="8" y="14" width="24" height="12" rx="4"/>' },
      { label: 'Bộ sizing kit', icon: '<circle cx="14" cy="20" r="6"/><circle cx="26" cy="20" r="9"/>' },
      { label: 'Cáp USB-C', icon: '<path d="M10 20h20M26 14l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>' },
    ];

    items.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'gallery-item';
      el.innerHTML = `
        <div class="skeleton"></div>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6">${item.icon}</svg>
        <span class="caption">${item.label}</span>
      `;
      grid.appendChild(el);
      const delay = 400 + i * 260;
      setTimeout(() => el.classList.add('loaded'), delay);
    });
  }

  /* ============================================================
     FORM — client-side validation + webhook POST + toast feedback
     ============================================================ */
  function initForm() {
    const form = document.getElementById('signupForm');
    const input = document.getElementById('email');
    const hint = document.getElementById('formHint');
    if (!form || !input || !hint) return;

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setState(message, state) {
      hint.textContent = message;
      hint.classList.remove('is-error', 'is-success');
      if (state) hint.classList.add(state);
    }

    input.addEventListener('input', () => {
      input.closest('.field-group').classList.remove('error');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();

      if (!EMAIL_RE.test(email)) {
        input.closest('.field-group').classList.add('error');
        setState('Email chưa hợp lệ. Vui lòng kiểm tra lại.', 'is-error');
        input.focus();
        return;
      }

      form.classList.add('loading');
      setState('Đang gửi thông tin...', null);

      const payload = {
        email,
        source: 'ora-landing-page',
        submitted_at: new Date().toISOString(),
      };

      try {
        if (WEBHOOK_URL.includes('REPLACE-WITH-YOUR-WEBHOOK-ID')) {
          // Chưa cấu hình webhook thật — giả lập gửi thành công để demo UI.
          await new Promise((res) => setTimeout(res, 900));
        } else {
          // Content-Type cố ý để 'text/plain', KHÔNG phải 'application/json'.
          // Lý do: với mode:'no-cors', trình duyệt chỉ cho phép gửi kèm các
          // header thuộc nhóm "CORS-safelisted" — 'application/json' không
          // nằm trong đó nên có thể bị trình duyệt âm thầm bỏ qua phần body.
          // 'text/plain' luôn được phép, và Google Apps Script / hầu hết các
          // webhook receiver đều đọc thẳng phần body dạng text rồi tự
          // JSON.parse ở phía server, nên đổi Content-Type không ảnh hưởng
          // gì tới dữ liệu — chỉ là cách hợp lệ hoá request phía trình duyệt.
          await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            mode: 'no-cors',
          });
        }
        setState('Đăng ký thành công! Hẹn gặp bạn trong bản ra mắt sớm.', 'is-success');
        showToast('Đã ghi nhận đăng ký của bạn');
        form.reset();
      } catch (err) {
        setState('Có lỗi xảy ra, vui lòng thử lại sau.', 'is-error');
      } finally {
        form.classList.remove('loading');
      }
    });
  }

  /* ============================================================
     BEHAVIOR TRACKING — click & scroll depth, surfaced via toast
     (điểm cộng: theo dõi hành vi + hiển thị thông báo)
     ============================================================ */
  function initBehaviorTracking() {
    const milestones = [25, 50, 75, 100];
    const seen = new Set();

    function onScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const pct = Math.round((scrolled / docHeight) * 100);
      milestones.forEach((m) => {
        if (pct >= m && !seen.has(m)) {
          seen.add(m);
          console.log(`[behavior] scroll_depth=${m}%`);
        }
      });
    }
    window.addEventListener('scroll', throttle(onScroll, 400), { passive: true });

    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;
      const label = target.textContent.trim().slice(0, 40) || target.getAttribute('aria-label') || 'element';
      console.log(`[behavior] click="${label}"`);
    });
  }

  function throttle(fn, wait) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn(...args); }
    };
  }

  /* ============================================================
     Helpers shared by shop + chat
     ============================================================ */
  function formatVND(n) {
    if (n === 0) return 'Miễn phí';
    return n.toLocaleString('vi-VN') + '₫';
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  /* ============================================================
     MINI E-COMMERCE — wishlist, cart, recently viewed
     State persisted in localStorage; UI is a shared slide-over drawer.
     ============================================================ */
  function initShop() {
    const grid = document.querySelector('.product-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.product-card'));
    const PRODUCTS = {};
    cards.forEach((card) => {
      const id = card.dataset.productId;
      PRODUCTS[id] = {
        id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        visualHTML: card.querySelector('.product-visual').innerHTML,
      };
    });

    let cart = readJSON('ora-cart', {});       // { [id]: qty }
    let wishlist = readJSON('ora-wishlist', []); // [id, ...]
    let recent = readJSON('ora-recent', []);     // [id, ...] most-recent first

    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    const cartToggle = document.getElementById('cartToggle');
    const drawerClose = document.getElementById('drawerClose');
    const cartBadge = document.getElementById('cartBadge');
    const tabs = document.querySelectorAll('.drawer-tab');

    function cartCount() { return Object.values(cart).reduce((s, q) => s + q, 0); }

    function persist() {
      writeJSON('ora-cart', cart);
      writeJSON('ora-wishlist', wishlist);
      writeJSON('ora-recent', recent);
    }

    function itemRow({ id, visualHTML, name, priceLabel, controlsHTML }) {
      return `<li class="drawer-item" data-id="${id}">
        <span class="drawer-item-visual">${visualHTML}</span>
        <span>
          <span class="drawer-item-name">${name}</span><br>
          <span class="drawer-item-price">${priceLabel}</span>
        </span>
        <span class="drawer-item-actions">${controlsHTML}</span>
      </li>`;
    }

    function renderCart() {
      const list = document.getElementById('cartList');
      const empty = document.getElementById('cartEmpty');
      const footer = document.getElementById('cartFooter');
      const ids = Object.keys(cart).filter((id) => cart[id] > 0);

      if (!ids.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
        footer.hidden = true;
      } else {
        empty.style.display = 'none';
        footer.hidden = false;
        list.innerHTML = ids.map((id) => {
          const p = PRODUCTS[id];
          if (!p) return '';
          return itemRow({
            id, visualHTML: p.visualHTML, name: p.name,
            priceLabel: formatVND(p.price),
            controlsHTML: `
              <button class="qty-btn" data-action="dec" aria-label="Giảm số lượng">−</button>
              <span class="qty-value">${cart[id]}</span>
              <button class="qty-btn" data-action="inc" aria-label="Tăng số lượng">+</button>
              <button class="item-remove" data-action="remove">Xóa</button>`,
          });
        }).join('');
        const total = ids.reduce((sum, id) => sum + (PRODUCTS[id]?.price || 0) * cart[id], 0);
        document.getElementById('cartTotal').textContent = formatVND(total);
      }

      const count = cartCount();
      cartBadge.hidden = count === 0;
      cartBadge.textContent = String(count);
      document.getElementById('cartCount').textContent = String(count);
    }

    function renderWishlist() {
      const list = document.getElementById('wishlistList');
      const empty = document.getElementById('wishlistEmpty');
      if (!wishlist.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
      } else {
        empty.style.display = 'none';
        list.innerHTML = wishlist.map((id) => {
          const p = PRODUCTS[id];
          if (!p) return '';
          return itemRow({
            id, visualHTML: p.visualHTML, name: p.name,
            priceLabel: formatVND(p.price),
            controlsHTML: `
              <button class="item-move-btn" data-action="move-to-cart">Thêm vào giỏ</button>
              <button class="item-remove" data-action="remove">Xóa</button>`,
          });
        }).join('');
      }
      document.getElementById('wishlistCount').textContent = String(wishlist.length);
    }

    function renderRecent() {
      const list = document.getElementById('recentList');
      const empty = document.getElementById('recentEmpty');
      if (!recent.length) {
        list.innerHTML = '';
        empty.style.display = 'block';
      } else {
        empty.style.display = 'none';
        list.innerHTML = recent.map((id) => {
          const p = PRODUCTS[id];
          if (!p) return '';
          return itemRow({
            id, visualHTML: p.visualHTML, name: p.name,
            priceLabel: formatVND(p.price),
            controlsHTML: `<button class="item-move-btn" data-action="move-to-cart">Thêm vào giỏ</button>`,
          });
        }).join('');
      }
    }

    function renderAll() { renderCart(); renderWishlist(); renderRecent(); persist(); }

    function addToCart(id, silent) {
      cart[id] = (cart[id] || 0) + 1;
      renderAll();
      if (!silent) {
        cartBadge.classList.remove('bump');
        requestAnimationFrame(() => cartBadge.classList.add('bump'));
        showToast(`Đã thêm ${PRODUCTS[id]?.name || 'sản phẩm'} vào giỏ`);
      }
    }

    function toggleWishlist(id, btn) {
      const idx = wishlist.indexOf(id);
      const nowActive = idx === -1;
      if (nowActive) wishlist.unshift(id); else wishlist.splice(idx, 1);
      if (btn) {
        btn.setAttribute('aria-pressed', String(nowActive));
        btn.classList.remove('pulse');
        requestAnimationFrame(() => btn.classList.add('pulse'));
      }
      renderAll();
      showToast(nowActive ? 'Đã lưu vào yêu thích' : 'Đã bỏ khỏi yêu thích');
    }

    function recordRecent(id) {
      recent = recent.filter((x) => x !== id);
      recent.unshift(id);
      recent = recent.slice(0, 6);
      renderRecent();
      persist();
    }

    // --- Drawer open/close/tabs ---
    function openDrawer(tab) {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('show'));
      if (tab) switchTab(tab);
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('show');
      setTimeout(() => { overlay.hidden = true; }, 350);
    }
    function switchTab(tab) {
      tabs.forEach((btn) => {
        const active = btn.dataset.tab === tab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.drawer-panel').forEach((panel) => {
        panel.hidden = panel.dataset.panel !== tab;
      });
    }

    cartToggle.addEventListener('click', () => openDrawer('cart'));
    drawerClose.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
    tabs.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // --- Product grid interactions ---
    grid.addEventListener('click', (e) => {
      const wishBtn = e.target.closest('.wishlist-btn');
      const cartBtn = e.target.closest('.add-to-cart-btn');
      if (wishBtn) {
        toggleWishlist(wishBtn.closest('.product-card').dataset.productId, wishBtn);
        return;
      }
      if (cartBtn) {
        addToCart(cartBtn.closest('.product-card').dataset.productId);
        cartBtn.classList.add('added');
        const original = cartBtn.textContent;
        cartBtn.textContent = 'Đã thêm ✓';
        setTimeout(() => { cartBtn.classList.remove('added'); cartBtn.textContent = original; }, 1400);
      }
    });

    // --- Drawer list interactions (delegated) ---
    drawer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.closest('.drawer-item')?.dataset.id;
      if (!id) return;
      const action = btn.dataset.action;
      if (action === 'inc') addToCart(id, true);
      if (action === 'dec') { cart[id] = Math.max(0, (cart[id] || 0) - 1); if (!cart[id]) delete cart[id]; renderAll(); }
      if (action === 'remove') {
        if (btn.closest('#panelWishlist')) { wishlist = wishlist.filter((x) => x !== id); }
        else { delete cart[id]; }
        renderAll();
      }
      if (action === 'move-to-cart') { addToCart(id); }
    });

    document.getElementById('checkoutBtn').addEventListener('click', () => {
      showToast('Đây là bản demo — chưa kết nối cổng thanh toán thật');
    });

    // --- Recently viewed: log when a product card is scrolled into view ---
    if ('IntersectionObserver' in window) {
      const viewObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            recordRecent(entry.target.dataset.productId);
            viewObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      cards.forEach((card) => viewObserver.observe(card));
    }

    // Initial paint from persisted state
    wishlist.forEach((id) => {
      const btn = grid.querySelector(`.product-card[data-product-id="${id}"] .wishlist-btn`);
      if (btn) btn.setAttribute('aria-pressed', 'true');
    });
    renderAll();
  }

  /* ============================================================
     CHATBOT — Gemini AI via /api/chat, with local fallback.
     ============================================================ */
  function initChat() {
    const fab = document.getElementById('chatFab');
    const panel = document.getElementById('chatPanel');
    const closeBtn = document.getElementById('chatClose');
    const body = document.getElementById('chatBody');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const quick = document.getElementById('chatQuick');
    if (!fab || !panel || !body || !form || !input || !quick) return;

    const RULES = [
      { kw: ['pin', 'battery', 'sac'], reply: 'ORA dùng được khoảng 7 ngày cho một lần sạc đầy, và sạc lại đầy 100% chỉ trong 2 giờ với đế sạc từ tính đi kèm.' },
      { kw: ['gia', 'tien', 'bao nhieu'], reply: 'ORA Ring có giá 4.990.000₫ cho bản Midnight/Sand và 5.290.000₫ cho bản Rose Gold. Đế sạc và hộp bảo quản bán riêng, bộ sizing kit được tặng kèm miễn phí.' },
      { kw: ['nuoc', 'boi', 'tam', 'chong nuoc'], reply: 'ORA đạt chuẩn chống nước 10ATM — bạn có thể đeo khi bơi, tắm vòi sen hoặc tập luyện ra mồ hôi nhiều mà không cần tháo ra.' },
      { kw: ['ngu', 'giac ngu', 'sleep'], reply: 'ORA theo dõi các giai đoạn ngủ REM, sâu và nhẹ, cùng số lần thức giấc trong đêm, để tính ra điểm hồi phục mỗi sáng.' },
      { kw: ['size', 'kich co', 'do size'], reply: 'ORA có size US 6–13. Bạn đo size tại nhà bằng bộ sizing kit được tặng kèm miễn phí khi đặt hàng, đeo thử 24h trước khi chọn size chính thức.' },
      { kw: ['giao hang', 'ship', 'van chuyen', 'mua o dau', 'dat hang'], reply: 'Đây là bản demo cho bài test tuyển dụng nên chưa xử lý đặt hàng thật. Ở bản triển khai thật, đơn hàng sẽ đi qua cổng thanh toán và đối tác vận chuyển.' },
      { kw: ['xin chao', 'chao', 'hi', 'hello', 'alo'], reply: 'Xin chào! Mình là trợ lý AI ORA 👋 Bạn muốn hỏi về pin, giá, chống nước hay theo dõi giấc ngủ?' },
      { kw: ['cam on', 'thank'], reply: 'Không có gì cả! Nếu cần thêm thông tin, cứ hỏi mình tiếp nhé.' },
    ];
    const FALLBACK = 'Mình chưa có thông tin chính xác cho câu này. Bạn để email ở phần "Đăng ký nhận tin" để được đội ORA tư vấn trực tiếp nhé!';

    function normalize(str) {
      return str.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function matchReply(text) {
      const n = normalize(text);
      const hit = RULES.find((rule) => rule.kw.some((k) => {
        const pattern = new RegExp('\\b' + k.replace(/\s+/g, '\\s+') + '\\b');
        return pattern.test(n);
      }));
      return hit ? hit.reply : FALLBACK;
    }

    async function askAI(text) {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok) throw new Error('AI unavailable');
        const data = await res.json();
        if (!data || !data.reply) throw new Error('Empty AI reply');
        return data.reply;
      } catch (err) {
        return matchReply(text);
      }
    }

    function appendMessage(role, text) {
      const div = document.createElement('div');
      div.className = `chat-msg ${role}`;
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    async function botReply(text) {
      const typing = document.createElement('div');
      typing.className = 'chat-msg bot';
      typing.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      const reply = await askAI(text);
      typing.remove();
      appendMessage('bot', reply);
    }

    let greeted = false;
    function openChat() {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      if (!greeted) {
        appendMessage('bot', 'Xin chào! Mình là trợ lý AI ORA 👋 Mình có thể tư vấn nhanh về nhẫn thông minh ORA.');
        greeted = true;
      }
      input.focus();
    }
    function closeChat() {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
    }

    fab.addEventListener('click', () => (panel.hidden ? openChat() : closeChat()));
    closeBtn.addEventListener('click', closeChat);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      appendMessage('user', text);
      input.value = '';
      botReply(text);
    });

    quick.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-q]');
      if (!btn) return;
      appendMessage('user', btn.dataset.q);
      botReply(btn.dataset.q);
    });
  }

  /* ============================================================
     Subtle parallax on hero glow (respects reduced motion)
     ============================================================ */
  function initParallax() {
    const glow = document.querySelector('.hero-glow');
    if (!glow) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    window.addEventListener('scroll', throttle(() => {
      const y = window.scrollY;
      glow.style.transform = `translateY(${y * 0.15}px)`;
    }, 16), { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initReveal();
    initRing();
    initGallery();
    initForm();
    initShop();
    initChat();
    initBehaviorTracking();
    initParallax();
  });
})();

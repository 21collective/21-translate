(() => {
  if (window.__ekranCevirmen) {
    window.__ekranCevirmen.toggle();
    return;
  }

  const LANGS = {
    tr: 'Türkçe', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español',
    it: 'Italiano', ru: 'Русский', ar: 'العربية', ja: '日本語', ko: '한국어', 'zh-CN': '中文',
  };
  // 'auto': Latin alfabeli yaygın dilleri birlikte dener (background.js'te açılıyor)
  const OCR_LANGS = {
    auto: 'Otomatik', eng: 'İngilizce', 'eng+tur': 'İngilizce + Türkçe', deu: 'Almanca', fra: 'Fransızca',
    spa: 'İspanyolca', ita: 'İtalyanca', rus: 'Rusça', ara: 'Arapça',
    jpn: 'Japonca', kor: 'Korece', chi_sim: 'Çince',
  };

  const ICON_SHOT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M8.5 9.5h7M8.5 12h7M8.5 14.5h4.5"/></svg>`;
  const ICON_COPY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>`;
  const ICON_TICK = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5 4.8 9.2 10 3"/></svg>`;
  const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      :host {
        --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
        --glass: rgba(246, 246, 248, .8);
        --menu-bg: rgba(250, 250, 252, .92);
        --glass-bar: rgba(0, 0, 0, .025);
        --fg: #1d1d1f;
        --muted: rgba(60, 60, 67, .62);
        --faint: rgba(60, 60, 67, .3);
        --hair: rgba(0, 0, 0, .1);
        --fill: rgba(120, 120, 128, .12);
        --fill-hover: rgba(120, 120, 128, .2);
        --accent: #007aff;
        --accent-soft: rgba(0, 122, 255, .1);
        --ring: rgba(0, 122, 255, .35);
        --edge: rgba(255, 255, 255, .6);
        --shadow: 0 0 0 .5px rgba(0, 0, 0, .12), 0 22px 70px rgba(0, 0, 0, .22), 0 6px 18px rgba(0, 0, 0, .08);
      }
      @media (prefers-color-scheme: dark) {
        :host {
          --glass: rgba(40, 40, 44, .76);
          --menu-bg: rgba(44, 44, 48, .94);
          --glass-bar: rgba(255, 255, 255, .025);
          --fg: #f5f5f7;
          --muted: rgba(235, 235, 245, .58);
          --faint: rgba(235, 235, 245, .25);
          --hair: rgba(255, 255, 255, .1);
          --fill: rgba(120, 120, 128, .24);
          --fill-hover: rgba(120, 120, 128, .34);
          --accent: #0a84ff;
          --accent-soft: rgba(10, 132, 255, .16);
          --ring: rgba(10, 132, 255, .45);
          --edge: rgba(255, 255, 255, .12);
          --shadow: 0 0 0 .5px rgba(0, 0, 0, .6), 0 22px 70px rgba(0, 0, 0, .5), 0 6px 18px rgba(0, 0, 0, .25);
        }
      }

      * { box-sizing: border-box; margin: 0; font-family: var(--font); -webkit-font-smoothing: antialiased; }
      [hidden] { display: none !important; }
      button { font: inherit; cursor: default; }

      .backdrop { position: fixed; inset: 0; pointer-events: auto; background: rgba(0, 0, 0, .06);
                  display: flex; justify-content: center; align-items: flex-start; padding: 16vh 16px 16px; }

      .panel { width: 640px; max-width: 100%; max-height: 72vh; display: flex; flex-direction: column;
               color: var(--fg); background: var(--glass); border-radius: 18px; overflow: hidden;
               -webkit-backdrop-filter: blur(40px) saturate(180%); backdrop-filter: blur(40px) saturate(180%);
               box-shadow: inset 0 .5px 0 var(--edge), var(--shadow);
               animation: pop .2s cubic-bezier(.22, 1, .36, 1); }
      @keyframes pop { from { opacity: 0; transform: scale(.97) translateY(-6px); } }
      @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }

      /* Üst: Spotlight benzeri giriş satırı */
      .input-row { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px 14px; }
      .glyph { flex: none; width: 26px; height: 26px; margin-top: 2px; border-radius: 7px; display: grid; place-items: center;
               background: linear-gradient(180deg, #4ea1ff, #0a6cff); color: #fff; font-size: 12px; font-weight: 700;
               letter-spacing: -.02em; box-shadow: inset 0 .5px 0 rgba(255,255,255,.4), 0 1px 2px rgba(0,0,0,.15); }
      textarea { flex: 1; min-height: 30px; max-height: 26vh; resize: none; border: 0; outline: 0; background: transparent;
                 color: var(--fg); font-size: 21px; line-height: 30px; letter-spacing: -.01em; padding: 0; overflow-y: auto; }
      textarea::placeholder { color: var(--faint); }

      .shot-btn { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px 0 9px;
                  border: 0; border-radius: 8px; background: var(--accent-soft); color: var(--accent);
                  font-size: 13px; font-weight: 600; white-space: nowrap; transition: background .12s; }
      .shot-btn svg { width: 17px; height: 17px; }
      .shot-btn:hover { background: var(--accent); color: #fff; }
      .shot-btn:focus-visible { outline: 3px solid var(--ring); }

      .divider { height: .5px; background: var(--hair); margin: 0 18px; }

      /* Boş durum: iki yolu açıkça göster */
      .empty { padding: 14px 14px 16px; }
      .shot-card { width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; padding: 14px 16px;
                   border: 1px dashed var(--faint); border-radius: 12px; background: transparent; color: var(--fg);
                   transition: background .15s, border-color .15s; }
      .shot-card:hover { background: var(--accent-soft); border-color: var(--accent); }
      .shot-card:focus-visible { outline: 3px solid var(--ring); outline-offset: 1px; }
      .shot-card .ic { flex: none; width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center;
                       background: var(--accent-soft); color: var(--accent); }
      .shot-card .ic svg { width: 22px; height: 22px; }
      .shot-card .txt { flex: 1; display: grid; gap: 2px; }
      .shot-card strong { font-size: 14px; font-weight: 600; }
      .shot-card span { font-size: 12.5px; color: var(--muted); }

      /* Sonuç */
      .result { padding: 12px 18px 16px; overflow-y: auto; }
      .preview { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
      .preview img { max-height: 56px; max-width: 260px; border-radius: 6px; display: block;
                     box-shadow: 0 0 0 .5px var(--hair), 0 1px 3px rgba(0,0,0,.12); }
      .pv-txt { display: grid; gap: 2px; justify-items: start; }
      .pv-txt span { font-size: 12px; color: var(--muted); }
      .link { border: 0; background: none; padding: 0; font-size: 13px; font-weight: 500; color: var(--accent); }
      .link:hover { text-decoration: underline; }
      .link:focus-visible { outline: 2px solid var(--ring); border-radius: 3px; }
      .meta { display: flex; align-items: center; gap: 6px; margin: 0 -4px 6px; }
      .src { font-size: 12px; font-weight: 500; color: var(--muted); padding-left: 4px; }
      .chev { color: var(--muted); font-size: 11px; }
      .spacer { flex: 1; }
      .out { font-size: 17px; line-height: 1.5; letter-spacing: -.005em; white-space: pre-wrap; user-select: text; }
      .out.placeholder { color: var(--muted); }
      .out.loading { animation: pulse 1.2s ease-in-out infinite; }
      @keyframes pulse { 50% { opacity: .45; } }

      .icon-btn { flex: none; width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent;
                  color: var(--muted); display: grid; place-items: center; transition: background .12s, color .12s; }
      .icon-btn svg { width: 18px; height: 18px; }
      .icon-btn:hover { background: var(--fill); color: var(--fg); }
      .icon-btn:focus-visible { outline: 3px solid var(--ring); }
      .icon-btn.done { color: #34c759; }

      /* macOS "pop-up button" */
      .select { display: inline-flex; align-items: center; gap: 6px; border: 0; outline: 0;
                font: 500 12px/16px var(--font); color: var(--fg); background: var(--fill);
                border-radius: 6px; padding: 4px 7px 4px 8px; white-space: nowrap; }
      .select::after { content: ""; width: 8px; height: 12px; flex: none;
                       background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='12' viewBox='0 0 8 12' fill='none' stroke='%238e8e93' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1.5 4.5 4 2l2.5 2.5M1.5 7.5 4 10l2.5-2.5'/%3E%3C/svg%3E") no-repeat center; }
      .select:hover, .select[aria-expanded=true] { background: var(--fill-hover); }
      .select:focus-visible { box-shadow: 0 0 0 3px var(--ring); }

      /* macOS menüsü */
      .menu { position: fixed; z-index: 1; min-width: 180px; max-height: 320px; overflow-y: auto; padding: 5px;
              pointer-events: auto; color: var(--fg); background: var(--menu-bg); border-radius: 10px;
              -webkit-backdrop-filter: blur(30px) saturate(180%); backdrop-filter: blur(30px) saturate(180%);
              box-shadow: inset 0 .5px 0 var(--edge), 0 0 0 .5px rgba(0, 0, 0, .18), 0 12px 36px rgba(0, 0, 0, .22);
              animation: menu-in .12s cubic-bezier(.22, 1, .36, 1); scrollbar-width: thin; }
      @keyframes menu-in { from { opacity: 0; transform: translateY(-3px); } }
      @media (prefers-reduced-motion: reduce) { .menu { animation: none; } }
      .menu .item { display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 12px 0 6px;
                    border-radius: 5px; font-size: 13px; white-space: nowrap; cursor: default; }
      .menu .item .ck { width: 14px; flex: none; display: grid; place-items: center; }
      .menu .item .ck svg { width: 12px; height: 12px; }
      .menu .item .note { margin-left: auto; padding-left: 16px; font-size: 11px; color: var(--muted); }
      .menu .item.active { background: var(--accent); color: #fff; }
      .menu .item.active .note { color: rgba(255, 255, 255, .75); }
      .menu .sep { height: .5px; background: var(--hair); margin: 5px 6px; }

      /* Alt bar */
      .bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px 8px 18px; border-top: .5px solid var(--hair);
             background: var(--glass-bar); font-size: 12px; color: var(--muted); }
              border-radius: 7px; background: var(--fill); color: var(--fg); font-size: 12px; font-weight: 500; }
      .bar .sep { width: .5px; height: 16px; background: var(--hair); margin: 0 2px; }
      .bar label { display: flex; align-items: center; gap: 6px; }
      .key { display: inline-flex; align-items: center; gap: 5px; border: 0; background: none; color: inherit; font-size: 12px; padding: 0 4px; }
      kbd { font: 500 11px/16px var(--font); min-width: 20px; padding: 1px 5px; border-radius: 5px; text-align: center;
            background: var(--fill); color: var(--fg); box-shadow: inset 0 -.5px 0 var(--hair); }
      .key:hover kbd { background: var(--fill-hover); }

      @media (max-width: 560px) {
        .bar label span, .key .lbl, .shot-btn span { display: none; }
      }

      /* Alan seçimi: macOS ekran görüntüsü aracı gibi */
      .mask { position: fixed; inset: 0; cursor: crosshair; pointer-events: auto; background: rgba(0, 0, 0, .3); }
      .mask.dragging { background: transparent; }
      .sel { position: fixed; outline: 1.5px solid #fff; border-radius: 2px;
             box-shadow: 0 0 0 .5px rgba(0, 0, 0, .5), 0 0 0 100vmax rgba(0, 0, 0, .3); }
      .size { position: fixed; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 500;
              font-variant-numeric: tabular-nums; color: #fff; background: rgba(30, 30, 30, .75);
              -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); pointer-events: none; }
      .guide { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 14px;
               padding: 10px 10px 10px 16px; border-radius: 14px; color: #fff; background: rgba(28, 28, 30, .78); cursor: default;
               -webkit-backdrop-filter: blur(24px) saturate(180%); backdrop-filter: blur(24px) saturate(180%);
               box-shadow: 0 0 0 .5px rgba(255, 255, 255, .15), 0 10px 30px rgba(0, 0, 0, .3);
               transition: opacity .15s; max-width: calc(100vw - 32px); }
      .guide .demo { flex: none; width: 44px; height: 30px; position: relative; }
      .guide .demo i { position: absolute; inset: 4px 6px; border: 1.5px dashed rgba(255,255,255,.85); border-radius: 3px;
                       animation: draw 1.6s ease-in-out infinite; transform-origin: top left; }
      @keyframes draw { 0% { transform: scale(.15); opacity: 0; } 15% { opacity: 1; } 60%, 100% { transform: scale(1); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) { .guide .demo i { animation: none; } }
      .guide .t { display: grid; gap: 1px; }
      .guide strong { font-size: 13.5px; font-weight: 600; }
      .guide span { font-size: 12px; color: rgba(255, 255, 255, .65); }
      .guide button { flex: none; height: 28px; padding: 0 12px; border: 0; border-radius: 8px; font-size: 12.5px; font-weight: 500;
                      color: #fff; background: rgba(255, 255, 255, .14); }
      .guide button:hover { background: rgba(255, 255, 255, .24); }
      .mask.dragging .guide { opacity: 0; pointer-events: none; }
    </style>

    <div class="backdrop" hidden>
      <div class="panel" role="dialog" aria-label="21 Translate">
        <div class="input-row">
          <div class="glyph" aria-hidden="true">文A</div>
          <textarea rows="1" placeholder="Çevirmek istediğin metni yaz ya da yapıştır" spellcheck="false" aria-label="Çevrilecek metin"></textarea>
          <button class="shot-btn" data-a="shot" title="Ekrandan alan seç (Alt+S)">${ICON_SHOT}<span>Ekrandan seç</span></button>
        </div>
        <div class="divider"></div>

        <div class="empty">
          <button class="shot-card" data-a="shot">
            <div class="ic">${ICON_SHOT}</div>
            <div class="txt">
              <strong>Ekrandan alan seç</strong>
              <span>Resimdeki, videodaki ya da kopyalanamayan yazının etrafına bir kutu çiz; okuyup çevireyim.</span>
            </div>
            <kbd>Alt S</kbd>
          </button>
        </div>

        <div class="result" hidden>
          <div class="preview" hidden>
            <div class="pv-txt"><span>Seçilen alan</span><button class="link" data-a="shot">Başka alan seç</button></div>
          </div>
          <div class="meta">
            <span class="src">Dil algılanacak</span>
            <span class="chev" aria-hidden="true">→</span>
            <button class="select target" aria-haspopup="listbox" aria-expanded="false" aria-label="Hedef dil"></button>
            <span class="spacer"></span>
            <button class="icon-btn" data-a="copy" title="Çeviriyi kopyala" aria-label="Çeviriyi kopyala">${ICON_COPY}</button>
          </div>
          <div class="out" aria-live="polite"></div>
        </div>

        <div class="bar">
          <label><span>Görseldeki dil</span> <button class="select ocr" aria-haspopup="listbox" aria-expanded="false" aria-label="Görseldeki yazının dili"></button></label>
          <span class="spacer"></span>
          <button class="key" data-a="close"><kbd>esc</kbd> <span class="lbl">Kapat</span></button>
        </div>
      </div>
    </div>

    <div class="menu" role="listbox" hidden></div>

    <div class="mask" hidden>
      <div class="guide">
        <div class="demo" aria-hidden="true"><i></i></div>
        <div class="t">
          <strong>Çevrilecek yazının etrafına bir kutu çiz</strong>
          <span>Fareyi basılı tutup sürükle, bırakınca okunur</span>
        </div>
        <button data-a="cancel">Vazgeç</button>
      </div>
      <div class="sel" hidden></div>
      <div class="size" hidden></div>
    </div>
  `;
  document.documentElement.appendChild(host);

  const $ = (s) => root.querySelector(s);
  const backdrop = $('.backdrop');
  const ta = $('textarea');
  const empty = $('.empty');
  const result = $('.result');
  const preview = $('.preview');
  const previewImg = new Image();
  previewImg.alt = 'Seçilen alan';
  $('.preview').prepend(previewImg);
  const out = $('.out');
  const target = $('.target');
  const srcLabel = $('.src');
  const ocrSelect = $('.ocr');
  const copyBtn = $('[data-a=copy]');
  const mask = $('.mask');
  const sel = $('.sel');
  const sizeTag = $('.size');

  const menu = $('.menu');
  let targetLang = 'tr';
  let ocrLang = 'auto';
  function renderSelects() {
    target.textContent = LANGS[targetLang] || targetLang;
    ocrSelect.textContent = OCR_LANGS[ocrLang] || ocrLang;
  }
  renderSelects();
  chrome.storage.sync.get({ targetLang, ocrLang }).then((s) => {
    targetLang = s.targetLang;
    ocrLang = s.ocrLang;
    renderSelects();
  });

  // --- macOS tarzı açılır menü (native <select> listesi stillendirilemiyor) ---
  let menuState = null;

  function openMenu(btn, entries, value, onPick) {
    closeMenu();
    menu.innerHTML = '';
    const items = [];
    for (const entry of entries) {
      if (entry === '-') {
        menu.append(Object.assign(document.createElement('div'), { className: 'sep' }));
        continue;
      }
      const [code, name, note] = entry;
      const el = document.createElement('div');
      el.className = 'item';
      el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', String(code === value));
      el.innerHTML = `<span class="ck">${code === value ? ICON_TICK : ''}</span><span class="name"></span>`;
      el.querySelector('.name').textContent = name;
      if (note) el.append(Object.assign(document.createElement('span'), { className: 'note', textContent: note }));
      const i = items.length;
      el.addEventListener('mousemove', () => setActive(i));
      el.addEventListener('mousedown', (e) => e.preventDefault());
      el.addEventListener('click', () => pick(i));
      menu.append(el);
      items.push({ code, name, el });
    }

    menu.hidden = false;
    const b = btn.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const below = b.bottom + 6 + m.height <= window.innerHeight - 8;
    menu.style.left = `${Math.max(8, Math.min(b.left - 6, window.innerWidth - m.width - 8))}px`;
    menu.style.top = `${below ? b.bottom + 6 : Math.max(8, b.top - 6 - m.height)}px`;

    btn.setAttribute('aria-expanded', 'true');
    menuState = { btn, items, onPick, active: -1 };
    setActive(Math.max(0, items.findIndex((it) => it.code === value)));
  }

  function setActive(i) {
    if (!menuState) return;
    menuState.items[menuState.active]?.el.classList.remove('active');
    menuState.active = i;
    const it = menuState.items[i];
    it.el.classList.add('active');
    it.el.scrollIntoView({ block: 'nearest' });
  }

  function pick(i) {
    const { items, onPick, btn } = menuState;
    closeMenu();
    btn.focus();
    onPick(items[i].code);
  }

  function closeMenu() {
    if (!menuState) return;
    menuState.btn.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    menuState = null;
  }

  function menuKey(e) {
    const { items, active } = menuState;
    if (e.key === 'ArrowDown') setActive((active + 1) % items.length);
    else if (e.key === 'ArrowUp') setActive((active - 1 + items.length) % items.length);
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(items.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') pick(active);
    else if (e.key === 'Escape' || e.key === 'Tab') closeMenu();
    else if (e.key.length === 1) {
      // Harfe basınca o harfle başlayan dile atla
      const k = e.key.toLocaleLowerCase('tr');
      const n = items.length;
      for (let j = 1; j <= n; j++) {
        const idx = (active + j) % n;
        if (items[idx].name.toLocaleLowerCase('tr').startsWith(k)) { setActive(idx); break; }
      }
    } else return;
    e.preventDefault();
  }

  // Menü dışına tıklayınca kapat (o tıklama modalı kapatmasın)
  root.addEventListener('mousedown', (e) => {
    if (!menuState || menu.contains(e.target) || menuState.btn.contains(e.target)) return;
    closeMenu();
    if (e.target === backdrop) e.stopPropagation();
  }, true);
  window.addEventListener('resize', closeMenu);

  const toggleMenu = (btn, ...args) => (menuState?.btn === btn ? closeMenu() : openMenu(btn, ...args));

  target.addEventListener('click', () => toggleMenu(target,
    Object.entries(LANGS), targetLang, (code) => {
      targetLang = code;
      renderSelects();
      chrome.storage.sync.set({ targetLang });
      translateNow();
    }));

  ocrSelect.addEventListener('click', () => toggleMenu(ocrSelect,
    [['auto', 'Otomatik', 'Latin alfabesi'], '-', ...Object.entries(OCR_LANGS).filter(([c]) => c !== 'auto')],
    ocrLang, (code) => {
      ocrLang = code;
      renderSelects();
      chrome.storage.sync.set({ ocrLang });
    }));

  // Modal açıkken yazılan tuşlar sayfanın kısayollarını (YouTube vb.) tetiklemesin
  for (const type of ['keydown', 'keyup', 'keypress']) {
    host.addEventListener(type, (e) => {
      if (type === 'keydown' && menuState) {
        menuKey(e);
      } else if (type === 'keydown') {
        if (e.key === 'Escape') onEscape();
        if (e.altKey && e.code === 'KeyS' && !backdrop.hidden) {
          e.preventDefault();
          startShot();
        }
      }
      e.stopPropagation();
    });
  }

  let lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    autosize();
    ta.focus();
    ta.select();
  }
  function close() {
    closeMenu();
    backdrop.hidden = true;
    mask.hidden = true;
    lastFocus?.focus?.();
  }
  function toggle() {
    !backdrop.hidden || !mask.hidden ? close() : open();
  }
  function onEscape() {
    if (!mask.hidden) cancelShot();
    else close();
  }
  // Seçim modunda odak sayfada kalabiliyor, Esc'i orada da yakala
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mask.hidden) onEscape();
  }, true);

  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });
  $('[data-a=close]').onclick = close;

  copyBtn.onclick = () => {
    if (out.classList.contains('placeholder')) return;
    navigator.clipboard.writeText(out.textContent);
    copyBtn.innerHTML = ICON_CHECK;
    copyBtn.classList.add('done');
    setTimeout(() => {
      copyBtn.innerHTML = ICON_COPY;
      copyBtn.classList.remove('done');
    }, 1200);
  };

  function autosize() {
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }

  // Boşken "ekrandan seç" kartı, doluyken sonuç alanı
  function showResult(on) {
    empty.hidden = on;
    result.hidden = !on;
  }

  // --- Çeviri (yazdıkça) ---
  let timer = null;
  let reqId = 0;
  function setOut(text, { placeholder = false, loading = false } = {}) {
    showResult(true);
    out.textContent = text;
    out.classList.toggle('placeholder', placeholder || loading);
    out.classList.toggle('loading', loading);
  }
  async function translateNow() {
    const text = ta.value.trim();
    const id = ++reqId;
    if (!text) {
      srcLabel.textContent = 'Dil algılanacak';
      preview.hidden = true;
      return showResult(false);
    }
    setOut('Çevriliyor…', { loading: true });
    const r = await chrome.runtime.sendMessage({ type: 'translate', text, targetLang });
    if (id !== reqId) return; // daha yeni bir istek var
    if (r.error) return setOut('Hata: ' + r.error, { placeholder: true });
    srcLabel.textContent = LANGS[r.src] || r.src || '';
    setOut(r.translation);
  }
  ta.addEventListener('input', () => {
    autosize();
    clearTimeout(timer);
    timer = setTimeout(translateNow, 400);
  });

  // --- Ekrandan alan seçme ---
  let startPt = null;
  let lastRect = null;

  function startShot() {
    closeMenu();
    backdrop.hidden = true;
    sel.hidden = true;
    sizeTag.hidden = true;
    mask.classList.remove('dragging');
    mask.hidden = false;
  }
  function cancelShot() {
    startPt = null;
    mask.hidden = true;
    backdrop.hidden = false;
    ta.focus();
  }
  root.querySelectorAll('[data-a=shot]').forEach((b) => (b.onclick = startShot));
  $('[data-a=cancel]').onclick = cancelShot;
  $('.guide').addEventListener('mousedown', (e) => e.stopPropagation());

  const rectFrom = (e) => ({
    x: Math.min(startPt.x, e.clientX),
    y: Math.min(startPt.y, e.clientY),
    w: Math.abs(e.clientX - startPt.x),
    h: Math.abs(e.clientY - startPt.y),
  });
  function drawSel(e) {
    const r = rectFrom(e);
    Object.assign(sel.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
    sizeTag.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
    const tx = Math.min(e.clientX + 14, window.innerWidth - 90);
    const ty = Math.min(e.clientY + 14, window.innerHeight - 28);
    Object.assign(sizeTag.style, { left: `${tx}px`, top: `${ty}px` });
  }

  mask.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startPt = { x: e.clientX, y: e.clientY };
    mask.classList.add('dragging');
    sel.hidden = false;
    sizeTag.hidden = false;
    drawSel(e);
  });
  mask.addEventListener('mousemove', (e) => startPt && drawSel(e));
  mask.addEventListener('mouseup', async (e) => {
    if (!startPt) return;
    const rect = rectFrom(e);
    startPt = null;
    mask.hidden = true;
    if (rect.w < 5 || rect.h < 5) {
      // Tıklayıp bıraktıysa seçim modunda kal, ipucunu tekrar göster
      mask.classList.remove('dragging');
      sel.hidden = true;
      sizeTag.hidden = true;
      mask.hidden = false;
      return;
    }
    lastRect = rect;

    // Overlay ekran görüntüsüne girmesin diye bir-iki frame bekliyoruz
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const res = await chrome.runtime.sendMessage({ type: 'capture', rect, viewportWidth: window.innerWidth });

    backdrop.hidden = false;
    if (res.error) return setOut('Hata: ' + res.error, { placeholder: true });
    ta.value = res.text;
    autosize();
    ta.focus();
    if (!res.text) {
      srcLabel.textContent = '';
      return setOut('Bu alanda yazı bulamadım. Yazıya daha yakın, daha sıkı bir kutu çizmeyi ya da alttan görseldeki dili değiştirmeyi dene.', { placeholder: true });
    }
    translateNow();
  });

  // Seçilen alanın küçük önizlemesi
  function showPreview(dataUrl, rect) {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / window.innerWidth;
      const c = document.createElement('canvas');
      c.width = Math.round(rect.w * ratio);
      c.height = Math.round(rect.h * ratio);
      c.getContext('2d').drawImage(img, rect.x * ratio, rect.y * ratio, c.width, c.height, 0, 0, c.width, c.height);
      previewImg.src = c.toDataURL('image/png');
      preview.hidden = false;
    };
    img.src = dataUrl;
  }

  // Ekran görüntüsü alındı → OCR sürerken modalı geri getir
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'captured') return;
    backdrop.hidden = false;
    ta.value = '';
    autosize();
    srcLabel.textContent = 'Görsel okunuyor';
    if (lastRect) showPreview(msg.dataUrl, lastRect);
    setOut('Okunuyor… (ilk seferde dil verisi indiriliyor)', { loading: true });
  });

  window.__ekranCevirmen = { toggle };
  open();
})();

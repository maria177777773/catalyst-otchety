/* drag-panel.js — любая плавающая панель (твик-панель, переключатель вариантов, панель правок) перетаскивается
   по экрану и запоминает место. Маша 07.10.2026: «она должна переноситься по экрану, а у меня прилипла слева и мешает».

   Подключение: <script src="drag-panel.js"></script>, затем
     DragPanel.make(panelEl, { key: 'rv-panel', handle: '.drag-handle', side: 'right', top: 120 });
   • key    — под каким именем хранить место в localStorage (своё для каждой страницы-панели);
   • handle — за что тянуть (селектор внутри панели); без него тянется за любое место, кроме кнопок и полей;
   • side   — где стоит по умолчанию: 'right' (по умолчанию) или 'left'; top — отступ сверху по умолчанию, px.
   Двойной клик по ручке возвращает панель на место по умолчанию. Панель не уезжает за край экрана,
   при сужении окна подтягивается обратно. Работает мышью и пальцем (pointer events). */
(function () {
  'use strict';
  var GAP = 12;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function load(k) { try { return JSON.parse(localStorage.getItem('drag-panel:' + k) || 'null'); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem('drag-panel:' + k, JSON.stringify(v)); } catch (e) {} }
  function forget(k) { try { localStorage.removeItem('drag-panel:' + k); } catch (e) {} }

  function make(el, o) {
    o = o || {};
    var key = o.key || el.id || 'panel', side = o.side || 'right', top0 = o.top == null ? 120 : o.top;
    el.setAttribute('data-drag-panel', '');
    el.style.position = 'fixed';
    el.style.right = 'auto'; el.style.bottom = 'auto';
    el.style.touchAction = 'none';

    function place(x, y) {
      var w = el.offsetWidth, h = el.offsetHeight;
      x = clamp(x, GAP, Math.max(GAP, innerWidth - w - GAP));
      y = clamp(y, GAP, Math.max(GAP, innerHeight - Math.min(h, innerHeight - 2 * GAP) - GAP));
      el.style.left = x + 'px'; el.style.top = y + 'px';
      return { x: x, y: y };
    }
    // top может быть функцией: место по умолчанию зависит от размера экрана (на телефоне — над нижней кнопкой)
    function home() { return { x: side === 'left' ? GAP + 4 : innerWidth - el.offsetWidth - GAP - 4, y: typeof top0 === 'function' ? top0() : top0 }; }
    var pos = load(key);
    function restore() { if (!el.offsetWidth && !pos) return; var p = pos ? { x: pos.x * innerWidth, y: pos.y * innerHeight } : home(); place(p.x, p.y); }
    restore();

    var drag = null, lastDown = 0, lastX = 0, lastY = 0;
    // ручку ищем в момент нажатия: панель может перерисовывать своё содержимое целиком
    function grabbable(t) {
      if (t.closest('button,a,input,select,textarea,label,[contenteditable]')) return false;
      if (!o.handle) return true;
      var h = t.closest(o.handle); return !!h && el.contains(h);
    }
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !grabbable(e.target)) return;
      // двойное нажатие по ручке возвращает на место; dblclick браузер не шлёт, когда pointerdown гасится
      var now = Date.now();
      if (now - lastDown < 380 && Math.abs(e.clientX - lastX) < 8 && Math.abs(e.clientY - lastY) < 8) {
        lastDown = 0; pos = null; forget(key); var hp = home(); place(hp.x, hp.y); e.preventDefault(); return;
      }
      lastDown = now; lastX = e.clientX; lastY = e.clientY;
      var r = el.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      place(e.clientX - drag.dx, e.clientY - drag.dy);
    });
    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      drag = null; el.classList.remove('is-dragging');
      var r = el.getBoundingClientRect();
      pos = { x: r.left / innerWidth, y: r.top / innerHeight };   // в долях экрана: место сохраняется и на другом размере окна
      save(key, pos);
    }
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    addEventListener('resize', restore);
    // панель может менять высоту (свернуть / развернуть) — не даём ей уехать за низ экрана
    // скрытая панель (hidden, display:none) имеет нулевой размер: тогда не трогаем, а когда покажется, ставим заново
    if (window.ResizeObserver) new ResizeObserver(function () {
      if (!el.offsetWidth) return;
      if (!pos) { var hp = home(); place(hp.x, hp.y); return; }
      var r = el.getBoundingClientRect(); place(r.left, r.top);
    }).observe(el);
    return { reset: function () { pos = null; forget(key); var p = home(); place(p.x, p.y); } };
  }

  // ручка: точки-«грип» без эмодзи, чтобы было видно, за что тянуть
  var css = '[data-drag-panel] .drag-handle{cursor:grab;user-select:none;-webkit-user-select:none}' +
    '[data-drag-panel].is-dragging,[data-drag-panel].is-dragging .drag-handle{cursor:grabbing}' +
    '[data-drag-panel].is-dragging{opacity:.96}' +
    '.drag-grip{display:inline-block;width:12px;height:18px;flex:none;opacity:.45;' +
    'background-image:radial-gradient(currentColor 1.6px,transparent 1.7px);background-size:6px 6px;background-position:0 0}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  window.DragPanel = { make: make };
})();

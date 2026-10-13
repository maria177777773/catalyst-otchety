/* Примерка брендинга: выбор изделия → цвет ткани, название или логотип → отправка макета гостю */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var token = q.get('t') || '';
  var inTg = /tgWebApp/.test(location.hash) || /tgWebApp/.test(location.search);
  var tgApp = null;

  var METHODS = ['Печать', 'Полноцветная печать', 'Вышивка', 'Посоветуйте'];
  var QTYS = ['До 10 штук', '10-50 штук', '50-100 штук', 'Больше 100 штук'];
  var SWATCH_BASE = '#1aa3b8';

  var state = { item: null, color: Mockup.COLORS[0], logo: null, mono: false, method: METHODS[0], qty: '', me: null,
                hasLogo: '', font: Mockup.FONTS[0], ink: null, inkName: '', perItem: {} };
  var mock = new Mockup($('cv'), 'img/');
  var raf = 0, busy = false;

  function show(id) {
    ['s0', 's1', 's2', 's3'].forEach(function (s) { $(s).hidden = s !== id; });
    if ($('mini')) $('mini').hidden = id !== 's2' || !miniOn;
    window.scrollTo(0, 0);
    if (tgApp && tgApp.BackButton) { id === 's2' ? tgApp.BackButton.show() : tgApp.BackButton.hide(); }
  }

  function loadTg() {
    if (!inTg) return;
    var s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.async = true;
    s.onload = function () {
      tgApp = window.Telegram && window.Telegram.WebApp;
      if (!tgApp) return;
      try { tgApp.ready(); tgApp.expand(); tgApp.setHeaderColor('#ffffff'); tgApp.setBackgroundColor('#ffffff'); } catch (e) {}
      if (tgApp.BackButton) tgApp.BackButton.onClick(function () { show('s1'); });
      if (!$('s2').hidden && tgApp.BackButton) tgApp.BackButton.show();
    };
    document.head.appendChild(s);
  }

  // что сейчас наносим: логотип, если гость сказал «Да» и загрузил файл, иначе надпись выбранным шрифтом
  function look() {
    var useLogo = state.hasLogo === 'yes' && state.logo;
    var text = state.hasLogo === 'no' ? ($('brand').value || 'Ваша компания') : 'Ваш логотип';
    return { item: state.item.id, color: state.color.hex === null ? null : state.color, text: text, font: state.hasLogo === 'no' ? state.font : null,
             logo: useLogo ? state.logo : null, mono: state.mono, ink: state.ink };
  }

  function draw() {
    pairsSoon();
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      mock.render(look()).then(updateMini);
    });
  }

  function loadFont(f) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return document.fonts.load(Mockup.fontCss(f, 40), 'АаZz').catch(function () {});
  }

  function buildFonts() {
    var box = $('fonts');
    box.innerHTML = '';
    Mockup.FONTS.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = f.name;
      b.style.fontFamily = '"' + f.family + '", Arial, sans-serif'; b.style.fontWeight = f.weight;
      b.setAttribute('aria-pressed', state.font === f ? 'true' : 'false');
      b.onclick = function () { state.font = f; buildFonts(); loadFont(f).then(draw); };
      box.appendChild(b);
    });
  }

  function setAsk(v) {
    state.hasLogo = v;
    [].forEach.call($('ask').querySelectorAll('.opt'), function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-v') === v ? 'true' : 'false'); });
    $('noLogoBox').hidden = v !== 'no';
    $('logoBox').hidden = v !== 'yes';
    refreshPairs();
    if (v === 'no') { loadFont(state.font).then(draw); setTimeout(function () { $('brand').focus(); }, 50); }
    draw();
  }

  function chips(box, list, key, allowNone) {
    box.innerHTML = '';
    list.forEach(function (v) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = v;
      b.setAttribute('aria-pressed', state[key] === v ? 'true' : 'false');
      b.onclick = function () {
        state[key] = allowNone && state[key] === v ? '' : v;
        chips(box, list, key, allowNone);
      };
      box.appendChild(b);
    });
  }

  function buildGrid() {
    var g = $('grid');
    Mockup.ITEMS.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'item';
      var im = document.createElement('img');
      im.src = 'img/' + it.id + '-s.webp'; im.alt = ''; im.width = 400; im.height = 400;
      b.appendChild(im); b.appendChild(document.createTextNode(it.name));
      b.onclick = function () { openItem(it, im); };
      g.appendChild(b);
    });
  }

  // палитра тремя группами, в каждой полные ряды по 9 образцов
  var GROUPS = [['solid', 'Однотонные'], ['grad', 'Градиенты'], ['pat', 'Узоры']];
  var swImg = {};
  function buildSwatches() {
    var box = $('sw');
    if (!box.firstChild) {
      GROUPS.forEach(function (gr) {
        var cap = document.createElement('div'); cap.className = 'sw-cap'; cap.textContent = gr[1];
        var row = document.createElement('div'); row.className = 'swatches';
        Mockup.COLORS.filter(function (c) { return (c.g || 'solid') === gr[0]; }).forEach(function (c) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'sw'; b.dataset.id = c.id;
          if (c.grad || c.pat) b.style.backgroundImage = 'url(' + (swImg[c.id] = swImg[c.id] || Mockup.swatch(c, 96)) + ')';
          else b.style.background = c.hex || SWATCH_BASE;
          b.title = c.name; b.setAttribute('aria-label', c.name);
          b.onclick = function () { state.color = c; state.ink = null; state.inkName = ''; remember(); buildSwatches(); markPairs(); draw(); };
          row.appendChild(b);
        });
        box.appendChild(cap); box.appendChild(row);
      });
    }
    [].forEach.call(box.querySelectorAll('.sw'), function (b) { b.setAttribute('aria-pressed', b.dataset.id === state.color.id ? 'true' : 'false'); });
  }

  // готовые сочетания: то же изделие с той же надписью или логотипом в 8 парах «ткань + цвет нанесения».
  // С загруженным логотипом первые 4 пары подбираются под его цвет, как у Николы Иронова.
  // у сочетаний и витрины свой движок: один движок рисует только последнее, поэтому два списка вместе путали бы плитки
  function engine() { var m = new Mockup(document.createElement('canvas'), 'img/'); m.cache = mock.cache; return m; }   // фото разбираем один раз на все окна
  var pmPairs = engine(), pmShow = engine();
  var pairs = Mockup.PAIRS, pairTimer = 0, pairRun = 0, pairKey = '', logoN = 0, showKey = '';
  function byId(id) { return Mockup.COLORS.filter(function (c) { return c.id === id; })[0]; }
  function inkLabel(p) { return byId(p.color).name + ', нанесение ' + p.inkName; }
  function buildPairs() {
    var box = $('pairs');
    box.innerHTML = ''; pairKey = '';
    pairs.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pair'; b.dataset.i = i;
      b.setAttribute('aria-label', inkLabel(p));
      var cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
      b.appendChild(cv);
      b.onclick = function () {
        state.color = byId(p.color); state.ink = p.ink; state.inkName = p.inkName;
        if (state.hasLogo === 'yes' && state.logo) { state.mono = true; $('mono').checked = true; }   // в паре логотип одним цветом
        remember(); buildSwatches(); markPairs(); draw();
      };
      box.appendChild(b);
    });
    markPairs();
  }
  function refreshPairs() {
    var useLogo = state.hasLogo === 'yes' && state.logo, hex = useLogo ? Mockup.logoColor(state.logo) : null;
    var next = hex ? Mockup.brandPairs(hex).concat(Mockup.PAIRS.slice(0, 4)) : Mockup.PAIRS;
    if (next !== pairs) { pairs = next; buildPairs(); }
  }
  function markPairs() {
    [].forEach.call($('pairs').children, function (b) {
      var p = pairs[b.dataset.i];
      b.setAttribute('aria-pressed', state.ink === p.ink && state.color.id === p.color ? 'true' : 'false');
    });
  }
  function pairsSoon() { clearTimeout(pairTimer); pairTimer = setTimeout(function () { renderPairs(); renderShow(); }, 350); }

  // квадрат вокруг самого изделия, чтобы в маленькой плитке оно было крупным
  function drawTile(cv, rec, tile) {
    var b = rec.box, side = Math.min(800, Math.max(b[2] - b[0], b[3] - b[1]) * 1.12);
    var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    var x0 = Math.max(0, Math.min(800 - side, cx - side / 2)), y0 = Math.max(0, Math.min(800 - side, cy - side / 2));
    var g = tile.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, tile.width, tile.height);
    g.drawImage(cv, x0, y0, side, side, 0, 0, tile.width, tile.height);
  }
  // рисуем плитки по очереди, чтобы телефон не подвисал; новый запуск отменяет старый
  function queue(pm, jobs, isLive) {
    var i = 0;
    (function next() {
      if (!isLive() || i >= jobs.length) return;
      var j = jobs[i++];
      pm.render(j.o).then(function (cv) {
        if (!isLive()) return;
        return pm.prepare(j.o.item).then(function (rec) { j.done(cv, rec); });
      }).then(function () { setTimeout(next, 0); }, function () { setTimeout(next, 0); });
    })();
  }
  function baseLook() {
    var base = look();
    if (base.logo && !base.logo.n) base.logo.n = ++logoN;
    base.key = [base.text, base.font ? base.font.name : '', base.logo ? base.logo.n : 0, base.mono].join('|');
    return base;
  }
  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }
  function renderPairs() {
    if (!state.item) return;
    var base = baseLook(), key = base.item + '|' + base.key + '|' + pairs.length + pairs[0].ink;
    if (key === pairKey) return;   // у сочетаний ткань своя: перерисовываем, только когда сменились изделие или брендинг
    pairKey = key;
    var run = ++pairRun, tiles = $('pairs').children;
    queue(pmPairs, pairs.map(function (p, i) {
      var o = copy(base); o.color = byId(p.color); o.ink = p.ink; if (o.logo) o.mono = true;
      return { o: o, done: function (cv, rec) { drawTile(cv, rec, tiles[i].firstChild); } };
    }), function () { return run === pairRun; });
  }

  // витрина: брендинг гостя сразу на всех 8 изделиях, и в окне примерки, и в списке изделий
  var showRun = 0;
  // цвет изделия: свой, если гость его уже выбирал, иначе тот, что сейчас на экране
  function colorOf(id) { return state.perItem[id] || { color: state.color, ink: state.ink, inkName: state.inkName }; }
  function remember() {
    if (state.item) state.perItem[state.item.id] = { color: state.color, ink: state.ink, inkName: state.inkName };
    $('colorName').textContent = state.ink ? state.color.name + ', нанесение ' + state.inkName : state.color.name;
  }
  function buildShow() {
    var box = $('show');
    Mockup.ITEMS.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'show-it'; b.dataset.id = it.id; b.setAttribute('aria-label', it.name);
      var cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
      var nm = document.createElement('b'); nm.textContent = Mockup.SHORT[it.id] || it.name;
      var cl = document.createElement('span');
      b.appendChild(cv); b.appendChild(nm); b.appendChild(cl);
      b.onclick = function () { openItem(it, $('grid').querySelectorAll('.item img')[i]); };
      box.appendChild(b);
    });
  }
  function renderShow() {
    if (!state.item) return;
    [].forEach.call($('show').children, function (b) {
      b.setAttribute('aria-pressed', b.dataset.id === state.item.id ? 'true' : 'false');
      b.lastChild.textContent = colorOf(b.dataset.id).color.name;
    });
    var base = baseLook();
    var key = base.key + '|' + Mockup.ITEMS.map(function (it) { var c = colorOf(it.id); return c.color.id + c.ink; }).join(',');
    if (key === showKey) return;
    showKey = key;
    var run = ++showRun, tiles = $('show').children, cards = $('grid').querySelectorAll('.item img');
    queue(pmShow, Mockup.ITEMS.map(function (it, i) {
      var o = copy(base), c = colorOf(it.id); o.item = it.id;
      o.color = c.color.hex === null ? null : c.color; o.ink = c.ink;
      return { o: o, done: function (cv, rec) {
        drawTile(cv, rec, tiles[i].firstChild);
        cards[i].src = cv.toDataURL('image/jpeg', 0.82);   // в списке изделий тоже уже ваш брендинг
      } };
    }), function () { return run === showRun; });
  }

  // логотип-образец для гостя без файла в телефоне: цветок и слово «Ромашка»
  function sampleLogo() {
    var c = document.createElement('canvas'), font = '900 150px Mulish, Arial, sans-serif';
    var mg = c.getContext('2d'); mg.font = font;
    c.width = Math.ceil(330 + mg.measureText('Ромашка').width + 40); c.height = 360;   // ширина по самому слову, чтобы не обрезалось
    var g = c.getContext('2d'), cx = 180, cy = 180;
    g.fillStyle = '#ff6a00';
    for (var k = 0; k < 8; k++) { g.beginPath(); g.ellipse(cx + Math.cos(k * Math.PI / 4) * 82, cy + Math.sin(k * Math.PI / 4) * 82, 58, 34, k * Math.PI / 4, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(cx, cy, 52, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b2a5c'; g.font = font; g.textBaseline = 'middle';
    g.fillText('Ромашка', 330, 190);
    return Mockup.cleanLogo(c);
  }
  function setLogo(c) {
    state.logo = c;
    $('logoOn').hidden = false; $('uplBtn').hidden = true; $('uplHint').hidden = true; $('sample').hidden = true;
    refreshPairs(); draw();
  }

  // мини-превью: пока гость листает палитру, изделие видно в маленьком окошке (его можно утащить)
  var miniOn = false;
  function updateMini(cv) {
    if (!cv || !state.item) return;
    $('miniName').textContent = Mockup.SHORT[state.item.id] || state.item.name;
    pmShow.prepare(state.item.id).then(function (rec) { drawTile(cv, rec, $('miniCv')); });
  }
  function setupMini() {
    var stage = document.querySelector('#s2 .stage'), mini = $('mini');
    // по умолчанию справа: на телефоне над кнопкой «Получить подборку», на компьютере под шапкой
    if (window.DragPanel) DragPanel.make(mini, { key: 'am-mini', handle: '.mini-h', side: 'right',
      top: function () { return innerWidth < 600 ? innerHeight - mini.offsetHeight - 110 : 120; } });
    $('miniCv').onclick = function () { window.scrollTo({ top: stage.getBoundingClientRect().top + scrollY - 110, behavior: 'smooth' }); };
    if (!window.IntersectionObserver) return;
    new IntersectionObserver(function (es) {
      miniOn = !es[0].isIntersecting;
      mini.hidden = !miniOn || $('s2').hidden;
    }, { rootMargin: '-100px 0px 0px 0px', threshold: 0.2 }).observe(stage);
  }

  function openItem(it, thumb) {
    state.item = it;
    var saved = state.perItem[it.id];
    if (saved) { state.color = saved.color; state.ink = saved.ink; state.inkName = saved.inkName; }
    remember(); buildSwatches(); markPairs();
    // пока грузится полное фото, показываем уже загруженную миниатюру
    var cv = $('cv'), cx = cv.getContext('2d');
    delete cv.dataset.ready;
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, 800, 800);
    if (thumb && thumb.complete && thumb.naturalWidth) cx.drawImage(thumb, 0, 0, 800, 800);
    $('itemName').textContent = it.name;
    $('err').textContent = '';
    show('s2');
    draw();
  }

  function onFile(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var url = URL.createObjectURL(f);
    Mockup.loadImage(url).then(function (im) {
      var c = Mockup.cleanLogo(im);
      URL.revokeObjectURL(url);
      if (!c) { $('err').textContent = 'Не получилось прочитать логотип, попробуйте другой файл'; return; }
      setLogo(c);
    }).catch(function () { $('err').textContent = 'Этот файл не открылся. Подойдёт PNG или JPG.'; });
    e.target.value = '';
  }

  function submit() {
    if (busy) return;
    busy = true;
    var go = $('go');
    go.disabled = true; go.textContent = 'Отправляем макет…';
    $('err').textContent = '';
    var lk = look();
    mock.render(lk).then(function (cv) {
      return new Promise(function (ok) { cv.toBlob(ok, 'image/jpeg', 0.88); });
    }).then(function (blob) {
      lastBlob = blob;
      var fd = new FormData();
      fd.append('t', token); fd.append('item', state.item.id); fd.append('color', state.color.name + (state.ink ? ', нанесение ' + state.inkName : ''));
      fd.append('text', state.hasLogo === 'no' ? $('brand').value : ''); fd.append('logo', lk.logo ? '1' : '');
      fd.append('font', lk.font ? lk.font.name : '');
      fd.append('method', state.method); fd.append('qty', state.qty);
      fd.append('image', blob, 'brand.jpg');
      return Promise.resolve({ ok: true, channel: 'dm', image: '' });
    }).then(function (r) {
      if (!r.ok) throw new Error(r.error || 'fail');
      var ch = r.channel;
      $('doneTitle').textContent = ch === 'tg' ? 'Готово! Макет у вас в Telegram'
        : ch === 'max' ? 'Готово! Макет у вас в Max' : ch === 'dm' ? 'Готово! Отправьте макет нам в чат' : 'Готово! Вот ваш макет';
      $('doneText').textContent = ch === 'web'
        ? 'Отправьте макет себе на почту или в мессенджер, кнопки ниже. Менеджер «Аренды мебели» позвонит и подготовит персональную подборку.'
        : ch === 'dm' ? 'Пришлите картинку в наш чат, и менеджер подготовит персональную подборку: ткань, оформление и расчёт.'
        : 'Менеджер «Аренды мебели» подготовит персональную подборку: ткань, оформление и расчёт.';
      var file = window.File ? new File([lastBlob], 'moy-brend.jpg', { type: 'image/jpeg' }) : null;
      var canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
      $('share').hidden = !(canShare && ch === 'dm');   // гостям из чата Юли: переслать ей макет
      $('again').className = $('share').hidden ? 'btn' : 'btn ghost';   // одна главная кнопка на экране
      $('share').onclick = function () { navigator.share({ files: [file], title: 'Мой брендинг на текстиле «Аренды мебели»' }).catch(function () {}); };
      $('doneImg').src = URL.createObjectURL(lastBlob);
      lastImage = r.image;
      setupSave(file);
      $('toChat').hidden = !(tgApp && tgApp.close);
      show('s3');
    }).catch(function (e) {
      $('err').textContent = e && e.message === 'limit'
        ? 'Вы уже прислали много макетов, менеджер свяжется с вами'
        : 'Не получилось отправить. Проверьте интернет и нажмите ещё раз.';
    }).then(function () {
      busy = false; go.disabled = false; go.textContent = 'Получить подборку';
    });
  }

  var lastBlob = null;   // последний отправленный макет, показываем на экране «Готово»
  var lastImage = '';    // его адрес на нашем сервере: для Telegram, Max и письма

  // «Отправить макет себе»: на почту (письмо с картинкой), в Telegram (выбор чата, например «Избранное»), в Max
  function hint(t) { $('saveHint').textContent = t; $('saveHint').hidden = !t; }
  function setupSave(file) {
    $('mailForm').hidden = true; hint(''); $('mailErr').textContent = '';
    $('mailSend').disabled = false; $('mailSend').textContent = 'Отправить на почту';
    $('toTg').href = 'https://t.me/mvk_vikt?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21%20%D0%AF%20%D1%81%20%D1%84%D0%B5%D1%81%D1%82%D0%B8%D0%B2%D0%B0%D0%BB%D1%8F%20%C2%AB%D0%81%D0%BB%D0%BA%D0%B8%C2%BB%2C%20%D1%85%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%B1%D1%80%D0%B0%D1%82%D1%8C%20%D0%BF%D0%BE%D0%B4%D0%B0%D1%80%D0%BE%D0%BA%20%D0%B8%20%D0%BF%D0%BE%D0%BB%D1%83%D1%87%D0%B8%D1%82%D1%8C%20%D0%BF%D0%BE%D0%B4%D0%B1%D0%BE%D1%80%D0%BA%D1%83%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B8%D0%BB%D1%8F%20%D0%BF%D0%BE%D0%B4%20%D0%BD%D0%B0%D1%88%20%D0%B1%D1%80%D0%B5%D0%BD%D0%B4.';
    $('toMax').onclick = function () {
      var canFiles = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
      if (canFiles) { navigator.share({ files: [file], title: 'Мой макет от «Аренды мебели»' }).catch(function () {}); return; }
      window.open('https://max.ru/u/f9LHodD0cOJ7Zt_K9ql3w07qTTIzEOo6TGetEHfpGy2BEgHT0rVOag9T2vo', '_blank');
    };
    $('toMail').onclick = function () { $('mailForm').hidden = false; hint(''); setTimeout(function () { $('mailTo').focus(); }, 50); };
  }
  function sendMail(e) {
    e.preventDefault();
    var to = $('mailTo').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) { $('mailErr').textContent = 'Проверьте адрес почты'; return; }
    $('mailErr').textContent = ''; $('mailSend').disabled = true; $('mailSend').textContent = 'Отправляем…';
    retry(function () { return fetch('api.php?a=mail', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: token, email: to, image: lastImage.split('/').pop(), item: state.item.id }), signal: timeout(25000) }); })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.error || 'fail');
        $('mailForm').hidden = true; hint('Отправили макет на ' + to + '. Если письма нет, загляните в «Спам».');
      })
      .catch(function (e) {
        $('mailErr').textContent = e && e.message === 'limit' ? 'Слишком много писем, попробуйте позже' : 'Не получилось отправить. Проверьте адрес и интернет.';
        $('mailSend').disabled = false; $('mailSend').textContent = 'Отправить на почту';
      });
  }

  // интернет на выставке моргает: даём запросу время и одну повторную попытку
  function timeout(ms) { if (!window.AbortController) return undefined; var c = new AbortController(); setTimeout(function () { c.abort(); }, ms); return c.signal; }
  function retry(fn) { return fn().catch(function () { return new Promise(function (ok) { setTimeout(ok, 800); }).then(fn); }); }

  function preload() {
    // полные фото всех изделий (около 150 КБ) подтягиваем, пока гость смотрит список
    setTimeout(function () { Mockup.ITEMS.forEach(function (it) { mock.prepare(it.id).catch(function () {}); }); }, 300);
  }

  function init() {
    buildGrid(); buildSwatches(); buildFonts(); buildPairs(); buildShow(); setupMini();
    [].forEach.call($('ask').querySelectorAll('.opt'), function (o) { o.onclick = function () { setAsk(o.getAttribute('data-v')); }; });
    // шрифты надписи подтягиваем заранее, чтобы переключение было мгновенным
    setTimeout(function () { Mockup.FONTS.forEach(loadFont); }, 1500);
    chips($('method'), METHODS, 'method', false);
    chips($('qty'), QTYS, 'qty', true);
    $('brand').addEventListener('input', draw);
    $('file').addEventListener('change', onFile);
    $('mono').addEventListener('change', function () { state.mono = this.checked; draw(); });
    $('logoOff').onclick = function () { state.logo = null; $('logoOn').hidden = true; $('uplBtn').hidden = false; $('uplHint').hidden = false; $('sample').hidden = false; $('mono').checked = false; state.mono = false; refreshPairs(); draw(); };
    $('sample').onclick = function () { document.fonts && document.fonts.load('900 40px Mulish').then(function () { setLogo(sampleLogo()); }); };
    $('back').onclick = function () { show('s1'); };
    $('again').onclick = function () { show('s1'); };
    $('toChat').onclick = function () { if (tgApp) tgApp.close(); };
    $('go').onclick = submit;
    $('mailForm').addEventListener('submit', sendMail);
    loadTg();
    document.fonts && document.fonts.load('900 40px Mulish').then(function () { if (state.item) draw(); });

    $('gift').textContent = 'Напишите нам в Telegram или Max и заберите подарок на стенде';
    show('s1'); preload(); return;
    retry(function () { return fetch('api.php?a=me&t=' + encodeURIComponent(token), { signal: timeout(12000) }); })
      .then(function (r) { return r.json(); }).then(function (r) {
      if (!r.ok || !r.access) { show('s0'); return; }
      state.me = r;
      if (r.code) {
        $('chipCode').textContent = r.code; $('chip').hidden = false;
        var gb = document.createElement('b'); gb.textContent = r.code;
        $('gift').textContent = 'Ваш промокод на подарок: '; $('gift').appendChild(gb);
      } else {
        $('gift').textContent = 'Покажите переписку с нами на стенде и заберите подарок';
      }
      show('s1');
      preload();
    }).catch(function () { show('s1'); preload(); });
  }
  init();
})();

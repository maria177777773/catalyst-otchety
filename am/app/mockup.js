/* Движок примерки: перекрашивает ткань на фото изделия и кладёт на неё надпись или логотип
   с тенями и складками самой ткани. Всё на canvas, без сервера. */
(function () {
  'use strict';

  // Зона нанесения на фото 800×800: центр, плоские ширина и высота, поворот (°),
  // сжатие по вертикали (перспектива) и наклон (skewX, °); lh — высота под логотип, если больше строки текста.
  var ITEMS = [
    { id: 'kreslo',   name: 'Чехол на кресло-мешок',        zone: { x: 330, y: 560, w: 230, h: 115, lh: 165, rot: -2, sy: 0.97, kx: 0 } },
    { id: 'podushka', name: 'Подушка декоративная',         zone: { x: 402, y: 400, w: 400, h: 240, rot: -1, sy: 1, kx: 0 } },
    { id: 'koktejl',  name: 'Чехол на коктейльный стол',    zone: { x: 398, y: 300, w: 158, h: 92, lh: 140, rot: 0, sy: 1, kx: 0 } },
    { id: 'stol',     name: 'Стрейч-чехол на стол',         zone: { x: 460, y: 358, w: 420, h: 95, lh: 98, rot: -8, sy: 1, kx: 0 } },
    { id: 'krug',     name: 'Наперон круглый стрейчевый',   zone: { x: 400, y: 162, w: 330, h: 190, rot: 0, sy: 0.33, kx: 0 } },
    { id: 'svis',     name: 'Наперон квадратный со свисом', zone: { x: 552, y: 316, w: 210, h: 64, lh: 84, m: [0.961, -0.276, 0, 1] } },
    { id: 'pled',     name: 'Флисовый плед',                zone: { x: 365, y: 495, w: 180, h: 64, rot: 24, sy: 1, kx: 0 } },
    { id: 'shezlong', name: 'Полотно для шезлонга',         zone: { x: 312, y: 250, w: 175, h: 95, lh: 150, rot: -1.5, sy: 0.92, kx: 18 } }
  ];

  // g: solid — однотонная ткань, grad — градиент (сублимация), pat — узор. Ряд в палитре = 9 образцов.
  var COLORS = [
    { id: 'biruza',  name: 'Бирюзовый', hex: null },
    { id: 'white',   name: 'Белый',     hex: '#f3f3f1' },
    { id: 'beige',   name: 'Бежевый',   hex: '#d9c4a3' },
    { id: 'grey',    name: 'Серый',     hex: '#9da1a6' },
    { id: 'graphite',name: 'Графит',    hex: '#34363a' },
    { id: 'black',   name: 'Чёрный',    hex: '#151515' },
    { id: 'choco',   name: 'Шоколадный',hex: '#4a2c21' },
    { id: 'mocha',   name: 'Мокко',     hex: '#a47864' },
    { id: 'terra',   name: 'Терракота', hex: '#c8553d' },
    { id: 'red',     name: 'Красный',   hex: '#c8292f' },
    { id: 'wine',    name: 'Бордовый',  hex: '#7b2034' },
    { id: 'orange',  name: 'Ярко-оранжевый', hex: '#ff6a00' },   // фирменный оранжевый «Вызов Принят» (логотип HR-панели)
    { id: 'yellow',  name: 'Жёлтый',    hex: '#f0c330' },
    { id: 'mustard', name: 'Горчичный', hex: '#c99a1e' },
    { id: 'lime',    name: 'Кислотный лайм', hex: '#c6f400' },
    { id: 'green',   name: 'Зелёный',   hex: '#13995a' },
    { id: 'emerald', name: 'Изумрудный',hex: '#0e6b50' },
    { id: 'navy',    name: 'Синий',     hex: '#22407f' },
    { id: 'electric',name: 'Электрик',  hex: '#2b4cff' },
    { id: 'sky',     name: 'Небесный',  hex: '#8ec5ee' },
    { id: 'mint',    name: 'Мятный',    hex: '#8fe3c4' },
    { id: 'sage',    name: 'Шалфей',    hex: '#9caf88' },
    { id: 'lavender',name: 'Лавандовый',hex: '#b7a3e8' },
    { id: 'violet',  name: 'Фиолетовый',hex: '#6c2bd9' },
    { id: 'fuchsia', name: 'Неоновая фуксия', hex: '#ff2d95' },
    { id: 'powder',  name: 'Пудровый',  hex: '#e8b4b8' },
    { id: 'coral',   name: 'Коралловый',hex: '#ff6f61' },
    // 06.10: Маша: «можно ещё градиентики» — печать на ткани сублимацией
    { id: 'g-sunset', g: 'grad', name: 'Закат',    grad: ['#ff6a00', '#ff2d95'] },
    { id: 'g-peach',  g: 'grad', name: 'Персик',   grad: ['#ffd3a5', '#fd6585'] },
    { id: 'g-lemon',  g: 'grad', name: 'Лимонад',  grad: ['#c6f400', '#13995a'] },
    { id: 'g-ocean',  g: 'grad', name: 'Океан',    grad: ['#1aa3b8', '#22407f'] },
    { id: 'g-aurora', g: 'grad', name: 'Северное сияние', grad: ['#8fe3c4', '#2b4cff', '#6c2bd9'] },
    { id: 'g-berry',  g: 'grad', name: 'Ягодный',  grad: ['#ff2d95', '#6c2bd9'] },
    { id: 'g-flame',  g: 'grad', name: 'Пламя',    grad: ['#f0c330', '#ff6a00', '#c8292f'] },
    { id: 'g-pastel', g: 'grad', name: 'Пастель',  grad: ['#b7a3e8', '#e8b4b8', '#ffd3a5'] },
    { id: 'g-rainbow',g: 'grad', name: 'Радуга',   grad: ['#ff2d95', '#ff6a00', '#f0c330', '#c6f400', '#1aa3b8', '#6c2bd9'] },
    // 06.10 вечер: Маша: «узоры помоднее, полоски с другими цветами: белые, розовые». Взято из трендов 2026:
    // горох — главный принт сезона (WGSN), крупная виши в пастели (Miu Miu), тональные и смешанные полоски,
    // коровий принт, клевер; база — тёплый белый в духе Pantone 2026 Cloud Dancer.
    { id: 'p-pink',      g: 'pat', name: 'Розовая полоска',   pat: 'stripes', a: '#f0eee9', b: '#f4a7c0', p: 34 },
    { id: 'p-pyjama',    g: 'pat', name: 'Пижамная полоска',  pat: 'stripes', a: '#f0eee9', b: '#7393dc', p: 28, k: 0.36 },
    { id: 'p-cabana',    g: 'pat', name: 'Маркиза',           pat: 'stripes', a: '#f0eee9', b: '#e8288a', p: 64 },
    { id: 'p-tonal',     g: 'pat', name: 'Полоска тон в тон', pat: 'stripes', a: '#cfae98', b: '#a47864', p: 40 },
    { id: 'p-ombre',     g: 'pat', name: 'Омбре',             pat: 'bands', bands: [['#fde2e4', 9], ['#f8b4c4', 9], ['#f07fa0', 9], ['#e2456f', 9], ['#f07fa0', 9], ['#f8b4c4', 9]] },
    { id: 'p-ticking',   g: 'pat', name: 'Тикинг',            pat: 'bands', bands: [['#f0eee9', 15], ['#2f3f73', 3], ['#f0eee9', 3], ['#2f3f73', 3]] },
    { id: 'p-mixed',     g: 'pat', name: 'Тонкая и толстая',  pat: 'bands', bands: [['#f0eee9', 10], ['#b3152a', 14], ['#f0eee9', 6], ['#b3152a', 3]] },
    { id: 'p-wave',      g: 'pat', name: 'Волна',             pat: 'wave', a: '#f0eee9', b: '#c8553d' },
    { id: 'p-zebra',     g: 'pat', name: 'Зебра',             pat: 'zebra', a: '#f0eee9', b: '#1c1c1c' },
    { id: 'p-cherry',    g: 'pat', name: 'Вишнёвый горох',    pat: 'dots', a: '#f0eee9', b: '#b3152a', p: 34 },
    { id: 'p-rose',      g: 'pat', name: 'Крупный горох',     pat: 'dots', a: '#2b1a20', b: '#f4a7c0', p: 52, r: 0.25 },
    { id: 'p-mint',      g: 'pat', name: 'Мятный мини-горох', pat: 'dots', a: '#79d1a9', b: '#ffffff', p: 20, r: 0.2 },
    { id: 'p-vichy-pink',g: 'pat', name: 'Розовая виши',      pat: 'gingham', a: '#f0eee9', b: '#f4a7c0', p: 60 },
    { id: 'p-vichy-butter', g: 'pat', name: 'Масляная виши',  pat: 'gingham', a: '#f0eee9', b: '#efcf5c', p: 60 },
    { id: 'p-wavychess', g: 'pat', name: 'Волнистая шахматка', pat: 'wavychess', a: '#f0eee9', b: '#a47864' },
    { id: 'p-cow',       g: 'pat', name: 'Коровий принт',     pat: 'cow', a: '#f0eee9', b: '#1c1c1c' },
    { id: 'p-daisy',     g: 'pat', name: 'Ромашки',           pat: 'daisy', a: '#f4a7c0', b: '#ffffff', c: '#efcf5c' },
    { id: 'p-clover',    g: 'pat', name: 'Клевер',            pat: 'clover', a: '#f0eee9', b: '#4c9a5f' },
    // 12.10: Маша по встрече с Юлей: «добавить новогоднюю линейку: олени, снежинки, снеговики»
    // 12.10 вечер: Маша: «новогодние ярче, со снежинками, с Дедами Морозами», затем «Новый год = зелёный и красный»: только красный и зелёный фон
    { id: 'ny-snow-red', g: 'pat', name: 'Снежинки на красном',   pat: 'snow', a: '#e4122f', b: '#ffffff', t: 2.4, R: 19 },
    { id: 'ny-snow-green', g: 'pat', name: 'Снежинки на зелёном', pat: 'snow', a: '#0e9f4e', b: '#ffffff', t: 2.4, R: 19 },
    { id: 'ny-santa',    g: 'pat', name: 'Дед Мороз на тёмно-зелёном', pat: 'santa', a: '#0b7a3e', b: '#ffffff' },
    { id: 'ny-santa-green', g: 'pat', name: 'Дед Мороз на зелёном', pat: 'santa', a: '#12b04f', b: '#ffffff' },
    { id: 'ny-trees-red',g: 'pat', name: 'Ёлочки на красном',     pat: 'trees', a: '#e4122f', b: '#1fb85a', c: '#ffd23f' },
    { id: 'ny-trees-green', g: 'pat', name: 'Ёлочки на зелёном',  pat: 'trees', a: '#0e9f4e', b: '#ffffff', c: '#e4122f' },
    { id: 'ny-deer-red', g: 'pat', name: 'Олени на красном',      pat: 'deer', a: '#e4122f', b: '#ffffff', c: '#1c1c1c' },
    { id: 'ny-deer-green', g: 'pat', name: 'Олени на зелёном',    pat: 'deer', a: '#0b7a3e', b: '#ffffff', c: '#e4122f' },
    { id: 'ny-snowman',  g: 'pat', name: 'Снеговики на зелёном',  pat: 'snowman', a: '#0e9f4e', b: '#ffffff', c: '#ff7a00' }
  ];

  var SIZE = 800;

  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function smooth(a, b, x) {
    var t = (x - a) / (b - a);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }
  function loadImage(src) {
    return new Promise(function (ok, fail) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = fail;
      im.src = src;
    });
  }

  // ---- узоры и градиенты ----
  // Узор = плитка w×h (в пикселях фото 800×800) и функция цвета точки плитки fn(u, v).
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  var TAU = Math.PI * 2;
  var PAT = {
    dots: function (o, A, B) {   // горох в шахматном порядке
      var P = o.p || 36, r = P * (o.r || 0.21);
      return { w: P, h: P, fn: function (u, v) {
        var d = Math.min(Math.hypot(u - P / 4, v - P / 4), Math.hypot(u - 3 * P / 4, v - 3 * P / 4));
        return d < r ? B : A;
      } };
    },
    stripes: function (o, A, B) {
      var P = o.p || 32, k = o.k || 0.5;
      return { w: P, h: P, fn: function (u) { return u < P * k ? B : A; } };
    },
    bands: function (o) {           // полосы разной ширины и цвета: омбре, тикинг, тонкая и толстая
      var list = o.bands.map(function (x) { return [hexToRgb(x[0]), x[1]]; }), W = 0;
      list.forEach(function (x) { W += x[1]; });
      return { w: W, h: W, fn: function (u) { for (var i = 0, acc = 0; i < list.length; i++) { acc += list[i][1]; if (u < acc) return list[i][0]; } return list[0][0]; } };
    },
    gingham: function (o, A, B) {   // виши: полосы полупрозрачные, на пересечении полный цвет
      var P = o.p || 28, M = mix(A, B, 0.5);
      return { w: P, h: P, fn: function (u, v) { var x = u < P / 2, y = v < P / 2; return x && y ? B : x || y ? M : A; } };
    },
    wave: function (o, A, B) {      // волнистые полосы
      var W = 64, S = 22;
      return { w: W, h: S, fn: function (u, v) { var s = v + 4.5 * Math.sin(TAU * u / W); s = ((s % S) + S) % S; return s < S * 0.42 ? B : A; } };
    },
    zebra: function (o, A, B) {     // неровные полосы разной толщины
      var P = 20, W = 80, H = 120;
      return { w: W, h: H, fn: function (u, v) {
        var s = u + 7 * Math.sin(TAU * v / H) + 3 * Math.sin(TAU * (2 * v / H + u / W));
        var t = 0.46 + 0.16 * Math.sin(TAU * (v / H + 2 * u / W));
        return ((s % P) + P) % P / P < t ? B : A;
      } };
    },
    wavychess: function (o, A, B) { // шахматка с волной
      var C = 30, T = C * 4;
      return { w: T, h: T, fn: function (u, v) {
        var x = u + 6 * Math.sin(TAU * v / T), y = v + 6 * Math.sin(TAU * u / T);
        return (Math.floor(x / C) + Math.floor(y / C)) & 1 ? B : A;
      } };
    },
    cow: function (o, A, B) {       // коровьи пятна: каждое из нескольких кругов, по краю плитки переходят на другую сторону
      var W = 220, seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var parts = [];
      [[40, 50], [150, 30], [100, 120], [190, 150], [35, 175], [120, 205]].forEach(function (c) {
        var n = 3 + Math.floor(rnd() * 3), base = 16 + rnd() * 12;
        for (var i = 0; i < n; i++) parts.push([c[0] + (rnd() - 0.5) * base * 1.6, c[1] + (rnd() - 0.5) * base * 1.3, base * (0.55 + rnd() * 0.5)]);
      });
      function wrap(d) { return ((d + W / 2) % W + W) % W - W / 2; }
      return { w: W, h: W, fn: function (u, v) {
        for (var i = 0; i < parts.length; i++) { var q = parts[i]; if (Math.hypot(wrap(u - q[0]), wrap(v - q[1])) < q[2]) return B; }
        return A;
      } };
    },
    daisy: function (o, A, B, Cc) { // ромашки в шахматном порядке
      var P = 72, R = P * 0.21;
      function fl(u, v) {
        var r = Math.hypot(u, v); if (r > R) return null;
        if (r < R * 0.3) return Cc;
        return r < R * (0.55 + 0.45 * Math.abs(Math.cos(4 * Math.atan2(v, u)))) ? B : null;
      }
      return { w: P, h: P, fn: function (u, v) { return fl(u - P / 4, v - P / 4) || fl(u - 3 * P / 4, v - 3 * P / 4) || A; } };
    },
    clover: function (o, A, B) {    // четырёхлистный клевер в шахматном порядке
      var P = 64, d = P * 0.1, rr = P * 0.082;
      function leaf(u, v) {
        var x = (u + v) * 0.7071, y = (v - u) * 0.7071;
        return Math.hypot(x - d, y) < rr || Math.hypot(x + d, y) < rr || Math.hypot(x, y - d) < rr || Math.hypot(x, y + d) < rr;
      }
      return { w: P, h: P, fn: function (u, v) { return leaf(u - P / 4, v - P / 4) || leaf(u - 3 * P / 4, v - 3 * P / 4) ? B : A; } };
    },
    // новогодняя линейка: фигурки в шахматном порядке, координаты внутри ячейки от её центра (v вниз)
    snow: function (o, A, B) {   // снежинка: три луча через центр + короткие веточки; o.t — толщина луча, o.R — размер
      var P = 64, R = o.R || 15, T = o.t || 1.1;
      function fl(u, v) {
        for (var k = 0; k < 3; k++) {
          var a = k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a), d = Math.abs(-u * s + v * c), al = u * c + v * s;
          if (d < T && Math.abs(al) < R) return true;
          var m = Math.abs(al) - R * 0.55;   // веточки на двух третях луча
          if (m > 0 && m < R * 0.33 && Math.abs(d - m * 0.9) < T * 0.9) return true;
        }
        return false;
      }
      return { w: P, h: P, fn: function (u, v) { return fl(u - P / 4, v - P / 4) || fl(u - 3 * P / 4, v - 3 * P / 4) ? B : A; } };
    },
    santa: function (o, A, B) {   // Дед Мороз: красный колпак с помпоном, лицо, белые усы и борода
      var P = 120, HAT = [226, 18, 44], SKIN = [255, 208, 172], NOSE = [236, 110, 110], EYE = [34, 34, 34];
      function sa(u, v) {
        if (Math.hypot(u - 7, v + 38) < 5.2) return B;                                   // помпон
        if (v > -14 && v < -8 && Math.abs(u) < 20 - Math.pow(v + 11, 2) * 0.3) return B;  // меховой край колпака
        if (v >= -37 && v <= -14 && Math.abs(u - (v + 37) * 0.18) < (v + 37) * 0.78 + 1) return HAT;  // колпак
        if (Math.hypot(u - 6, v + 3.5) < 1.9 || Math.hypot(u + 6, v + 3.5) < 1.9) return EYE;
        if (Math.hypot(u, v - 1) < 3.6) return NOSE;
        if ((Math.pow((Math.abs(u) - 6.5) / 8, 2) + Math.pow((v - 5) / 4, 2)) < 1) return B;  // усы
        if (Math.pow(u / 14, 2) + Math.pow((v + 1) / 10.5, 2) < 1 && v < 3) return SKIN;     // лицо
        if (Math.pow(u / 21, 2) + Math.pow((v - 9) / 17, 2) < 1 && v > -1) return B;        // борода
        return null;
      }
      var K = 0.72;   // фигурка крупнее в 1,4 раза
      return { w: P, h: P, fn: function (u, v) { return sa((u - P / 4) * K, (v - P / 4) * K - 2) || sa((u - 3 * P / 4) * K, (v - 3 * P / 4) * K - 2) || A; } };
    },
    trees: function (o, A, B, Cc) {   // ёлочка из трёх ярусов со стволом
      var P = 80;
      function tr(u, v) {
        if (Math.abs(u) < 2.6 && v > 11 && v < 16) return Cc;
        var t = [[-22, 0.4], [-14, 0.55], [-6, 0.7]];
        for (var i = 0; i < 3; i++) { var y = v - t[i][0]; if (y > 0 && y < 18 && Math.abs(u) < y * t[i][1]) return B; }
        return null;
      }
      return { w: P, h: P, fn: function (u, v) { return tr(u - P / 4, v - P / 4) || tr(u - 3 * P / 4, v - 3 * P / 4) || A; } };
    },
    deer: function (o, A, B, Cc) {   // голова оленя с ветвистыми рогами и носом
      var P = 120;
      function seg(u, v, x1, y1, x2, y2, w) {
        var dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(u - x1 - t * dx, v - y1 - t * dy) < w;
      }
      function dr(u, v) {
        if (Math.hypot(u, v - 17) < 4.6) return Cc;
        if ((u * u) / 225 + ((v - 6) * (v - 6)) / 169 < 1) return B;
        for (var s = -1; s <= 1; s += 2) {
          var x = Math.abs(u) * s;
          if (((u * s - 17) * (u * s - 17)) / 49 + ((v + 4) * (v + 4)) / 16 < 1 && u * s > 0) return B;
          if (u * s > 0 && (seg(x, v, 8, -9, 20, -33, 2.4) || seg(x, v, 13, -19, 25, -22, 2) || seg(x, v, 17, -27, 10, -34, 2) || seg(x, v, 20, -33, 28, -36, 2))) return B;
        }
        return null;
      }
      return { w: P, h: P, fn: function (u, v) { return dr(u - P / 4, v - P / 4 - 2) || dr(u - 3 * P / 4, v - 3 * P / 4 - 2) || A; } };
    },
    snowman: function (o, A, B, Cc) {   // снеговик: три шара, ведро-шапка, морковка
      var P = 112;
      function sm(u, v) {
        if (Math.abs(u) < 6.5 && v > -29 && v < -22) return [34, 34, 34];
        if (Math.abs(u) < 9 && v >= -22 && v < -20) return [34, 34, 34];
        if (u > 3 && u < 13 && Math.abs(v + 14) < 1.8 * (13 - u) / 10 + 0.5) return Cc;
        if (Math.hypot(u, v + 13) < 7 || Math.hypot(u, v + 1) < 9 || Math.hypot(u, v - 14) < 12) return B;
        return null;
      }
      return { w: P, h: P, fn: function (u, v) { return sm(u - P / 4, v - P / 4 - 2) || sm(u - 3 * P / 4, v - 3 * P / 4 - 2) || A; } };
    }
  };

  // плитка узора в масштабе k, со сглаживанием (4×4 замера на пиксель); средний цвет — для оттенка надписи
  var tileCache = {};
  function tile(c, k) {
    var key = c.id + '@' + k;
    if (tileCache[key]) return tileCache[key];
    var A = c.a ? hexToRgb(c.a) : null, B = c.b ? hexToRgb(c.b) : null, Cc = c.c ? hexToRgb(c.c) : null;
    var t = PAT[c.pat](c, A, B, Cc);
    var W = Math.max(2, Math.round(t.w * k)), H = Math.max(2, Math.round(t.h * k)), SS = 4;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), id = g.createImageData(W, H), d = id.data, sum = [0, 0, 0];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var r = 0, gg = 0, b = 0;
      for (var sy = 0; sy < SS; sy++) for (var sx = 0; sx < SS; sx++) {
        var col = t.fn((x + (sx + 0.5) / SS) * t.w / W, (y + (sy + 0.5) / SS) * t.h / H);
        r += col[0]; gg += col[1]; b += col[2];
      }
      var q = (y * W + x) * 4, n2 = SS * SS;
      d[q] = r / n2; d[q + 1] = gg / n2; d[q + 2] = b / n2; d[q + 3] = 255;
      sum[0] += d[q]; sum[1] += d[q + 1]; sum[2] += d[q + 2];
    }
    g.putImageData(id, 0, 0);
    cv.avg = [sum[0] / (W * H), sum[1] / (W * H), sum[2] / (W * H)];
    tileCache[key] = cv;
    return cv;
  }
  function gradAvg(stops) {
    var s = [0, 0, 0];
    stops.forEach(function (h) { var c = hexToRgb(h); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; });
    return [s[0] / stops.length, s[1] / stops.length, s[2] / stops.length];
  }
  function fillGrad(g, stops, x0, y0, x1, y1) {
    var lg = g.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (h, i) { lg.addColorStop(i / (stops.length - 1), h); });
    g.fillStyle = lg;
  }
  function zoneAngle(z) { return z.m ? Math.atan2(z.m[1], z.m[0]) : (z.rot || 0) * Math.PI / 180; }

  // образец для палитры: картинка size×size
  Mockup.swatch = function (c, size, fallback) {
    var cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    var g = cv.getContext('2d');
    if (c.grad) fillGrad(g, c.grad, 0, size, size, 0);
    else if (c.pat) {
      g.translate(size / 2, size / 2); g.rotate((c.rot || 0) * Math.PI / 180);
      g.fillStyle = g.createPattern(tile(c, size / 110), 'repeat');
      g.fillRect(-size, -size, size * 2, size * 2);
      return cv.toDataURL();
    } else g.fillStyle = c.hex || fallback || '#1aa3b8';
    g.fillRect(0, 0, size, size);
    return cv.toDataURL();
  };

  function Mockup(canvas, base) {
    this.canvas = canvas;
    canvas.width = SIZE; canvas.height = SIZE;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.base = base || 'img/';
    this.cache = {};
    this.print = document.createElement('canvas');
    this.print.width = SIZE; this.print.height = SIZE;
    this.pctx = this.print.getContext('2d', { willReadFrequently: true });
  }

  // Разбор фото: маска ткани (бирюза), яркость и опорная яркость ткани.
  Mockup.prototype.prepare = function (id) {
    var self = this;
    if (self.cache[id]) return self.cache[id];
    self.cache[id] = loadImage(self.base + id + '.webp').then(function (im) {
      var c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(im, 0, 0, SIZE, SIZE);
      var d = x.getImageData(0, 0, SIZE, SIZE).data;
      var n = SIZE * SIZE, mask = new Float32Array(n), lum = new Float32Array(n);
      var hist = new Uint32Array(256), cnt = 0, rs = 0, gs = 0, bs = 0;
      for (var i = 0; i < n; i++) {
        var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        var s = mx ? (mx - mn) / mx : 0, h = 0;
        if (mx !== mn) {
          if (mx === r) h = 60 * (((g - b) / (mx - mn)) % 6);
          else if (mx === g) h = 60 * ((b - r) / (mx - mn) + 2);
          else h = 60 * ((r - g) / (mx - mn) + 4);
          if (h < 0) h += 360;
        }
        var hw = 1 - smooth(20, 38, Math.abs(h - 188));
        var m = hw * smooth(0.10, 0.30, s) * smooth(18, 45, mx);
        mask[i] = m;
        var L = 0.299 * r + 0.587 * g + 0.114 * b;
        lum[i] = L;
        if (m > 0.9) { hist[L | 0]++; cnt++; rs += r; gs += g; bs += b; }
      }
      // опорная яркость = 60-й перцентиль ткани (свет, а не тени)
      var bx0 = SIZE, by0 = SIZE, bx1 = 0, by1 = 0;   // рамка ткани: по ней тянем градиент
      for (var yy = 0; yy < SIZE; yy += 2) for (var xx = 0; xx < SIZE; xx += 2) {
        if (mask[yy * SIZE + xx] > 0.5) { if (xx < bx0) bx0 = xx; if (xx > bx1) bx1 = xx; if (yy < by0) by0 = yy; if (yy > by1) by1 = yy; }
      }
      var acc = 0, ref = 128;
      for (var k = 0; k < 256; k++) { acc += hist[k]; if (acc >= cnt * 0.6) { ref = k; break; } }
      return { im: im, data: d, mask: mask, lum: lum, ref: Math.max(ref, 1),
               own: [rs / cnt, gs / cnt, bs / cnt], box: [bx0, by0, bx1, by1] };
    });
    self.cache[id].catch(function () { delete self.cache[id]; });   // сеть моргнула: попробуем снова
    return self.cache[id];
  };

  // ткань с узором или градиентом под конкретное изделие: цвет каждой точки фото (кэш на изделие × ткань)
  Mockup.prototype.texture = function (c, item, rec) {
    var key = item.id + '|' + c.id;
    this.tex = this.tex || {};
    if (this.tex[key]) return this.tex[key];
    var cv = document.createElement('canvas'); cv.width = SIZE; cv.height = SIZE;
    var g = cv.getContext('2d', { willReadFrequently: true }), z = item.zone, avg;
    if (c.grad) {
      var b = rec.box;
      fillGrad(g, c.grad, b[0], b[3], b[2], b[1]);
      g.fillRect(0, 0, SIZE, SIZE);
      avg = gradAvg(c.grad);
    } else {
      var t = tile(c, item.ps || 1);
      g.translate(z.x, z.y); g.rotate(zoneAngle(z) + (c.rot || 0) * Math.PI / 180);
      g.fillStyle = g.createPattern(t, 'repeat');
      g.fillRect(-SIZE * 1.5, -SIZE * 1.5, SIZE * 3, SIZE * 3);
      avg = t.avg;
    }
    var keys = Object.keys(this.tex);
    if (keys.length > 12) delete this.tex[keys[0]];   // на телефоне память не резиновая
    return (this.tex[key] = { data: g.getImageData(0, 0, SIZE, SIZE).data, avg: avg });
  };

  function zoneTransform(g, z) {
    g.translate(z.x, z.y);
    if (z.m) { g.transform(z.m[0], z.m[1], z.m[2], z.m[3], 0, 0); return; }
    g.rotate((z.rot || 0) * Math.PI / 180);
    if (z.kx) g.transform(1, 0, Math.tan(z.kx * Math.PI / 180), 1, 0, 0);
    g.scale(1, z.sy || 1);
  }

  function fontCss(font, size) {
    font = font || { family: 'Mulish', weight: 900 };
    return font.weight + ' ' + size + 'px "' + font.family + '", Arial, sans-serif';
  }

  function fitText(ctx, text, w, h, maxLines, font) {
    var words = text.trim().split(/\s+/);
    var best = { size: 0, lines: [text] };
    function widthOf(lines, size) {
      ctx.font = fontCss(font, size);
      var m = 0;
      for (var i = 0; i < lines.length; i++) m = Math.max(m, ctx.measureText(lines[i]).width);
      return m;
    }
    var options = [[text.trim()]];
    if (words.length > 1 && maxLines !== 1) {
      for (var cut = 1; cut < words.length; cut++)
        options.push([words.slice(0, cut).join(' '), words.slice(cut).join(' ')]);
    }
    options.forEach(function (lines) {
      var lh = 1.05, maxByH = h / (lines.length * lh);
      var size = Math.min(maxByH, 400);
      var wv = widthOf(lines, size);
      if (wv > w) size = size * w / wv;
      if (size > best.size) best = { size: size, lines: lines };
    });
    return best;
  }

  // Подготовка загруженного логотипа: белый фон прозрачным, обрезка пустых краёв.
  Mockup.cleanLogo = function (im) {
    var maxSide = 700, sc = Math.min(1, maxSide / Math.max(im.naturalWidth || im.width, im.naturalHeight || im.height));
    var W = Math.max(1, Math.round((im.naturalWidth || im.width) * sc)), H = Math.max(1, Math.round((im.naturalHeight || im.height) * sc));
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0, W, H);
    var id = x.getImageData(0, 0, W, H), d = id.data, hasAlpha = false;
    for (var i = 3; i < d.length; i += 16) if (d[i] < 250) { hasAlpha = true; break; }
    if (!hasAlpha) {
      for (var j = 0; j < d.length; j += 4) {
        var mn = Math.min(d[j], d[j + 1], d[j + 2]);
        if (mn > 238) d[j + 3] = 0;
        else if (mn > 215) d[j + 3] = Math.round(255 * (238 - mn) / 23);
      }
    }
    var x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) {
      if (d[(y * W + xx) * 4 + 3] > 24) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    x.putImageData(id, 0, 0);
    if (x1 < 0) return null;
    var out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  };

  // 07.10.2026, Маша: «логотип не подгружается» — в сочетаниях (логотип одним цветом) логотип на своей плашке
  // (тёмный или цветной квадрат с буквами, JPG без прозрачности) заливался целиком, выходил пустой квадрат.
  // Как печать в один цвет: если в логотипе есть тёмное и светлое (порог Оцу по яркости), краской идёт тёмная
  // часть, светлая остаётся цветом ткани; логотип одного тона красится целиком, как раньше. Считается один раз.
  function monoAlpha(L) {
    if (L._monoA) return L._monoA;
    var W = L.width, H = L.height, d = L.getContext('2d').getImageData(0, 0, W, H).data, hist = new Array(256), tot = 0, i;
    for (i = 0; i < 256; i++) hist[i] = 0;
    for (i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { hist[(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0]++; tot++; }
    var sum = 0; for (i = 0; i < 256; i++) sum += i * hist[i];
    var sB = 0, wB = 0, best = -1, th = 128, m0 = 0, m1 = 0, w0 = 0;
    for (i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue;
      var wF = tot - wB; if (!wF) break;
      sB += i * hist[i];
      var mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; th = i; m0 = mB; m1 = mF; w0 = wB / tot; }
    }
    // только для логотипа на сплошной плашке: непрозрачного больше 60% кадра. Логотип без плашки (буквы на прозрачном
    // фоне, даже светлые) красится целиком, иначе светлые буквы пропали бы
    var opaque = 0; for (i = 3; i < d.length; i += 4) if (d[i] >= 250) opaque++;
    var split = tot > 0 && opaque / (W * H) > 0.6 && m1 - m0 > 70 && w0 > 0.04 && w0 < 0.96;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var cx = c.getContext('2d'), out = cx.createImageData(W, H), o = out.data;
    for (i = 0; i < d.length; i += 4) {
      var a = d[i + 3];
      if (split) {
        var lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        a = a * Math.max(0, Math.min(1, (th + 14 - lum) / 28));
      }
      o[i + 3] = a;
    }
    cx.putImageData(out, 0, 0);
    L._monoA = c;
    return c;
  }
  Mockup.monoAlpha = monoAlpha;

  // opts: { item, color: hex|null, text, font: {family, weight}, logo: canvas|null, mono: bool }
  Mockup.prototype.render = function (opts) {
    var self = this, item = ITEMS.filter(function (i) { return i.id === opts.item; })[0];
    var seq = self.seq = (self.seq || 0) + 1;
    return self.prepare(item.id).then(function (rec) {
      if (seq !== self.seq) return self.canvas;   // пока грузилось, гость выбрал другое: рисуем только последнее
      var n = SIZE * SIZE, src = rec.data, mask = rec.mask, lum = rec.lum, ref = rec.ref;
      var out = self.ctx.createImageData(SIZE, SIZE), o = out.data;
      var col = typeof opts.color === 'string' ? { hex: opts.color } : opts.color || {};
      var tx = col.grad || col.pat ? self.texture(col, item, rec) : null;
      var T = tx ? tx.avg : col.hex ? hexToRgb(col.hex) : null, td = tx ? tx.data : null;
      var tLum = T ? 0.299 * T[0] + 0.587 * T[1] + 0.114 * T[2] : 0.299 * rec.own[0] + 0.587 * rec.own[1] + 0.114 * rec.own[2];
      var lift = tLum < 90 ? 0.75 : 1.15;

      // 1. ткань
      for (var i = 0; i < n; i++) {
        var p = i * 4, m = mask[i];
        if (!T || m < 0.003) { o[p] = src[p]; o[p + 1] = src[p + 1]; o[p + 2] = src[p + 2]; o[p + 3] = 255; continue; }
        var s = lum[i] / ref;
        for (var c = 0; c < 3; c++) {
          var tc = td ? td[p + c] : T[c];
          var v = s <= 1 ? tc * s : tc + (255 - tc) * Math.min(1, (s - 1) * lift);
          o[p + c] = src[p + c] * (1 - m) + v * m;
        }
        o[p + 3] = 255;
      }

      // 2. нанесение
      var pc = self.pctx, z = item.zone;
      pc.setTransform(1, 0, 0, 1, 0, 0);
      pc.clearRect(0, 0, SIZE, SIZE);
      // цвет нанесения: из готового сочетания или сам — тёмный на светлой ткани, белый на тёмной
      var ink = opts.ink || (tLum > 150 ? '#1c1c1c' : '#ffffff');
      var inkRgb = hexToRgb(ink), inkLum = 0.299 * inkRgb[0] + 0.587 * inkRgb[1] + 0.114 * inkRgb[2];
      // на пёстром узоре надпись теряется: печатаем с контуром контрастного цвета
      var edge = col.pat ? (inkLum > 150 ? '#1c1c1c' : '#ffffff') : null;
      var hasPrint = false;
      zoneTransform(pc, z);
      if (opts.logo) {
        // логотип часто квадратный: где на ткани есть место, зона под него выше, чем под строку текста (lh)
        var L = opts.logo, sc = Math.min(z.w / L.width, (z.lh || z.h) / L.height);
        var lw = L.width * sc, lh = L.height * sc;
        if (opts.mono) {
          var t = document.createElement('canvas'); t.width = L.width; t.height = L.height;
          var tx = t.getContext('2d'); tx.drawImage(monoAlpha(L), 0, 0);
          tx.globalCompositeOperation = 'source-in'; tx.fillStyle = ink; tx.fillRect(0, 0, t.width, t.height);
          L = t;
        }
        if (edge) {
          var e = document.createElement('canvas'); e.width = L.width; e.height = L.height;
          var ex = e.getContext('2d'); ex.drawImage(L, 0, 0);
          ex.globalCompositeOperation = 'source-in'; ex.fillStyle = edge; ex.fillRect(0, 0, e.width, e.height);
          var rr = Math.max(2.5, Math.min(lw, lh) * 0.035);
          for (var a = 0; a < 16; a++) pc.drawImage(e, -lw / 2 + rr * Math.cos(a * Math.PI / 8), -lh / 2 + rr * Math.sin(a * Math.PI / 8), lw, lh);
        }
        pc.drawImage(L, -lw / 2, -lh / 2, lw, lh);
        hasPrint = true;
      } else if (opts.text && opts.text.trim()) {
        var f = fitText(pc, opts.text, z.w, z.h, z.lines, opts.font);
        pc.font = fontCss(opts.font, f.size);
        pc.fillStyle = ink; pc.textAlign = 'center'; pc.textBaseline = 'middle';
        var lh2 = f.size * 1.05, y0 = -lh2 * (f.lines.length - 1) / 2;
        if (edge) {
          pc.lineJoin = 'round'; pc.lineWidth = Math.max(3, f.size * 0.18); pc.strokeStyle = edge;
          f.lines.forEach(function (ln, idx) { pc.strokeText(ln, 0, y0 + idx * lh2 + f.size * 0.04); });
        }
        f.lines.forEach(function (ln, idx) { pc.fillText(ln, 0, y0 + idx * lh2 + f.size * 0.04); });
        hasPrint = true;
      }
      if (hasPrint) {
        var pd = pc.getImageData(0, 0, SIZE, SIZE).data;
        for (var j = 0; j < n; j++) {
          var q = j * 4, a = pd[q + 3];
          if (!a) continue;
          var pa = (a / 255) * Math.min(1, mask[j] * 1.25) * 0.96;
          if (pa <= 0) continue;
          var sh = lum[j] / ref; sh = sh < 0.5 ? 0.5 : sh > 1.06 ? 1.06 : sh;
          var shade = 0.18 + 0.82 * sh;
          for (var cc = 0; cc < 3; cc++) {
            var pv = Math.min(255, pd[q + cc] * shade);
            o[q + cc] = o[q + cc] * (1 - pa) + pv * pa;
          }
        }
      }
      self.ctx.putImageData(out, 0, 0);
      self.canvas.dataset.ready = item.id;
      if (opts.debug) {
        var g = self.ctx; g.save(); zoneTransform(g, z); g.strokeStyle = '#ff0040'; g.lineWidth = 3; g.strokeRect(-z.w / 2, -z.h / 2, z.w, z.h); g.restore();
      }
      return self.canvas;
    });
  };

  // шрифты для надписи, если логотипа нет (файлы в fonts/, подключены в fonts.css)
  Mockup.FONTS = [
    { name: 'Строгий',    family: 'Mulish',           weight: 900 },
    { name: 'Классика',   family: 'Playfair Display', weight: 700 },
    { name: 'Рукописный', family: 'Caveat',           weight: 700 },
    { name: 'Широкий',    family: 'Unbounded',        weight: 700 },
    { name: 'Узкий',      family: 'Oswald',           weight: 600 },
    { name: 'Мягкий',     family: 'Comfortaa',        weight: 700 },
    // 06.10: Маша: «два-три необычных: ультраширокий и какой-то»
    { name: 'Ультра',     family: 'Science Gothic',   weight: 900 },   // ширина 200%: статичная копия с Google Fonts
    { name: 'Ретро',      family: 'Lobster',          weight: 400 }
  ];
  // главный цвет логотипа: самый частый насыщенный оттенок; если логотип чёрно-белый, его тёмный цвет
  Mockup.logoColor = function (L) {
    var d = L.getContext('2d').getImageData(0, 0, L.width, L.height).data, bins = [], dark = [0, 0, 0, 0], all = 0;
    for (var i = 0; i < d.length; i += 16) {
      if (d[i + 3] < 160) continue;
      var r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); all++;
      if (mx < 1 || (mx - mn) / mx < 0.35 || mx < 50) { if (mx < 120) { dark[0] += r; dark[1] += g; dark[2] += b; dark[3]++; } continue; }
      var h = mx === r ? ((g - b) / (mx - mn) + 6) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
      var k = Math.floor(h * 4) % 24;
      bins[k] = bins[k] || [0, 0, 0, 0]; bins[k][0] += r; bins[k][1] += g; bins[k][2] += b; bins[k][3]++;
    }
    var best = null; bins.forEach(function (x) { if (x && (!best || x[3] > best[3])) best = x; });
    var c = best && best[3] > all * 0.08 ? best : dark[3] ? dark : null;
    if (!c) return null;
    function h2(v) { v = Math.round(v / c[3]); return (v < 16 ? '0' : '') + v.toString(16); }
    return '#' + h2(c[0]) + h2(c[1]) + h2(c[2]);
  };
  // сочетания под цвет логотипа: логотип на белом и чёрном, белым по ткани цвета бренда, тон в тон на светлом оттенке
  Mockup.brandPairs = function (hex) {
    var B = hexToRgb(hex), lum = 0.299 * B[0] + 0.587 * B[1] + 0.114 * B[2];
    function nearest(t, skip) {
      var best = null, bd = 1e9;
      COLORS.forEach(function (c) {
        if (!c.hex || skip.indexOf(c.id) >= 0) return;
        var x = hexToRgb(c.hex), dd = (x[0] - t[0]) * (x[0] - t[0]) + (x[1] - t[1]) * (x[1] - t[1]) + (x[2] - t[2]) * (x[2] - t[2]);
        if (dd < bd) { bd = dd; best = c.id; }
      });
      return best;
    }
    var own = nearest(B, ['white', 'black']), tint = nearest(mix(B, [255, 255, 255], 0.62), ['white', own]);
    var ownLum = (function (c) { var x = hexToRgb(COLORS.filter(function (y) { return y.id === c; })[0].hex); return 0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]; })(own);
    return [
      { color: 'white', ink: hex, inkName: 'цветом логотипа' },
      { color: own, ink: ownLum > 150 ? '#111111' : '#ffffff', inkName: ownLum > 150 ? 'чёрным' : 'белым' },
      lum > 70 ? { color: 'black', ink: hex, inkName: 'цветом логотипа' } : { color: 'beige', ink: hex, inkName: 'цветом логотипа' },
      { color: tint, ink: hex, inkName: 'цветом логотипа' }
    ];
  };

  // готовые сочетания «ткань + цвет нанесения», как пары цветов у Николы Иронова (Студия Лебедева)
  Mockup.PAIRS = [   // 07.10: Маша: «покреативнее, покислотнее, градиенты»
    { color: 'lime',     ink: '#6c2bd9', inkName: 'фиолетовым' },
    { color: 'fuchsia',  ink: '#c6f400', inkName: 'кислотным лаймом' },
    { color: 'g-sunset', ink: '#ffffff', inkName: 'белым' },
    { color: 'electric', ink: '#c6f400', inkName: 'кислотным лаймом' },
    { color: 'g-aurora', ink: '#ffffff', inkName: 'белым' },
    { color: 'black',    ink: '#ff2d95', inkName: 'неоновой фуксией' },
    { color: 'orange',   ink: '#2b4cff', inkName: 'электриком' },
    { color: 'g-berry',  ink: '#c6f400', inkName: 'кислотным лаймом' }
  ];
  Mockup.fontCss = fontCss;
  Mockup.ITEMS = ITEMS;
  Mockup.SHORT = { kreslo: 'Кресло-мешок', podushka: 'Подушка', koktejl: 'Коктейльный стол', stol: 'Стол', krug: 'Круглый наперон', svis: 'Наперон со свисом', shezlong: 'Шезлонг', pled: 'Плед' };
  Mockup.COLORS = COLORS;
  Mockup.loadImage = loadImage;
  window.Mockup = Mockup;
})();

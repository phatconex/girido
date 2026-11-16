/* Giri Garden — drawing and motion helpers. No dependencies. */
  var STAGES = ['Hạt', 'Mầm', 'Cây non', 'Cây lớn', 'Ra hoa', 'Ra trái'];
  var FEELINGS = ['Tồi tệ', 'Xấu', 'Tạm', 'Tốt', 'Tuyệt'];
  var MOODS = { happy: 'Giri đang lim dim cười', cheer: 'Giri đang nhảy ăn mừng', sleepy: 'Giri đang ngủ gật', sad: 'Giri đang buồn', munch: 'Giri đang nhai lá' };
  var KINDS = { tron: 'Cây tán tròn', thong: 'Cây thông', bach: 'Cây bách', giot: 'Cây giọt nước', dua: 'Cây dừa', xuongrong: 'Xương rồng', bui: 'Bụi cây', tan: 'Cây bàng', tre: 'Tre', sen: 'Hoa sen', huongduong: 'Hướng dương', mai: 'Mai vàng', dao: 'Hoa đào', phuong: 'Phượng vĩ', xoai: 'Cây xoài', cam: 'Cây cam', chuoi: 'Cây chuối', dudu: 'Đu đủ', thanhlong: 'Thanh long' };
  var GROUPS = [
    { key: 'xanh', name: 'Cây xanh', kinds: ['tron', 'thong', 'bach', 'giot', 'bui', 'tan', 'tre', 'xuongrong'] },
    { key: 'hoa', name: 'Hoa', kinds: ['sen', 'huongduong', 'mai', 'dao', 'phuong'] },
    { key: 'trai', name: 'Cây ăn trái', kinds: ['dua', 'xoai', 'cam', 'chuoi', 'dudu', 'thanhlong'] }
  ];

  /* mascot(mood, size): Giri as nested CSS blocks. The neck is five nested segments, so it bends like a noodle. */
  function mascot(mood, size) {
    mood = MOODS[mood] ? mood : 'happy';
    size = size || 120;
    var s = function (cls, inner) { return '<span class="gg-giri__' + cls + '">' + (inner || '') + '</span>'; };
    var eye = { happy: 'eye', cheer: 'eye gg-giri__eye--up', sleepy: 'eye', sad: 'eye gg-giri__eye--open', munch: 'eye gg-giri__eye--open' }[mood];
    var mouth = { happy: 'mouth', cheer: 'mouth gg-giri__mouth--open', sleepy: 'mouth gg-giri__mouth--flat', sad: 'mouth gg-giri__mouth--down', munch: 'mouth gg-giri__mouth--chew' }[mood];
    var fx = { sleepy: s('z', 'z') + s('z gg-giri__z--2', 'z'), sad: s('tear'), munch: s('leaf') }[mood] || '';
    var inner = s('ear') + s('head', s('horn gg-giri__horn--1') + s('horn gg-giri__horn--2') + s(eye) + s('blush') + s('nose') + s(mouth) + fx);
    for (var i = 5; i >= 1; i--) {
      inner = '<span class="gg-giri__seg' + (i % 2 ? '' : ' gg-giri__seg--alt') + (i === 1 ? ' gg-giri__seg--root' : '') +
        '" style="animation-delay:calc(var(--speed) * -' + (0.12 * i).toFixed(2) + ')">' + inner + '</span>';
    }
    return '<span class="gg-giri gg-giri--' + mood + '" style="font-size:' + (size / 14).toFixed(2) + 'px" role="img" aria-label="' + MOODS[mood] + '">' +
      s('all', s('shadow') + s('tail') + s('leg gg-giri__leg--2') + s('leg gg-giri__leg--4') + s('body') + s('leg gg-giri__leg--1') + s('leg gg-giri__leg--3') + inner) + '</span>';
  }

  /* two-tone primitives: the whole shape in class a, its right half again in class b */
  function disc(cx, cy, r, a, b) {
    return '<circle class="gg-t-' + a + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/><path class="gg-t-' + b + '" d="M' + cx + ' ' + (cy - r) + ' a' + r + ' ' + r + ' 0 0 1 0 ' + 2 * r + 'z"/>';
  }
  function pill(cx, top, w, h, a, b) {
    var r = w / 2;
    return '<rect class="gg-t-' + a + '" x="' + (cx - r) + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="' + r + '"/>' +
      '<path class="gg-t-' + b + '" d="M' + cx + ' ' + top + ' a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + ' v' + (h - 2 * r) + ' a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r + 'z"/>';
  }
  /* a rounded tier centred on x = 60 */
  function tier(top, w, h, r, a, b) {
    var half = w / 2 - r;
    return '<rect class="gg-t-' + a + '" x="' + (60 - w / 2) + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="' + r + '"/>' +
      '<path class="gg-t-' + b + '" d="M60 ' + top + ' h' + half + ' a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + ' v' + (h - 2 * r) + ' a' + r + ' ' + r + ' 0 0 1 ' + (-r) + ' ' + r + ' h' + (-half) + 'z"/>';
  }
  /* a pine layer with a zigzag hem; teeth must be even so the middle lands on a point */
  function zig(top, w, h, teeth, a, b) {
    var n = teeth * 2, y = top + h, full = 'M60 ' + top, right = 'M60 ' + top, k, px, py;
    for (k = 0; k <= n; k++) {
      px = 60 + w / 2 - k * (w / n); py = y - (k % 2 ? 8 : 0);
      full += ' L' + px.toFixed(1) + ' ' + py;
      if (k <= n / 2) right += ' L' + px.toFixed(1) + ' ' + py;
    }
    return '<path class="gg-t-' + a + '" d="' + full + 'z"/><path class="gg-t-' + b + '" d="' + right + 'z"/>';
  }
  function dome(cx, cy, rx, ry, a, b) {
    return '<path class="gg-t-' + a + '" d="M' + (cx - rx) + ' ' + cy + ' a' + rx + ' ' + ry + ' 0 0 1 ' + 2 * rx + ' 0z"/><path class="gg-t-' + b + '" d="M' + cx + ' ' + (cy - ry) + ' a' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + ry + ' h' + (-rx) + 'z"/>';
  }
  function trunk(top, w) {
    return '<rect class="gg-t-bark" x="' + (60 - w / 2) + '" y="' + top + '" width="' + w + '" height="' + (131 - top) + '" rx="' + w / 2 + '"/>' +
      '<rect class="gg-t-barkdark" x="60" y="' + (top + w / 2) + '" width="' + w / 2 + '" height="' + (131 - top - w / 2) + '"/>';
  }
  /* small details: a lit leaf clump, a shaded clump */
  function hi(x, y, rx, ry, rot) { return '<ellipse class="gg-t-hi" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (rot || 0) + ' ' + x + ' ' + y + ')"/>'; }
  function lo(x, y, r) { return '<circle class="gg-t-lo" cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; }
  function frond(ex, ey, ax, ay, bx, by, cls, flip) {
    var m = function (x) { return flip ? 120 - x : x; };
    return '<path class="gg-t-' + cls + '" d="M60 52 Q' + m(ax) + ' ' + ay + ' ' + m(ex) + ' ' + ey + ' Q' + m(bx) + ' ' + by + ' 60 52z"/>';
  }
  function fronds(flip, c) {
    return frond(18, 86, 26, 44, 42, 60, c[0], flip) + frond(9, 62, 28, 30, 36, 50, c[1], flip) + frond(16, 32, 38, 26, 40, 42, c[2], flip) + frond(42, 11, 53, 28, 47, 36, c[3], flip);
  }

  /* each kind: the full tree, where its flowers and fruit sit, and its fruit colour */
  var TREES = {
    tron: { draw: function () {
      return '<path class="gg-t-barkline" d="M60 102 L43 78 M60 96 L80 74"/>' + trunk(70, 9) +
        disc(60, 44, 30, 'mid', 'dark') + disc(38, 68, 14, 'light', 'mid') + disc(84, 64, 12, 'lime', 'light') +
        hi(45, 30, 7, 3, -35) + hi(39, 46, 5, 2.5, -55) + hi(55, 21, 4, 2, -15) + hi(33, 64, 4, 2, -40) + lo(75, 33, 4) + lo(81, 48, 3) + lo(70, 60, 3.5);
    }, spots: [[48, 36], [72, 42], [58, 58], [84, 64], [38, 70]], fruit: 'red' },
    thong: { draw: function () {
      return trunk(102, 8) + zig(58, 76, 50, 6, 'mid', 'dark') + zig(35, 60, 44, 6, 'light', 'mid') + zig(12, 44, 40, 4, 'lime', 'light') +
        '<path class="gg-t-barkline" d="M64 118 h7 v-5" style="stroke-width:3"/>';
    }, spots: [[60, 40], [50, 64], [70, 68], [44, 92], [76, 94]], fruit: 'brown' },
    bach: { draw: function () {
      return trunk(86, 8) + tier(66, 58, 28, 13, 'mid', 'dark') + tier(48, 48, 26, 12, 'light', 'mid') + tier(31, 36, 24, 11, 'mid', 'dark') + tier(15, 24, 22, 10, 'lime', 'light') +
        hi(43, 75, 7, 2.5, 0) + hi(46, 56, 6, 2.2, 0) + hi(50, 39, 4.5, 2, 0) + hi(55, 22, 3, 1.6, 0);
    }, spots: [[52, 24], [68, 44], [48, 60], [74, 78], [56, 84]], fruit: 'pink' },
    giot: { draw: function () {
      return trunk(86, 8) + '<path class="gg-t-light" d="M60 12 C88 52 90 88 60 94 C30 88 32 52 60 12z"/><path class="gg-t-dark" d="M60 12 C88 52 90 88 60 94z"/>' +
        '<path class="gg-t-vein" d="M60 30 V90 M60 48 L50 40 M60 60 L46 50 M60 73 L48 64 M60 54 L70 46 M60 66 L73 57 M60 79 L71 71"/>' + hi(44, 68, 2.5, 7, 8);
    }, spots: [[60, 40], [48, 58], [72, 62], [54, 80], [68, 82]], fruit: 'pink' },
    dua: { draw: function () {
      return '<path class="gg-t-barkline" style="stroke-width:7" d="M60 131 Q53 92 60 52"/><path class="gg-t-ring" d="M53.6 118 h6.4 M53.4 104 h6.4 M54.2 90 h6.4 M55.6 76 h6.4 M57.4 63 h6"/>' +
        fronds(false, ['dark', 'mid', 'light', 'lime']) + fronds(true, ['dark', 'dark', 'mid', 'light']) + '<circle class="gg-t-barkdark" cx="60" cy="52" r="4.5"/>';
    }, spots: [[54, 58], [66, 58], [60, 63]], fruit: 'brown' },
    xuongrong: { draw: function () {
      return '<path class="gg-t-arm" d="M48 88 h-12 v-16"/><path class="gg-t-arm gg-t-arm--dark" d="M72 76 h12 v-18"/>' + pill(60, 40, 26, 72, 'light', 'mid') +
        '<path class="gg-t-vein" d="M54 50 V108 M66 50 V108 M36 76 v8 M84 62 v10 M47 60 h-3 M47 100 h-3 M73 66 h3 M73 96 h3 M31 78 h-2.5 M89 64 h2.5"/>' +
        '<path class="gg-t-pot" d="M43 112 h34 l-4 20 h-26z"/><rect class="gg-t-potrim" x="40" y="106" width="40" height="8" rx="3"/>';
    }, spots: [[60, 40], [36, 70], [84, 56]], fruit: 'pink' },
    bui: { draw: function () {
      return disc(36, 114, 16, 'mid', 'dark') + disc(84, 112, 18, 'mid', 'dark') + disc(60, 100, 25, 'light', 'mid') + disc(44, 110, 12, 'lime', 'light') +
        hi(50, 86, 6, 2.5, -30) + hi(40, 104, 4, 2, -40) + lo(72, 96, 3.5) + lo(88, 108, 3) + lo(68, 112, 3);
    }, spots: [[54, 90], [72, 100], [40, 108], [86, 106], [60, 114]], fruit: 'blue' },
    tan: { draw: function () {
      return '<path class="gg-t-barkline" d="M60 100 L41 74 M60 94 L81 66"/>' + trunk(60, 9) +
        dome(40, 76, 25, 19, 'mid', 'dark') + dome(83, 68, 23, 17, 'light', 'mid') + dome(60, 54, 31, 25, 'lime', 'light') +
        hi(47, 40, 8, 3, -20) + hi(30, 68, 5, 2, -20) + hi(74, 60, 4, 2, -15) + lo(74, 44, 3.5) + lo(52, 70, 3) + lo(94, 62, 3);
    }, spots: [[50, 42], [68, 38], [60, 48], [36, 68], [86, 60]], fruit: 'orange' },
    tre: { draw: function () {
      var s = '', lf = function (x, y, dir, cls) { return '<path class="gg-t-' + cls + '" d="M' + x + ' ' + y + ' q' + dir * 10 + ' -10 ' + dir * 22 + ' -4 q' + -dir * 10 + ' 8 ' + -dir * 22 + ' 4z"/>'; };
      [[46, 26], [60, 14], [74, 36]].forEach(function (c, i) {
        s += '<path class="gg-t-culm' + (i === 2 ? ' gg-t-culm--dark' : '') + '" d="M' + c[0] + ' 131 V' + c[1] + '"/>';
        for (var y = 112; y > c[1] + 6; y -= 22) s += '<path class="gg-t-vein" style="opacity:1" d="M' + (c[0] - 3) + ' ' + y + ' h6"/>';
      });
      return s + lf(46, 48, -1, 'lime') + lf(46, 72, -1, 'light') + lf(60, 36, 1, 'light') + lf(60, 60, -1, 'mid') + lf(74, 58, 1, 'mid') + lf(74, 82, 1, 'dark') + lf(60, 22, 1, 'lime') + lf(46, 32, 1, 'light');
    }, spots: [], fruit: null },
    sen: { draw: function (st) {
      var p = function (rot, cls) { return '<path class="gg-t-bloom--' + cls + '" transform="rotate(' + rot + ' 60 98)" d="M60 62 Q73 82 60 98 Q47 82 60 62z"/>'; };
      var bloom = st >= 4 ? p(-64, 'pink') + p(64, 'pink') + p(-33, 'cream') + p(33, 'cream') + p(0, 'pink') + '<circle class="gg-t-pollen" cx="60" cy="93" r="3.5"/>' : p(0, 'pink');
      return '<path class="gg-t-stem" d="M60 130 V96 M42 130 Q40 118 31 114 M80 130 Q82 122 91 118"/>' +
        '<ellipse class="gg-t-mid" cx="29" cy="112" rx="16" ry="6.5"/><path class="gg-t-dark" d="M29 105.5 a16 6.5 0 0 1 0 13z"/>' +
        '<ellipse class="gg-t-light" cx="93" cy="116" rx="14" ry="5.5"/><path class="gg-t-mid" d="M93 110.5 a14 5.5 0 0 1 0 11z"/>' + bloom;
    }, spots: [], fruit: null },
    huongduong: { draw: function (st) {
      var head = '', i;
      if (st >= 4) {
        for (i = 0; i < 12; i++) head += '<ellipse class="' + (i % 2 ? 'gg-t-pollen' : 'gg-t-fruit--orange') + '" cx="60" cy="26" rx="5.5" ry="11" transform="rotate(' + i * 30 + ' 60 46)"/>';
        head += '<circle class="gg-t-bark" cx="60" cy="46" r="12"/><circle class="gg-t-barkdark" cx="60" cy="46" r="7"/>';
      } else head = disc(60, 50, 10, 'light', 'mid') + '<circle class="gg-t-pollen" cx="60" cy="43" r="3"/>';
      return '<path class="gg-t-stem" style="stroke-width:5" d="M60 130 V56"/><path class="gg-t-light" d="M60 104 q-26 -4 -28 -24 q24 2 28 24z"/><path class="gg-t-dark" d="M60 90 q26 -4 28 -24 q-24 2 -28 24z"/>' + head;
    }, spots: [], fruit: null },
    mai: { draw: function () { return blossomTree(false); }, spots: [[36, 54], [86, 52], [22, 76], [100, 80], [60, 58], [47, 72], [74, 70], [60, 86]], bloom: 'yellow', fruit: null },
    dao: { draw: function () { return blossomTree(true); }, spots: [[84, 54], [34, 52], [98, 76], [20, 80], [60, 58], [73, 72], [46, 70], [60, 86], [90, 66]], bloom: 'pink', fruit: null },
    phuong: { draw: function () {
      return '<path class="gg-t-barkline" d="M60 106 L36 80 M60 100 L86 76"/>' + trunk(68, 9) + dome(33, 80, 27, 15, 'mid', 'dark') + dome(89, 76, 27, 15, 'mid', 'dark') + dome(60, 64, 42, 22, 'light', 'mid') +
        hi(42, 52, 8, 2.5, -15) + hi(24, 74, 5, 2, -15) + lo(84, 58, 3.5) + lo(100, 72, 3);
    }, spots: [[40, 50], [57, 46], [74, 49], [88, 58], [30, 60], [20, 72], [100, 68], [60, 58]], bloom: 'red', fruit: null },
    xoai: { draw: function () {
      return trunk(84, 9) + '<ellipse class="gg-t-mid" cx="60" cy="54" rx="38" ry="34"/><path class="gg-t-dark" d="M60 20 a38 34 0 0 1 0 68z"/>' +
        hi(40, 36, 8, 3, -40) + hi(32, 54, 7, 2.5, -60) + hi(50, 26, 6, 2.2, -20) + hi(44, 70, 6, 2.2, -30) + lo(78, 38, 4) + lo(86, 56, 3.5) + lo(72, 72, 4);
    }, spots: [[38, 76], [54, 84], [70, 82], [86, 70], [28, 60]], fruit: 'orange', oval: true },
    cam: { draw: function () {
      return trunk(90, 8) + disc(60, 60, 34, 'mid', 'dark') + hi(42, 42, 8, 3, -40) + hi(34, 60, 6, 2.5, -60) + hi(52, 32, 5, 2, -20) + lo(78, 44, 4) + lo(84, 64, 3.5) + lo(70, 82, 3.5);
    }, spots: [[44, 50], [70, 46], [56, 70], [80, 72], [38, 74], [62, 34]], fruit: 'orange' },
    chuoi: { draw: function () {
      var a = [-72, 72, -38, 38, 0], c = ['dark', 'dark', 'mid', 'mid', 'light'], s = pill(60, 70, 14, 62, 'lime', 'light');
      a.forEach(function (r, i) { s += '<g transform="rotate(' + r + ' 60 78)"><rect class="gg-t-' + c[i] + '" x="52" y="18" width="16" height="62" rx="8"/><path class="gg-t-vein" d="M60 24 V78"/></g>'; });
      return s;
    }, spots: [[73, 92], [79, 97], [72, 101], [78, 106]], fruit: 'yellow', oval: true },
    dudu: { draw: function () {
      var s = '<path class="gg-t-barkline" style="stroke-width:7" d="M60 131 V50"/><path class="gg-t-ring" d="M56.5 118 h7 M56.5 104 h7 M56.5 90 h7"/>';
      [[30, 66], [90, 66], [24, 44], [96, 44], [34, 22], [86, 22], [60, 12]].forEach(function (p) {
        s += '<path class="gg-t-stem" style="stroke-width:2.5" d="M60 50 L' + p[0] + ' ' + p[1] + '"/>' + disc(p[0], p[1], 10, 'light', 'mid');
      });
      return s + disc(60, 48, 7, 'lime', 'light');
    }, spots: [[53, 62], [67, 62], [55, 74], [66, 75]], fruit: 'orange', oval: true },
    thanhlong: { draw: function () {
      return trunk(58, 8) + '<path class="gg-t-arm" style="stroke-width:8" d="M60 58 Q34 44 30 82 M60 58 Q46 32 38 60"/><path class="gg-t-arm gg-t-arm--dark" style="stroke-width:8" d="M60 58 Q86 44 90 82 M60 58 Q76 30 84 62"/>' + disc(60, 54, 8, 'lime', 'light');
    }, spots: [[30, 87], [90, 87], [38, 65], [84, 67]], fruit: 'magenta', oval: true }
  };

  /* ---- tán cây méo mó: mỗi loại một dáng lệch, bóng đổ ở góc dưới phải, cành lộ dưới tán, lá con chĩa ra ---- */
  var uid = 0;
  function canopy(d, base, shade) {
    var id = 'ggc' + (++uid);
    return '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><path class="gg-t-' + shade + '" d="' + d + '"/>' +
      '<g clip-path="url(#' + id + ')"><path class="gg-t-' + base + '" style="opacity:.55" d="' + d + '" transform="translate(-3 -4)"/><path class="gg-t-' + base + '" d="' + d + '" transform="translate(-9 -10)"/></g>';
  }
  function blob(d, cls) { return '<path class="gg-t-' + cls + '" d="' + d + '"/>'; }
  function sprig(x, y, rot, a, b) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><path class="gg-t-' + (a || 'lime') + '" d="M0 0 q-7 -3 -8 -12 q7 2 8 12z"/><path class="gg-t-' + (b || 'light') + '" d="M0 0 q7 -3 8 -11 q-7 2 -8 11z"/></g>';
  }
  function trunkC(top, lean, w) {
    w = w || 9; var tx = 60 + lean, my = (131 + top) / 2;
    return '<path class="gg-t-bark" d="M' + (60 - w / 2) + ' 131 Q' + (60 - w / 2 + lean * 0.2) + ' ' + my + ' ' + (tx - w / 3) + ' ' + top + ' L' + (tx + w / 3) + ' ' + top + ' Q' + (60 + w / 2 + lean * 0.5) + ' ' + my + ' ' + (60 + w / 2) + ' 131z"/>';
  }
  function twig(d) { return '<path class="gg-t-barkline" style="stroke-width:4" d="' + d + '"/>'; }
  function restyle(kind, draw, spots) { TREES[kind].draw = draw; TREES[kind].spots = spots; }
  restyle('tron', function () {
    return trunkC(80, 1) + canopy('M60 14 C84 11 101 31 98 55 C96 79 80 93 57 90 C35 88 19 71 22 49 C25 27 38 16 60 14z', 'mid', 'dark') + sprig(31, 30, -50) + sprig(97, 62, 70) + sprig(58, 52, 15, 'lime', 'dark') + sprig(40, 84, -130);
  }, [[44, 34], [72, 30], [58, 60], [80, 62], [38, 60]]);
  restyle('thong', function () {
    return trunkC(88, 0) + canopy('M60 9 C67 9 71 16 75 24 L101 78 C106 89 99 96 88 95 L33 96 C22 96 15 88 20 77 L45 24 C49 16 53 9 60 9z', 'mid', 'dark') + sprig(40, 44, -60) + sprig(88, 62, 55) + sprig(60, 60, 10, 'lime', 'dark') + sprig(28, 92, -110) + sprig(94, 94, 120);
  }, [[60, 34], [48, 58], [72, 60], [40, 82], [80, 80]]);
  restyle('cam', function () {
    return trunkC(88, 0) + canopy('M29 27 C44 20 78 21 93 26 C100 28 102 35 100 42 L97 83 C96 92 90 96 83 95 L37 96 C30 96 24 92 24 83 L20 41 C19 34 23 29 29 27z', 'light', 'mid') + sprig(44, 22, -15) + sprig(74, 22, 20) + sprig(21, 60, -85) + sprig(100, 70, 85) + sprig(58, 58, 10, 'lime', 'mid');
  }, [[40, 40], [62, 36], [82, 46], [46, 70], [76, 74]]);
  restyle('bach', function () {
    return trunkC(88, 3, 8) + canopy('M55 9 C75 6 86 26 83 50 C82 73 77 94 60 96 C41 98 34 74 37 49 C40 27 41 12 55 9z', 'light', 'mid') + sprig(40, 36, -70) + sprig(84, 58, 75) + sprig(58, 56, 8, 'lime', 'mid');
  }, [[58, 26], [68, 46], [52, 62], [66, 78], [56, 86]]);
  restyle('giot', function () {
    return trunkC(86, -7) + twig('M58 110 Q68 102 76 96') + canopy('M51 16 C77 6 98 28 93 56 C90 72 97 84 84 93 C67 104 39 97 33 78 C27 61 29 25 51 16z', 'mid', 'dark') + sprig(90, 26, 40) + sprig(31, 52, -80) + sprig(94, 76, 95) + sprig(60, 58, 12, 'lime', 'dark');
  }, [[56, 30], [78, 44], [48, 58], [70, 72], [52, 82]]);
  restyle('xoai', function () {
    return blob('M22 55 C40 48 84 46 102 53 C98 75 79 84 60 84 C41 84 27 75 22 55z', 'dark') + trunkC(58, 3) + twig('M60 100 Q48 88 37 74 M62 94 Q75 84 86 72 M61 84 L60 68') +
      canopy('M30 28 C44 7 80 7 93 26 C107 28 113 44 105 55 C98 63 80 58 62 60 C44 62 26 67 17 55 C9 43 16 31 30 28z', 'mid', 'dark') + sprig(22, 34, -55) + sprig(104, 34, 50) + sprig(60, 36, 10, 'lime', 'dark');
  }, [[36, 40], [58, 24], [82, 36], [98, 46], [26, 50]]);
  restyle('tan', function () {
    return blob('M28 48 C44 44 80 44 96 49 C93 70 77 79 60 79 C43 79 31 69 28 48z', 'mid') + trunkC(52, -5) + twig('M56 96 Q46 82 38 68 M58 88 Q72 78 82 66') +
      canopy('M21 46 C20 22 43 9 62 11 C85 11 103 26 101 46 C100 57 90 58 80 54 C70 50 60 58 48 56 C36 54 22 59 21 46z', 'lime', 'light') + sprig(34, 18, -35, 'light', 'mid') + sprig(96, 30, 55, 'light', 'mid');
  }, [[40, 30], [62, 24], [84, 34], [50, 44], [90, 44]]);
  restyle('phuong', function () {
    return blob('M18 54 C40 48 84 48 104 54 C100 74 80 82 60 82 C40 82 22 74 18 54z', 'dark') + trunkC(54, 2) + twig('M60 100 Q46 86 34 74 M61 92 Q76 82 88 72') +
      canopy('M11 50 C9 31 30 19 46 26 C56 13 78 13 87 26 C103 21 115 36 109 50 C105 61 90 58 78 56 C66 54 54 61 42 58 C30 56 13 63 11 50z', 'mid', 'dark') + sprig(16, 34, -60) + sprig(108, 34, 55);
  }, [[28, 40], [48, 34], [66, 26], [88, 36], [100, 46], [40, 50], [76, 46], [58, 42]]);
  restyle('bui', function () {
    return canopy('M22 118 C11 104 22 87 38 90 C42 73 67 69 77 84 C93 77 107 92 100 108 C109 118 100 131 88 130 L32 130 C21 131 17 125 22 118z', 'light', 'mid') + sprig(30, 92, -45, 'lime', 'mid') + sprig(92, 86, 40, 'lime', 'mid') + sprig(60, 104, 8, 'lime', 'mid');
  }, [[40, 104], [60, 90], [80, 100], [92, 116], [50, 118]]);

  /* các khối dùng chung cho hoa, tre, xương rồng và cây họ dừa */
  function puff(x, y, r, a, b) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (r / 10) + ')">' + canopy('M0 -10 C7 -11 11 -4 10 2 C9 8 4 11 -2 10 C-8 9 -11 3 -10 -3 C-9 -8 -5 -10 0 -10z', a, b) + '</g>'; }
  function leafBlob(x, y, len, wid, rot, a, b, rib) {
    var d = 'M0 0 C' + wid + ' ' + (-len * 0.28) + ' ' + (wid * 1.15) + ' ' + (-len * 0.8) + ' ' + (wid * 0.15) + ' ' + (-len) + ' C' + (-wid * 0.85) + ' ' + (-len * 0.76) + ' ' + (-wid) + ' ' + (-len * 0.24) + ' 0 0z';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' + canopy(d, a, b) + (rib ? '<path class="gg-t-vein" d="M0 -5 Q' + (wid * 0.2) + ' ' + (-len * 0.5) + ' ' + (wid * 0.12) + ' ' + (-len + 7) + '"/>' : '') + '</g>';
  }
  function blossomTree(flip) {
    var m = function (x) { return flip ? 120 - x : x; };
    var q = function (p) { var d = 'M' + m(p[0][0]) + ' ' + p[0][1], i; for (i = 1; i < p.length; i += 2) d += ' Q' + m(p[i][0]) + ' ' + p[i][1] + ' ' + m(p[i + 1][0]) + ' ' + p[i + 1][1]; return d; };
    var s = '<path class="gg-t-barkline" style="stroke-width:5" d="' + q([[60, 106], [46, 94], [42, 80], [41, 66], [34, 56]]) + ' ' + q([[61, 110], [77, 98], [80, 84], [86, 70], [88, 54]]) + ' ' + q([[42, 81], [32, 82], [23, 77]]) + ' ' + q([[80, 85], [92, 86], [100, 81]]) + ' ' + q([[60, 106], [65, 82], [58, 60]]) + '"/>' + trunkC(100, flip ? 3 : -3, 9);
    [[34, 54, 9, 'lime', 'light'], [88, 52, 10, 'light', 'mid'], [22, 76, 7, 'light', 'mid'], [100, 80, 8, 'lime', 'light'], [58, 58, 8, 'light', 'mid']].forEach(function (p) { s += puff(m(p[0]), p[1], p[2], p[3], p[4]); });
    return s + sprig(m(70), 72, flip ? -40 : 40) + sprig(m(48), 92, flip ? 50 : -50);
  }
  restyle('sen', function (st) {
    var pad = function (x, y, k, a, b) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' + canopy('M-18 0 C-18 -9 -4 -10 6 -8 C16 -7 20 -2 18 3 C16 9 2 10 -8 8 C-15 7 -18 4 -18 0z', a, b) + '<path class="gg-t-ground" d="M2 0 L17 -8 L20 -1z"/></g>'; };
    var petal = function (rot, len, cls) { return '<path class="gg-t-bloom--' + cls + '" transform="rotate(' + rot + ' 60 98)" d="M60 98 C' + (60 + len * 0.38) + ' ' + (98 - len * 0.3) + ' ' + (60 + len * 0.3) + ' ' + (98 - len * 0.85) + ' ' + (60 + len * 0.06) + ' ' + (98 - len) + ' C' + (60 - len * 0.26) + ' ' + (98 - len * 0.8) + ' ' + (60 - len * 0.4) + ' ' + (98 - len * 0.3) + ' 60 98z"/>'; };
    var bloom = st >= 4 ? petal(-72, 30, 'pink') + petal(64, 34, 'pink') + petal(-38, 37, 'cream') + petal(31, 39, 'cream') + petal(-5, 41, 'pink') + '<circle class="gg-t-pollen" cx="59" cy="92" r="4"/>' : petal(-5, 26, 'pink');
    return '<path class="gg-t-stem" d="M60 130 Q53 112 60 97 M40 130 Q43 120 32 115 M80 130 Q78 124 90 120"/>' + pad(30, 114, 1, 'mid', 'dark') + pad(93, 119, 0.8, 'light', 'mid') + bloom;
  }, []);
  restyle('huongduong', function (st) {
    var head = '', i;
    if (st >= 4) {
      for (i = 0; i < 12; i++) head += '<ellipse class="' + (i % 2 ? 'gg-t-pollen' : 'gg-t-fruit--orange') + '" cx="64" cy="' + (i % 3 ? 24 : 21) + '" rx="' + (i % 2 ? 5 : 6) + '" ry="' + (i % 3 ? 11 : 14) + '" transform="rotate(' + (i * 30 + (i % 2 ? 4 : -3)) + ' 64 44)"/>';
      head += canopy('M64 31 C72 30 78 37 77 45 C76 53 70 58 62 57 C54 56 50 50 51 43 C52 35 57 31 64 31z', 'bark', 'barkdark');
    } else head = puff(64, 48, 11, 'light', 'mid') + '<circle class="gg-t-pollen" cx="62" cy="41" r="3"/>';
    return '<path class="gg-t-stem" style="stroke-width:5" d="M60 130 Q49 100 63 58"/>' + leafBlob(55, 108, 28, 10, -72, 'light', 'mid', 1) + leafBlob(56, 90, 25, 9, 64, 'mid', 'dark', 1) + '<g transform="rotate(8 64 44)">' + head + '</g>';
  }, []);
  restyle('tre', function () {
    var s = '', pt = function (p, t) { var u = 1 - t; return [u * u * p[0] + 2 * u * t * p[2] + t * t * p[4], u * u * p[1] + 2 * u * t * p[3] + t * t * p[5]]; };
    [[46, 131, 41, 80, 49, 26], [60, 131, 65, 70, 57, 12], [74, 131, 79, 90, 71, 38]].forEach(function (c, i) {
      s += '<path class="gg-t-culm' + (i === 2 ? ' gg-t-culm--dark' : '') + '" d="M' + c[0] + ' ' + c[1] + ' Q' + c[2] + ' ' + c[3] + ' ' + c[4] + ' ' + c[5] + '"/>';
      [0.24, 0.5, 0.76].forEach(function (t, k) {
        var p = pt(c, t); s += '<path class="gg-t-vein" style="opacity:1" d="M' + (p[0] - 3.5).toFixed(1) + ' ' + p[1].toFixed(1) + ' h7"/>';
        if ((k + i) % 2 === 0) s += '<g transform="translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') scale(1.5)">' + sprig(0, 0, i === 1 ? -70 : 70, i === 2 ? 'mid' : 'lime', 'light') + '</g>';
      });
    });
    return s + '<g transform="scale(1.4)">' + sprig(40.6, 9, 20) + sprig(35, 19, -30) + '</g>';
  }, []);
  restyle('xuongrong', function () {
    return '<path class="gg-t-arm" d="M48 92 Q31 92 33 70"/><path class="gg-t-arm gg-t-arm--dark" d="M72 78 Q89 78 87 54"/>' +
      canopy('M60 37 C70 36 76 46 75 58 C74 80 77 100 73 112 L47 112 C43 98 46 80 45 60 C45 46 50 38 60 37z', 'light', 'mid') +
      '<path class="gg-t-vein" d="M55 50 Q52 80 55 108 M66 50 Q69 80 66 108 M33 76 v8 M87 60 v10 M46 62 h-3 M46 100 h-3 M74 68 h3 M74 96 h3"/>' +
      '<path class="gg-t-pot" d="M41 108 C50 105 70 105 80 108 L76 131 C66 134 54 134 45 131z"/><path class="gg-t-potrim" d="M38 105 C50 101 70 101 83 105 L82 114 C70 110 50 110 39 114z"/>';
  }, [[60, 37], [33, 68], [87, 52]]);
  restyle('dua', function () {
    var s = '<path class="gg-t-barkline" style="stroke-width:7" d="M60 131 Q45 102 57 80 Q66 64 62 52"/><path class="gg-t-ring" d="M52 116 l7 -2 M51 102 l7 -1 M54 88 l7 1 M58 74 l7 2"/>';
    [[-112, 34, 'dark'], [108, 32, 'dark'], [-76, 40, 'mid'], [72, 39, 'mid'], [-40, 38, 'light'], [36, 40, 'light'], [-4, 30, 'lime']].forEach(function (f) { s += leafBlob(62, 52, f[1], 8, f[0], f[2], f[2] === 'dark' ? 'dark' : f[2] === 'mid' ? 'dark' : 'mid', 1); });
    return s + '<circle class="gg-t-barkdark" cx="62" cy="53" r="5"/>';
  }, [[56, 60], [68, 60], [62, 66]]);
  restyle('chuoi', function () {
    var s = canopy('M54 131 C51 110 53 90 57 72 L65 72 C69 90 70 110 67 131z', 'lime', 'light');
    [[-82, 44, 'dark', 'dark'], [74, 42, 'dark', 'dark'], [-44, 54, 'mid', 'dark'], [36, 52, 'mid', 'dark'], [-6, 58, 'light', 'mid']].forEach(function (f) { s += leafBlob(60, 76, f[1], 13, f[0], f[2], f[3], 1); });
    return s;
  }, [[73, 92], [79, 97], [72, 101], [78, 106]]);
  restyle('dudu', function () {
    var s = '<path class="gg-t-barkline" style="stroke-width:7" d="M60 131 Q67 96 58 50"/><path class="gg-t-ring" d="M58 118 h7 M59.5 104 h7 M60 90 h7"/>';
    [[28, 66, 9], [92, 68, 10], [21, 42, 11], [99, 40, 9], [36, 20, 10], [85, 17, 12], [60, 9, 10]].forEach(function (p, i) { s += '<path class="gg-t-stem" style="stroke-width:2.5" d="M58 50 Q' + ((58 + p[0]) / 2) + ' ' + ((50 + p[1]) / 2 - 6) + ' ' + p[0] + ' ' + p[1] + '"/>' + puff(p[0], p[1], p[2], i % 2 ? 'light' : 'mid', i % 2 ? 'mid' : 'dark'); });
    return s + puff(58, 48, 7, 'lime', 'light');
  }, [[52, 62], [65, 62], [54, 74], [65, 75]]);
  restyle('thanhlong', function () {
    return trunkC(56, -3, 8) + '<path class="gg-t-arm" style="stroke-width:9" d="M58 58 Q29 40 28 84 M58 58 Q43 26 36 60"/><path class="gg-t-arm gg-t-arm--dark" style="stroke-width:9" d="M58 58 Q91 44 92 86 M58 58 Q79 24 86 62"/>' + puff(58, 52, 9, 'lime', 'light');
  }, [[28, 88], [92, 90], [36, 64], [86, 66]]);

  function flower5(x, y, cls) {
    var s = '', i, a;
    for (i = 0; i < 5; i++) { a = (i * 72 - 90) * Math.PI / 180; s += '<circle class="gg-t-bloom--' + cls + '" cx="' + (x + 3.6 * Math.cos(a)).toFixed(1) + '" cy="' + (y + 3.6 * Math.sin(a)).toFixed(1) + '" r="3.1"/>'; }
    return s + '<circle class="gg-t-pollen' + (cls === 'yellow' ? ' gg-t-pollen--deep' : '') + '" cx="' + x + '" cy="' + y + '" r="2"/>';
  }

  var BASE = '<rect class="gg-t-rim" x="24" y="130" width="72" height="5"/><ellipse class="gg-t-rim" cx="60" cy="135" rx="36" ry="9"/>' +
    '<ellipse class="gg-t-ground" cx="60" cy="130" rx="36" ry="9"/><ellipse class="gg-t-shade" cx="60" cy="131" rx="15" ry="3.5"/>' +
    '<path class="gg-t-blade" d="M30 130 l2 -7 l2 7z M86 131 l2 -6 l2 6z M38 134 l1.5 -5 l1.5 5z"/>';

  /* the drawing of one plant, without its svg wrapper or ground */
  function plantBody(stage, kind) {
    var t = TREES[kind], body = '';
    if (stage === 0) return '<ellipse class="gg-t-seed" cx="60" cy="125" rx="7" ry="8"/><ellipse class="gg-t-hi" cx="57.5" cy="121" rx="2" ry="3"/>';
    if (stage === 1) return '<path class="gg-t-stem" d="M60 129 V108"/><path class="gg-t-light" d="M60 110 q-14 -2 -16 -14 q14 0 16 14z"/><path class="gg-t-dark" d="M60 110 q14 -2 16 -14 q-14 0 -16 14z"/>';
    if (stage === 2) return '<g transform="translate(60 130) scale(0.55) translate(-60 -130)">' + t.draw(3) + '</g>';
    body = t.draw(stage);
    t.spots.forEach(function (p) {
      if (stage === 5 && t.fruit) {
        body += (t.oval ? '<ellipse class="gg-t-fruit--' + t.fruit + '" cx="' + p[0] + '" cy="' + p[1] + '" rx="4.5" ry="7" transform="rotate(18 ' + p[0] + ' ' + p[1] + ')"/>'
          : '<circle class="gg-t-fruit--' + t.fruit + '" cx="' + p[0] + '" cy="' + p[1] + '" r="6"/>') + '<circle class="gg-t-fruitshine" cx="' + (p[0] - 2) + '" cy="' + (p[1] - 2) + '" r="1.6"/>';
      } else if (stage >= 4) body += flower5(p[0], p[1], t.bloom || 'cream');
    });
    return body;
  }

  /* plant(stage, kind, size, bare): stage 0 seed, 1 sprout, 2 young, 3 grown, 4 in flower, 5 in fruit; bare = no grass disc */
  function plant(stage, kind, size, bare) {
    stage = Math.max(0, Math.min(5, stage | 0));
    if (!TREES[kind]) kind = 'tron';
    size = size || 120;
    return '<svg class="gg-plant" viewBox="0 0 120 ' + (bare ? 132 : 146) + '" width="' + size + '" height="' + Math.round(size * (bare ? 132 : 146) / 120) +
      '" role="img" aria-label="' + KINDS[kind] + ': ' + STAGES[stage] + '">' + (bare ? '' : BASE) + '<g class="gg-p-grow">' + plantBody(stage, kind) + '</g></svg>';
  }

  /* plot(days, opts): one month as an isometric plot. days[i] is the kind planted on day i + 1, or null.
     opts: today (day number to mark), fresh (day number that just got planted, pops in), size. */
  function plot(days, opts) {
    opts = opts || {};
    var T = 92, s = 0.44, cells = [], k;
    var pt = function (dy) { return '180,' + (T + dy) + ' 348,' + (T + 84 + dy) + ' 180,' + (T + 168 + dy) + ' 12,' + (T + 84 + dy); };
    var out = '<polygon class="gg-pl-soil" points="' + pt(26) + '"/><polygon class="gg-pl-edge2" points="' + pt(17) + '"/><polygon class="gg-pl-edge1" points="' + pt(8) + '"/><polygon class="gg-pl-top" points="' + pt(0) + '"/>';
    for (k = 0; k < days.length && k < 36; k++) cells.push({ k: k, i: k % 6, j: Math.floor(k / 6) });
    cells.sort(function (a, b) { return (a.i + a.j) - (b.i + b.j); });
    cells.forEach(function (c) {
      var x = 180 + (c.i - c.j) * 28, y = T + 14 + (c.i + c.j) * 14, d = c.k + 1, kind = days[c.k];
      if (kind && TREES[kind]) {
        out += '<g class="gg-pl-tree' + (d === opts.fresh ? ' is-new' : '') + '" data-day="' + d + '" transform="translate(' + (x - 60 * s).toFixed(1) + ' ' + (y - 130 * s).toFixed(1) + ') scale(' + s + ')">' +
          '<title>Ngày ' + d + ': ' + KINDS[kind] + '</title><ellipse class="gg-t-shade" cx="60" cy="131" rx="18" ry="5"/><g class="gg-pl-pop">' + plantBody(5, kind) + '</g></g>';
      } else {
        out += '<ellipse class="gg-pl-slot' + (d === opts.today ? ' is-today' : '') + '" data-day="' + d + '" cx="' + x + '" cy="' + y + '" rx="9" ry="4.5"/>';
      }
    });
    var n = days.filter(function (v) { return v; }).length, size = opts.size || 360;
    return '<svg class="gg-plot" viewBox="0 0 360 300" width="' + size + '" height="' + Math.round(size * 300 / 360) + '" role="img" aria-label="Khu đất của tháng: ' + n + ' cây">' + out + '</svg>';
  }

  /* trail(months, opts): every month's plants along one winding path. months: [{ name, days, key? }], newest first; a month with a key gets a button sign carrying data-month. opts: per (plants per row), size. */
  function trail(months, opts) {
    opts = opts || {};
    var per = opts.per || 9, size = opts.size || 52, items = [], html = '', i;
    months.forEach(function (m) { items.push({ sign: m.name, key: m.key }); m.days.forEach(function (kind) { if (kind) items.push({ kind: kind }); }); });
    for (i = 0; i < items.length; i += per) {
      html += '<div class="gg-trail__row">' + items.slice(i, i + per).map(function (it) {
        if (!it.sign) return plant(5, it.kind, size, true);
        return it.key ? '<button type="button" class="gg-sign" data-month="' + it.key + '">' + it.sign + '</button>' : '<span class="gg-sign">' + it.sign + '</span>';
      }).join('') + '</div>';
    }
    return '<div class="gg-trail">' + html + '</div>';
  }

  /* the face of a mood orb, drawn in a 40 x 40 box */
  function orbInner(level) {
    level = Math.max(1, Math.min(5, level | 0));
    var dots = '<circle class="gg-o-ink" cx="14" cy="17" r="2.3"/><circle class="gg-o-ink" cx="26" cy="17" r="2.3"/>';
    var face = [
      '<path class="gg-o-line" d="M11 14 l5 3 l-5 3"/><path class="gg-o-line" d="M29 14 l-5 3 l5 3"/><path class="gg-o-line" d="M13 28 q2.3 -3 4.6 0 t4.6 0 t4.6 0"/>',
      dots + '<path class="gg-o-line" d="M15 28 q5 -5 10 0"/>',
      dots + '<path class="gg-o-line" d="M15 27 h10"/>',
      '<path class="gg-o-line" d="M11 18 q3 -4 6 0"/><path class="gg-o-line" d="M23 18 q3 -4 6 0"/><path class="gg-o-line" d="M14 24 q6 6 12 0"/>',
      dots + '<path class="gg-o-ink" d="M13 23 h14 a7 7 0 0 1 -14 0z"/>'
    ][level - 1];
    return '<circle class="gg-o-' + level + '" cx="20" cy="20" r="19"/><ellipse class="gg-o-shine" cx="13" cy="9" rx="7" ry="3.5" transform="rotate(-28 13 9)"/>' + face;
  }

  function orb(level, size) {
    level = Math.max(1, Math.min(5, level | 0));
    size = size || 44;
    return '<svg class="gg-orb" viewBox="0 0 40 40" width="' + size + '" height="' + size + '" role="img" aria-label="' + FEELINGS[level - 1] + '">' + orbInner(level) + '</svg>';
  }

  /* jar(levels, size, dropLast): a month of orbs, oldest at the bottom; holds 32 */
  function jar(levels, size, dropLast) {
    levels = (levels || []).slice(0, 32);
    size = size || 200;
    var out = '', k = 0, j = 0;
    levels.forEach(function (lv, i) {
      var per = k % 2 ? 4 : 5;
      var x = (k % 2 ? 58 : 44) + j * 28 + ((i * 7) % 5 - 2);
      var y = 208 - k * 24 + ((i * 3) % 3 - 1);
      var cls = dropLast && i === levels.length - 1 ? ' class="gg-o-new"' : '';
      out += '<g transform="translate(' + (x - 13) + ' ' + (y - 13) + ') scale(0.65)"><g' + cls + '>' + orbInner(lv) + '</g></g>';
      j++;
      if (j >= per) { j = 0; k++; }
    });
    return '<svg class="gg-jar" viewBox="0 0 200 240" width="' + size + '" height="' + Math.round(size * 1.2) +
      '" role="img" aria-label="Lọ cảm xúc: ' + levels.length + ' viên">' +
      '<path class="gg-j-body" d="M44 34 h112 q24 6 24 40 v120 q0 30 -30 30 h-100 q-30 0 -30 -30 v-120 q0 -34 24 -40z"/>' +
      out +
      '<path class="gg-j-shine" d="M34 84 v84"/>' +
      '<rect class="gg-j-lid" x="50" y="8" width="100" height="24" rx="8"/></svg>';
  }

  /* jarLive(el, levels, size): the mood jar with real rolling orbs.
     Returns { add(level), setLast(level), count() }. add() opens the lid, drops one orb in and closes it. */
  function jarLive(el, levels, size) {
    size = size || 200;
    var R = 13, G = 0.5, balls = [], raf = 0, calm = 0, started = 0, seed = 11;
    var rnd = function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    el.innerHTML = '<svg class="gg-jar" viewBox="0 -44 200 284" width="' + size + '" height="' + Math.round(size * 1.42) + '" role="img">' +
      '<path class="gg-j-body" d="M44 34 h112 q24 6 24 40 v120 q0 30 -30 30 h-100 q-30 0 -30 -30 v-120 q0 -34 24 -40z"/>' +
      '<g class="gg-j-orbs"></g><path class="gg-j-shine" d="M34 84 v84"/>' +
      '<g class="gg-j-lidg"><rect class="gg-j-lid" x="50" y="8" width="100" height="24" rx="8"/></g></svg>';
    var svg = el.firstChild, layer = svg.querySelector('.gg-j-orbs');

    function spawn(level, x, y) {
      var b = { x: x, y: y, vx: (rnd() - 0.5) * 3, vy: 2, a: 0, lv: Math.max(1, Math.min(5, level | 0)), g: null };
      balls.push(b);
      return b;
    }
    function corner(b, cx, cy) {
      if ((cx < 100 ? b.x >= cx : b.x <= cx) || b.y < cy) return;
      var dx = b.x - cx, dy = b.y - cy, d = Math.sqrt(dx * dx + dy * dy), max = 28.5 - R;
      if (d <= max) return;
      var nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
      b.x = cx + nx * max; b.y = cy + ny * max;
      if (vn > 0) { b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; }
    }
    function walls(b) {
      var neck = b.y < 70, lo = (neck ? 46 : 21.5) + R, hi = (neck ? 154 : 178.5) - R;
      if (b.x < lo) { b.x = lo; if (b.vx < 0) b.vx *= -0.5; }
      if (b.x > hi) { b.x = hi; if (b.vx > 0) b.vx *= -0.5; }
      if (b.y > 222.5 - R) { b.y = 222.5 - R; if (b.vy > 0) b.vy *= -0.45; b.vx *= 0.97; }
      corner(b, 50, 194); corner(b, 150, 194);
    }
    /* one physics step; returns how far everything moved */
    function step() {
      var i, j, k, b, c, moved = 0;
      for (i = 0; i < balls.length; i++) { b = balls[i]; b.px = b.x; b.py = b.y; b.vy += G; b.vx *= 0.992; b.x += b.vx; b.y += b.vy; }
      for (k = 0; k < 5; k++) {
        for (i = 0; i < balls.length; i++) {
          b = balls[i];
          for (j = i + 1; j < balls.length; j++) {
            c = balls[j];
            var dx = c.x - b.x, dy = c.y - b.y, d2 = dx * dx + dy * dy;
            if (d2 >= 4 * R * R) continue;
            var d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, o = (2 * R - d) / 2;
            b.x -= nx * o; b.y -= ny * o; c.x += nx * o; c.y += ny * o;
            var rv = (c.vx - b.vx) * nx + (c.vy - b.vy) * ny;
            if (rv < 0) { var imp = -1.3 * rv / 2; b.vx -= imp * nx; b.vy -= imp * ny; c.vx += imp * nx; c.vy += imp * ny; }
          }
          walls(b);
        }
      }
      for (i = 0; i < balls.length; i++) {
        b = balls[i];
        var mx = b.x - b.px, my = b.y - b.py;
        if (Math.abs(mx) > 0.05) b.a += mx / R * 57.3;
        moved += Math.abs(mx) + Math.abs(my);
      }
      return moved;
    }
    function draw() {
      balls.forEach(function (b) {
        if (!b.g) { b.g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); b.g.innerHTML = orbInner(b.lv); layer.appendChild(b.g); }
        b.g.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ') rotate(' + b.a.toFixed(0) + ') scale(0.65) translate(-20 -20)');
      });
      svg.setAttribute('aria-label', 'Lọ cảm xúc: ' + balls.length + ' viên');
    }
    function settle(steps) {
      for (var s = 0; s < steps; s++) step();
      balls.forEach(function (b) { b.vx = 0; b.vy = 0; });
      draw();
    }
    function tick(now) {
      if (!started) started = now;
      var moved = step();
      draw();
      calm = moved < 0.12 * balls.length ? calm + 1 : 0;
      if (calm > 45 || now - started > 7000) { raf = 0; balls.forEach(function (b) { b.vx = 0; b.vy = 0; }); return; }
      raf = requestAnimationFrame(tick);
    }
    function run() { calm = 0; started = 0; if (!raf) raf = requestAnimationFrame(tick); }

    /* fill silently so the jar is already at rest when it first appears */
    (levels || []).slice(0, 32).forEach(function (lv) { spawn(lv, 62 + rnd() * 76, 30); for (var s = 0; s < 24; s++) step(); });
    for (var s0 = 0; s0 < 420; s0++) step();
    balls.forEach(function (b) { b.vx = 0; b.vy = 0; b.a = (rnd() - 0.5) * 50; });
    draw();
    var total = balls.length;

    return {
      count: function () { return total; },
      add: function (level) {
        if (total >= 32) return;
        total++;
        if (still()) { spawn(level, 100, 30); settle(500); return; }
        svg.classList.add('is-open');
        setTimeout(function () { var b = spawn(level, 92 + rnd() * 16, -14); b.vx = (rnd() - 0.5) * 2.4; b.vy = 3; run(); }, 300);
        setTimeout(function () { svg.classList.remove('is-open'); }, 1300);
      },
      setLast: function (level) {
        var b = balls[balls.length - 1];
        if (!b) return;
        b.lv = Math.max(1, Math.min(5, level | 0));
        if (b.g) b.g.innerHTML = orbInner(b.lv);
        if (still()) { draw(); return; }
        b.vy = -5; b.vx = (rnd() - 0.5) * 3; run();
      }
    };
  }

  function still() {
    return !document.body.animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function particle(cls, x, y) {
    var s = document.createElement('span');
    s.className = 'gg-particle ' + cls;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    document.body.appendChild(s);
    return s;
  }

  /* burst(el, 'drops' | 'confetti'): particles fly out from the centre of el */
  function burst(el, kind) {
    if (!el || still()) return;
    kind = kind === 'confetti' ? 'confetti' : 'drops';
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var n = kind === 'confetti' ? 22 : 8;
    for (var i = 0; i < n; i++) {
      (function (i) {
        var s = particle('gg-particle--' + kind + ' gg-particle--c' + (i % 4), cx, cy);
        var a = Math.PI * 2 * i / n + Math.random() * 0.5;
        var d = (kind === 'confetti' ? 60 : 34) + Math.random() * 50;
        var x = Math.cos(a) * d, y = Math.sin(a) * d - (kind === 'confetti' ? 30 : 0);
        var spin = kind === 'confetti' ? Math.round(Math.random() * 540) : 45;
        s.animate([
          { transform: 'translate(-50%,-50%) scale(0.3) rotate(45deg)', opacity: 1 },
          { transform: 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px)) scale(1) rotate(' + spin + 'deg)', opacity: 1, offset: 0.6 },
          { transform: 'translate(calc(-50% + ' + x * 1.1 + 'px), calc(-50% + ' + (y + 40) + 'px)) scale(0.8) rotate(' + spin + 'deg)', opacity: 0 }
        ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }).onfinish = function () { s.remove(); };
      })(i);
    }
  }

  /* rain(el): a short shower falling onto el, used before a plant grows */
  function rain(el) {
    if (!el || still()) return;
    var r = el.getBoundingClientRect();
    for (var i = 0; i < 7; i++) {
      (function (i) {
        var s = particle('gg-particle--drops', r.left + r.width * (0.2 + 0.1 * i), r.top - 6);
        s.animate([
          { transform: 'translate(-50%, -20px) rotate(45deg)', opacity: 0 },
          { transform: 'translate(-50%, 0) rotate(45deg)', opacity: 1, offset: 0.2 },
          { transform: 'translate(-50%, ' + r.height * 0.6 + 'px) rotate(45deg)', opacity: 0 }
        ], { duration: 520, delay: (i * 3 % 7) * 45, easing: 'ease-in', fill: 'backwards' }).onfinish = function () { s.remove(); };
      })(i);
    }
  }


const Giri = { mascot: mascot, plant: plant, plot: plot, trail: trail, groups: GROUPS, orb: orb, jar: jar, jarLive: jarLive, burst: burst, rain: rain, stages: STAGES, kinds: KINDS, moods: MOODS, feelings: FEELINGS };
export default Giri;

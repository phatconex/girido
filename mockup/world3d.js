/* Giri Garden — bản thử 3D low-poly. Mọi mô hình dựng bằng khối cơ bản của three.js, không dùng file mô hình ngoài. */
window.MK3D = (function () {
  'use strict';
  var T = window.THREE, api = { ready: false, update: function () {}, cheer: function () {} };
  if (!T) return api;
  var canvas = document.createElement('canvas');
  canvas.className = 'mk-gl'; canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { canvas.remove(); return api; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.outputEncoding = T.sRGBEncoding;
  var scene = new T.Scene(); scene.fog = new T.Fog(col(0xdcecf8), 48, 120);
  var cam = new T.PerspectiveCamera(30, 1, 0.1, 300);
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- màu lấy từ bảng màu của design system ---- */
  /* trong 3D ánh sáng làm màu nhạt đi, nên dùng bản đậm hơn một bậc của cùng bảng pastel */
  var C = { grass: 0x9ed684, grass2: 0x8acb76, earth: 0xa3764f, earth2: 0x835c3c, sand: 0xe3c896, water: 0x6fc3f0, lime: 0xbfe45f, light: 0x97d67f, mid: 0x62b96f, dark: 0x3a935c,
    bark: 0x99673f, fur: 0xffc02e, spot: 0xf2842f, ink: 0x4a2a12, cream: 0xffeebb, sun: 0xffd24a, blush: 0xff93a8, red: 0xf96b5c, orange: 0xff9a3d, magenta: 0xee6aa0, blue: 0x2f7fd0, rock: 0xcfc4b2, white: 0xffffff };
  var mats = {};
  function col(c) { return new T.Color(c).convertSRGBToLinear(); }
  function mat(c) { return mats[c] || (mats[c] = new T.MeshStandardMaterial({ color: col(c), flatShading: true, roughness: 0.92, metalness: 0 })); }
  function mesh(geo, c, x, y, z) { var m = new T.Mesh(geo, mat(c)); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; return m; }
  var seed = 7; function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  function ico(r, c, x, y, z, d) { var m = mesh(new T.IcosahedronGeometry(r, d || 0), c, x, y, z); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); return m; }
  function cyl(rt, rb, h, c, x, y, z, seg) { return mesh(new T.CylinderGeometry(rt, rb, h, seg || 6), c, x, y, z); }
  function cone(r, h, c, x, y, z, seg) { return mesh(new T.ConeGeometry(r, h, seg || 7), c, x, y, z); }
  function box(w, h, d, c, x, y, z) { return mesh(new T.BoxGeometry(w, h, d), c, x, y, z); }

  /* ---- ánh sáng ---- */
  scene.add(new T.HemisphereLight(col(0xeaf5ff), col(0x9fd68a), 0.95));
  var sun = new T.DirectionalLight(col(0xfff0d0), 1.6);
  sun.position.set(9, 16, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -15; sun.shadow.camera.right = 15; sun.shadow.camera.top = 15; sun.shadow.camera.bottom = -15; sun.shadow.camera.far = 50; sun.shadow.bias = -0.0006;
  scene.add(sun);

  /* ---- hòn đảo nổi, hồ nước, đá, cỏ ---- */
  var world = new T.Group(); scene.add(world);
  var top = cyl(9.6, 9.0, 1.2, C.grass, 0, -0.6, 0, 11); top.castShadow = false; world.add(top);
  world.add(cyl(9.0, 6.2, 2.4, C.earth, 0, -2.4, 0, 11));
  world.add(cyl(6.2, 2.2, 2.6, C.earth2, 0, -4.9, 0, 9));
  [[-6, -3, 2.6], [3, -6, 3.2], [-2, -6.5, 2.2], [6.5, -2, 2]].forEach(function (m) { var g = ico(m[2], C.grass2, m[0], -0.2, m[1], 1); g.scale.y = 0.28; g.castShadow = false; world.add(g); });
  var POND = { x: 4.4, z: 1.6, r: 2.7 };
  var rim = cyl(POND.r + 0.45, POND.r + 0.45, 0.12, C.sand, POND.x, 0.02, POND.z, 10); rim.castShadow = false; world.add(rim);
  var water = new T.Mesh(new T.CylinderGeometry(POND.r, POND.r, 0.1, 10), new T.MeshStandardMaterial({ color: col(C.water), flatShading: true, roughness: 0.25, metalness: 0.1 }));
  water.position.set(POND.x, 0.07, POND.z); water.receiveShadow = true; world.add(water);
  var ripples = [0, 1].map(function (i) { var r = new T.Mesh(new T.TorusGeometry(1, 0.035, 5, 28), new T.MeshBasicMaterial({ color: C.white, transparent: true, opacity: 0.6 })); r.rotation.x = Math.PI / 2; r.position.set(POND.x + (i ? 0.7 : -0.5), 0.14, POND.z + (i ? -0.6 : 0.4)); r.userData.t = i * 0.5; world.add(r); return r; });
  [[6.9, 3.4, 0.55], [7.4, 2.6, 0.38], [2.2, -0.2, 0.42], [-7.4, 1.6, 0.6], [-6.8, 2.3, 0.36]].forEach(function (p) { var r = ico(p[2], C.rock, p[0], p[2] * 0.5, p[1]); r.scale.y = 0.75; world.add(r); });
  for (var gi = 0; gi < 46; gi++) {
    var a = rnd() * 6.283, d = 1.5 + rnd() * 7.4, gx = Math.cos(a) * d, gz = Math.sin(a) * d;
    if (Math.hypot(gx - POND.x, gz - POND.z) < POND.r + 0.7) continue;
    var b = cone(0.07, 0.3 + rnd() * 0.25, gi % 3 ? C.mid : C.dark, gx, 0.15, gz, 4); b.castShadow = false; world.add(b);
    if (gi % 4 === 0) { var f = ico(0.09, [C.blush, C.cream, C.sun][gi % 3], gx + 0.2, 0.2, gz + 0.1); f.castShadow = false; world.add(f); }
  }

  /* ---- cây: mỗi loại là vài khối ghép lại ---- */
  function dots(g, list, color, r) { list.forEach(function (p) { g.add(ico(r || 0.13, color, p[0], p[1], p[2])); }); }
  var around = [[0.55, 2.2, 0.5], [-0.6, 2.5, 0.35], [0.1, 3.0, 0.75], [-0.3, 2.0, -0.7], [0.7, 2.8, -0.35], [-0.85, 2.1, -0.1], [0.2, 2.45, 0.95], [0.95, 2.25, 0.05]];
  function round(extra, color, trunkTilt) {
    var g = new T.Group(), t = cyl(0.13, 0.2, 1.7, C.bark, 0, 0.85, 0); t.rotation.z = trunkTilt || 0.06; g.add(t);
    g.add(ico(0.95, C.mid, 0, 2.35, 0)); g.add(ico(0.62, C.light, 0.62, 2.0, 0.3)); g.add(ico(0.55, C.lime, -0.55, 2.15, 0.35)); g.add(ico(0.5, C.dark, 0.1, 2.05, -0.6));
    if (extra) dots(g, around, color); return g;
  }
  function pine() { var g = new T.Group(); g.add(cyl(0.14, 0.2, 0.7, C.bark, 0, 0.35, 0)); g.add(cone(1.0, 1.3, C.dark, 0, 1.2, 0)); g.add(cone(0.78, 1.15, C.mid, 0, 1.95, 0)); g.add(cone(0.52, 1.0, C.light, 0, 2.65, 0)); return g; }
  function blossom(color) {
    var g = new T.Group(); g.add(cyl(0.1, 0.17, 1.2, C.bark, 0, 0.6, 0));
    [[0.5, 0.7], [-0.6, 0.5], [0.15, -0.65], [-0.2, 0.3]].forEach(function (d, i) {
      var br = cyl(0.05, 0.08, 1.3, C.bark, d[0] * 0.5, 1.6, d[1] * 0.5); br.rotation.set(d[1] * 0.7, 0, -d[0] * 0.7); g.add(br);
      g.add(ico(0.28, color, d[0], 2.15, d[1])); g.add(ico(0.2, i % 2 ? C.lime : color, d[0] * 1.4, 1.9, d[1] * 1.3)); g.add(ico(0.17, color, d[0] * 0.6, 2.45, d[1] * 0.4));
    });
    return g;
  }
  function umbrella(color) {
    var g = new T.Group(); g.add(cyl(0.13, 0.2, 1.6, C.bark, 0, 0.8, 0));
    var c1 = ico(1.25, C.mid, 0, 2.0, 0, 1); c1.scale.y = 0.38; g.add(c1); var c2 = ico(0.8, C.light, 0.2, 2.35, 0.1, 1); c2.scale.y = 0.4; g.add(c2);
    dots(g, [[0.7, 2.25, 0.5], [-0.75, 2.2, 0.3], [0.1, 2.6, 0.2], [-0.2, 2.25, -0.8], [0.9, 2.2, -0.3], [0.2, 2.3, 0.95], [-0.95, 2.15, -0.3]], color, 0.14); return g;
  }
  function bush(color) { var g = new T.Group(); g.add(ico(0.62, C.mid, 0, 0.45, 0)); g.add(ico(0.45, C.light, 0.55, 0.35, 0.15)); g.add(ico(0.4, C.lime, -0.45, 0.32, 0.25)); if (color) dots(g, [[0.2, 0.85, 0.35], [-0.3, 0.7, 0.45], [0.6, 0.6, 0.4], [0, 0.6, 0.6]], color, 0.1); return g; }
  function palm(color) {
    var g = new T.Group(), i, s;
    for (i = 0; i < 5; i++) { s = cyl(0.11, 0.14, 0.62, i % 2 ? C.bark : C.earth2, Math.sin(i * 0.5) * 0.14, 0.3 + i * 0.58, 0); s.rotation.z = -0.06 * i; g.add(s); }
    for (i = 0; i < 7; i++) { var leaf = cone(0.26, 1.7, i % 2 ? C.mid : C.light, 0, 0, 0, 4); leaf.scale.z = 0.25; var p = new T.Group(); leaf.position.y = 0.85; leaf.rotation.z = 0; p.add(leaf); p.position.set(0.2, 3.05, 0); p.rotation.set(0, i * 0.9, 1.25); g.add(p); }
    if (color) dots(g, [[0.3, 2.85, 0.15], [0.05, 2.85, -0.12], [0.2, 2.75, 0.0]], color, 0.15); return g;
  }
  function bamboo() { var g = new T.Group(); [[-0.2, 0, 3.0], [0.1, 0.15, 3.5], [0.3, -0.15, 2.5]].forEach(function (c, i) { g.add(cyl(0.07, 0.08, c[2], i === 2 ? C.mid : C.light, c[0], c[2] / 2, c[1], 5)); for (var y = 0.8; y < c[2]; y += 0.9) { var l = cone(0.12, 0.6, C.lime, c[0] + 0.22, y, c[1], 4); l.rotation.z = -1.1; l.scale.z = 0.3; g.add(l); } }); return g; }
  function sunflower() { var g = new T.Group(); g.add(cyl(0.05, 0.06, 1.5, C.dark, 0, 0.75, 0, 5)); var l = cone(0.2, 0.6, C.mid, 0.22, 0.7, 0, 4); l.rotation.z = -1.2; l.scale.z = 0.35; g.add(l); var h = new T.Group(); for (var i = 0; i < 10; i++) { var p = cone(0.1, 0.38, i % 2 ? C.sun : C.orange, 0, 0, 0, 4); p.position.set(Math.cos(i * 0.628) * 0.36, Math.sin(i * 0.628) * 0.36, 0); p.rotation.z = i * 0.628 - 1.57; p.scale.z = 0.3; h.add(p); } h.add(cyl(0.24, 0.24, 0.1, C.ink, 0, 0, 0, 9).rotateX(1.57)); h.position.set(0, 1.6, 0.05); h.rotation.x = -0.25; g.add(h); return g; }
  function cactus() { var g = new T.Group(); g.add(cyl(0.26, 0.3, 1.9, C.light, 0, 0.95, 0, 7)); g.add(ico(0.27, C.light, 0, 1.9, 0)); g.add(cyl(0.13, 0.13, 0.5, C.mid, -0.45, 1.0, 0).rotateZ(1.57)); g.add(cyl(0.13, 0.14, 0.7, C.mid, -0.66, 1.3, 0)); g.add(cyl(0.12, 0.12, 0.45, C.mid, 0.42, 1.25, 0).rotateZ(1.57)); g.add(cyl(0.12, 0.13, 0.6, C.mid, 0.6, 1.5, 0)); g.add(ico(0.13, C.blush, 0, 2.2, 0)); return g; }
  var KIND = {
    tron: function () { return round(true, C.red); }, thong: pine, bach: pine, giot: function () { return round(false); }, bui: function () { return bush(C.blue); }, tan: function () { return umbrella(C.lime); }, tre: bamboo, xuongrong: cactus,
    sen: function () { return bush(C.blush); }, huongduong: sunflower, mai: function () { return blossom(C.sun); }, dao: function () { return blossom(C.blush); }, phuong: function () { return umbrella(C.red); },
    dua: function () { return palm(C.earth2); }, xoai: function () { return round(true, C.orange); }, cam: function () { return round(true, C.orange, -0.05); }, chuoi: function () { return palm(C.sun); }, dudu: function () { return palm(C.orange); }, thanhlong: function () { return umbrella(C.magenta); }
  };
  function tree(kind) { return (KIND[kind] || KIND.tron)(); }

  /* ---- các ô đất của tháng: cây đã trồng đứng quanh đảo ---- */
  var slots = [];
  [[3.3, 7], [5.3, 11], [7.1, 14], [8.6, 17]].forEach(function (ring, ri) {
    for (var i = 0; i < ring[1]; i++) {
      var a = i / ring[1] * 6.283 + ri * 0.4, x = Math.cos(a) * ring[0], z = Math.sin(a) * ring[0];
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.0) continue;
      if (z > 3.2 && x > -5.4 && x < 3.2) continue;
      slots.push({ x: x, z: z });
    }
  });
  slots.sort(function (p, q) { return p.z - q.z; });
  var planted = ['thong', 'xoai', 'mai', 'tron', 'tre', 'phuong', 'dao', 'cam', 'dua', 'bui', 'huongduong', 'thong', 'xuongrong', 'tan'];
  var sway = [];
  slots.slice(0, 30).forEach(function (s, i) {
    if (i < planted.length) { var t = tree(planted[i]); t.position.set(s.x, 0, s.z); t.rotation.y = rnd() * 6; var k = 0.72 + rnd() * 0.3; t.scale.set(k, k, k); t.userData.ph = rnd() * 6; world.add(t); sway.push(t); }
    else { var m = cyl(0.3, 0.38, 0.1, C.earth, s.x, 0.05, s.z, 7); m.castShadow = false; world.add(m); }
  });

  /* ---- Giri: hươu cao cổ dựng bằng hộp ---- */
  var giri = new T.Group(), neck = new T.Group(), tail = new T.Group(), headPos = new T.Object3D();
  giri.add(box(1.5, 0.85, 0.7, C.fur, 0, 1.55, 0));
  [[-0.55, 0.22], [-0.55, -0.22], [0.55, 0.22], [0.55, -0.22]].forEach(function (l) { giri.add(box(0.17, 1.2, 0.17, C.fur, l[0], 0.6, l[1])); giri.add(box(0.19, 0.16, 0.19, C.earth2, l[0], 0.08, l[1])); });
  [[-0.3, 1.75, 0.36], [0.25, 1.5, 0.36], [-0.1, 1.4, -0.36], [0.4, 1.8, -0.36], [-0.5, 1.6, -0.36]].forEach(function (s) { giri.add(box(0.26, 0.24, 0.03, C.spot, s[0], s[1], s[2])); });
  neck.position.set(0.6, 1.85, 0); neck.add(box(0.32, 2.7, 0.32, C.fur, 0, 1.3, 0));
  [[0.6, 0.17], [1.3, -0.17], [1.9, 0.17], [0.95, -0.17], [2.3, -0.17]].forEach(function (s) { neck.add(box(0.2, 0.26, 0.03, C.spot, 0, s[0], s[1])); });
  var head = new T.Group(); head.position.set(0.1, 2.75, 0);
  head.add(box(0.95, 0.42, 0.42, C.fur, 0.3, 0, 0)); head.add(box(0.3, 0.3, 0.44, C.cream, 0.75, -0.04, 0));
  head.add(box(0.07, 0.07, 0.03, C.ink, 0.25, 0.08, 0.22)); head.add(box(0.07, 0.07, 0.03, C.ink, 0.25, 0.08, -0.22));
  head.add(box(0.26, 0.1, 0.08, C.spot, -0.12, 0.12, 0.26)); head.add(box(0.26, 0.1, 0.08, C.spot, -0.12, 0.12, -0.26));
  [0.1, -0.1].forEach(function (z) { head.add(cyl(0.03, 0.03, 0.26, C.fur, 0.02, 0.32, z, 5)); head.add(ico(0.06, C.spot, 0.02, 0.46, z)); });
  headPos.position.set(0.3, 0.5, 0); head.add(headPos); neck.add(head); giri.add(neck);
  tail.position.set(-0.75, 1.75, 0); tail.add(box(0.07, 0.75, 0.07, C.fur, 0, -0.35, 0)); tail.add(ico(0.1, C.spot, 0, -0.75, 0)); giri.add(tail);
  giri.position.set(-2.6, 0, 5.4); giri.rotation.y = 0.35; world.add(giri);

  /* ---- cây của hôm nay: lớn theo cấp ---- */
  var todayG = new T.Group(); todayG.position.set(0.5, 0, 5.9); world.add(todayG);
  var ring = new T.Mesh(new T.TorusGeometry(0.75, 0.06, 6, 26), new T.MeshBasicMaterial({ color: col(C.sun) })); ring.rotation.x = Math.PI / 2; ring.position.set(0.5, 0.06, 5.9); world.add(ring);
  var cur = { stage: -1, kind: '' }, grow = 0, hop = 0;
  function setToday(stage, kind) {
    if (cur.stage === stage && cur.kind === kind) return;
    var bigger = stage > cur.stage && cur.stage >= 0; cur = { stage: stage, kind: kind };
    while (todayG.children.length) todayG.remove(todayG.children[0]);
    todayG.add(cyl(0.5, 0.62, 0.16, C.earth, 0, 0.08, 0, 8));
    if (stage === 0) todayG.add(ico(0.16, C.earth2, 0, 0.26, 0));
    else if (stage === 1) { todayG.add(cyl(0.035, 0.045, 0.5, C.dark, 0, 0.4, 0, 5)); var a = cone(0.14, 0.4, C.light, 0.16, 0.66, 0, 4), b = cone(0.14, 0.4, C.mid, -0.16, 0.66, 0, 4); a.rotation.z = -0.9; b.rotation.z = 0.9; a.scale.z = b.scale.z = 0.35; todayG.add(a); todayG.add(b); }
    else {
      var t = stage >= 5 ? tree(kind) : round(stage === 4, C.cream), k = [0, 0, 0.5, 0.78, 0.92, 1.05][stage];
      t.scale.set(k, k, k); t.position.y = 0.1; todayG.add(t);
    }
    if (bigger) { grow = 1; hop = 1; }
    draw();
  }

  /* ---- mây ---- */
  var clouds = [];
  [[-14, 9, -9, 1.3], [6, 11, -16, 1.7], [15, 7.5, -6, 1.0], [-4, 12.5, -22, 2.0], [22, 10, -20, 1.5]].forEach(function (c) {
    var g = new T.Group(), m = new T.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 });
    [[0, 0, 0, 1], [1.1, -0.15, 0.1, 0.75], [-1.1, -0.2, 0, 0.7], [0.3, 0.45, -0.1, 0.7]].forEach(function (p) { var s = new T.Mesh(new T.IcosahedronGeometry(p[3], 0), m); s.position.set(p[0], p[1], p[2]); g.add(s); });
    g.position.set(c[0], c[1], c[2]); g.scale.set(c[3], c[3] * 0.7, c[3]); scene.add(g); clouds.push(g);
  });

  /* ---- máy quay, kéo để xoay đảo ---- */
  var W = 1, H = 1, px = 0, py = 0, spin = 0, spinTo = 0, drag = null, say = null, v = new T.Vector3(), clock = new T.Clock(), running = false;
  function resize() {
    W = window.innerWidth; H = window.innerHeight; renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.position.set(0, 12, 34); cam.lookAt(0, 0.6, 0);
    if (W > 1080) cam.setViewOffset(W, H, W * 0.21, -H * 0.06, W, H); else cam.setViewOffset(W, H, 0, H * 0.16, W, H);
    cam.updateProjectionMatrix(); draw();
  }
  function draw() {
    renderer.render(scene, cam);
    say = say && document.contains(say) ? say : document.getElementById('mk-say');
    if (say) { headPos.getWorldPosition(v); v.project(cam); say.style.left = Math.round((v.x + 1) / 2 * W) + 'px'; say.style.top = Math.round((1 - v.y) / 2 * H) + 'px'; }
  }
  function tick() {
    if (!running) return;
    var t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(), 0.05), i;
    spin += (spinTo - spin) * 0.08; world.rotation.y = spin + Math.sin(t * 0.15) * 0.03 + px * 0.05;
    cam.position.y = 12 + py * 0.6; cam.lookAt(0, 0.6, 0);
    neck.rotation.z = -0.12 + Math.sin(t * 1.3) * 0.05; neck.rotation.x = Math.sin(t * 0.9) * 0.04; tail.rotation.x = Math.sin(t * 5) * 0.5;
    if (hop > 0) { hop = Math.max(0, hop - dt * 1.4); giri.position.y = Math.abs(Math.sin(hop * 9.4)) * 0.5 * hop; neck.rotation.z += Math.sin(hop * 18) * 0.12; } else giri.position.y = 0;
    if (grow > 0) { grow = Math.max(0, grow - dt * 1.6); var e = 1 + Math.sin(grow * 9) * 0.22 * grow; todayG.scale.set(e, 2 - e, e); } else todayG.scale.set(1, 1, 1);
    for (i = 0; i < sway.length; i++) sway[i].rotation.z = Math.sin(t * 0.9 + sway[i].userData.ph) * 0.025;
    for (i = 0; i < clouds.length; i++) { clouds[i].position.x += dt * (0.25 + i * 0.05); if (clouds[i].position.x > 30) clouds[i].position.x = -30; }
    ripples.forEach(function (r) { r.userData.t = (r.userData.t + dt * 0.35) % 1; var s = 0.3 + r.userData.t * 1.3; r.scale.set(s, s, 1); r.material.opacity = 0.6 * (1 - r.userData.t); });
    ring.scale.setScalar(1 + Math.sin(t * 3) * 0.08); ring.visible = cur.stage < 5;
    draw(); requestAnimationFrame(tick);
  }
  function start() { if (still) { draw(); return; } if (!running) { running = true; clock.getDelta(); requestAnimationFrame(tick); } }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { if (document.hidden) running = false; else start(); });
  window.addEventListener('pointermove', function (e) { px = e.clientX / W - 0.5; py = e.clientY / H - 0.5; if (drag !== null) { spinTo += (e.clientX - drag) * 0.006; drag = e.clientX; } });
  canvas.addEventListener('pointerdown', function (e) { drag = e.clientX; canvas.style.cursor = 'grabbing'; });
  window.addEventListener('pointerup', function () { drag = null; canvas.style.cursor = 'grab'; });
  resize(); start();

  api.ready = true;
  api.update = function (o) { setToday(o.stage, o.kind); if (still) draw(); };
  api.cheer = function () { hop = 1; };
  return api;
})();

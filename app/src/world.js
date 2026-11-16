/* Giri Garden — cảnh nền: hồ trong rừng nhiều lớp, mỗi lớp chuyển động riêng. Dựng một lần lúc mở app. */
var GGWorld = (function () {
  'use strict';
  /* ---- cảnh nền: hồ trong rừng, nhiều lớp, mỗi lớp chuyển động riêng ---- */
  function sprite(kind, x, y, size, stage) { return Giri.plant(stage == null ? 5 : stage, kind, size, true).replace('<svg ', '<svg x="' + x + '" y="' + y + '" '); }
  function cloud(x, y, k) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><ellipse class="mk-cloud" cx="0" cy="0" rx="90" ry="26"/><circle class="mk-cloud" cx="-30" cy="-18" r="34"/><circle class="mk-cloud" cx="22" cy="-26" r="42"/><circle class="mk-cloud" cx="62" cy="-8" r="26"/></g>'; }
  function star(x, y, r, d) { return '<path class="mk-spark" style="animation-delay:' + d + 's" d="M' + x + ' ' + (y - r) + ' L' + (x + r * 0.28) + ' ' + (y - r * 0.28) + ' L' + (x + r) + ' ' + y + ' L' + (x + r * 0.28) + ' ' + (y + r * 0.28) + ' L' + x + ' ' + (y + r) + ' L' + (x - r * 0.28) + ' ' + (y + r * 0.28) + ' L' + (x - r) + ' ' + y + ' L' + (x - r * 0.28) + ' ' + (y - r * 0.28) + 'z"/>'; }
  function blades(x, y, k, cls) {
    var s = '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">', i;
    for (i = 0; i < 5; i++) s += '<path class="mk-blade ' + (cls || '') + '" style="animation-delay:' + (-i * 0.6) + 's" d="M' + (i * 12 - 4) + ' 0 Q' + (i * 12 + (i - 2) * 6) + ' -' + (30 + (i % 3) * 14) + ' ' + (i * 12 + (i - 2) * 12) + ' -' + (52 + (i % 3) * 20) + ' Q' + (i * 12 + 6 + (i - 2) * 4) + ' -24 ' + (i * 12 + 6) + ' 0z"/>';
    return s + '</g>';
  }
  function scene() {
    var s = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMinYMax slice" aria-hidden="true">', i;
    s += '<circle class="mk-halo" cx="1240" cy="170" r="130"/><circle class="mk-sun" cx="1240" cy="170" r="70"/>';
    s += '<g class="mk-drift mk-drift--slow" style="animation-delay:-60s">' + cloud(0, 150, 1) + '</g><g class="mk-drift mk-drift--slow" style="animation-delay:-150s">' + cloud(0, 250, 0.7) + '</g>';
    s += '<path class="mk-far" d="M0 560 Q120 400 250 440 Q360 330 500 430 Q620 500 760 400 Q880 320 1010 420 Q1150 500 1290 380 Q1430 300 1600 430 V900 H0z"/>';
    s += '<g class="mk-drift" style="animation-delay:-20s">' + cloud(0, 330, 0.9) + '</g><g class="mk-drift" style="animation-delay:-80s">' + cloud(0, 210, 1.2) + '</g>';
    s += '<path class="mk-mid" d="M0 600 Q180 470 420 540 Q620 600 820 520 Q1040 440 1260 520 Q1440 580 1600 520 V900 H0z"/>';
    [[150, 548], [182, 540], [470, 556], [840, 528], [872, 520], [1180, 512], [1470, 548], [1500, 540]].forEach(function (p) { s += '<path class="mk-pine" d="M' + p[0] + ' ' + (p[1] - 44) + ' l13 44 h-26z"/>'; });
    s += '<path class="mk-field" d="M760 640 Q1080 560 1600 600 V700 H760z"/>';
    s += '<path class="mk-bank" d="M860 668 Q1160 604 1600 640 V740 H860z"/>';
    s += sprite('tron', 1090, 508, 150) + sprite('phuong', 1250, 494, 170) + sprite('bui', 1420, 580, 90) + sprite('thong', 990, 566, 96);
    s += '<path class="mk-water" d="M520 716 Q900 660 1600 694 V900 H330 Q470 820 520 716z"/><path class="mk-water-2" d="M700 760 Q1000 730 1700 760 V800 Q1100 770 700 800z"/><path class="mk-water-2" style="animation-delay:-4s" d="M560 836 Q900 812 1700 842 V872 Q1000 842 560 872z"/>';
    s += '<path class="mk-shoreline" d="M866 676 Q1160 624 1600 652"/>';
    [[760, 742, 90, 0], [980, 790, 120, -2], [1240, 744, 80, -4], [1380, 826, 130, -1], [700, 858, 110, -3]].forEach(function (w) { s += '<path class="mk-wave" style="animation-delay:' + w[3] + 's" d="M' + w[0] + ' ' + w[1] + ' q' + w[2] / 4 + ' -8 ' + w[2] / 2 + ' 0 t' + w[2] / 2 + ' 0"/>'; });
    s += star(900, 760, 11, 0) + star(1130, 812, 8, -1.2) + star(1330, 770, 12, -2.1) + star(1480, 850, 9, -0.6) + star(1020, 862, 9, -2.6) + star(790, 818, 7, -1.7);
    s += '<ellipse class="mk-lily" cx="1180" cy="716" rx="26" ry="8"/><ellipse class="mk-lily" style="animation-delay:-2s" cx="1250" cy="730" rx="18" ry="6"/><ellipse class="mk-lily" style="animation-delay:-3s" cx="1040" cy="724" rx="20" ry="6"/>' + sprite('sen', 1150, 630, 70);
    s += '<path class="mk-near" d="M0 640 Q280 590 560 640 Q760 680 800 780 Q820 850 770 900 H0z"/><path class="mk-shoreline" d="M566 644 Q760 684 798 782 Q816 848 772 898"/>';
    s += sprite('xoai', -90, 250, 330) + sprite('tre', 560, 470, 150) + sprite('bui', 660, 590, 96);
    [[60, 690], [330, 660], [520, 690], [640, 760], [700, 850], [470, 870]].forEach(function (f, i) { s += '<circle class="mk-flower' + (i % 2 ? ' mk-flower--pink' : '') + '" cx="' + f[0] + '" cy="' + f[1] + '" r="5"/><circle class="mk-flower' + (i % 2 ? '' : ' mk-flower--pink') + '" cx="' + (f[0] + 12) + '" cy="' + (f[1] + 5) + '" r="3.5"/>'; });
    s += blades(610, 720, 0.5) + blades(20, 700, 0.55) + blades(700, 800, 0.45);
    s += '<g class="mk-flock"><g transform="translate(0 260)"><path class="mk-bird mk-flap" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g><g transform="translate(-70 300) scale(0.7)"><path class="mk-bird mk-flap" style="animation-delay:-0.3s" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g><g transform="translate(-40 230) scale(0.8)"><path class="mk-bird mk-flap" style="animation-delay:-0.5s" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g></g>';
    for (i = 0; i < 5; i++) s += '<path class="mk-leaf-fall" style="animation-delay:' + (-i * 2.9) + 's" d="M' + (240 + i * 190) + ' 0 q12 -8 20 4 q-12 8 -20 -4z"/>';
    s += blades(1330, 910, 2.3, 'mk-blade--front') + blades(1480, 915, 1.7) + blades(-20, 915, 1.5, 'mk-blade--front');
    return '<div class="mk-scene" aria-hidden="true">' + s + '</svg></div>';
  }
  return { scene: scene };
})();

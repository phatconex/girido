/* Giri Garden — cảnh nền: hồ trong rừng nhiều lớp, mỗi lớp chuyển động riêng. Dựng một lần lúc mở app. */
import Giri from './giri.js';

  /* ---- cảnh nền: hồ trong rừng, nhiều lớp, mỗi lớp chuyển động riêng ---- */
  function sprite(kind, x, y, size, stage) { return Giri.plant(stage == null ? 5 : stage, kind, size, true).replace('<svg ', '<svg x="' + x + '" y="' + y + '" '); }
  function cloud(x, y, k) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><ellipse class="mk-cloud" cx="0" cy="0" rx="90" ry="26"/><circle class="mk-cloud" cx="-30" cy="-18" r="34"/><circle class="mk-cloud" cx="22" cy="-26" r="42"/><circle class="mk-cloud" cx="62" cy="-8" r="26"/></g>'; }
  function star(x, y, r, d) { return '<path class="mk-spark" style="animation-delay:' + d + 's" d="M' + x + ' ' + (y - r) + ' L' + (x + r * 0.28) + ' ' + (y - r * 0.28) + ' L' + (x + r) + ' ' + y + ' L' + (x + r * 0.28) + ' ' + (y + r * 0.28) + ' L' + x + ' ' + (y + r) + ' L' + (x - r * 0.28) + ' ' + (y + r * 0.28) + ' L' + (x - r) + ' ' + y + ' L' + (x - r * 0.28) + ' ' + (y - r * 0.28) + 'z"/>'; }
  function blades(x, y, k, cls) {
    var s = '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">', i;
    for (i = 0; i < 5; i++) s += '<path class="mk-blade ' + (cls || '') + '" style="animation-delay:' + (-i * 0.6) + 's" d="M' + (i * 12 - 4) + ' 0 Q' + (i * 12 + (i - 2) * 6) + ' -' + (30 + (i % 3) * 14) + ' ' + (i * 12 + (i - 2) * 12) + ' -' + (52 + (i % 3) * 20) + ' Q' + (i * 12 + 6 + (i - 2) * 4) + ' -24 ' + (i * 12 + 6) + ' 0z"/>';
    return s + '</g>';
  }
  /* vị trí sao [x, y, bán kính] và đom đóm [x, y]: cố định, để mỗi lần mở app bầu trời vẫn vậy */
  var STARS = [[60, 90, 2.6], [150, 210, 2], [240, 60, 3], [300, 300, 2], [420, 120, 2.4], [470, 250, 2], [700, 300, 2.4], [760, 40, 2],
    [880, 220, 2.6], [940, 90, 2], [1010, 300, 2], [1060, 150, 2.8], [1120, 50, 2], [1340, 80, 2.4], [1400, 210, 2], [1460, 120, 2.8], [1530, 50, 2], [1560, 250, 2.4],
    [110, 330, 2], [380, 380, 2], [660, 420, 1.8], [900, 370, 2], [1290, 330, 2], [1500, 380, 1.8]];
  var FIREFLIES = [[250, 620], [470, 700], [640, 610], [930, 640], [1130, 690], [1330, 650], [1520, 690]];
  function scene() {
    /* Cảnh chia thành năm hình SVG chồng lên nhau, cùng khung nhìn nên khớp nhau từng điểm: lớp tĩnh (đất, đồi, mặt hồ) chỉ vẽ một lần,
       lớp động (mây, sóng, cây lắc, lá rơi) được trình duyệt tách riêng. Nhờ vậy thứ gì chuyển động thì chỉ lớp của nó phải vẽ lại,
       không kéo theo cả cảnh. Gộp hết vào một hình thì mỗi khung hình phải vẽ lại gần như toàn bộ màn hình, rất tốn CPU. */
    var OPEN = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMinYMax slice" aria-hidden="true" class="mk-layer';
    var layer = function (moving) { return '</svg>' + OPEN + (moving ? ' mk-layer--moving' : '') + '">'; };
    var s = OPEN + ' mk-layer--moving">', i;                                         // lớp 1 (động): sao, trăng, mặt trời, mây
    /* Mặt trời và trăng nằm ở khoảng trống giữa thẻ cây hôm nay và bảng việc, để không bị giao diện che mất. */
    /* trời đêm: sao và trăng khuyết, chỉ hiện khi cảnh là buổi tối (xem [data-sky] trong app.css) */
    s += '<g class="mk-night"><defs><mask id="mk-moon-mask"><rect x="420" y="20" width="260" height="260" fill="#fff"/><circle cx="592" cy="128" r="56" fill="#000"/></mask></defs>';
    STARS.forEach(function (p, i) { s += '<circle class="mk-star" style="animation-delay:' + (-(i % 7) * 0.55) + 's" cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '"/>'; });
    s += star(330, 150, 9, -0.4).replace('mk-spark', 'mk-star') + star(820, 110, 7, -1.6).replace('mk-spark', 'mk-star') + star(1470, 300, 8, -2.4).replace('mk-spark', 'mk-star');
    s += '<circle class="mk-moonglow" cx="550" cy="148" r="120"/><circle class="mk-moon" cx="550" cy="148" r="66" mask="url(#mk-moon-mask)"/></g>';
    s += '<g class="mk-sunwrap"><circle class="mk-halo" cx="580" cy="150" r="130"/><circle class="mk-sun" cx="580" cy="150" r="70"/></g>';
    s += '<g class="mk-drift mk-drift--slow" style="animation-delay:-60s">' + cloud(0, 150, 1) + '</g><g class="mk-drift mk-drift--slow" style="animation-delay:-150s">' + cloud(0, 250, 0.7) + '</g>';
    s += '<g class="mk-drift" style="animation-delay:-20s">' + cloud(0, 200, 0.9) + '</g><g class="mk-drift" style="animation-delay:-80s">' + cloud(0, 110, 1.2) + '</g>';
    s += layer(false);                                                              // lớp 2 (tĩnh): đồi, bờ xa, mặt hồ
    s += '<path class="mk-far" d="M0 560 Q120 400 250 440 Q360 330 500 430 Q620 500 760 400 Q880 320 1010 420 Q1150 500 1290 380 Q1430 300 1600 430 V900 H0z"/>';
    s += '<path class="mk-mid" d="M0 600 Q180 470 420 540 Q620 600 820 520 Q1040 440 1260 520 Q1440 580 1600 520 V900 H0z"/>';
    [[150, 548], [182, 540], [470, 556], [840, 528], [872, 520], [1180, 512], [1470, 548], [1500, 540]].forEach(function (p) { s += '<path class="mk-pine" d="M' + p[0] + ' ' + (p[1] - 44) + ' l13 44 h-26z"/>'; });
    /* bờ xa: hai dải đất chạy suốt chiều ngang, không có mép cắt; cây đứng trên bờ, phía trên mép nước */
    var WATER = 'M0 722 Q460 694 880 704 Q1250 686 1600 698 V900 H0z';
    s += '<defs><clipPath id="mk-water-clip"><path d="' + WATER + '"/></clipPath></defs>';
    s += '<path class="mk-meadow" d="M0 624 Q460 580 880 604 Q1250 572 1600 592 V900 H0z"/>';
    s += '<path class="mk-bank" d="M0 672 Q460 636 880 652 Q1250 628 1600 644 V900 H0z"/>';
    s += '<path class="mk-water" d="' + WATER + '"/><path class="mk-shoreline" d="M0 722 Q460 694 880 704 Q1250 686 1600 698"/>';
    s += layer(true);                                                               // lớp 3 (động): cây bờ xa, sóng, lấp lánh, sen
    s += sprite('thong', 930, 590, 96) + sprite('tron', 1060, 536, 150) + sprite('phuong', 1230, 514, 170) + sprite('bui', 1436, 606, 90) + sprite('bui', 846, 624, 70);
    s += '<g clip-path="url(#mk-water-clip)"><path class="mk-water-2" d="M640 766 Q1000 738 1700 766 V804 Q1100 776 640 804z"/><path class="mk-water-2" style="animation-delay:-4s" d="M560 838 Q900 814 1700 844 V874 Q1000 844 560 874z"/></g>';
    [[900, 752, 90, 0], [1010, 800, 120, -2], [1290, 756, 80, -4], [1400, 830, 130, -1], [860, 862, 110, -3]].forEach(function (w) { s += '<path class="mk-wave" style="animation-delay:' + w[3] + 's" d="M' + w[0] + ' ' + w[1] + ' q' + w[2] / 4 + ' -8 ' + w[2] / 2 + ' 0 t' + w[2] / 2 + ' 0"/>'; });
    s += star(960, 772, 11, 0) + star(1150, 822, 8, -1.2) + star(1350, 782, 12, -2.1) + star(1490, 852, 9, -0.6) + star(1060, 866, 9, -2.6) + star(880, 824, 7, -1.7);
    s += '<ellipse class="mk-lily" cx="1184" cy="748" rx="28" ry="9"/><ellipse class="mk-lily" style="animation-delay:-2s" cx="1262" cy="766" rx="18" ry="6"/><ellipse class="mk-lily" style="animation-delay:-3s" cx="1090" cy="758" rx="20" ry="6"/>' + sprite('sen', 1150, 676, 70);
    s += blades(1010, 716, 0.3) + blades(1392, 708, 0.34) + blades(1560, 712, 0.3);
    s += layer(false);                                                              // lớp 4 (tĩnh): bãi cỏ gần, hoa
    s += '<path class="mk-near" d="M0 640 Q280 590 560 640 Q760 680 800 780 Q820 850 770 900 H0z"/><path class="mk-shoreline" clip-path="url(#mk-water-clip)" d="M0 640 Q280 590 560 640 Q760 680 800 780 Q820 850 770 900"/>';
    [[60, 690], [330, 660], [520, 690], [640, 760], [700, 850], [470, 870]].forEach(function (f, i) { s += '<circle class="mk-flower' + (i % 2 ? ' mk-flower--pink' : '') + '" cx="' + f[0] + '" cy="' + f[1] + '" r="5"/><circle class="mk-flower' + (i % 2 ? '' : ' mk-flower--pink') + '" cx="' + (f[0] + 12) + '" cy="' + (f[1] + 5) + '" r="3.5"/>'; });
    s += layer(true);                                                               // lớp 5 (động): cây gần, cỏ, chim, đom đóm, lá rơi
    s += sprite('xoai', -90, 250, 330) + sprite('tre', 560, 470, 150) + sprite('bui', 660, 590, 96);
    s += blades(610, 720, 0.5) + blades(20, 700, 0.55) + blades(700, 800, 0.45);
    s += '<g class="mk-flock"><g transform="translate(0 260)"><path class="mk-bird mk-flap" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g><g transform="translate(-70 300) scale(0.7)"><path class="mk-bird mk-flap" style="animation-delay:-0.3s" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g><g transform="translate(-40 230) scale(0.8)"><path class="mk-bird mk-flap" style="animation-delay:-0.5s" d="M0 0 q10 -12 20 0 q10 -12 20 0"/></g></g>';
    s += '<g class="mk-night">'; FIREFLIES.forEach(function (p, i) { s += '<circle class="mk-firefly" style="animation-delay:' + (-i * 1.3) + 's" cx="' + p[0] + '" cy="' + p[1] + '" r="4"/>'; }); s += '</g>';
    for (i = 0; i < 5; i++) s += '<path class="mk-leaf-fall" style="animation-delay:' + (-i * 2.9) + 's" d="M' + (240 + i * 190) + ' 0 q12 -8 20 4 q-12 8 -20 -4z"/>';
    s += blades(1330, 910, 2.3, 'mk-blade--front') + blades(1480, 915, 1.7) + blades(-20, 915, 1.5, 'mk-blade--front');
    return '<div class="mk-scene" aria-hidden="true">' + s + '</svg></div>';
  }

export { scene };

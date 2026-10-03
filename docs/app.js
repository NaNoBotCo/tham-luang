/* Tham Luang, Drawn — everything that moves. Plain canvas 2D, no libraries. */
(function () {
  "use strict";
  var U = window.UI || {};
  var TH = U.lang === "th";
  var Q = new URLSearchParams(location.search);
  var CARD = Q.has("card");
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var $ = function (id) { return document.getElementById(id); };
  var C = { cave: "#0c1316", rock: "#1b2529", rock2: "#2a363b", ink: "#f1ebdd", dim: "#b9b3a6", lamp: "#ffc85a", water: "#3db3c8", deep: "#17586a", line: "#9be38c", pink: "#ff8f7a" };
  var nf = function (n, d) { return Number(n).toLocaleString(TH ? "th-TH" : "en-US", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  // piecewise-linear keyframes [[t, v], ...]
  function keys(k, t) {
    if (t <= k[0][0]) return k[0][1];
    for (var i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
    return k[k.length - 1][1];
  }
  // fit a canvas to its CSS width at an aspect ratio (w/h); returns {c, w, h}
  function fit(cv, ar, minH) {
    var w = cv.clientWidth || cv.parentNode.clientWidth;
    var h = ar ? Math.max(minH || 0, w / ar) : cv.clientHeight;
    if (ar) cv.style.height = h + "px";
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    var c = cv.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { c: c, w: w, h: h };
  }

  /* ---------- the loop: only canvases on screen are drawn ---------- */
  var scenes = [];
  function scene(cv, ar, minH, draw, opts) {
    if (!cv) return null;
    var s = { cv: cv, ar: ar, minH: minH, draw: draw, vis: false, g: null, opts: opts || {} };
    s.size = function () { s.g = fit(cv, typeof s.ar === "function" ? s.ar() : s.ar, s.minH); s.dirty = true; };
    s.size(); scenes.push(s);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { s.vis = e[0].isIntersecting; if (s.vis && s.opts.onShow) s.opts.onShow(); }).observe(cv);
    else s.vis = true;
    return s;
  }
  var last = 0;
  function frame(ms) {
    var dt = Math.min(0.1, (ms - last) / 1000 || 0); last = ms;
    for (var i = 0; i < scenes.length; i++) { var s = scenes[i]; if (s.vis || CARD) s.draw(s.g.c, s.g.w, s.g.h, ms / 1000, dt); }
    requestAnimationFrame(frame);
  }
  var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { scenes.forEach(function (s) { s.size(); }); }, 120); });

  /* ================= 1. HERO: the mountain in profile, eighteen days ================= */
  // t = hours since 00:00, 23 June 2018. 432 h = 00:00, 11 July.
  var T_END = 432;
  var RAIN = [[0, 0], [13, 0.1], [16, 0.9], [40, 0.65], [72, 0.8], [100, 1], [125, 0.7], [160, 0.5], [180, 0.25], [200, 0.45], [222, 0.1], [250, 0.2], [270, 0.05], [335, 0.05], [352, 0.35], [370, 0.15], [400, 0.2], [425, 0.3], [432, 0.55]];
  var WATER = [[0, 0.02], [15, 0.05], [30, 0.55], [72, 0.78], [110, 0.92], [170, 0.92], [230, 0.86], [262, 0.8], [290, 0.62], [340, 0.48], [360, 0.44], [426, 0.4], [432, 0.62]];
  // the cave profile: s from mouth (0) to ledge (1); dy in units of A (positive = lower)
  var PROF = [[0, 0], [0.05, 0.05], [0.14, -0.15], [0.3, 0.0], [0.36, 0.55], [0.42, 0.1], [0.48, 0.65], [0.55, 0.15], [0.6, 0.0], [0.66, 0.6], [0.72, 0.2], [0.78, 0.7], [0.84, 0.05], [0.9, 0.4], [0.95, -0.6], [1, -1.2]];
  var CH = [[0.05, 1.5], [0.14, 1.7], [0.3, 1.9], [0.6, 1.1], [0.84, 1.3], [1, 1.5]]; // chamber widenings
  function profY(s) {
    for (var i = 1; i < PROF.length; i++) if (s <= PROF[i][0]) { var a = PROF[i - 1], b = PROF[i]; return lerp(a[1], b[1], (1 - Math.cos(Math.PI * (s - a[0]) / (b[0] - a[0]))) / 2); }
    return PROF[PROF.length - 1][1];
  }
  function profR(s) {
    var r = 0.3 + 0.07 * Math.sin(s * 41) + 0.04 * Math.sin(s * 97);
    for (var i = 0; i < CH.length; i++) r *= 1 + (CH[i][1] - 1) * Math.exp(-Math.pow((s - CH[i][0]) / 0.025, 2));
    return r;
  }
  // the Sleeping Lady: six bell curves added together
  var LADY = [[0.16, 0.42, 0.045], [0.33, 0.62, 0.07], [0.5, 0.42, 0.09], [0.68, 0.66, 0.065], [0.85, 0.36, 0.055], [0.5, 0.28, 0.38]];
  function lady(x) {
    var y = 0;
    for (var i = 0; i < LADY.length; i++) y += LADY[i][1] * Math.exp(-Math.pow((x - LADY[i][0]) / LADY[i][2], 2));
    return y + 0.012 * Math.sin(x * 83) + 0.008 * Math.sin(x * 191 + 1);
  }
  // who is where: each person is {kind, path(t) -> s or null, out(t)}
  var TEAMN = 13, DAYSTART = [373.5, 397.5, 421.5], JOURNEY = [3, 2.5, 2.1], SPACING = 0.75;
  var DAYOF = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2];
  var dep = [], k = [0, 0, 0];
  for (var i = 0; i < TEAMN; i++) { var d = DAYOF[i]; dep.push(DAYSTART[d] + SPACING * k[d]); k[d]++; }
  // s along the cave at time t for boy i (s<0 = outside, walking off)
  function boyS(i, t) {
    var go = 15 + i * 0.08;
    if (t < go) return -0.04 - 0.01 * i;
    if (t < go + 4) return smooth((t - go) / 4) * 1;
    var d = dep[i], j = JOURNEY[DAYOF[i]];
    if (t < d) return 1;
    if (t < d + j) return lerp(1, 0.3, (t - d) / j);
    if (t < d + j + 0.9) return lerp(0.3, 0, (t - d - j) / 0.9);
    return -0.02 - Math.min(0.12, (t - d - j - 0.9) * 0.05);
  }
  var LASTOUT = dep[12] + JOURNEY[2] + 0.9;
  function sealS(i, t) {
    if (t < 252) return null;
    if (t < 258) return lerp(0.3, 1, (t - 252) / 6);
    var d = dep[12] + 0.75 * (i + 1), j = 2.1;
    if (t < d) return 1;
    if (t < d + j) return lerp(1, 0.3, (t - d) / j);
    if (t < d + j + 0.8) return lerp(0.3, 0, (t - d - j) / 0.8);
    return null;
  }
  function finderS(i, t) { // Volanthen and Stanton, 2 July
    if (t < 228 || t > 251) return null;
    if (t < 237.6) return lerp(0.3, 1, (t - 228) / 9.6);
    if (t < 240.6) return 1;
    return lerp(1, 0.3, (t - 240.6) / 10.4);
  }
  function leadS(i, t) { // the diver beside each boy on the way out
    var d = dep[i], j = JOURNEY[DAYOF[i]];
    if (t < d - 2.4 || t > d + j) return null;
    if (t < d) return lerp(0.3, 1, (t - d + 2.4) / 2.4);
    return lerp(1, 0.3, (t - d) / j);
  }
  var heroT = 0, heroPlay = !REDUCE, heroHold = 0;
  if (Q.has("t")) { heroT = clamp(parseFloat(Q.get("t")) || 0, 0, T_END); heroPlay = false; }
  if (CARD && !Q.has("t")) { heroT = 253; heroPlay = false; }
  var hero = scene($("scene"), null, 0, function (c, w, h, now, dt) {
    if (heroPlay) {
      if (heroT >= T_END) { heroHold += dt; if (heroHold > 3.5) { heroT = 0; heroHold = 0; } }
      else heroT = Math.min(T_END, heroT + dt * 10.8);
      syncHero();
    }
    drawHero(c, w, h, heroT, now);
  });
  function drawHero(c, w, h, t, now) {
    var hod = (t % 24 + 24) % 24;
    var sun = Math.sin((hod - 6) / 12 * Math.PI); // -1..1
    var rain = keys(RAIN, t), water = keys(WATER, t);
    var day = clamp(sun * 1.6 + 0.3, 0, 1) * (1 - 0.55 * rain);
    // sky
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, mix("#05090d", "#5c7f90", day)); g.addColorStop(1, mix("#0c1418", "#a9b8b4", day * 0.9));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // stars on clear nights
    if (day < 0.25 && rain < 0.3) {
      c.fillStyle = "rgba(255,255,240," + (0.7 * (1 - day * 4) * (1 - rain * 3)) + ")";
      for (var i = 0; i < 140; i++) { var sx = hash(i) * w, sy = hash(i + 500) * h * 0.55; c.fillRect(sx, sy, hash(i + 9) < 0.1 ? 1.6 : 1, hash(i + 9) < 0.1 ? 1.6 : 1); }
    }
    // clouds: soft bands whose darkness follows the rain
    for (var b = 0; b < 4; b++) {
      var cy = h * (0.08 + b * 0.07), drift = (now * 6 + b * 230) % (w + 600) - 300;
      c.fillStyle = "rgba(" + (day > 0.3 ? "70,82,88" : "30,38,44") + "," + (0.12 + rain * 0.35) + ")";
      for (var q = 0; q < 6; q++) { c.beginPath(); c.ellipse((drift + q * 260) % (w + 600) - 150, cy + 14 * Math.sin(q * 2 + b), 170, 26 + 10 * b, 0, 0, 7); c.fill(); }
    }
    // lightning in the heaviest rain
    if (rain > 0.75 && !CARD && hash(Math.floor(now * 3)) > 0.985) { c.fillStyle = "rgba(220,230,255,.25)"; c.fillRect(0, 0, w, h); }
    // mountain
    var gy = h * 0.93, top = h * (w < 600 ? 0.46 : 0.36), mh = gy - top;
    var X0 = -w * 0.02, XW = w * 1.04;
    var mx = function (x) { return X0 + x * XW; };
    var my = function (x) { return gy - lady(x) * mh * 0.95; };
    c.beginPath(); c.moveTo(0, h);
    for (var x = 0; x <= 1.0001; x += 0.004) c.lineTo(mx(x), my(x));
    c.lineTo(w, h); c.closePath();
    var mg = c.createLinearGradient(0, top, 0, gy);
    mg.addColorStop(0, mix("#1d2a2a", "#4d6152", day)); mg.addColorStop(1, mix("#131b1d", "#3b4740", day));
    c.fillStyle = mg; c.fill();
    c.save(); c.clip();
    // limestone beds: wavy lines inside the mountain
    c.strokeStyle = "rgba(220,215,190," + (0.05 + 0.06 * day) + ")"; c.lineWidth = 1;
    for (var L = 0; L < 14; L++) {
      c.beginPath();
      for (x = 0; x <= 1.0001; x += 0.01) { var yy = top + L * mh / 12 + 8 * Math.sin(x * 9 + L) + 5 * Math.sin(x * 23 - L * 2); x === 0 ? c.moveTo(mx(x), yy) : c.lineTo(mx(x), yy); }
      c.stroke();
    }
    // rain soaking down: faint drips moving down through the rock
    c.fillStyle = "rgba(61,179,200," + (0.25 * rain) + ")";
    for (i = 0; i < 90 * rain; i++) { var px = hash(i + 40) , py = ((now * 0.06 + hash(i + 80)) % 1); var X = mx(px); var Y = lerp(my(px), gy, py); c.fillRect(X, Y, 1.4, 5); }
    c.restore();
    // forest along the ridge
    c.fillStyle = mix("#0f1714", "#2c4430", day);
    for (x = 0.01; x < 1; x += 0.006) { var r = 3 + 3 * hash(x * 1000); c.beginPath(); c.arc(mx(x), my(x) + 2, r, 0, 7); c.fill(); }
    // the cave, under the mountain
    var A = mh * 0.085, cy0 = gy - mh * 0.15, s0x = 0.86, s1x = 0.17;
    var cx = function (s) { return mx(lerp(s0x, s1x, s)) + 6 * Math.sin(s * 30); };
    var cyy = function (s) { return cy0 + profY(s) * A; };
    var N = 220, up = [], dn = [];
    for (i = 0; i <= N; i++) { var s = i / N, rr = profR(s) * A; up.push([cx(s), cyy(s) - rr]); dn.push([cx(s), cyy(s) + rr]); }
    c.beginPath(); c.moveTo(up[0][0], up[0][1]);
    for (i = 1; i <= N; i++) c.lineTo(up[i][0], up[i][1]);
    for (i = N; i >= 0; i--) c.lineTo(dn[i][0], dn[i][1]);
    c.closePath();
    c.fillStyle = "#070b0d"; c.fill();
    c.save(); c.clip();
    // water: one surface, rising and falling with the reports
    var wy = cy0 + A * (0.9 - 1.6 * water);
    var wg = c.createLinearGradient(0, wy, 0, wy + A * 3);
    wg.addColorStop(0, "rgba(61,179,200,.95)"); wg.addColorStop(1, "rgba(23,88,106,.95)");
    c.fillStyle = wg; c.fillRect(0, wy, w, h);
    c.strokeStyle = "rgba(200,245,255,.6)"; c.beginPath();
    for (x = 0; x < w; x += 6) { var yw = wy + 1.2 * Math.sin(x * 0.08 + now * 2); x ? c.lineTo(x, yw) : c.moveTo(x, yw); }
    c.stroke();
    c.restore();
    c.strokeStyle = "rgba(240,230,200,.18)"; c.lineWidth = 1; c.beginPath(); c.moveTo(up[0][0], up[0][1]);
    for (i = 1; i <= N; i++) c.lineTo(up[i][0], up[i][1]);
    c.stroke();
    // the mouth
    var mX = cx(0), mY = cyy(0);
    c.fillStyle = "#070b0d"; c.beginPath(); c.ellipse(mX + 4, mY, A * 0.5, A * 0.55, 0, 0, 7); c.fill();
    // the camp: lights that grow with the rescue
    var camp = clamp((t - 30) / 200, 0, 1);
    for (i = 0; i < 6 + 60 * camp; i++) {
      var tx = mX + 14 + hash(i + 3) * (w - mX - 20), ty = gy - 4 - hash(i + 7) * (gy - my(clamp((tx - X0) / XW, 0, 1))) * 0.25;
      var tw = 0.5 + 0.5 * Math.sin(now * 3 + i);
      c.fillStyle = "rgba(255,200,90," + (0.35 + 0.5 * tw) * (1 - day * 0.6) + ")"; c.fillRect(tx, ty, 2, 2);
    }
    // pipes out of the mouth once pumping starts
    if (t > 110) { c.strokeStyle = "rgba(240,140,60,.7)"; c.lineWidth = 2; c.beginPath(); c.moveTo(mX, mY + A * 0.3); c.quadraticCurveTo((mX + w) / 2, gy + 4, w, gy - 6); c.stroke(); }
    // Saman Kunan's mark, from 6 July
    if (t > 289) { var ms = 0.45, sx2 = cx(ms), sy2 = cyy(ms) - profR(ms) * A - 8; star(c, sx2, sy2, 4.5, "rgba(255,200,90," + (0.6 + 0.25 * Math.sin(now * 1.5)) + ")"); }
    // people
    var inside = 0, outN = 0;
    var person = function (s, col, rad, k2) {
      if (s === null) return;
      var X, Y;
      if (s < 0) { X = mX + (-s) * w * 1.1 + 6; Y = gy - 6 - 3 * hash(k2); }
      else { X = cx(s) + (k2 % 5 - 2) * 3.2 * (s > 0.97 ? 1 : 0.3); Y = cyy(s) + profR(s) * A * 0.55 - (s > 0.97 ? (k2 % 3) * 2.6 : 0); }
      var gl = c.createRadialGradient(X, Y, 0, X, Y, rad * 4);
      gl.addColorStop(0, col); gl.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = gl; c.beginPath(); c.arc(X, Y, rad * 4, 0, 7); c.fill();
      c.fillStyle = "#fff8e0"; c.beginPath(); c.arc(X, Y, rad * 0.55, 0, 7); c.fill();
    };
    for (i = 0; i < 2; i++) person(finderS(i, t), "rgba(155,227,140,.9)", 3, 30 + i);
    for (i = 0; i < 4; i++) person(sealS(i, t), "rgba(120,180,255,.9)", 2.6, 40 + i);
    for (i = 0; i < TEAMN; i++) person(leadS(i, t), "rgba(155,227,140,.9)", 2.6, 60 + i);
    for (i = 0; i < TEAMN; i++) {
      var bs = boyS(i, t);
      if (bs >= 0) inside++; else if (t > 300) outN++;
      person(bs, "rgba(255,200,90,.95)", 3.2, i);
    }
    // counters
    if (!CARD) {
      c.font = "600 14px " + (TH ? "'Noto Sans Thai'," : "") + "system-ui,sans-serif"; c.textAlign = "right"; c.fillStyle = "rgba(241,235,221,.85)";
      var txt = U.inside.replace("{n}", inside) + (outN ? " · " + U.out_n.replace("{n}", outN) : "");
      c.fillText(txt, w - 16, h - 14);
    }
  }
  function star(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } c.fill(); }
  function mix(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  // hero controls
  var tday = $("tday"), tplay = $("tplay"), tdate = $("tdate"), tev = $("tev"), dayLis = document.querySelectorAll(".days li");
  var lastDay = -1;
  function syncHero() {
    if (!tday) return;
    tday.value = heroT;
    var d = clamp(Math.floor(heroT / 24), 0, 17), hod = heroT - d * 24;
    var dd = 23 + d, mo = 5; if (dd > 30) { dd -= 30; mo = 6; }
    var hh = Math.floor(hod), mm = Math.floor((hod - hh) * 60 / 15) * 15;
    tdate.textContent = dd + " " + U.months[mo] + " " + (TH ? "2561" : "2018") + " · " + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    if (d !== lastDay) {
      lastDay = d; tev.textContent = U.days[d];
      for (var i = 0; i < dayLis.length; i++) dayLis[i].classList.toggle("on", i === d);
    }
  }
  if (tday) {
    tday.addEventListener("input", function () { heroT = parseFloat(tday.value); heroPlay = false; tplay.textContent = U.play; syncHero(); });
    tplay.addEventListener("click", function () { heroPlay = !heroPlay; if (heroPlay && heroT >= T_END) heroT = 0; tplay.textContent = heroPlay ? U.pause : U.play; });
    tplay.textContent = heroPlay ? U.pause : U.play;
    for (var di = 0; di < dayLis.length; di++) (function (li) {
      li.addEventListener("click", function () { heroT = +li.dataset.d * 24 + 12; heroPlay = false; tplay.textContent = U.play; syncHero(); $("top").scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" }); });
    })(dayLis[di]);
    syncHero();
  }

  /* ================= 2. MAP: the way in, from above ================= */
  // Points copied from Per Meistrup's CC0 map (pixels; 120 px = 500 m), mouth first.
  var ROUTE = [[452, 236, "mouth"], [440, 226], [436, 214, "c1"], [433, 195], [437, 180], [430, 163], [430, 145, "c2"], [420, 126], [405, 115], [393, 113], [383, 122], [372, 131], [358, 141], [342, 148, "c3"], [322, 141], [300, 135], [280, 140], [262, 137], [246, 130], [236, 137], [228, 152], [212, 161], [196, 166, "tj"], [188, 190], [180, 222], [172, 255], [165, 280], [160, 294, "pb"], [148, 305], [128, 316], [104, 322], [80, 330, "ledge"]];
  var MONK = [[196, 166], [200, 140], [205, 110], [208, 82], [210, 56]];
  var MPP = 500 / 120;
  function catmull(P, n) {
    var out = [];
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (var j = 0; j < n; j++) {
        var t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3), i]);
      }
    }
    var L = P[P.length - 1]; out.push([L[0], L[1], P.length - 1]); return out;
  }
  var RP = catmull(ROUTE, 12), RL = [0];
  for (var ri = 1; ri < RP.length; ri++) RL.push(RL[ri - 1] + Math.hypot(RP[ri][0] - RP[ri - 1][0], RP[ri][1] - RP[ri - 1][1]) * MPP);
  var TOTAL = RL[RL.length - 1];
  var NAMED = {}; // metres along the trace for each named point
  ROUTE.forEach(function (p, i) { if (p[2]) { for (var j = 0; j < RP.length; j++) if (RP[j][2] === i) { NAMED[p[2]] = RL[j]; break; } } });
  var FLOOD = [[NAMED.c3 + 40, NAMED.c3 + 420], [NAMED.c3 + 620, NAMED.pb - 20], [NAMED.pb + 30, NAMED.ledge - 50]];
  document.querySelectorAll(".trace").forEach(function (el) { el.textContent = nf(TOTAL / 1000, 1) + (TH ? " กม." : " km"); });
  function at(m) { // point on the trace at m metres
    m = clamp(m, 0, TOTAL);
    var lo = 0, hi = RL.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (RL[mid] < m) lo = mid; else hi = mid; }
    var f = (m - RL[lo]) / (RL[hi] - RL[lo] || 1);
    return [lerp(RP[lo][0], RP[hi][0], f), lerp(RP[lo][1], RP[hi][1], f)];
  }
  function flooded(m) { for (var i = 0; i < FLOOD.length; i++) if (m >= FLOOD[i][0] && m <= FLOOD[i][1]) return true; return false; }
  var mpos = $("mpos"), mdist = $("mdist"), mwhere = $("mwhere"), mode = "lay", mPos = 0, mRun = false;
  function mapUpdate() {
    var m = mode === "lay" ? mPos * TOTAL : (1 - mPos) * TOTAL;
    if (mdist) mdist.textContent = nf(Math.round(m / 10) * 10) + " m";
    var best = "mouth", bm = -1;
    for (var kk in NAMED) if (NAMED[kk] <= m + 25 && NAMED[kk] > bm) { bm = NAMED[kk]; best = kk; }
    if (mwhere) mwhere.textContent = U.places[best] + " · " + (flooded(m) ? U.places.flooded : U.places.dry);
  }
  var plan = scene($("plan"), function () { return innerWidth < 640 ? 0.95 : 1.55; }, 300, function (c, w, h, now, dt) {
    if (mRun) { mPos = Math.min(1, mPos + dt / 9); if (mpos) mpos.value = mPos * 1000; if (mPos >= 1) mRun = false; mapUpdate(); }
    var minx = 20, maxx = 470, miny = 40, maxy = 345;
    var sc = Math.min((w - 40) / (maxx - minx), (h - 40) / (maxy - miny));
    var ox = (w - (maxx - minx) * sc) / 2 - minx * sc, oy = (h - (maxy - miny) * sc) / 2 - miny * sc;
    var P = function (p) { return [ox + p[0] * sc, oy + p[1] * sc]; };
    c.fillStyle = "#0a1013"; c.fillRect(0, 0, w, h);
    // contour lines of an invented hill field, drawn from a sum of sines (decoration, not the real terrain)
    c.strokeStyle = "rgba(155,227,140,.07)"; c.lineWidth = 1;
    for (var lv = -2; lv <= 2; lv += 0.5) {
      for (var gx = 0; gx < w; gx += 6) for (var gyy = 0; gyy < h; gyy += 6) {
        var f = Math.sin(gx * 0.011) + Math.cos(gyy * 0.013 + gx * 0.004) + 0.6 * Math.sin((gx + gyy) * 0.02);
        if (Math.abs(f - lv) < 0.03) c.fillRect(gx, gyy, 1.5, 1.5);
      }
    }
    // Monk's Series branch
    c.strokeStyle = "rgba(241,235,221,.25)"; c.lineWidth = 6; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); MONK.forEach(function (p, i) { var q = P(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
    // the passage
    c.strokeStyle = "rgba(241,235,221,.32)"; c.lineWidth = 10;
    c.beginPath(); RP.forEach(function (p, i) { var q = P(p); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
    // flooded stretches
    c.strokeStyle = C.water; c.lineWidth = 7;
    FLOOD.forEach(function (fz) { c.beginPath(); for (var m = fz[0]; m <= fz[1]; m += 8) { var q = P(at(m)); m === fz[0] ? c.moveTo(q[0], q[1]) : c.lineTo(q[0], q[1]); } c.stroke(); });
    // pumps (from the same map)
    [[375, 130, 6], [430, 172, 3]].forEach(function (pp) { var q = P(pp); c.fillStyle = "#6fb0ff"; for (var i = 0; i < pp[2]; i++) c.fillRect(q[0] - 9 + (i % 3) * 7, q[1] - 12 - Math.floor(i / 3) * 7, 5, 5); });
    // the guideline / the way out
    var mNow = mPos * TOTAL;
    c.strokeStyle = C.line; c.lineWidth = 2.2; c.beginPath();
    if (mode === "lay") { for (var m = 0; m <= mNow; m += 6) { var q = P(at(m)); m ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } }
    else { for (m = 0; m <= TOTAL; m += 6) { q = P(at(m)); m ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } }
    c.stroke();
    // the team on the ledge
    var L = P(at(TOTAL));
    for (var b = 0; b < 13; b++) {
      var gone = mode === "out" && b < Math.floor(mPos * 13.999);
      if (gone) continue;
      var a = b / 13 * Math.PI * 2, X = L[0] + 9 * Math.cos(a), Y = L[1] + 9 * Math.sin(a);
      c.fillStyle = "rgba(255,200,90," + (0.7 + 0.3 * Math.sin(now * 2 + b)) + ")"; c.beginPath(); c.arc(X, Y, 2.6, 0, 7); c.fill();
    }
    // the diver (and, on the way out, the boy)
    var D = P(at(mode === "lay" ? mNow : TOTAL - mNow));
    var gl = c.createRadialGradient(D[0], D[1], 0, D[0], D[1], 18); gl.addColorStop(0, "rgba(155,227,140,.9)"); gl.addColorStop(1, "rgba(155,227,140,0)");
    c.fillStyle = gl; c.beginPath(); c.arc(D[0], D[1], 18, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(D[0], D[1], 3, 0, 7); c.fill();
    if (mode === "out" && mPos > 0 && mPos < 1) { c.fillStyle = C.lamp; c.beginPath(); c.arc(D[0] + 6, D[1] + 2, 2.6, 0, 7); c.fill(); }
    // labels
    c.font = "600 " + (w < 500 ? 11 : 13) + "px " + (TH ? "'Noto Sans Thai'," : "") + "system-ui,sans-serif";
    var LBL = { mouth: [8, 14, "left"], c1: [10, 0, "left"], c2: [10, -2, "left"], c3: [0, 24, "center"], tj: [-10, -8, "right"], pb: [-12, 4, "right"], ledge: [0, 26, "center"] };
    for (var key in LBL) {
      var pt = P(at(NAMED[key])), o = LBL[key];
      c.fillStyle = "#fff"; c.beginPath(); c.arc(pt[0], pt[1], 3.4, 0, 7); c.fill();
      c.textAlign = o[2]; c.fillStyle = key === "ledge" ? C.lamp : "rgba(241,235,221,.9)";
      c.fillText(U.places[key], pt[0] + o[0], pt[1] + o[1]);
    }
    var mk = P(MONK[MONK.length - 1]); c.textAlign = "center"; c.fillStyle = "rgba(241,235,221,.5)"; c.fillText(U.places.monk, mk[0], mk[1] - 8);
    var pq = P([375, 130]); c.textAlign = "center"; c.fillStyle = "#9cc8ff"; c.fillText(U.places.pumps, pq[0], pq[1] - 22);
    // scale bar and north
    var bx = w - 20 - 120 * sc, by = h - 18;
    c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 120 * sc, by); c.moveTo(bx, by - 4); c.lineTo(bx, by + 4); c.moveTo(bx + 120 * sc, by - 4); c.lineTo(bx + 120 * sc, by + 4); c.stroke();
    c.textAlign = "center"; c.fillStyle = "#fff"; c.fillText("500 m", bx + 60 * sc, by - 8);
    c.beginPath(); c.moveTo(w - 24, 22); c.lineTo(w - 30, 40); c.lineTo(w - 18, 40); c.closePath(); c.fill(); c.fillText("N", w - 24, 54);
    // legend
    c.textAlign = "left"; c.fillStyle = C.water; c.fillRect(16, h - 26, 18, 6); c.fillStyle = "rgba(241,235,221,.85)"; c.fillText(U.places.flooded, 40, h - 19);
  }, { onShow: function () { if (!plan.started && !REDUCE) { plan.started = true; mRun = true; } } });
  if (mpos) {
    mpos.addEventListener("input", function () { mPos = mpos.value / 1000; mRun = false; mapUpdate(); });
    $("mlay").addEventListener("click", function () { mode = "lay"; mPos = 0; mRun = true; mapUpdate(); this.classList.add("hot"); $("mout").classList.remove("hot"); });
    $("mout").addEventListener("click", function () { mode = "out"; mPos = 0; mRun = true; mapUpdate(); this.classList.add("hot"); $("mlay").classList.remove("hot"); });
    mapUpdate();
  }

  /* ================= 3. SQUEEZE: 38 × 72 cm, to scale, with footballs ================= */
  var HA = 36, HB = 19, HN = 2.6, BR = 11; // half-width, half-height, superellipse power, ball radius (cm)
  function holeY(x) { var u = Math.abs(x) / HA; return u >= 1 ? 0 : HB * Math.pow(1 - Math.pow(u, HN), 1 / HN); }
  function ballFits(bx, by) { for (var a = 0; a < 6.283; a += 0.1) { var x = bx + BR * Math.cos(a), y = by + BR * Math.sin(a); if (Math.abs(y) > holeY(x) + 0.01) return false; } return true; }
  // a loop of attempts: three side by side (fit), a fourth (no), two stacked (no)
  var TRIES = [[-22.5, 0], [0, 0], [22.5, 0], [34, 0], [0, 11.5]];
  scene($("squeezecv"), 1.25, 0, function (c, w, h, now) {
    var sc = (w * 0.76) / (HA * 2), ox = w * 0.47, oy = h * 0.47;
    c.fillStyle = "#151d20"; c.fillRect(0, 0, w, h);
    // rock: blobs from a sum of sines
    for (var i = 0; i < 260; i++) { var x = hash(i) * w, y = hash(i + 99) * h, r = 6 + 22 * hash(i + 7); c.fillStyle = "rgba(" + (60 + 30 * hash(i + 3)) + "," + (66 + 30 * hash(i + 4)) + "," + (64 + 20 * hash(i + 5)) + ",.35)"; c.beginPath(); c.ellipse(x, y, r, r * 0.6, hash(i + 2) * 3, 0, 7); c.fill(); }
    // the hole
    c.beginPath();
    for (var a = 0; a <= 200; a++) { var xx = -HA + a / 200 * HA * 2; var yy = holeY(xx); a ? c.lineTo(ox + xx * sc, oy - yy * sc) : c.moveTo(ox + xx * sc, oy - yy * sc); }
    for (a = 200; a >= 0; a--) { xx = -HA + a / 200 * HA * 2; c.lineTo(ox + xx * sc, oy + holeY(xx) * sc); }
    c.closePath();
    var hg = c.createRadialGradient(ox, oy, 0, ox, oy, HA * sc); hg.addColorStop(0, "#020405"); hg.addColorStop(1, "#0b1214");
    c.fillStyle = hg; c.fill(); c.strokeStyle = "rgba(241,235,221,.6)"; c.lineWidth = 1.5; c.stroke();
    // footballs: a 4-second cycle per step
    var cyc = (now / 1.6) % (TRIES.length + 2), step = Math.floor(cyc), f = cyc - step;
    for (var b = 0; b < Math.min(step + 1, TRIES.length); b++) {
      var tr = TRIES[b], fits = b < 3 ? ballFits(tr[0], tr[1]) : false;
      var px = tr[0], py = tr[1];
      if (b === step) { var e = smooth(f * 1.6); px = lerp(-HA - 20, tr[0], e); if (!fits && f > 0.6) px = tr[0] - 10 * Math.sin((f - 0.6) * 12) * (1 - f); }
      if (b >= 3 && b < step) continue; // failed tries leave
      if (b >= 3 && step === TRIES.length + 1) continue;
      ball(c, ox + px * sc, oy - py * sc, BR * sc, now * (b === step ? 3 : 0) + b, fits || b === step && f < 0.6 ? "#fff" : C.pink, !fits && b === step && f > 0.6);
    }
    // rulers
    c.strokeStyle = "rgba(241,235,221,.7)"; c.fillStyle = "rgba(241,235,221,.85)"; c.lineWidth = 1; c.font = "12px system-ui,sans-serif"; c.textAlign = "center";
    var ry = oy + HB * sc + 22;
    c.beginPath(); c.moveTo(ox - HA * sc, ry); c.lineTo(ox + HA * sc, ry); c.stroke();
    for (var cm = 0; cm <= 72; cm += 2) { var X = ox - HA * sc + cm * sc, tl = cm % 10 === 0 ? 7 : 3; c.beginPath(); c.moveTo(X, ry - tl); c.lineTo(X, ry); c.stroke(); if (cm % 10 === 0) c.fillText(cm, X, ry + 15); }
    c.fillText(TH ? "72 ซม." : "72 cm", ox, ry + 34);
    var rx = ox + HA * sc + 14;
    if (rx + 30 < w) {
      c.beginPath(); c.moveTo(rx, oy - HB * sc); c.lineTo(rx, oy + HB * sc); c.stroke();
      for (cm = 0; cm <= 38; cm += 2) { var Y = oy + HB * sc - cm * sc; tl = cm % 10 === 0 ? 7 : 3; c.beginPath(); c.moveTo(rx, Y); c.lineTo(rx + tl, Y); c.stroke(); }
      c.save(); c.translate(rx + 22, oy); c.rotate(-Math.PI / 2); c.fillText(TH ? "38 ซม." : "38 cm", 0, 0); c.restore();
    }
    c.textAlign = "left"; c.fillStyle = C.lamp; c.font = "600 14px " + (TH ? "'Noto Sans Thai'," : "") + "system-ui,sans-serif";
    c.fillText(TH ? "ลูกฟุตบอลเบอร์ 5 · 22 ซม." : "size 5 football · 22 cm", 14, 24);
  });
  function ball(c, x, y, r, rot, edge, bad) {
    c.save(); c.translate(x, y);
    c.fillStyle = "#f4f1e8"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.clip();
    c.fillStyle = "#1c2326";
    // pentagon + five neighbours, the classic panels, turned by rot
    for (var k = 0; k < 6; k++) {
      var cx = k ? 0.78 * r * Math.cos(rot + k * 1.2566) : 0, cy = k ? 0.78 * r * Math.sin(rot + k * 1.2566) : 0, pr = r * 0.28;
      c.beginPath(); for (var i = 0; i < 5; i++) { var a = rot + i * 1.2566 + (k ? Math.PI : 0); c.lineTo(cx + pr * Math.cos(a), cy + pr * Math.sin(a)); } c.closePath(); c.fill();
    }
    c.restore();
    c.strokeStyle = edge; c.lineWidth = bad ? 3 : 1.5; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  }

  /* ================= 4. WATER: 400 pools ================= */
  var POOL = 2.5e6, RATE = 1.6e6, wh = $("whours"), wHours = 0, wRun = false;
  function wSync() {
    if (!wh) return;
    var L = wHours * RATE;
    $("wh").textContent = nf(Math.round(wHours)); $("wl").textContent = nf(Math.round(L / 1e6)) + (TH ? " ล้าน" : " million");
    $("wp").textContent = nf(Math.min(400, L / POOL), 1); $("wd").textContent = nf(wHours / 24, 1);
  }
  var pools = scene($("pools"), 1, 0, function (c, w, h, now, dt) {
    if (wRun) { wHours = Math.min(625, wHours + dt * 110); wh.value = wHours; wSync(); if (wHours >= 625) wRun = false; }
    c.fillStyle = "#0a1013"; c.fillRect(0, 0, w, h);
    var n = 20, pad = 10, gap = 3, cw = (w - pad * 2 - gap * (n - 1)) / n, chh = (h - pad * 2 - 30 - gap * (n - 1)) / n;
    var full = wHours * RATE / POOL;
    for (var i = 0; i < 400; i++) {
      var col = i % n, row = Math.floor(i / n), x = pad + col * (cw + gap), y = pad + 30 + row * (chh + gap);
      c.fillStyle = "#1d2a2e"; c.fillRect(x, y, cw, chh);
      var f = clamp(full - i, 0, 1);
      if (f > 0) {
        var wy = y + chh * (1 - f);
        c.fillStyle = f >= 1 ? "#2b9fb4" : "#3db3c8"; c.fillRect(x, wy + (f < 1 ? Math.sin(now * 4 + i) * 0.8 : 0), cw, chh * f);
        if (f >= 1) { c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 0.6; for (var l = 1; l < 4; l++) { c.beginPath(); c.moveTo(x + 1, y + chh * l / 4); c.lineTo(x + cw - 1, y + chh * l / 4); c.stroke(); } }
      }
    }
    // a pipe across the top, flowing while it pumps
    c.strokeStyle = "#e0883e"; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 16); c.lineTo(w, 16); c.stroke();
    if (wRun || (wHours > 0 && wHours < 625)) { c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2; c.setLineDash([6, 10]); c.lineDashOffset = -now * 60; c.beginPath(); c.moveTo(0, 16); c.lineTo(w, 16); c.stroke(); c.setLineDash([]); }
  }, { onShow: function () { if (!pools.started && !REDUCE) { pools.started = true; wHours = 0; wRun = true; } } });
  if (wh) { wh.addEventListener("input", function () { wHours = +wh.value; wRun = false; wSync(); }); wSync(); }

  /* ================= 5. AIR: a jar of a hundred parts ================= */
  var ao2 = $("ao2"), appl = $("appl"), O2 = 21, PPL = 13, mols = [];
  for (var mi = 0; mi < 100; mi++) mols.push({ x: 0.08 + 0.84 * hash(mi + 1), y: 0.12 + 0.8 * hash(mi + 2), vx: hash(mi + 3) - 0.5, vy: hash(mi + 4) - 0.5, a: hash(mi + 5) * 6, rank: hash(mi + 6) });
  var order = mols.slice().sort(function (a, b) { return a.rank - b.rank; });
  function airSync() {
    if (!ao2) return;
    O2 = +ao2.value; PPL = +appl.value;
    $("ao2v").textContent = nf(O2, 1) + "%"; $("apv").textContent = PPL;
    var day = PPL * 0.25 * 1440;
    $("aday").textContent = nf(day) + (TH ? " ลิตร" : " L"); $("aair").textContent = nf(day / 0.21) + (TH ? " ลิตร" : " L");
  }
  scene($("jar"), 0.95, 0, function (c, w, h, now, dt) {
    c.fillStyle = "#0a1013"; c.fillRect(0, 0, w, h);
    var jx = w * 0.14, jy = h * 0.12, jw = w * 0.72, jh = h * 0.72;
    c.strokeStyle = "rgba(241,235,221,.55)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(jx + jw * 0.3, jy - 10); c.lineTo(jx + jw * 0.3, jy); c.quadraticCurveTo(jx, jy, jx, jy + 30); c.lineTo(jx, jy + jh - 18); c.quadraticCurveTo(jx, jy + jh, jx + 18, jy + jh); c.lineTo(jx + jw - 18, jy + jh); c.quadraticCurveTo(jx + jw, jy + jh, jx + jw, jy + jh - 18); c.lineTo(jx + jw, jy + 30); c.quadraticCurveTo(jx + jw, jy, jx + jw * 0.7, jy); c.lineTo(jx + jw * 0.7, jy - 10); c.stroke();
    var nO = Math.round(O2), nAr = 1;
    var r = Math.max(3, Math.min(w, h) * 0.014);
    for (var i = 0; i < 100; i++) {
      var m = mols[i];
      if (!REDUCE) { m.x += m.vx * dt * 0.25; m.y += m.vy * dt * 0.25; if (m.x < 0.06 && m.vx < 0 || m.x > 0.94 && m.vx > 0) m.vx *= -1; if (m.y < 0.1 && m.vy < 0 || m.y > 0.94 && m.vy > 0) m.vy *= -1; m.a += dt * (m.vx * 4); }
      var rank = order.indexOf(m), isO = rank < nO, isAr = rank >= nO && rank < nO + nAr;
      var X = jx + m.x * jw, Y = jy + m.y * jh;
      c.fillStyle = isO ? C.water : isAr ? "#c9b6ff" : "rgba(185,179,166,.55)";
      if (isAr) { c.beginPath(); c.arc(X, Y, r, 0, 7); c.fill(); continue; }
      var dx = Math.cos(m.a) * r * 0.75, dy = Math.sin(m.a) * r * 0.75;
      c.beginPath(); c.arc(X - dx, Y - dy, r, 0, 7); c.arc(X + dx, Y + dy, r, 0, 7); c.fill();
    }
    c.textAlign = "center"; c.font = "700 " + Math.round(h * 0.065) + "px Fraunces,Georgia,serif"; c.fillStyle = C.water;
    c.fillText(nO + " / 100", w / 2, h * 0.96);
    c.font = "600 13px " + (TH ? "'Noto Sans Thai'," : "") + "system-ui,sans-serif"; c.fillStyle = "rgba(241,235,221,.8)";
    c.textAlign = "left"; c.fillText(TH ? "O₂ ออกซิเจน" : "O₂ oxygen", 12, 20); c.fillStyle = "rgba(185,179,166,.9)"; c.fillText(TH ? "N₂ ไนโตรเจน และอื่นๆ" : "N₂ nitrogen and the rest", 12, 38);
  });
  if (ao2) { ao2.addEventListener("input", airSync); appl.addEventListener("input", airSync); airSync(); }

  /* ================= 6. WAY OUT: one journey, and three days of them ================= */
  scene($("trip"), function () { return innerWidth < 640 ? 0.8 : 2.1; }, 320, function (c, w, h, now) {
    c.fillStyle = "#0a1013"; c.fillRect(0, 0, w, h);
    var narrow = w < 640, font = (TH ? "'Noto Sans Thai'," : "") + "system-ui,sans-serif";
    var L = 16, R = w - 16, T1 = 34, H1 = narrow ? h * 0.36 : h * 0.42;
    // top panel: a day-one journey, 0..4 h
    var X = function (hr) { return L + (R - L) * hr / 4; };
    var SEG = [[0, 1.3, 0], [1.3, 1.6, 1], [1.6, 3.0, 2], [3.0, 3.06, 3], [3.06, 3.9, 4]];
    var by = T1 + H1 - 26;
    SEG.forEach(function (s) {
      c.fillStyle = s[2] === 0 || s[2] === 2 ? C.water : s[2] === 3 ? C.lamp : s[2] === 1 ? "#8c7f68" : "#c9a96e";
      c.fillRect(X(s[0]), by, X(s[1]) - X(s[0]) - 1, 12);
    });
    c.font = "600 12px " + font; c.fillStyle = "rgba(241,235,221,.85)"; c.textAlign = "center";
    [[0.65, 0], [1.45, 1], [2.3, 2], [3.5, 4]].forEach(function (p) { c.fillText(U.out_seg[p[1]], X(p[0]), by + 28); });
    // sleep: each dose fades over ~50 min; a top-up restores it
    var DOSES = [0, 0.85, 1.7, 2.55];
    c.strokeStyle = "#c9b6ff"; c.lineWidth = 2; c.beginPath();
    for (var hr = 0; hr <= 3.9; hr += 0.01) {
      var last = 0; for (var i = 0; i < DOSES.length; i++) if (DOSES[i] <= hr) last = DOSES[i];
      var lvl = Math.exp(-(hr - last) / 0.7), y = T1 + 8 + (1 - lvl) * (H1 - 70);
      hr ? c.lineTo(X(hr), y) : c.moveTo(X(hr), y);
    }
    c.stroke();
    DOSES.forEach(function (d) { c.fillStyle = "#c9b6ff"; c.beginPath(); c.arc(X(d), T1 + 8, 4, 0, 7); c.fill(); c.fillText(U.out_dose, X(d), T1 - 2); });
    // a boy moving along it
    var p = (now % 9) / 9 * 3.9;
    c.fillStyle = C.lamp; c.beginPath(); c.arc(X(p), by + 6, 5, 0, 7); c.fill();
    c.fillStyle = C.line; c.beginPath(); c.arc(X(p) - 9, by + 4, 4, 0, 7); c.fill();
    c.textAlign = "center"; c.fillStyle = "rgba(241,235,221,.55)"; c.font = "11px " + font;
    for (var tk = 0; tk <= 4; tk++) { c.fillRect(X(tk) - 0.5, by - 6, 1, 4); c.fillText(tk + (TH ? " ชม." : " h"), clamp(X(tk), L + 12, R - 14), by - 10); }
    c.font = "600 12px " + font;
    // bottom panel: the three days on a clock, 13:00 to 23:00
    var T2 = T1 + H1 + 30, H2 = h - T2 - 10, rowH = H2 / 3;
    var CX = function (clock) { return L + (narrow ? 44 : 120) + (R - L - (narrow ? 44 : 120)) * (clock - 13) / 10; };
    c.font = "600 12px " + font;
    for (var dd = 0; dd < 3; dd++) {
      var ry = T2 + dd * rowH + rowH * 0.5;
      c.fillStyle = "rgba(241,235,221,.75)"; c.textAlign = "left";
      c.fillText((TH ? ["8 ก.ค.", "9 ก.ค.", "10 ก.ค."] : narrow ? ["8 Jul", "9 Jul", "10 Jul"] : ["8 July", "9 July", "10 July"])[dd], L, ry + 4);
      c.strokeStyle = "rgba(241,235,221,.12)"; c.beginPath(); c.moveTo(CX(13), ry); c.lineTo(CX(23), ry); c.stroke();
    }
    for (i = 0; i < TEAMN; i++) {
      var d0 = DAYOF[i], dp = dep[i] - (15 + d0) * 24, j = JOURNEY[d0];
      var lane = i - DAYOF.indexOf(d0), nl = d0 === 2 ? 5 : 4;
      var ry2 = T2 + d0 * rowH + rowH * (0.12 + 0.76 * lane / (nl - 1));
      c.strokeStyle = i === 8 ? "#9cc8ff" : C.lamp; c.lineWidth = 4; c.beginPath(); c.moveTo(CX(dp), ry2); c.lineTo(CX(dp + j + 0.9), ry2); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(CX(dp + j + 0.9), ry2, 3, 0, 7); c.fill();
      { c.fillStyle = "rgba(241,235,221,.9)"; c.textAlign = "left"; c.fillText(U.team[i], CX(dp + j + 0.9) + 6, ry2 + 4); }
    }
    c.fillStyle = "rgba(241,235,221,.5)"; c.textAlign = "center";
    for (var hh = 13; hh <= 23; hh += 2) c.fillText(hh + ":00", CX(hh), h - 2);
  });

  /* ================= 7. PEOPLE: ten thousand dots, seven hundred cylinders ================= */
  var GROUPS = [[2000, "#9aa86a"], [900, "#6f9bd8"], [90, C.lamp], [7010, "#c8b99a"]];
  var crowd = scene($("crowd"), function () { return innerWidth < 640 ? 0.8 : 2.2; }, 0, function (c, w, h, now, dt) {
    crowd.rev = Math.min(10000, (crowd.rev || 0) + (REDUCE || CARD ? 10000 : dt * 4000));
    c.fillStyle = "#0a1013"; c.fillRect(0, 0, w, h);
    var cols = w < 640 ? 80 : 160, rows = Math.ceil(10000 / cols), legendH = w < 640 ? 64 : 34;
    var cell = Math.min((w - 20) / cols, (h - 20 - legendH) / rows), ox = (w - cols * cell) / 2, oy = 10;
    var idx = 0;
    for (var g = 0; g < GROUPS.length; g++) {
      c.fillStyle = GROUPS[g][1];
      for (var i = 0; i < GROUPS[g][0]; i++, idx++) {
        if (idx > crowd.rev) break;
        var x = ox + (idx % cols) * cell + cell / 2, y = oy + Math.floor(idx / cols) * cell + cell / 2;
        if (g === 2) { c.beginPath(); c.arc(x, y, cell * 0.75, 0, 7); c.fill(); }
        else c.fillRect(x - cell * 0.32, y - cell * 0.32, cell * 0.64, cell * 0.64);
      }
    }
    c.font = "600 13px " + (TH ? "'Noto Sans Thai'," : "") + "system-ui,sans-serif"; c.textAlign = "left";
    var lx = 12, ly = oy + rows * cell + 22;
    for (g = 0; g < GROUPS.length; g++) {
      var lab = nf(GROUPS[g][0]) + " " + U.pe_groups[g], lw = c.measureText(lab).width + 34;
      if (lx + lw > w && lx > 12) { lx = 12; ly += 18; }
      c.fillStyle = GROUPS[g][1]; c.fillRect(lx, ly - 10, 10, 10); c.fillStyle = "rgba(241,235,221,.9)"; c.fillText(lab, lx + 14, ly);
      lx += lw;
    }
  });
  scene($("cyl"), function () { return innerWidth < 640 ? 1.2 : 3.2; }, 0, function (c, w, h) {
    c.fillStyle = "#0a1013"; c.fillRect(0, 0, w, h);
    var cols = w < 640 ? 35 : 70, rows = Math.ceil(700 / cols), lh = 26;
    var cw = (w - 20) / cols, ch = (h - 20 - lh) / rows;
    for (var i = 0; i < 700; i++) {
      var x = 10 + (i % cols) * cw, y = 10 + Math.floor(i / cols) * ch, bw = cw * 0.55, bh = ch * 0.8;
      c.beginPath(); c.moveTo(x + (cw - bw) / 2, y + bh); c.lineTo(x + (cw - bw) / 2, y + bw / 2); c.arc(x + cw / 2, y + bw / 2, bw / 2, Math.PI, 0); c.lineTo(x + (cw + bw) / 2, y + bh); c.closePath();
      if (i < 500) { c.fillStyle = C.water; c.fill(); } else { c.strokeStyle = "rgba(241,235,221,.5)"; c.lineWidth = 1; c.stroke(); }
    }
    c.font = "600 13px " + (TH ? "'Noto Sans Thai'," : "") + "system-ui,sans-serif"; c.fillStyle = "rgba(241,235,221,.9)"; c.textAlign = "left";
    var a1 = "500 " + U.cyl[0], a2 = "200 " + U.cyl[1];
    c.fillStyle = C.water; c.fillRect(12, h - 18, 10, 10); c.fillStyle = "rgba(241,235,221,.9)"; c.fillText(a1, 28, h - 8);
    var x2 = 28 + c.measureText(a1).width + 22; c.strokeStyle = "rgba(241,235,221,.6)"; c.strokeRect(x2 + 0.5, h - 17.5, 9, 9); c.fillText(a2, x2 + 16, h - 8);
  });

  /* ================= 8. REMEMBERED: candles, and thirteen boars ================= */
  document.querySelectorAll("canvas.candle").forEach(function (cv, n) {
    scene(cv, null, 0, function (c, w, h, now) {
      c.clearRect(0, 0, w, h);
      var x = w / 2, base = h - 6, ch = h * 0.42, cw = 16;
      var gr = Math.min(base - ch - 18, w / 2) * 0.95, gl = c.createRadialGradient(x, base - ch - 18, 0, x, base - ch - 18, gr);
      gl.addColorStop(0, "rgba(255,200,90,.3)"); gl.addColorStop(1, "rgba(255,200,90,0)");
      c.fillStyle = gl; c.fillRect(0, 0, w, h);
      var bg = c.createLinearGradient(x - cw / 2, 0, x + cw / 2, 0); bg.addColorStop(0, "#d9cbb0"); bg.addColorStop(0.5, "#f6eedd"); bg.addColorStop(1, "#c8b896");
      c.fillStyle = bg; c.fillRect(x - cw / 2, base - ch, cw, ch);
      c.strokeStyle = "#333"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, base - ch); c.lineTo(x, base - ch - 5); c.stroke();
      // flame: x = sin t · sin(t/2)^m, y = cos t, swaying
      var fl = REDUCE ? 0 : 0.12 * Math.sin(now * 7 + n) + 0.06 * Math.sin(now * 13 + n * 2);
      var m = 1.6 + 0.4 * Math.sin(now * 5 + n), fh = 24 + 3 * Math.sin(now * 9 + n);
      c.beginPath();
      for (var t = 0; t <= 6.29; t += 0.05) { var fx = Math.sin(t) * Math.pow(Math.sin(t / 2), m) * 7, fy = Math.cos(t); var yy = base - ch - 6 - (1 - fy) / 2 * fh; c.lineTo(x + fx + fl * (1 - fy) / 2 * 14, yy); }
      var fg = c.createLinearGradient(0, base - ch - 6 - fh, 0, base - ch - 4); fg.addColorStop(0, "#fff6c8"); fg.addColorStop(0.6, "#ffc85a"); fg.addColorStop(1, "#e2702c");
      c.fillStyle = fg; c.fill();
    });
  });
  function boar(c, x, y, s, flip, ph) {
    c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
    c.fillStyle = "#a9824f";
    // body: a superellipse
    c.beginPath(); for (var a = 0; a <= 6.29; a += 0.08) { var ca = Math.cos(a), sa = Math.sin(a); c.lineTo(18 * Math.sign(ca) * Math.pow(Math.abs(ca), 0.8), -10 - 9 * Math.sign(sa) * Math.pow(Math.abs(sa), 0.8)); } c.fill();
    // bristles along the back
    c.strokeStyle = "#a9824f"; c.lineWidth = 1.2;
    for (var b = -12; b <= 10; b += 3) { c.beginPath(); c.moveTo(b, -18); c.lineTo(b - 1, -22 - 2 * Math.sin(b + ph)); c.stroke(); }
    // head: a wedge to the snout
    c.beginPath(); c.moveTo(14, -16); c.lineTo(28, -8); c.lineTo(29, -3); c.lineTo(14, -4); c.closePath(); c.fill();
    c.fillStyle = "#7d5d36"; c.beginPath(); c.ellipse(29, -5.5, 1.6, 2.6, 0, 0, 7); c.fill();
    c.strokeStyle = "#efe6d0"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(25, -4); c.quadraticCurveTo(27, -10, 24, -11); c.stroke(); // tusk
    c.fillStyle = "#a9824f"; c.beginPath(); c.moveTo(15, -16); c.lineTo(17, -22); c.lineTo(19, -15); c.fill(); // ear
    // legs
    c.strokeStyle = "#a9824f"; c.lineWidth = 3.2; [-12, -6, 7, 12].forEach(function (lx) { c.beginPath(); c.moveTo(lx, -4); c.lineTo(lx + Math.sin(ph) * 0.5, 4); c.stroke(); });
    // tail: an Archimedean curl
    c.lineWidth = 1.2; c.beginPath(); for (var t = 0; t < 9; t += 0.2) { var r = 0.45 * t; c.lineTo(-18 - r * Math.cos(t), -14 - r * Math.sin(t)); } c.stroke();
    c.restore();
  }
  scene($("boars"), null, 0, function (c, w, h, now) {
    c.clearRect(0, 0, w, h);
    var cx = w / 2, by = h - 18;
    var gl = c.createRadialGradient(cx, by - 20, 0, cx, by - 20, h * 0.9); gl.addColorStop(0, "rgba(255,200,90,.28)"); gl.addColorStop(1, "rgba(255,200,90,0)");
    c.fillStyle = gl; c.fillRect(0, 0, w, h);
    c.fillStyle = "#6b5a46"; c.fillRect(cx - Math.min(w * 0.46, 420), by, Math.min(w * 0.92, 840), 8);
    var s = Math.min(1.6, w / 560), span = Math.min(w * 0.88, 800);
    for (var i = 0; i < 13; i++) {
      var f = i / 12, x = cx - span / 2 + f * span, y = by - 2 - 10 * Math.sin(f * Math.PI);
      boar(c, x, y, s * (0.8 + 0.2 * Math.sin(f * Math.PI)), x > cx, REDUCE ? 0 : now * 2 + i);
    }
  });

  requestAnimationFrame(frame);
})();

/* =========================================================
   Lead Catcher: a 30-second mini-game.
   Catch leads in the funnel, avoid spam, beat a CPL of ₹600.
   Fires a "leadcatcher:over" event with the final CPL.
   ========================================================= */
(function () {
  var canvas = document.getElementById('game');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var overlay = document.getElementById('g-overlay');
  var titleEl = document.getElementById('g-title'), msgEl = document.getElementById('g-msg'), bestEl = document.getElementById('g-best');
  var startBtn = document.getElementById('g-start');
  var hud = { leads: document.getElementById('g-leads'), spend: document.getElementById('g-spend'), cpl: document.getElementById('g-cpl'), time: document.getElementById('g-time') };

  var TARGET_CPL = 600, DURATION = 30, BURN = 400, SPAM_COST = 500;   // tweak difficulty here
  var W = 0, H = 0, dpr = 1;
  var state = 'idle', items = [], pops = [], leads = 0, spend = 0, timeLeft = DURATION, spawnT = 0, last = 0;
  var funnel = { x: 0, w: 120, target: 0 }, keys = {};

  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  var C = {};
  function readColours() { C = { blue: css('--blue'), coral: css('--coral'), mint: css('--mint'), sun: css('--sun'), ink: css('--ink'), ink3: css('--ink-3'), line: css('--line') }; }

  function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function getBest() { try { return parseInt(localStorage.getItem('bp-best-cpl'), 10) || null; } catch (e) { return null; } }
  function setBest(v) { try { localStorage.setItem('bp-best-cpl', String(v)); } catch (e) {} }
  function showBest() { var b = getBest(); bestEl.textContent = b ? 'Your best CPL: ' + fmt(b) : ''; }

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    funnel.w = Math.max(90, Math.min(140, W * 0.16));
    if (!funnel.x) funnel.x = funnel.target = W / 2;
    draw();
  }

  function updateHud() {
    hud.leads.textContent = leads;
    hud.spend.textContent = fmt(spend);
    hud.cpl.textContent = leads ? fmt(spend / leads) : '–';
    hud.time.textContent = Math.ceil(timeLeft) + 's';
  }

  function start() {
    readColours();
    items = []; pops = []; leads = 0; spend = 0; timeLeft = DURATION; spawnT = 0.3;
    state = 'play'; overlay.hidden = true; canvas.focus({ preventScroll: true });
    updateHud(); last = performance.now(); requestAnimationFrame(loop);
  }

  function end() {
    state = 'over';
    var cpl = leads ? Math.round(spend / leads) : Math.round(spend);
    var best = getBest();
    if (leads && (!best || cpl < best)) setBest(cpl);
    if (!leads) { titleEl.textContent = 'No leads this time'; msgEl.textContent = 'The whole budget went to waste. Want the version where every rupee converts? That’s my job.'; }
    else if (cpl < TARGET_CPL) { titleEl.textContent = 'CPL ' + fmt(cpl) + '. You beat my ₹600!'; msgEl.textContent = 'You think like a performance marketer. Let’s talk, we should probably work together.'; }
    else { titleEl.textContent = 'CPL ' + fmt(cpl); msgEl.textContent = 'Close, but my real campaigns ran under ₹600 per lead. Want that for your brand? Hire me, or try again.'; }
    startBtn.lastChild.textContent = 'Play again';
    showBest(); overlay.hidden = false;
    document.dispatchEvent(new CustomEvent('leadcatcher:over', { detail: { cpl: cpl, leads: leads } }));
  }

  function spawn() {
    var r = Math.random(), type = r < 0.68 ? 'lead' : r < 0.8 ? 'gold' : 'spam';
    var progress = 1 - timeLeft / DURATION;
    items.push({ type: type, x: 20 + Math.random() * (W - 40), y: -20, r: type === 'gold' ? 13 : 12, vy: 150 + Math.random() * 90 + progress * 140, wob: Math.random() * 6.28 });
  }

  function loop(now) {
    if (state !== 'play') return;
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    timeLeft -= dt; spend += BURN * dt;
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = 0.55 - (1 - timeLeft / DURATION) * 0.22; }

    if (keys.left) funnel.target -= 560 * dt;
    if (keys.right) funnel.target += 560 * dt;
    funnel.target = Math.max(funnel.w / 2, Math.min(W - funnel.w / 2, funnel.target));
    funnel.x += (funnel.target - funnel.x) * Math.min(1, dt * 18);

    var mouthY = H - 74;
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.y += it.vy * dt; it.wob += dt * 3;
      if (it.y + it.r >= mouthY && it.y - it.r <= mouthY + 14 && Math.abs(it.x - funnel.x) < funnel.w / 2 - 4) {
        if (it.type === 'lead') { leads += 1; pops.push({ x: it.x, y: mouthY - 10, t: 0, txt: '+1', c: C.blue }); }
        else if (it.type === 'gold') { leads += 3; pops.push({ x: it.x, y: mouthY - 10, t: 0, txt: '+3', c: C.sun }); }
        else { spend += SPAM_COST; pops.push({ x: it.x, y: mouthY - 10, t: 0, txt: '−₹500', c: C.coral }); }
        items.splice(i, 1); continue;
      }
      if (it.y - it.r > H) items.splice(i, 1);
    }
    for (var p = pops.length - 1; p >= 0; p--) { pops[p].t += dt; if (pops[p].t > 0.8) pops.splice(p, 1); }

    if (timeLeft <= 0) { timeLeft = 0; updateHud(); draw(); end(); return; }
    updateHud(); draw();
    requestAnimationFrame(loop);
  }

  function drawItem(it) {
    var x = it.x + Math.sin(it.wob) * 3, y = it.y;
    ctx.beginPath(); ctx.arc(x, y, it.r, 0, Math.PI * 2);
    ctx.fillStyle = it.type === 'lead' ? C.blue : it.type === 'gold' ? C.sun : C.coral; ctx.fill();
    ctx.fillStyle = it.type === 'gold' ? '#3A2A00' : '#fff';
    if (it.type === 'lead') {          // person glyph
      ctx.beginPath(); ctx.arc(x, y - 3, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y + 7, 6, Math.PI, 0); ctx.fill();
    } else if (it.type === 'gold') {   // star
      ctx.beginPath();
      for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 3.2 : 7.5; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.fill();
    } else {                           // spam cross
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 4.5, y - 4.5); ctx.lineTo(x + 4.5, y + 4.5); ctx.moveTo(x + 4.5, y - 4.5); ctx.lineTo(x - 4.5, y + 4.5); ctx.stroke();
    }
  }

  function drawFunnel() {
    var x = funnel.x, w = funnel.w, top = H - 74;
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, top); ctx.lineTo(x + w / 2, top);
    ctx.lineTo(x + 10, top + 40); ctx.lineTo(x + 10, top + 62); ctx.lineTo(x - 10, top + 62); ctx.lineTo(x - 10, top + 40);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.mint; ctx.fillRect(x - w / 2, top - 5, w, 6);
    ctx.fillStyle = '#fff'; ctx.font = '700 12px Outfit, "DM Sans", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CRM', x, top + 22);
  }

  function draw() {
    if (!W) return;
    if (!C.blue) readColours();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.line;
    for (var gy = 24; gy < H; gy += 28) for (var gx = 24; gx < W; gx += 28) ctx.fillRect(gx, gy, 1.5, 1.5);
    items.forEach(drawItem);
    drawFunnel();
    pops.forEach(function (p) {
      ctx.globalAlpha = 1 - p.t / 0.8; ctx.fillStyle = p.c; ctx.font = '800 18px Outfit, "DM Sans", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.txt, p.x, p.y - p.t * 40); ctx.globalAlpha = 1;
    });
  }

  function moveTo(clientX) { var r = canvas.getBoundingClientRect(); funnel.target = clientX - r.left; }
  canvas.addEventListener('pointermove', function (e) { moveTo(e.clientX); });
  canvas.addEventListener('pointerdown', function (e) { moveTo(e.clientX); });
  canvas.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = true; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = true; e.preventDefault(); }
    if ((e.key === ' ' || e.key === 'Enter') && state !== 'play') { e.preventDefault(); start(); }
  });
  canvas.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });
  startBtn.addEventListener('click', start);
  window.addEventListener('resize', resize);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColours(); draw(); });

  readColours(); showBest(); resize(); updateHud();
})();

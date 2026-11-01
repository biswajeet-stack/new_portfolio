/* =========================================================
   Gamification and small interactions:
   - "Your stage" journey meter in the header
   - Visitor quests with achievement toasts (saved in the browser)
   - 3D tilt on framed images, showreel autoplay in view
   ========================================================= */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- Toasts ---------- */
  var toastBox = document.getElementById('toasts');
  function toast(title, text, icon, colour) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.style.borderLeftColor = 'var(--' + (colour || 'mint') + ')';
    el.innerHTML = '<span class="badge-ico b-' + (colour || 'mint') + '"><svg class="ico"><use href="#i-' + (icon || 'trophy') + '"/></svg></span><div><b class="t-title"></b><span class="t-text"></span></div>';
    el.querySelector('.t-title').textContent = title;
    el.querySelector('.t-text').textContent = text;
    toastBox.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 350); }, 3800);
  }

  /* ---------- Journey stages ---------- */
  var STAGES = [
    { name: 'Visitor', note: '' },
    { name: 'Lead', note: 'You checked out the work. Nice.' },
    { name: 'MQL', note: 'Marketing qualified: you found the game and badges.' },
    { name: 'SQL', note: 'Sales qualified: you read the services and career path.' },
    { name: 'Opportunity', note: 'You reached the contact section.' },
    { name: 'Closed-won', note: 'You reached out. Thank you! I’ll reply soon.' }
  ];
  var stage = 0;
  var nameEl = document.getElementById('stage-name'), fillEl = document.getElementById('stage-fill');
  function setStage(n, silent) {
    if (n <= stage) return;
    stage = n;
    nameEl.textContent = STAGES[n].name;
    fillEl.style.width = Math.max(6, n / (STAGES.length - 1) * 100) + '%';
    if (!silent) toast('Stage unlocked: ' + STAGES[n].name, STAGES[n].note, 'funnel', n === STAGES.length - 1 ? 'coral' : 'blue');
  }

  /* ---------- Quests ---------- */
  var QUESTS = { reel: 'Watched the reel', work: 'Case reader', play: 'Campaign launched', beat: 'Budget beater', contact: 'Closed-won' };
  var done = load('bp-quests', {});
  var countEl = document.getElementById('quest-count');
  function renderQuests() {
    var n = 0;
    Object.keys(QUESTS).forEach(function (q) {
      var li = document.querySelector('[data-quest="' + q + '"]');
      if (!li) return;
      if (done[q]) { n++; li.classList.add('done'); li.querySelector('use').setAttribute('href', '#i-star'); }
    });
    countEl.textContent = n + ' / ' + Object.keys(QUESTS).length;
  }
  function complete(q) {
    if (done[q]) return;
    done[q] = true; save('bp-quests', done); renderQuests();
    toast('Achievement unlocked', QUESTS[q], 'trophy', 'mint');
  }
  renderQuests();

  /* ---------- Watch sections ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var s = parseInt(e.target.getAttribute('data-stage'), 10);
        if (s) setStage(s);
        if (e.target.id === 'work') complete('work');
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('[data-stage]').forEach(function (el) { io.observe(el); });
  }
  document.querySelectorAll('.track-contact').forEach(function (a) {
    a.addEventListener('click', function () { setStage(5); complete('contact'); });
  });
  document.addEventListener('leadcatcher:over', function (e) {
    complete('play');
    if (e.detail.leads && e.detail.cpl < 600) complete('beat');
  });

  /* ---------- Showreel: autoplay in view, quest after 5 seconds ---------- */
  var video = document.getElementById('showreel');
  if (video) {
    video.addEventListener('timeupdate', function () { if (video.currentTime > 5) complete('reel'); });
    if ('IntersectionObserver' in window && !reduceMotion) {
      var userPaused = false, autoPausing = false;
      video.addEventListener('pause', function () { if (!autoPausing) userPaused = true; autoPausing = false; });
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !userPaused) video.play().catch(function () {});
          else if (!e.isIntersecting && !video.paused) { autoPausing = true; video.pause(); }
        });
      }, { threshold: 0.5 }).observe(video);
    }
  }

  /* ---------- Tilt framed images ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg) translateZ(10px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }
})();

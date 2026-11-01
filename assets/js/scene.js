/* =========================================================
   3D hero: a glass funnel with leads spiralling down into it,
   orbited by marketing metric chips (CPL, CTR, ROAS ...).
   It follows the .hero-visual box in the page layout.
   ========================================================= */
(function () {
  var canvas = document.getElementById('scene');
  var anchor = document.querySelector('.hero-visual');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fallback() { document.body.classList.add('no-3d'); if (canvas) canvas.style.display = 'none'; }
  if (!window.THREE || !canvas) { fallback(); return; }

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { fallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  var key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(-5, 8, 8); scene.add(key);
  var fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(6, -2, 4); scene.add(fill);

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function col(name) { return new THREE.Color(css(name)).convertSRGBToLinear(); }

  var group = new THREE.Group();
  scene.add(group);

  /* ---------- Funnel ---------- */
  var TOP = 1.7, BOTTOM = -1.0, SPOUT = -1.9, RTOP = 2.1, RNECK = 0.34;
  function radiusAt(y) {
    if (y <= BOTTOM) return RNECK;
    var u = (y - BOTTOM) / (TOP - BOTTOM);
    return RNECK + (RTOP - RNECK) * Math.pow(u, 1.25);
  }
  var profile = [];
  for (var i = 0; i <= 40; i++) {
    var y = SPOUT + (TOP - SPOUT) * (i / 40);
    profile.push(new THREE.Vector2(radiusAt(y), y));
  }
  var glassMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.28, roughness: 0.15, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  var funnel = new THREE.Mesh(new THREE.LatheGeometry(profile, 72), glassMat);
  group.add(funnel);

  // Coloured rings marking funnel stages
  var ringMats = [];
  [[TOP, '--blue'], [0.75, '--blue'], [-0.1, '--coral'], [BOTTOM, '--mint']].forEach(function (r, idx) {
    var m = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 });
    m.userData.token = r[1];
    ringMats.push(m);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(r[0]), idx === 0 ? 0.07 : 0.045, 16, 96), m);
    ring.rotation.x = Math.PI / 2; ring.position.y = r[0];
    group.add(ring);
  });

  /* ---------- Leads: balls that fall in and spiral down ---------- */
  var tokens = ['--blue', '--coral', '--mint', '--sun'];
  var COUNT = window.innerWidth < 700 ? 26 : 40;
  var balls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 20, 20), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.05 }), COUNT);
  var leads = [];
  for (var n = 0; n < COUNT; n++) leads.push({ s: Math.random(), speed: 0.12 + Math.random() * 0.08, a: Math.random() * 6.28, spin: 1.5 + Math.random() * 1.5, tok: tokens[n % 4], r0: 0.4 + Math.random() * 1.4 });
  group.add(balls);
  var dummy = new THREE.Object3D();

  /* ---------- Metric chips (flat billboards) ---------- */
  var chipDefs = [['CPL', '--blue'], ['CTR', '--coral'], ['ROAS', '--mint'], ['SEO', '--sun'], ['CRM', '--blue'], ['+320%', '--coral'], ['500+ leads', '--mint']];
  var chips = [];
  function chipTexture(label, colour, dark) {
    var c = document.createElement('canvas'), g = c.getContext('2d');
    g.font = '700 64px Outfit, "DM Sans", system-ui, sans-serif';
    var w = Math.ceil(g.measureText(label).width) + 88, h = 112;
    c.width = w; c.height = h;
    g.fillStyle = colour;
    g.beginPath(); g.moveTo(h / 2, 0); g.lineTo(w - h / 2, 0); g.arc(w - h / 2, h / 2, h / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(h / 2, h); g.arc(h / 2, h / 2, h / 2, Math.PI / 2, Math.PI * 1.5); g.fill();
    g.font = '700 64px Outfit, "DM Sans", system-ui, sans-serif';
    g.fillStyle = dark ? '#3A2A00' : '#ffffff'; g.textBaseline = 'middle'; g.fillText(label, 44, h / 2 + 4);
    var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
    return { tex: tex, aspect: w / h };
  }
  function buildChips() {
    chips.forEach(function (ch) { group.remove(ch.sprite); ch.sprite.material.map.dispose(); });
    chips = chipDefs.map(function (d, i) {
      var t = chipTexture(d[0], css(d[1]), d[1] === '--sun');
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t.tex, transparent: true, depthWrite: false }));
      var hgt = 0.46; sp.scale.set(hgt * t.aspect, hgt, 1);
      group.add(sp);
      return { sprite: sp, a: i / chipDefs.length * Math.PI * 2, y: [1.9, -1.2, 0.6, -2.2, 2.6, -0.3, -1.8][i], r: 3.1 + (i % 3) * 0.35 };
    });
  }

  function applyColours() {
    glassMat.color.copy(col('--blue'));
    ringMats.forEach(function (m) { m.color.copy(col(m.userData.token)); });
    leads.forEach(function (l, i) { balls.setColorAt(i, col(l.tok)); });
    if (balls.instanceColor) balls.instanceColor.needsUpdate = true;
    buildChips();
  }
  applyColours();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildChips);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyColours);

  /* ---------- Layout ---------- */
  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();
  function viewH() { return 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; }
  function place() {
    var r = anchor.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight, vh = viewH(), vw = vh * camera.aspect;
    group.position.x = ((r.left + r.width / 2) / w - 0.5) * vw;
    group.position.y = -((r.top + r.height / 2) / h - 0.5) * vh;
    group.scale.setScalar((r.width / h) * vh / 6.4);
    group.visible = r.bottom > -150 && r.top < h + 150;
  }

  var pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX / window.innerWidth * 2 - 1; pointer.y = e.clientY / window.innerHeight * 2 - 1;
  }, { passive: true });

  var clock = new THREE.Clock(), t = 0, running = true;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05), sp = reduceMotion ? 0 : 1;
    t += dt * sp;
    eased.x += (pointer.x - eased.x) * 0.05; eased.y += (pointer.y - eased.y) * 0.05;

    place();
    if (!group.visible) { renderer.render(scene, camera); return; }
    group.rotation.x = 0.32 + eased.y * 0.15;
    group.rotation.y = eased.x * 0.4 + window.scrollY * 0.0015;

    // Leads: drop from above (s 0–0.3), then spiral down the funnel wall (0.3–1)
    for (var i = 0; i < COUNT; i++) {
      var L = leads[i];
      L.s += dt * L.speed * sp;
      if (L.s > 1) { L.s -= 1; L.a = Math.random() * 6.28; L.r0 = 0.4 + Math.random() * 1.4; }
      var x, y, z, scale = 1;
      if (L.s < 0.3) {
        var u = L.s / 0.3;
        y = 3.4 - (3.4 - TOP) * u * u; x = Math.cos(L.a) * L.r0; z = Math.sin(L.a) * L.r0;
        scale = Math.min(1, u * 4);
      } else {
        var v = (L.s - 0.3) / 0.7;
        y = TOP - (TOP - SPOUT - 0.4) * v;
        L.a += dt * L.spin * sp * (1 + v * 2);
        var rr = Math.min(L.r0, radiusAt(y) - 0.16);
        x = Math.cos(L.a) * rr; z = Math.sin(L.a) * rr;
        if (y < SPOUT) scale = Math.max(0, 1 - (SPOUT - y) / 0.4);
      }
      dummy.position.set(x, y, z); dummy.scale.setScalar(scale); dummy.updateMatrix();
      balls.setMatrixAt(i, dummy.matrix);
    }
    balls.instanceMatrix.needsUpdate = true;

    chips.forEach(function (c, i) {
      var a = c.a + t * 0.25;
      c.sprite.position.set(Math.cos(a) * c.r, c.y + Math.sin(t * 1.2 + i) * 0.12, Math.sin(a) * c.r);
    });

    renderer.render(scene, camera);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false;
    else if (!running) { running = true; clock.getDelta(); requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
})();

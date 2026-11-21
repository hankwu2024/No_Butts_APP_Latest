// Hero background shader: green and orange aurora curtains over a dark night sky; they lean and brighten toward the cursor.
// Falls back to the CSS background when WebGL is missing; draws one still frame for reduced motion.
(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'hero-shader';
  canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return;

  var VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 r; uniform float t; uniform vec2 m; uniform float e;',
    'const vec3 skyTop = vec3(0.020, 0.055, 0.045);',
    'const vec3 skyLow = vec3(0.055, 0.150, 0.110);',
    'const vec3 green = vec3(0.230, 0.950, 0.560);',
    'const vec3 teal = vec3(0.160, 0.780, 0.700);',
    'const vec3 orange = vec3(1.000, 0.540, 0.200);',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    'float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }',
    // one aurora curtain: a bright wavy edge with rays streaming upward from it
    'float curtain(float x, float y, float base, float seed, float pull) {',
    '  float c = base + 0.10 * sin(x * 1.4 + t * 0.30 + seed) + 0.12 * (fbm(vec2(x * 1.2 - t * 0.12, seed)) - 0.5) + pull;',
    '  float dy = y - c;',
    '  float edge = exp(-dy * dy * 140.0);',
    '  float rays = 0.55 + 0.45 * sin(x * 38.0 + fbm(vec2(x * 3.0, t * 0.2 + seed)) * 9.0 + t * 0.8);',
    '  float glow = dy > 0.0 ? exp(-dy * 4.5) * rays : exp(dy * 22.0);',
    '  return edge * 0.9 + glow * 0.55;',
    '}',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / r;',
    '  float asp = r.x / r.y;',
    '  float x = uv.x * asp;',
    '  float mx = m.x * asp;',
    // the curtains lean toward the cursor
    '  float near = exp(-abs(x - mx) * 2.2) * (0.4 + e);',
    '  vec3 sky = mix(skyLow, skyTop, smoothstep(0.0, 1.0, uv.y));',
    '  vec3 col = vec3(0.0);',
    '  float a1 = curtain(x, uv.y, 0.58, 1.0, (m.y - 0.58) * 0.35 * near);',
    '  float a2 = curtain(x + 0.7, uv.y, 0.46, 4.0, (m.y - 0.46) * 0.30 * near);',
    '  float a3 = curtain(x - 0.4, uv.y, 0.34, 7.0, (m.y - 0.34) * 0.25 * near);',
    '  float shimmer = 0.75 + 0.25 * sin(t * 0.7 + x * 0.8);',
    '  col += green * a1 * 0.95 * shimmer;',
    '  col += teal * a2 * 0.70;',
    '  col += orange * a3 * 0.80 * (1.15 - shimmer * 0.3);',
    // brighten around the cursor
    '  col += mix(green, orange, 0.35) * exp(-length(vec2(x, uv.y) - vec2(mx, m.y)) * 5.0) * e * 0.22;',
    // twinkling stars in the upper sky
    '  float h = hash(floor(gl_FragCoord.xy / 3.0));',
    '  col += vec3(step(0.9965, h) * (0.5 + 0.5 * sin(t * 2.5 + h * 60.0)) * smoothstep(0.45, 0.9, uv.y) * 0.8);',
    // dim only the aurora (not the sky) behind the text so white text stays crisp
    '  float veil = asp > 1.1 ? 0.93 * smoothstep(0.74, 0.40, uv.x) : 0.93 * smoothstep(0.30, 0.44, uv.y);',
    '  col = sky + col * (1.0 - veil);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't');
  var uM = gl.getUniformLocation(prog, 'm'), uE = gl.getUniformLocation(prog, 'e');

  hero.insertBefore(canvas, hero.firstChild);
  hero.classList.add('has-shader');

  // the gradient is soft, so render below screen resolution to stay light on phones
  var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
  function resize() {
    var w = Math.max(1, Math.round(hero.clientWidth * scale));
    var h = Math.max(1, Math.round(hero.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  var mouse = { x: 0.75, y: 0.6 }, target = { x: 0.75, y: 0.6 }, energy = 0;
  hero.addEventListener('pointermove', function (ev) {
    var rect = hero.getBoundingClientRect();
    var nx = (ev.clientX - rect.left) / rect.width, ny = 1 - (ev.clientY - rect.top) / rect.height;
    energy = Math.min(1, energy + Math.hypot(nx - target.x, ny - target.y) * 10);
    target.x = nx;
    target.y = ny;
  }, { passive: true });

  var start = performance.now();
  function draw(now) {
    resize();
    mouse.x += (target.x - mouse.x) * 0.08;
    mouse.y += (target.y - mouse.y) * 0.08;
    energy = Math.max(energy * 0.975, 0.1);
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, (now - start) / 1000);
    gl.uniform2f(uM, mouse.x, mouse.y);
    gl.uniform1f(uE, energy);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // paint right away so the canvas never shows an empty frame
  draw(start);

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    draw(start + 20000);
    window.addEventListener('resize', function () { draw(start + 20000); });
    return;
  }

  // only animate while the hero is on screen and the tab is visible
  var running = false, onScreen = true;
  function loop(now) {
    if (!running) return;
    draw(now);
    requestAnimationFrame(loop);
  }
  function update() {
    var should = onScreen && document.visibilityState === 'visible';
    if (should && !running) { running = true; requestAnimationFrame(loop); }
    else if (!should) running = false;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; update(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', update);
  update();
})();

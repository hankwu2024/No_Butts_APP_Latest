// Motion and small interactions for the "warm field report" look (see DESIGN.md).
// Everything here is decoration: content stays fully visible if this script never runs.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- reading progress bar ----------
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function updateBar() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(window.scrollY / max, 1) : 0);
  }
  window.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);
  updateBar();

  // ---------- photo marquee: duplicate the row so the loop is seamless ----------
  if (!reduce) {
    document.querySelectorAll('.marquee-track').forEach(function (track) {
      Array.prototype.slice.call(track.children).forEach(function (item) {
        var copy = item.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      });
    });
  }

  // ---------- cursor spotlight on cards ----------
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.card, .interest-card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // ---------- back-to-top button with a progress ring ----------
  var top = document.createElement('button');
  top.type = 'button';
  top.className = 'to-top';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<svg viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="23"/></svg>↑';
  document.body.appendChild(top);
  var ring = top.querySelector('circle');
  var C = 2 * Math.PI * 23;
  ring.style.strokeDasharray = C;
  function updateTop() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    ring.style.strokeDashoffset = C * (1 - p);
    top.classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', updateTop, { passive: true });
  updateTop();
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  if (reduce) return;

  // ---------- buttons lean toward the cursor ----------
  if (finePointer) {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = 'translate(' + x + 'px,' + (y - 2) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  // ---------- hero photo tilts toward the cursor ----------
  var photo = document.querySelector('.hero-photo');
  if (photo && finePointer) {
    photo.addEventListener('pointermove', function (e) {
      var r = photo.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      photo.style.transform = 'perspective(900px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg)';
    });
    photo.addEventListener('pointerleave', function () { photo.style.transform = ''; });
  }

  // ---------- scroll reveal + count-up ----------
  if (!('IntersectionObserver' in window)) return;

  var groups = [
    '.section-head', '.quote', '.chip-row', '.two-col > *', '.sow-feature', '.marquee',
    '.card-grid > *', '.stats > .stat', '.photo-grid > figure', '.interest-card',
    '.fact-grid > .fact', '.award-year', '.timeline:not(.full-log) > .tl-item',
    '.country-block', '.table-scroll', '.st-branch'
  ];

  var targets = [];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest('.hero') || el.closest('.action-modal') || targets.indexOf(el) !== -1) return;
      // stagger siblings in the same container
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--reveal-delay', Math.min(idx, 6) * 0.07 + 's');
      el.classList.add('reveal');
      targets.push(el);
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      var num = e.target.querySelector('.num');
      if (num) countUp(num);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(function (el) { io.observe(el); });

  // "17,707+" counts up from 0 and keeps the "+"; text like "9 年" is left alone
  function countUp(el) {
    var text = el.textContent.trim();
    var m = text.match(/^([\d,]+)(\+?)$/);
    if (!m) return;
    var end = parseInt(m[1].replace(/,/g, ''), 10);
    if (!end) return;
    var start = null, dur = 1400;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased).toLocaleString('en-US') + m[2];
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = text;
    }
    requestAnimationFrame(step);
  }
})();

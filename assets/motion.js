// Scroll-reveal and count-up for the "action scrapbook" look (see DESIGN.md).
// Content stays fully visible if this script never runs.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var groups = [
    '.section-head', '.quote', '.chip-row', '.two-col > *', '.sow-feature',
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
    var start = null, dur = 1200;
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

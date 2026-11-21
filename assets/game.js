// "Your turn" mini-game on the home page: tap the cigarette butts to pick them up.
(function () {
  var game = document.querySelector('.butt-game');
  if (!game) return;

  var field = game.querySelector('.butt-field');
  var countEl = game.querySelector('[data-count]');
  var hint = game.querySelector('.butt-hint');
  var done = game.querySelector('.butt-done');
  var reset = game.querySelector('.butt-reset');
  var next = game.querySelector('.game-next');
  var total = parseInt(game.dataset.total, 10) || 12;
  var picked = 0;

  var SVG = '<svg viewBox="0 0 64 16" aria-hidden="true">' +
    '<rect x="0" y="3" width="26" height="10" rx="2" fill="#e8a25a"/>' +
    '<rect x="25" y="3" width="30" height="10" fill="#f4f1ea"/>' +
    '<rect x="54" y="3" width="8" height="10" rx="2" fill="#6b6460"/>' +
    '<rect x="25" y="3" width="2" height="10" fill="#c98a4a"/></svg>';

  function scatter() {
    field.innerHTML = '';
    picked = 0;
    countEl.textContent = '0';
    hint.hidden = false;
    done.hidden = true;
    reset.hidden = true;
    if (next) next.hidden = true;
    game.classList.remove('is-done');

    // spread the butts over a 4 x 3 grid, jittered inside each cell
    var cols = 4, rows = Math.ceil(total / cols);
    for (var i = 0; i < total; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      var x = (c + 0.2 + Math.random() * 0.6) / cols * 100;
      var y = (r + 0.2 + Math.random() * 0.6) / rows * 100;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'butt';
      b.setAttribute('aria-label', label(i + 1));
      b.style.left = x + '%';
      b.style.top = y + '%';
      b.style.setProperty('--rot', Math.round(Math.random() * 360) + 'deg');
      b.innerHTML = SVG;
      field.appendChild(b);
    }
  }

  field.addEventListener('click', function (e) {
    var b = e.target.closest('.butt');
    if (!b || b.classList.contains('picked')) return;
    b.classList.add('picked');
    b.disabled = true;

    var plus = document.createElement('span');
    plus.className = 'butt-plus';
    plus.textContent = '+1';
    plus.style.left = b.style.left;
    plus.style.top = b.style.top;
    field.appendChild(plus);
    setTimeout(function () { plus.remove(); }, 900);

    picked++;
    countEl.textContent = picked;
    countEl.classList.remove('bump');
    void countEl.offsetWidth;
    countEl.classList.add('bump');

    if (picked === total) {
      hint.hidden = true;
      done.hidden = false;
      reset.hidden = false;
      if (next) next.hidden = false;
      game.classList.add('is-done');
    }
  });

  function label(i) {
    var l = window.currentLang;
    return (l === 'zh' ? '撿起菸蒂 ' : (l === 'ja' ? '吸い殻を拾う ' : 'Pick up butt ')) + i;
  }
  document.addEventListener('langchange', function () {
    field.querySelectorAll('.butt').forEach(function (b, i) { b.setAttribute('aria-label', label(i + 1)); });
  });

  reset.addEventListener('click', scatter);
  scatter();
})();

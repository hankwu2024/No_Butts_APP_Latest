// 點「開啟 APP」時，不離開個人網站，改成跳出視窗開啟菸蒂快篩平台
(function () {
  var APP_URL = 'screening/index.html';
  var LABELS = {
    zh: { title: '菸蒂快篩平台', newTab: '在新分頁開啟 ↗', close: '關閉' },
    en: { title: 'Cigarette Butt Screening App', newTab: 'Open in new tab ↗', close: 'Close' },
    ja: { title: '吸い殻クイックスクリーニング', newTab: '新しいタブで開く ↗', close: '閉じる' }
  };
  var modal, frame, lastFocus;

  function label(k) {
    var l = LABELS[window.currentLang] || LABELS.zh;
    return l[k];
  }

  function build() {
    modal = document.createElement('div');
    modal.className = 'app-popup';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div class="app-popup-backdrop" data-close></div>' +
      '<div class="app-popup-panel">' +
      '  <div class="app-popup-bar">' +
      '    <span class="app-popup-title"></span>' +
      '    <a class="app-popup-newtab" href="' + APP_URL + '" target="_blank" rel="noopener"></a>' +
      '    <button type="button" class="app-popup-close" data-close>×</button>' +
      '  </div>' +
      '  <iframe class="app-popup-frame" allow="geolocation; camera; clipboard-write" title=""></iframe>' +
      '</div>';
    document.body.appendChild(modal);
    frame = modal.querySelector('iframe');
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  function open() {
    if (!modal) build();
    lastFocus = document.activeElement;
    modal.querySelector('.app-popup-title').textContent = label('title');
    modal.querySelector('.app-popup-newtab').textContent = label('newTab');
    var btn = modal.querySelector('.app-popup-close');
    btn.setAttribute('aria-label', label('close'));
    frame.title = label('title');
    // 第一次打開才載入，之後關掉再開會保留原本的畫面
    if (!frame.getAttribute('src')) frame.src = APP_URL;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    btn.focus();
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="screening/"]');
    if (!a || (modal && modal.contains(a))) return;
    // 按住 Ctrl / Cmd / Shift 或按中鍵時，照瀏覽器原本的方式開新分頁
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    open();
  });
})();

// 全站共用的成果數據與參考來源（唯一資料來源）。
// 頁面上用 <span data-stat="butts"></span> 顯示數字，用 data-stat-note 顯示統計說明；
// 改數字只要改這個檔案，所有頁面、三種語言會一起更新。
// asOf / scope / method 填 null 代表「待確認」：前台不會顯示那一項，不會出現假資料。
window.SITE_DATA = {
  stats: {
    butts:   { value: 17707,  plus: true,  source: 'log', asOf: null, method: null },
    actions: { value: 94,     plus: false, source: 'log', asOf: null, method: null },
    reach:   { value: 117608, plus: true,  source: 'log', asOf: null, method: null },
    forum:   { value: 300,    plus: true,  source: null,  asOf: null, method: null }
  },

  sourceLabels: {
    log:   { zh: '不落蒂聯盟行動總表（內部紀錄）', en: 'No Butts Alliance action log (internal record)', ja: '不落蒂聯盟 活動記録（内部資料）' }
  },

  // 科學數據的參考來源（project.html 的「資料來源」區塊會列出）
  references: [
    {
      id: 'ema-91',
      type: 'official',
      title: { zh: '環境部環境管理署〈菸蒂不落地計畫：強化研究〉常見問答', en: 'Ministry of Environment (Taiwan), Environmental Management Administration — Cigarette Butt-Free Plan FAQ', ja: '台湾環境部 環境管理署「吸い殻ポイ捨てゼロ計画」FAQ' },
      note: {
        zh: '依 2025 年菸品銷售約 365 億根、假設四分之一遭亂丟推估，每年至少 91 億根菸蒂進入環境。這是推估值，不是實際清點。頁面發布 2025-03-10，更新 2026-08-31。',
        en: 'Estimate: about 36.5 billion cigarettes sold in 2025; assuming a quarter of butts are littered, at least 9.1 billion butts enter the environment each year. This is an estimate, not a count. Published 2025-03-10, updated 2026-08-31.',
        ja: '2025年の販売量約365億本、その4分の1がポイ捨てされると仮定した推計で、年間少なくとも91億本が環境中に出ています。実測ではなく推計値です。2025-03-10公開、2026-08-31更新。'
      },
      url: 'https://www.ema.gov.tw/topics/cigarette-butt-free-plan/strengthened-research/4079.html'
    },
    {
      id: 'slaughter-2011',
      type: 'paper',
      title: { zh: 'Slaughter E. 等（2011）菸蒂及其化學成分對海水與淡水魚的毒性，Tobacco Control 20(Suppl 1): i25–29', en: 'Slaughter E. et al. (2011). Toxicity of cigarette butts, and their chemical components, to marine and freshwater fish. Tobacco Control 20(Suppl 1): i25–29', ja: 'Slaughter E. ほか（2011）吸い殻とその化学成分の海水魚・淡水魚への毒性. Tobacco Control 20(Suppl 1): i25–29' },
      note: {
        zh: '美國 EPA 標準魚類急毒性試驗，對象為海水魚（topsmelt）與淡水魚（黑頭呆魚）。抽過且含殘留菸草的菸蒂浸出液，半數致死濃度約為每公升 1 根菸蒂。這是實驗室條件下的結果，不等於真實河川或海洋中的情況。',
        en: 'US EPA standard acute fish bioassays on a marine fish (topsmelt) and a freshwater fish (fathead minnow). For leachate of smoked butts with leftover tobacco, the LC50 was about 1 butt per litre. A laboratory result; it does not describe conditions in real rivers or seas.',
        ja: '米国EPA標準の魚類急性毒性試験（海水魚トップスメルト、淡水魚ファットヘッドミノー）。たばこの残った吸い殻の浸出液で、半数致死濃度は1リットルあたり約1本。実験室での結果であり、実際の川や海の状況を示すものではありません。'
      },
      url: 'https://doi.org/10.1136/tc.2010.040170'
    }
  ]
};

(function () {
  function lang() { return window.currentLang || 'en'; }
  function locale(l) { return l === 'zh' ? 'zh-TW' : (l === 'ja' ? 'ja-JP' : 'en-US'); }
  function fmt(s, l) { return s.value.toLocaleString(locale(l)) + (s.plus ? '+' : ''); }

  var NOTE = {
    zh: { src: '資料來源：', asOf: '統計截止：', method: '計算方式：' },
    en: { src: 'Source: ', asOf: 'As of: ', method: 'Method: ' },
    ja: { src: '出典：', asOf: '集計日：', method: '算出方法：' }
  };

  function render() {
    var D = window.SITE_DATA, l = lang();
    document.querySelectorAll('[data-stat]').forEach(function (el) {
      var s = D.stats[el.getAttribute('data-stat')];
      if (s) el.textContent = fmt(s, l);
    });
    // 數字說明：只顯示已確認的欄位
    document.querySelectorAll('[data-stat-note]').forEach(function (el) {
      var keys = el.getAttribute('data-stat-note').split(/\s+/), seen = {}, parts = [];
      var N = NOTE[l] || NOTE.en;
      keys.forEach(function (k) {
        var s = D.stats[k];
        if (!s) return;
        if (s.source && !seen[s.source]) {
          seen[s.source] = 1;
          var lab = D.sourceLabels[s.source];
          parts.push(N.src + (lab[l] || lab.en));
        }
        if (s.asOf && !seen['a' + s.asOf]) { seen['a' + s.asOf] = 1; parts.push(N.asOf + s.asOf); }
        if (s.method && s.method[l]) parts.push(N.method + s.method[l]);
      });
      el.textContent = parts.join('　');
    });
    document.querySelectorAll('[data-references]').forEach(function (ol) {
      ol.innerHTML = '';
      D.references.forEach(function (r) {
        var li = document.createElement('li');
        li.id = 'ref-' + r.id;
        var a = document.createElement('a');
        a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = r.title[l] || r.title.en;
        var p = document.createElement('p');
        p.textContent = r.note[l] || r.note.en;
        li.appendChild(a); li.appendChild(p);
        ol.appendChild(li);
      });
    });
  }

  document.addEventListener('langchange', render);
  document.addEventListener('DOMContentLoaded', render);
})();

/*!
 * ملف الإعلانات الوحيد لكل الصفحات — كل شيء يخص الإعلانات هنا فقط.
 * بانرات + Native فقط: بدون Popunder وبدون Social Bar وبدون إشعارات.
 * الإعلانات تُدرج مباشرة في الصفحة (بلا iframe معزول).
 *
 * الاستخدام في أي صفحة:
 *   1) <script src="adsterra.js" defer></script>
 *   2) أماكن فارغة:  <div data-ad="top"></div>   (الأسماء في P أدناه)
 *   3) اختياري: data-no-support على <body> لإخفاء زر/رابط الراعي.
 * أداة اليوتيوب (التي فيها #apiCard) تُنشأ أماكنها تلقائياً من PAGE أدناه حسب التبويب.
 * للإيقاف: ENABLED=false أو احذف وسم <script>.
 */
(function () {
  'use strict';
  var ENABLED = true;

  // ---- الإعدادات ---------------------------------------------------------
  var SUPPORT_CHIP = true;
  var SUPPORT_COOLDOWN = 60000;
  var SUPPORT_LINK = 'https://araplhn.org/4/3f093ddf57a8ee45454ef2e9b69b320a';
  var HOST = 'https://bauval.org';

  // ---- الوحدات -----------------------------------------------------------
  var U = {
    b728:  { k: 'b438ca159fef3619cd01dd89663463be', w: 728, h: 90  },
    m300:  { k: '729c9fd7aa7322cef370e2d2f67a5788', w: 300, h: 250 },
    b468:  { k: '1e423ba61e8df2d60437276587320065', w: 468, h: 60  },
    m320:  { k: '7ba3e4b2562ec32fe469244d1c937d74', w: 320, h: 50  },
    s160a: { k: 'fabddc7a40461c7b942294ab544c4344', w: 160, h: 300 },
    s160b: { k: 'd6d837601ee8eae05c4e2f5180e6638d', w: 160, h: 600 },
    native:{ k: '7d74d287d7c8907ca009698fb7e174e7', native: true, h: 280 }
  };

  // اسم المكان -> [[وحدة, أقل عرض شاشة, أقل ارتفاع (اختياري)], ...] أول شرط ينجح يُستخدم.
  // الوحدة لا تظهر في مكانين ظاهرين معاً (يُتخطى المكان الثاني).
  var P = {
    // صفحات ثابتة
    top:   [['b728', 800], ['m320', 340]],
    topx:  [['b728', 800], ['b468', 500], ['m320', 0]],
    mid:   [['m300', 330]],
    end:   [['native', 0]],
    seo:   [['b468', 520]],
    sideR: [['s160b', 1241]],
    sideL: [['s160a', 1241]],
    railL: [['s160b', 1340]],
    railR: [['s160a', 1340]],
    // أداة اليوتيوب
    small: [['b468', 500], ['m320', 0]],
    wide1: [['b728', 800], ['m300', 0]],
    wide2: [['native', 0]],
    cRailL:[['s160a', 1140]],
    cRailR:[['s160b', 1140, 720]]
  };

  // ---- أماكن أداة اليوتيوب (تُنشأ فقط إذا وُجد #apiCard) -----------------
  var HOME = 'body:not(.has-data)', API = 'body.has-data[data-tab="api"]',
      STATS = 'body.has-data[data-tab="overview"]', RES = 'body.has-data[data-tab="videos"]',
      EXP = 'body.has-data[data-tab="export"]', RAIL = HOME + ',' + API + ',' + EXP;
  var PAGE = [
    { id: 'homeTop', kind: 'small', before: 'apiCard', order: 0, show: HOME },
    { id: 'home1',   kind: 'wide1', after: 'helpVid', order: 2, show: HOME },
    { id: 'home2',   kind: 'wide2', afterAd: 'home1', order: 2, show: HOME },
    { id: 'apiTop',  kind: 'small', before: 'apiCard', order: 0, show: API },
    { id: 'api1',    kind: 'wide1', after: 'apiCard', order: 2, show: API },
    { id: 'api2',    kind: 'wide2', afterAd: 'api1', order: 2, show: API },
    { id: 'statsTop',kind: 'small', after: 'channelInfoCard', order: 4, show: STATS },
    { id: 'stats1',  kind: 'wide1', after: 'statsWrap', order: 5, show: STATS },
    { id: 'stats2',  kind: 'wide2', afterAd: 'stats1', order: 5, show: STATS },
    { id: 'res1',    kind: 'wide1', after: 'tableContainer', order: 7, show: RES },
    { id: 'expTop',  kind: 'small', before: 'exportCard', order: 8, show: EXP },
    { id: 'exp1',    kind: 'wide1', after: 'exportCard', order: 8, show: EXP },
    { id: 'exp2',    kind: 'wide2', afterAd: 'exp1', order: 8, show: EXP },
    { id: 'railL',   kind: 'cRailL', rail: 1, show: RAIL },
    { id: 'railR',   kind: 'cRailR', rail: 1, show: RAIL }
  ];

  if (!ENABLED) return;
  var slots = [], live = {}, queue = [], busy = false;
  var ar = function () { return document.documentElement.lang === 'ar'; };
  var label = function () { return ar() ? 'إعلان' : 'Advertisement'; };

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.adx{margin:6px auto;text-align:center;max-width:100%}' +
      '.adl{display:block;font:11px system-ui,sans-serif;opacity:.65;margin-bottom:3px}' +
      '.adx iframe{border:0;display:block;margin:0 auto;background:transparent;max-width:none}' +
      '[data-show]{display:none;box-sizing:border-box;width:100%;max-width:970px;margin:22px auto;text-align:center}' +
      '[data-show][data-ad="small"]{max-width:760px;margin:12px auto 4px}' +
      '[data-show].adrail{position:fixed;top:84px;width:160px;margin:0;z-index:5}' +
      '[data-ad="cRailL"]{left:calc(50% - 556px)}[data-ad="cRailR"]{left:calc(50% + 396px)}' +
      '#adsSupport{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom,0px));inset-inline-start:14px;z-index:30;background:#0a7a65;color:#fff;padding:8px 14px;border-radius:99px;font:600 .85rem system-ui,sans-serif;text-decoration:none;box-shadow:0 3px 12px #0004}' +
      '@media print{#adsSupport,.adx,[data-show]{display:none!important}}';
    document.head.appendChild(s);
  }

  // atOptions متغير عام يقرؤه كل سكربت إعلان، لذا تُحمَّل الوحدات واحدة تلو الأخرى.
  function next() {
    if (busy || !queue.length) return;
    busy = true;
    var job = queue.shift(), done = false;
    var fin = function () { if (done) return; done = true; busy = false; setTimeout(next, 150); };
    job(fin);
    setTimeout(fin, 5000);
  }
  function enqueue(job) { queue.push(job); next(); }

  // ينقل ما يكتبه سكربت الإعلان (document.write) إلى حاوية الإعلان نفسها؛ وسوم script تُنشأ من جديد لتعمل.
  function put(holder, html) {
    var t = document.createElement('div');
    t.innerHTML = html;
    while (t.firstChild) {
      var n = t.firstChild;
      if (n.nodeName === 'SCRIPT') {
        var s = document.createElement('script');
        for (var i = 0; i < n.attributes.length; i++) s.setAttribute(n.attributes[i].name, n.attributes[i].value);
        s.text = n.text;
        t.removeChild(n);
        holder.appendChild(s);
      } else holder.appendChild(n);
    }
  }

  function frame(holder, u, fin) {
    var s = document.createElement('script');
    s.setAttribute('data-cfasync', 'false');
    if (u.native) {
      var c = document.createElement('div');
      c.id = 'container-' + u.k;
      holder.appendChild(c);
      s.async = true;
      s.onload = s.onerror = fin;
      s.src = HOST + '/21/' + u.k;
      holder.appendChild(s);
      return;
    }
    window.atOptions = { key: u.k, format: 'iframe', height: u.h, width: u.w, params: {} };
    var ow = document.write, ol = document.writeln;
    document.write = document.writeln = function () { put(holder, [].join.call(arguments, '')); };
    var restore = function () { document.write = ow; document.writeln = ol; fin(); };
    s.onload = s.onerror = restore;
    s.src = HOST + '/22/' + u.k;
    holder.appendChild(s);
  }

  // ---- اختيار الوحدة والظهور ---------------------------------------------
  function choose(s) {
    var r = P[s.kind] || [], w = window.innerWidth, h = window.innerHeight;
    for (var i = 0; i < r.length; i++) {
      var u = r[i][0];
      if (w >= r[i][1] && h >= (r[i][2] || 0) && (!live[u] || live[u] === s)) return u;
    }
    return null;
  }

  function visible(s) {
    var el = s.el;
    if (s.show) {
      var ok = !document.body.classList.contains('focus') && document.body.matches(s.show);
      el.style.display = ok ? 'block' : 'none';
      if (!ok) return false;
    }
    return el.getClientRects().length > 0;
  }

  function fit(s) {
    if (!s.out) return;
    var p = s.show ? s.el : s.el.parentNode, cs = getComputedStyle(p),
        av = p.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
    if (!(av > 0)) return;
    var k = Math.min(1, av / s.u.w);   // يصغّر ولا يقصّ
    s.out.style.width = Math.round(s.u.w * k) + 'px';
    s.out.style.height = Math.round(s.u.h * k) + 'px';
    s.holder.style.transform = k < 1 ? 'scale(' + k + ')' : '';
  }

  function unmount(s) {
    if (s.io) { s.io.disconnect(); s.io = null; }
    if (s.box && s.box.parentNode) s.box.parentNode.removeChild(s.box);
    if (s.unit && live[s.unit] === s) delete live[s.unit];
    s.box = s.out = s.holder = s.u = s.unit = null;
    s.gen++;
  }

  function mount(s, unit) {
    var u = U[unit], box = document.createElement('div'), lab = document.createElement('small'),
        holder = document.createElement('div'), g = ++s.gen;
    live[unit] = s;
    s.unit = unit; s.u = u; s.box = box; s.holder = holder; s.out = null;
    box.className = 'adx'; lab.className = 'adl'; lab.textContent = label();
    box.appendChild(lab);
    if (u.native) {
      holder.style.cssText = 'width:100%;max-width:728px;min-height:' + u.h + 'px;margin:0 auto';
      box.appendChild(holder);
    } else {
      var out = document.createElement('div');
      out.style.cssText = 'direction:ltr;margin:0 auto;width:' + u.w + 'px;height:' + u.h + 'px';
      holder.style.cssText = 'direction:ltr;width:' + u.w + 'px;height:' + u.h + 'px;transform-origin:0 0';
      out.appendChild(holder); box.appendChild(out); s.out = out;
    }
    s.el.appendChild(box);
    var kind = s.el.getAttribute('data-ad');
    if (/^rail/.test(kind)) {
      s.el.style.cssText = 'position:fixed;top:84px;z-index:3;' + (kind === 'railL' ? 'left:10px' : 'right:10px');
    }
    fit(s);
    var go = function () {
      enqueue(function (fin) {
        if (s.gen !== g || !s.box) { fin(); return; }
        frame(holder, u, fin);
      });
    };
    if ('IntersectionObserver' in window) {
      s.io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { s.io.disconnect(); s.io = null; go(); }
      }, { rootMargin: '300px' });
      s.io.observe(holder);
    } else go();
  }

  function sync() {
    slots.forEach(function (s) {
      if (!visible(s)) { if (s.box) unmount(s); return; }
      var u = choose(s);
      if (s.box && s.unit !== u) unmount(s);
      if (!s.box) { if (u) mount(s, u); }
      else fit(s);
    });
  }

  function reg(el) {
    slots.push({ el: el, kind: el.getAttribute('data-ad'), show: el.getAttribute('data-show'), gen: 0 });
  }

  // أماكن أداة اليوتيوب: تُنشأ بجوار العناصر المعروفة
  function buildPage() {
    if (!document.getElementById('apiCard')) return;
    var made = {};
    PAGE.forEach(function (d) {
      var el = document.createElement('div');
      el.setAttribute('data-ad', d.kind); el.setAttribute('data-show', d.show);
      if (d.rail) {
        el.className = 'adrail'; document.body.appendChild(el);
      } else {
        var ref = d.afterAd ? made[d.afterAd] : document.getElementById(d.after || d.before);
        if (!ref || !ref.parentNode) return;
        if (d.order != null) el.style.order = d.order;
        ref.parentNode.insertBefore(el, d.before ? ref : ref.nextSibling);
      }
      made[d.id] = el; reg(el);
    });
  }

  function support() {
    if (!SUPPORT_CHIP || document.body.hasAttribute('data-no-support')) return;
    var txtChip = function () { return ar() ? '☕ ادعم الأداة · رابط راعٍ (إعلان)' : '☕ Support us · Sponsor link (ad)'; };
    var txtFoot = function () { return ar() ? 'ادعم الصفحة بزيارة رابط الراعي (إعلان)' : 'Support this page by visiting a sponsor link (ad)'; };
    var mk = function (id) {
      var a = document.createElement('a');
      if (id) a.id = id;
      a.href = SUPPORT_LINK; a.target = '_blank'; a.rel = 'sponsored noopener noreferrer';
      return a;
    };
    var chip = mk('adsSupport'); chip.textContent = txtChip();
    chip.addEventListener('click', function () {
      chip.style.display = 'none';
      setTimeout(function () { chip.style.display = ''; }, SUPPORT_COOLDOWN);
    });
    document.body.appendChild(chip);
    var foot = document.querySelector('footer'), fl = null;
    if (foot) {
      var d = document.createElement('div'); d.style.marginTop = '6px';
      fl = mk(); fl.style.cssText = 'color:inherit;text-decoration:underline';
      fl.textContent = txtFoot();
      d.appendChild(fl); foot.appendChild(d);
    }
    new MutationObserver(function () {
      chip.textContent = txtChip();
      if (fl) fl.textContent = txtFoot();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  function init() {
    css();
    [].forEach.call(document.querySelectorAll('[data-ad]'), reg);
    buildPage();
    sync();
    support();
    var t = 0, later = function (ms) { clearTimeout(t); t = setTimeout(sync, ms); };
    new MutationObserver(function () { later(60); })
      .observe(document.body, { attributes: true, attributeFilter: ['class', 'data-tab'] });
    new MutationObserver(function () {
      [].forEach.call(document.querySelectorAll('.adl'), function (l) { l.textContent = label(); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    addEventListener('resize', function () { later(150); });
    setInterval(sync, 1500);   // يلتقط إظهار/إخفاء الأقسام التي تتغير بـ style
  }
  function start() { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(init); }
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();

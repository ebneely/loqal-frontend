/* Loqal storefront — shared behaviour for every page. */
document.documentElement.classList.add('js');

/* Garment line art. One source, referenced by key from every page. */
window.SHAPES = {
  tee:'<path d="M40 26 L30 34 L22 52 L34 58 L38 50 L38 96 L82 96 L82 50 L86 58 L98 52 L90 34 L80 26 L70 26 Q60 38 50 26 Z"/>',
  shirt:'<path d="M42 24 L30 32 L22 52 L33 58 L37 50 L37 98 L83 98 L83 50 L87 58 L98 52 L90 32 L78 24 L60 34 Z"/><path d="M60 34 L60 98"/><path d="M42 24 L60 34 L78 24"/><rect class="solid" x="66" y="50" width="12" height="14" rx="1"/>',
  knit:'<path d="M44 26 L26 36 L18 60 L30 66 L36 54 L36 98 L84 98 L84 54 L90 66 L102 60 L94 36 L76 26 Q60 34 44 26 Z"/><path d="M44 26 Q60 20 76 26"/><path d="M36 90 L84 90"/>',
  sweat:'<path d="M44 26 L26 36 L18 60 L30 66 L36 54 L36 98 L84 98 L84 54 L90 66 L102 60 L94 36 L76 26 Z"/><path d="M46 26 Q60 40 74 26"/><path class="solid" d="M36 92 L84 92 L84 98 L36 98 Z"/><path d="M30 92 L90 92"/>',
  pants:'<path class="solid" d="M40 20 L80 20 L84 62 L78 104 L64 104 L60 60 L56 104 L42 104 L36 62 Z"/><path d="M40 20 L80 20 L84 62 L78 104 L64 104 L60 60 L56 104 L42 104 L36 62 Z"/><path d="M40 30 L80 30"/>',
  shorts:'<path d="M38 24 L82 24 L86 56 L80 84 L64 84 L60 56 L56 84 L40 84 L34 56 Z"/><path d="M38 34 L82 34"/>',
  jacket:'<path d="M42 22 L28 30 L20 56 L32 62 L36 52 L36 102 L84 102 L84 52 L88 62 L100 56 L92 30 L78 22 Z"/><path d="M60 22 L60 102"/><path d="M42 22 L60 30 L78 22"/><rect x="40" y="62" width="14" height="16" rx="1"/><rect x="66" y="62" width="14" height="16" rx="1"/>',
  shoe:'<path class="solid" d="M18 78 Q20 58 40 56 L72 56 Q98 58 100 78 L100 86 L18 86 Z"/><path d="M18 78 Q20 58 40 56 L72 56 Q98 58 100 78 L100 86 L18 86 Z"/><path d="M40 56 L46 68 L74 68"/>',
  bag:'<path d="M34 44 L86 44 L92 100 L28 100 Z"/><path d="M46 44 L46 32 Q60 20 74 32 L74 44"/><path d="M28 58 L92 58"/>',
  cap:'<path d="M32 74 Q32 34 60 34 Q88 34 88 74 Z"/><path class="solid" d="M28 74 L92 74 L92 88 L28 88 Z"/><path d="M28 74 L92 74 L92 88 L28 88 Z"/>',
  dress:'<path d="M46 24 L38 34 L30 100 L90 100 L82 34 L74 24 Q60 34 46 24 Z"/><path d="M38 48 L82 48"/>',
  socks:'<path d="M46 24 L62 24 L62 66 L84 84 L72 98 L44 76 L44 24 Z"/><path d="M46 34 L62 34"/>'
};

/* Reveals. The element is visible without JS; this only adds the entrance. */
(function(){
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin:'0px 0px -6% 0px', threshold:.06 });
  window.reveal = function(root){
    (root || document).querySelectorAll('.rv:not(.in)').forEach(function(el){ io.observe(el); });
  };
  reveal();
})();

/* Rail arrows. RTL scrollLeft runs negative; dir already carries the sign. */
document.querySelectorAll('.arrows button').forEach(function(b){
  b.addEventListener('click', function(){
    var r = document.getElementById(b.dataset.rail);
    if (r) r.scrollBy({ left: r.clientWidth * .7 * Number(b.dataset.dir), behavior:'smooth' });
  });
});

/* Single-choice button groups (filter chips, sizes, swatches). */
window.exclusive = function(sel){
  var all = document.querySelectorAll(sel);
  all.forEach(function(b){
    b.addEventListener('click', function(){
      all.forEach(function(o){ o.setAttribute('aria-pressed','false'); });
      b.setAttribute('aria-pressed','true');
    });
  });
};
exclusive('.chips .chip');

/* Add to cart — mockup only; confirms in place rather than navigating. */
document.addEventListener('click', function(e){
  var b = e.target.closest('.add, #add');
  if (!b) return;
  e.preventDefault();
  b.textContent = 'اتضافت ✓';
});

/* ── shops: one source of truth for every page ─────────
   [name, neighbourhood, street, pieces, open, hours, shape] */
window.SHOPS = [
  ['Versattire','الزمالك','٢٦ شارع البرازيل','١٤٢',1,'بيقفل ١٠ م','knit'],
  ['Dryp','مصر الجديدة','شارع كليوباترا ١٤','٨٦',1,'بيقفل ١٠ م','tee'],
  ['Ordinary Product','وسط البلد','شارع شريف ٩','٢٠٣',1,'بيقفل ٩ م','shirt'],
  ['Juvenile','المهندسين','شارع جامعة الدول','٦٤',0,'يفتح ١٢ م','jacket'],
  ['Plein De Vie','الزمالك','شارع حسن صبري ٣١','١١٨',1,'بيقفل ١١ م','dress'],
  ['Comfowear','مدينة نصر','شارع عباس العقاد','٩٧',0,'يفتح ١٢ م','sweat'],
  ['Zedzee','المعادي','شارع ٩ — المعادي','٥١',1,'بيقفل ١٠ م','shoe'],
  ['Antikka','وسط البلد','شارع طلعت حرب','٧٣',1,'بيقفل ٩ م','bag'],
  ['Salty','الزمالك','شارع ٢٦ يوليو','٦٨',0,'يفتح ١ م','tee'],
  ['Denjoe','المهندسين','شارع البطل أحمد عبد العزيز','١٠٤',1,'بيقفل ١٠ م','pants'],
  ['Eighties','مصر الجديدة','شارع الميرغني','٤٥',1,'بيقفل ٩ م','shirt'],
  ['Wahm','المعادي','شارع ٧٩ — المعادي','٣٧',0,'يفتح ١٢ م','cap'],
  ['Decked Out','مدينة نصر','مكرم عبيد','٥٩',1,'بيقفل ١٠ م','sweat'],
  ['Comfowear Kids','مدينة نصر','عباس العقاد','٢٤',0,'يفتح ١٢ م','tee'],
  ['JEN','الزمالك','شارع بهجت علي','٨١',1,'بيقفل ١٠ م','dress'],
  ['Vega','الدقي','شارع التحرير','٦٦',1,'بيقفل ٩ م','shoe'],
  ['Slack','المعادي','شارع ٢٣٣','٤٢',0,'يفتح ١٢ م','pants'],
  ['27','وسط البلد','شارع عدلي','٣٣',1,'بيقفل ٩ م','knit']
];

/* Shop card — the same object on the home rail and the shop index,
   so the two can never drift into two different ideas of a shop. */
window.shopCard = function(s, extra){
  var state = s[4]
    ? '<span class="state"><i class="dot"></i> مفتوح</span>'
    : '<span class="state shut">مقفول</span>';
  return '<a class="shopcard ' + (extra || '') + '" href="shops.html">'
    + '<span class="sign">' + state + '<span class="nm">' + s[0] + '</span></span>'
    + '<span class="sbody"><span class="t">' + s[0] + '</span>'
    + '<span class="hood">' + s[1] + '</span>'
    + '<span class="foot"><span>' + s[5] + '</span><span>' + s[3] + ' قطعة</span></span>'
    + '</span></a>';
};

/* ── the brands mega-menu: an A–Z index of every shop ───
   Built here rather than pasted into four pages — the advertise site
   already proved what happens when the same block lives in two files. */
(function(){
  var trigger = document.querySelector('[data-mega]');
  if (!trigger) return;

  var letters = {};
  SHOPS.forEach(function(s){
    var l = /[A-Za-z]/.test(s[0][0]) ? s[0][0].toUpperCase() : '#';
    (letters[l] = letters[l] || []).push(s);
  });
  var keys = Object.keys(letters).sort();

  var cols = keys.map(function(l){
    return '<div class="grp"><span class="ltr">' + l + '</span>'
      + letters[l].map(function(s){
          return '<a href="shops.html" data-shop="' + s[0] + '">' + s[0] + '</a>';
        }).join('')
      + '</div>';
  }).join('');

  var mega = document.createElement('div');
  mega.className = 'mega';
  mega.id = 'mega';
  mega.innerHTML = '<div class="az">' + cols + '</div>'
    + '<div class="mega-feat" id="feat"></div>';

  var scrim = document.createElement('div');
  scrim.className = 'scrim';

  document.body.appendChild(scrim);
  document.querySelector('header').after(mega);

  function feature(s){
    document.getElementById('feat').innerHTML =
      '<span class="pic"><svg viewBox="0 0 120 120">' + SHAPES[s[6]] + '</svg></span>'
      + '<span class="nm">' + s[0] + '</span>'
      + '<span class="hd">' + s[1] + ' — ' + s[2] + '</span>'
      + '<span class="rw">' + (s[4] ? '<i class="dot"></i> ' : '') + s[5]
      + ' · ' + s[3] + ' قطعة</span>';
  }
  feature(SHOPS[0]);

  mega.addEventListener('mouseover', function(e){
    var a = e.target.closest('[data-shop]');
    if (!a) return;
    var s = SHOPS.find(function(x){ return x[0] === a.dataset.shop; });
    if (s) feature(s);
  });

  /* the chevron lives with the trigger, so its rotation and the panel
     can never disagree about whether the menu is open */
  trigger.insertAdjacentHTML('beforeend',
    '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');

  function open(on){
    mega.classList.toggle('open', on);
    scrim.classList.toggle('open', on);
    trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) {
      var h = document.querySelector('header').getBoundingClientRect().bottom;
      mega.style.setProperty('--mega-top', Math.max(h, 0) + 'px');
    }
  }

  /* Hover on a pointer, tap on touch. The close delay matters: without it,
     crossing the gap between the trigger and the panel shuts the menu
     under the cursor. */
  var hoverable = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var t;
  function later(on){ clearTimeout(t); t = setTimeout(function(){ open(on); }, on ? 60 : 220); }

  if (hoverable) {
    [trigger, mega].forEach(function(el){
      el.addEventListener('mouseenter', function(){ later(true); });
      el.addEventListener('mouseleave', function(){ later(false); });
    });
    trigger.addEventListener('focus', function(){ open(true); });
  }

  /* Click still works everywhere — it is the only way in on touch, and on a
     mouse it lets someone pin the panel open rather than holding a hover. */
  trigger.addEventListener('click', function(e){
    e.preventDefault();
    clearTimeout(t);
    open(!mega.classList.contains('open'));
  });
  scrim.addEventListener('click', function(){ clearTimeout(t); open(false); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { clearTimeout(t); open(false); }
  });
})();

/* ── footer: built here so all four pages carry the same one ── */
(function(){
  var old = document.querySelector('footer');
  if (!old) return;

  var shops = SHOPS.slice().sort(function(a,b){ return a[0].localeCompare(b[0]); })
    .map(function(s){ return '<a href="shops.html">' + s[0] + '</a>'; }).join('');

  var links = [
    ['عن لوكال','https://join-loqaaal.vercel.app/'],
    ['انضم كمحل','https://join-loqaaal.vercel.app/'],
    ['الشحن والتوصيل','#'],
    ['الاستبدال والاسترجاع','#'],
    ['الأسئلة الشائعة','#'],
    ['تواصل معنا','#'],
    ['الشروط والأحكام','#'],
    ['سياسة الخصوصية','#']
  ].map(function(l){
    var ext = l[1].indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + l[1] + '"' + ext + '>' + l[0] + '</a>';
  }).join('');

  /* Payment METHODS, drawn — not imitations of the Visa/Mastercard/Meeza
     marks. Those are trademarks; a real deployment drops in the official
     assets the processor supplies. One icon per method also beats three
     near-identical card logos sitting in a row. */
  var PAY = [
    ['بطاقات','Visa · Mastercard · Meeza',
      '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 9.5h19"/><path d="M6 14.5h4"/>'],
    ['Valu','محفظة فالو',
      '<path d="M3 7.5A2 2 0 0 1 5 5.5h11a2 2 0 0 1 2 2v1"/><rect x="3" y="7.5" width="18" height="11" rx="2"/><path d="M21 11.5h-4a1.5 1.5 0 0 0 0 3h4"/>'],
    ['InstaPay','تحويل فوري',
      '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10 7.5h4.5L13 6"/><path d="M14 12.5H9.5L11 14"/>'],
    ['كاش','عند الاستلام',
      '<rect x="2.5" y="6.5" width="19" height="11" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M5.5 12h.5"/><path d="M18 12h.5"/>']
  ];
  var pays = PAY.map(function(p){
    return '<span title="' + p[1] + '"><svg viewBox="0 0 24 24" aria-hidden="true">'
      + p[2] + '</svg>' + p[0] + '</span>';
  }).join('');

  var f = document.createElement('footer');
  f.className = 'site';
  f.innerHTML =
    '<div class="fcols">'
    + '<div class="fcol"><h3>المحلات</h3><div class="fshops">' + shops + '</div></div>'
    + '<div class="fcol"><h3>لوكال</h3><div class="flinks">' + links + '</div></div>'
    + '<div class="fcol"><h3>اعرف الجديد</h3>'
      + '<form class="sub" onsubmit="return false"><input type="email" placeholder="إيميلك" aria-label="إيميلك"><button type="submit">اشترك</button></form>'
      + '<div class="pays">' + pays + '</div>'
    + '</div>'
    + '</div>'
    + '<div class="fbot">'
      + '<span class="mark">لوكال</span>'
      + '<span>تسوّق من محلات بلدك — القاهرة والجيزة</span>'
      + '<span class="social">'
        + '<a href="#" aria-label="إنستجرام"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg></a>'
        + '<a href="https://wa.me/201559959890" target="_blank" rel="noopener" aria-label="واتساب"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-3.2-6.4"/><path d="M4 20l1.4-4A8 8 0 0 0 20 12"/></svg></a>'
      + '</span>'
      + '<span>© ٢٠٢٦ لوكال</span>'
    + '</div>';

  old.replaceWith(f);
})();

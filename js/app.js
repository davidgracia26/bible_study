/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (theme === 'dark') {
    icon.textContent  = '\u2600';
    label.textContent = 'Light';
  } else {
    icon.innerHTML    = '&#9790;';
    label.textContent = 'Dark';
  }
  try { localStorage.setItem('bs-theme', theme); } catch(e) {}
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* Restore saved preference on load */
(function() {
  try {
    const saved = localStorage.getItem('bs-theme');
    if (saved === 'dark' || saved === 'light') applyTheme(saved);
  } catch(e) {}
})();

/* ════════════════════════════════════════
   STATE
════════════════════════════════════════ */
let DATA = null;
let SECTION_Q_START = [];
let current = 0;
let done = new Set();
let fontScale = 0;
const BASE_PX = 18;

/* ════════════════════════════════════════
   LOAD WEEK DATA
════════════════════════════════════════ */
async function loadWeek() {
  const params = new URLSearchParams(location.search);
  const weekId = params.get('week');

  if (!weekId) {
    showAppError('No study was specified. Go back to the <a href="index.html">index</a> and pick a week.');
    return;
  }

  try {
    const res = await fetch(`data/${weekId}.json`);
    if (!res.ok) throw new Error(`Could not load data/${weekId}.json (${res.status})`);
    DATA = await res.json();
  } catch (err) {
    showAppError(`Sorry, this study could not be loaded. (${err.message})`);
    return;
  }

  initPage();
}

function showAppError(html) {
  const stage = document.getElementById('q-stage');
  if (stage) stage.innerHTML = `<div class="app-error">${html}</div>`;
  const chromeTitle = document.getElementById('chrome-title');
  if (chromeTitle) chromeTitle.textContent = 'Bible Study';
}

/* ════════════════════════════════════════
   BUILD STATIC-ISH CHROME FROM DATA
════════════════════════════════════════ */
function initPage() {
  if (DATA.meta && DATA.meta.pageTitle) document.title = DATA.meta.pageTitle;

  document.getElementById('chrome-eyebrow').innerHTML = DATA.meta.eyebrow || '';
  document.getElementById('chrome-title').innerHTML =
    `${DATA.meta.title || ''} <span>${DATA.meta.titleHighlight || ''}</span>`;

  SECTION_Q_START = DATA.sections.map((_, i) =>
    DATA.questions.findIndex(q => q.section === i)
  );

  buildSectionPills();
  buildListDrawer();
  buildPassagesOverlay();
  buildVoicesOverlay();
  buildPrayerOverlay();
  buildOverview();

  document.getElementById('page-footer-text').innerHTML = DATA.meta.footer || '';

  render();
}

function buildSectionPills() {
  const hasVoices = Object.keys(DATA.scholars || {}).length > 0;
  let html = `<button onclick="jumpToSection('passages')" data-target="passages">Passages</button>`;
  DATA.sections.forEach((sec, i) => {
    html += `<button onclick="jumpToSection('${i}')" data-target="${i}">${sec.label}</button>`;
  });
  if (hasVoices) {
    html += `<button onclick="jumpToSection('voices')" data-target="voices">Voices</button>`;
  }
  html += `<button onclick="jumpToSection('prayer')" data-target="prayer">Prayer</button>`;
  document.getElementById('section-pills').innerHTML = html;
}

function buildListDrawer() {
  let html = '';
  DATA.sections.forEach((sec, sIdx) => {
    html += `<div class="list-section">${sec.label} &mdash; ${sec.name.replace(/<\/?em>/g, '')} &nbsp;&middot;&nbsp; ${sec.ref}</div>`;
    DATA.questions.forEach((q, qIdx) => {
      if (q.section !== sIdx) return;
      html += `
        <div class="list-q-item" id="li-${qIdx}" onclick="goToQuestion(${qIdx}); toggleListOverlay();">
          <div class="lq-num">${q.n}</div>
          <div class="lq-text">${q.text}</div>
        </div>`;
    });
  });
  document.getElementById('list-drawer-body').innerHTML = html;
}

function buildPassagesOverlay() {
  let html = '';
  Object.values(DATA.passages || {}).forEach(p => {
    html += `
      <div class="sp-passage-card">
        <div class="sp-ref"><a href="${p.link}" target="_blank" rel="noopener">${p.ref}</a></div>
        <div class="sp-text">${p.text}</div>
        <div class="sp-trans">${DATA.meta.translation || 'NIV'}</div>
      </div>`;
  });
  document.getElementById('passages-overlay-body').innerHTML = html;
}

function buildVoicesOverlay() {
  const scholars = Object.values(DATA.scholars || {});
  const overlay = document.getElementById('voices-overlay');
  if (!scholars.length) {
    if (overlay) overlay.remove();
    return;
  }
  let html = '';
  scholars.forEach(s => {
    html += `
      <div class="sp-scholar-card">
        <div class="sp-s-label">${s.name}${s.role ? ' &nbsp;&middot;&nbsp; ' + s.role : ''}</div>
        <div class="sp-s-quote">&ldquo;${s.quote}&rdquo;</div>
        <div class="sp-s-attr">&#x2014; ${s.name}</div>
      </div>`;
  });
  document.getElementById('voices-overlay-body').innerHTML = html;
}

function buildPrayerOverlay() {
  const prayer = DATA.prayer || {};
  document.getElementById('prayer-overlay-body').innerHTML = `
    <div class="sp-prayer-block">
      <div class="sp-prayer-label">${prayer.label || 'Closing Prayer'}</div>
      <div class="sp-prayer-text">${prayer.text || ''}</div>
      <div class="sp-prayer-source">${prayer.source || ''}</div>
    </div>`;
}

/* ════════════════════════════════════════
   OVERVIEW (auto-generated print view)
════════════════════════════════════════ */
function buildOverview() {
  let html = '';
  DATA.sections.forEach((sec, sIdx) => {
    html += `
      <div class="overview-part-header">
        <span class="op-label">${sec.label}</span>
        <span class="op-title">${sec.name}</span>
        <span class="op-ref">${sec.ref}</span>
      </div>`;
    DATA.questions.forEach(q => {
      if (q.section !== sIdx) return;
      const refsHTML = q.refs.map(r => `<span>${r}</span>`).join('');
      html += `
        <div class="overview-q-card">
          <div class="oq-num">${q.n}</div>
          <div>
            <div class="oq-text">${q.text}</div>
            <div class="oq-refs">${refsHTML}</div>
          </div>
        </div>`;
    });
  });
  document.getElementById('overview-section').innerHTML = html;
}

/* ════════════════════════════════════════
   RENDER (per-question view)
════════════════════════════════════════ */
function render() {
  const q = DATA.questions[current];

  /* Left panel */
  const sec = DATA.sections[q.section];
  document.getElementById('left-part-badge').textContent = sec.label;
  document.getElementById('left-part-name').innerHTML = sec.name;

  let leftHTML = '';

  const seenPassages = new Set();
  q.passages.forEach(key => {
    if (seenPassages.has(key)) return;
    seenPassages.add(key);
    const p = DATA.passages[key];
    if (!p) return;
    leftHTML += `
      <div class="passage-block">
        <div class="p-ref"><a href="${p.link}" target="_blank" rel="noopener">${p.ref}</a></div>
        <div class="p-text">${p.text}</div>
        <div class="p-trans">${DATA.meta.translation || 'NIV'}</div>
      </div>`;
  });

  if (q.scholars && q.scholars.length) {
    q.scholars.forEach(key => {
      const s = DATA.scholars[key];
      if (!s) return;
      leftHTML += `
        <div class="scholar-block">
          <div class="s-label">Voice for the Discussion</div>
          <div class="s-quote">&ldquo;${s.quote}&rdquo;</div>
          <div class="s-attr">&#x2014; ${s.name}${s.role ? ' &nbsp;&middot;&nbsp; ' + s.role : ''}</div>
        </div>`;
    });
  }

  if (!leftHTML) {
    leftHTML = `<div class="no-scholar">No citation for this question</div>`;
  }

  document.getElementById('left-body').innerHTML = leftHTML;

  /* Right panel */
  const refsHTML = q.refs.map(r => `<span>${r}</span>`).join('');
  document.getElementById('q-stage').innerHTML = `
    <div class="q-num-large">Question ${q.n}</div>
    <div class="q-text-main">${q.text}</div>
    <div class="q-refs">${refsHTML}</div>
  `;

  /* Dots */
  let dotsHTML = '';
  DATA.questions.forEach((_, i) => {
    let cls = 'q-dot';
    if (i === current) cls += ' active';
    else if (done.has(i)) cls += ' done';
    dotsHTML += `<div class="${cls}" onclick="goToQuestion(${i})" title="Q${i+1}"></div>`;
  });
  document.getElementById('q-dots').innerHTML = dotsHTML;
  document.getElementById('q-of-total').innerHTML = `<strong>Q${q.n}</strong> of ${DATA.questions.length}`;

  /* Nav buttons */
  document.getElementById('btn-prev').disabled = current === 0;
  document.getElementById('btn-next').disabled = current === DATA.questions.length - 1;
  document.getElementById('btn-next').innerHTML = current === DATA.questions.length - 1
    ? 'Last Question'
    : 'Next <span class="arrow">&#8594;</span>';

  /* Mark done */
  const markBtn = document.getElementById('btn-mark');
  if (done.has(current)) {
    markBtn.classList.add('marked');
    markBtn.textContent = '✓ Discussed';
  } else {
    markBtn.classList.remove('marked');
    markBtn.textContent = '✓ Mark Done';
  }

  /* Section pills */
  document.querySelectorAll('.section-pills button[data-target]').forEach(btn => {
    btn.classList.remove('active');
  });
  const activePill = document.querySelector(`.section-pills button[data-target="${q.section}"]`);
  if (activePill) activePill.classList.add('active');

  /* List drawer */
  document.querySelectorAll('.list-q-item').forEach((el, i) => {
    el.classList.remove('active-item', 'done-item');
    if (i === current) el.classList.add('active-item');
    if (done.has(i)) el.classList.add('done-item');
  });
}

/* ════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════ */
function goToQuestion(i) {
  current = Math.max(0, Math.min(DATA.questions.length - 1, i));
  render();
}
function nextQ() { goToQuestion(current + 1); }
function prevQ() { goToQuestion(current - 1); }
function toggleMark() {
  if (done.has(current)) done.delete(current);
  else done.add(current);
  render();
}

function jumpToSection(target) {
  if (target === 'passages') { openOverlay('passages-overlay'); return; }
  if (target === 'voices')   { openOverlay('voices-overlay'); return; }
  if (target === 'prayer')   { openOverlay('prayer-overlay'); return; }
  goToQuestion(SECTION_Q_START[Number(target)]);
}

function openOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function closeOverlayOnBackdrop(e, id) {
  if (e.target === document.getElementById(id)) closeOverlay(id);
}

/* ════════════════════════════════════════
   FONT SIZE
════════════════════════════════════════ */
function adjustFont(dir) {
  fontScale = Math.max(-2, Math.min(4, fontScale + dir));
  document.documentElement.style.fontSize = (BASE_PX + fontScale * 2) + 'px';
}

/* ════════════════════════════════════════
   LIST OVERLAY
════════════════════════════════════════ */
function toggleListOverlay() {
  document.getElementById('list-overlay').classList.toggle('open');
}
function closeListOnBackdrop(e) {
  if (e.target === document.getElementById('list-overlay')) toggleListOverlay();
}

/* ════════════════════════════════════════
   RESPONSIVE CHROME (mobile)
   On narrow screens, move section pills, font
   controls, and the theme toggle out of the
   cramped top bar and into the "All Questions"
   drawer, where there's room to breathe.
════════════════════════════════════════ */
function setupResponsiveChrome() {
  const drawerHeader = document.querySelector('.list-drawer-header');
  const pills        = document.getElementById('section-pills');
  const fontControls = document.getElementById('font-controls');
  const themeToggle  = document.getElementById('theme-toggle-btn');
  if (!drawerHeader) return;

  const movable = [pills, fontControls, themeToggle].filter(Boolean);
  const originals = movable.map(el => ({ el, parent: el.parentNode, next: el.nextSibling }));

  let quickActions = null;
  const mq = window.matchMedia('(max-width: 760px)');

  function layout(isMobile) {
    if (isMobile) {
      if (!quickActions) {
        quickActions = document.createElement('div');
        quickActions.className = 'drawer-quick-actions';
        drawerHeader.insertAdjacentElement('afterend', quickActions);
      }
      movable.forEach(el => quickActions.appendChild(el));
    } else {
      originals.forEach(({ el, parent, next }) => {
        if (next && next.parentNode === parent) parent.insertBefore(el, next);
        else parent.appendChild(el);
      });
    }
  }

  layout(mq.matches);
  mq.addEventListener('change', e => layout(e.matches));
}
setupResponsiveChrome();

/* ════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (!DATA) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextQ(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prevQ(); }
  if (e.key === ' ') { e.preventDefault(); toggleMark(); }
  if (e.key === 'd' || e.key === 'D') { toggleTheme(); }
  if (e.key === 'Escape') {
    document.getElementById('list-overlay').classList.remove('open');
    ['passages-overlay', 'voices-overlay', 'prayer-overlay'].forEach(id => closeOverlay(id));
  }
});

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
loadWeek();

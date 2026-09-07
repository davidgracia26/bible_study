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
let VIEWS = [];
let current = 0;
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

  buildViews();
  buildSectionPills();
  buildListDrawer();
  buildOverview();

  document.getElementById('page-footer-text').innerHTML = DATA.meta.footer || '';

  current = VIEWS.findIndex(v => v.type === 'question');
  render();
}

/* ════════════════════════════════════════
   VIEWS
   One continuous sequence: Passages, then
   each question, then Voices (if any), then
   Prayer. Prev/Next step through all of it.
════════════════════════════════════════ */
function buildViews() {
  const hasVoices = Object.keys(DATA.scholars || {}).length > 0;
  VIEWS = [{ type: 'passages' }];
  DATA.questions.forEach((q, i) => VIEWS.push({ type: 'question', qIndex: i }));
  if (hasVoices) VIEWS.push({ type: 'voices' });
  VIEWS.push({ type: 'prayer' });
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

function passagesHTML() {
  let html = '';
  Object.values(DATA.passages || {}).forEach(p => {
    html += `
      <div class="sp-passage-card">
        <div class="sp-ref"><a href="${p.link}" target="_blank" rel="noopener">${p.ref}</a></div>
        <div class="sp-text">${p.text}</div>
        <div class="sp-trans">${DATA.meta.translation || 'NIV'}</div>
      </div>`;
  });
  return html;
}

function voicesHTML() {
  let html = '';
  Object.values(DATA.scholars || {}).forEach(s => {
    html += `
      <div class="sp-scholar-card">
        <div class="sp-s-label">${s.name}${s.role ? ' &nbsp;&middot;&nbsp; ' + s.role : ''}</div>
        <div class="sp-s-quote">&ldquo;${s.quote}&rdquo;</div>
        <div class="sp-s-attr">&#x2014; ${s.name}</div>
      </div>`;
  });
  return html;
}

function prayerHTML() {
  const prayer = DATA.prayer || {};
  return `
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
   RENDER
   `current` indexes into VIEWS, which is one
   continuous sequence: Passages, Q1..Qn,
   Voices, Prayer. All views render into the
   same main panel (#q-stage) — no overlays.
════════════════════════════════════════ */
function render() {
  const view = VIEWS[current];
  const stage = document.getElementById('q-stage');
  const totalEl = document.getElementById('q-of-total');

  const leftPanel = document.getElementById('left-panel');

  if (view.type === 'question') {
    const q = DATA.questions[view.qIndex];
    leftPanel.classList.remove('hidden');
    renderLeftPanel(q);

    const refsHTML = q.refs.map(r => `<span>${r}</span>`).join('');
    stage.className = 'q-stage';
    stage.innerHTML = `
      <div class="q-num-large">Question ${q.n}</div>
      <div class="q-text-main">${q.text}</div>
      <div class="q-refs">${refsHTML}</div>
    `;
    totalEl.innerHTML = `<strong>Q${q.n}</strong> of ${DATA.questions.length}`;
  } else {
    leftPanel.classList.add('hidden');
    stage.className = 'q-stage list-view';
    if (view.type === 'passages') {
      stage.innerHTML = `<div class="q-num-large">Scripture Passages</div>${passagesHTML()}`;
      totalEl.textContent = 'Scripture Passages';
    } else if (view.type === 'voices') {
      stage.innerHTML = `<div class="q-num-large">Voices for the Discussion</div>${voicesHTML()}`;
      totalEl.textContent = 'Voices for the Discussion';
    } else if (view.type === 'prayer') {
      stage.innerHTML = `<div class="q-num-large">Prayer</div>${prayerHTML()}`;
      totalEl.textContent = 'Prayer';
    }
  }

  /* Dots (questions only) */
  let dotsHTML = '';
  DATA.questions.forEach((_, i) => {
    let cls = 'q-dot';
    if (view.type === 'question' && i === view.qIndex) cls += ' active';
    dotsHTML += `<div class="${cls}" onclick="goToQuestion(${i})" title="Q${i+1}"></div>`;
  });
  document.getElementById('q-dots').innerHTML = dotsHTML;

  /* Nav buttons */
  document.getElementById('btn-prev').disabled = current === 0;
  document.getElementById('btn-next').disabled = current === VIEWS.length - 1;
  document.getElementById('btn-next').innerHTML = current === VIEWS.length - 1
    ? 'The End'
    : 'Next <span class="arrow">&#8594;</span>';

  /* Section pills */
  document.querySelectorAll('.section-pills button[data-target]').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeTarget = view.type === 'question'
    ? String(DATA.questions[view.qIndex].section)
    : view.type;
  const activePill = document.querySelector(`.section-pills button[data-target="${activeTarget}"]`);
  if (activePill) activePill.classList.add('active');

  /* List drawer */
  document.querySelectorAll('.list-q-item').forEach((el, i) => {
    el.classList.remove('active-item');
    if (view.type === 'question' && i === view.qIndex) el.classList.add('active-item');
  });
}

function renderLeftPanel(q) {
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
}

/* ════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════ */
function goToQuestion(i) {
  const qi = Math.max(0, Math.min(DATA.questions.length - 1, i));
  const idx = VIEWS.findIndex(v => v.type === 'question' && v.qIndex === qi);
  if (idx !== -1) current = idx;
  render();
}
function nextQ() { current = Math.min(VIEWS.length - 1, current + 1); render(); }
function prevQ() { current = Math.max(0, current - 1); render(); }

function jumpToSection(target) {
  if (target === 'passages' || target === 'voices' || target === 'prayer') {
    const idx = VIEWS.findIndex(v => v.type === target);
    if (idx !== -1) current = idx;
    render();
    return;
  }
  goToQuestion(SECTION_Q_START[Number(target)]);
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
  if (e.key === 'd' || e.key === 'D') { toggleTheme(); }
  if (e.key === 'Escape') {
    document.getElementById('list-overlay').classList.remove('open');
  }
});

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
loadWeek();

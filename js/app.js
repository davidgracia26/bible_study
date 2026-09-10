/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (theme === 'dark') {
    icon.textContent  = '\u2600';
    label.textContent = I18N.t('light', 'Light');
  } else {
    icon.innerHTML    = '&#9790;';
    label.textContent = I18N.t('dark', 'Dark');
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
let WEEK_ID = null;
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
    showAppError(
      `${I18N.t('noStudySpecified')} <a href="index.html">${I18N.t('indexLinkText')}</a> ${I18N.t('andPickAWeek')}`
    );
    return;
  }

  WEEK_ID = weekId;
  const baseUrl = `data/${weekId}.json`;
  const localizedUrl = I18N.localize(baseUrl);
  let usedFallback = false;

  try {
    let res = await fetch(localizedUrl);
    if (!res.ok && localizedUrl !== baseUrl) {
      usedFallback = true;
      res = await fetch(baseUrl);
    }
    if (!res.ok) throw new Error(`Could not load ${baseUrl} (${res.status})`);
    DATA = await res.json();
  } catch (err) {
    showAppError(`${I18N.t('couldNotLoadStudy')} (${err.message})`);
    return;
  }

  const requestedQ = parseInt(params.get('q'), 10);
  initPage(usedFallback, requestedQ);
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
function initPage(usedFallback, requestedQ) {
  if (DATA.meta && DATA.meta.pageTitle) document.title = DATA.meta.pageTitle;

  document.getElementById('chrome-eyebrow').innerHTML = DATA.meta.eyebrow || '';
  document.getElementById('chrome-title').innerHTML =
    `${DATA.meta.title || ''} <span>${DATA.meta.titleHighlight || ''}</span>`;

  const videoLink = document.getElementById('chrome-video-link');
  if (videoLink) {
    if (DATA.meta.videoUrl) {
      videoLink.href = DATA.meta.videoUrl;
      videoLink.classList.remove('hidden');
    } else {
      videoLink.classList.add('hidden');
    }
  }

  SECTION_Q_START = DATA.sections.map((_, i) =>
    DATA.questions.findIndex(q => q.section === i)
  );

  buildViews();
  buildSectionPills();
  buildOverview();

  document.getElementById('page-footer-text').innerHTML = DATA.meta.footer || '';

  if (usedFallback) showFallbackNotice();

  const requestedIdx = Number.isInteger(requestedQ)
    ? VIEWS.findIndex(v => v.type === 'question' && DATA.questions[v.qIndex].n === requestedQ)
    : -1;
  current = requestedIdx !== -1 ? requestedIdx : VIEWS.findIndex(v => v.type === 'question');
  render();
}

/* Translate the bits of chrome that are static HTML (not injected per-view). */
function applyStaticStrings() {
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('home-btn-label', I18N.t('home'));
  set('app-loading', I18N.t('loadingStudy'));
  set('chrome-video-link-label', I18N.t('watchSermon'));
  set('btn-prev-label', I18N.t('prev'));
  set('btn-next-label', I18N.t('next'));
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) homeBtn.title = I18N.t('backToHome');
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.title = I18N.t('toggleTheme');
  const smallerBtn = document.getElementById('font-btn-smaller');
  if (smallerBtn) smallerBtn.title = I18N.t('smaller');
  const largerBtn = document.getElementById('font-btn-larger');
  if (largerBtn) largerBtn.title = I18N.t('larger');
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
}

function showFallbackNotice() {
  const stage = document.getElementById('q-stage');
  if (!stage) return;
  const note = document.createElement('div');
  note.className = 'i18n-fallback-notice';
  note.textContent = I18N.t('notTranslatedNotice');
  stage.parentNode.insertBefore(note, stage);
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
  VIEWS.push({ type: 'allquestions' });
}

function buildSectionPills() {
  const hasVoices = Object.keys(DATA.scholars || {}).length > 0;
  let html = `<button onclick="jumpToSection('passages')" data-target="passages">${I18N.t('passages')}</button>`;
  DATA.sections.forEach((sec, i) => {
    html += `<button onclick="jumpToSection('${i}')" data-target="${i}">${sec.label}</button>`;
  });
  if (hasVoices) {
    html += `<button onclick="jumpToSection('voices')" data-target="voices">${I18N.t('voices')}</button>`;
  }
  html += `<button onclick="jumpToSection('prayer')" data-target="prayer">${I18N.t('prayer')}</button>`;
  html += `<button class="list-toggle-btn" onclick="jumpToSection('allquestions')" data-target="allquestions"><span class="ltb-text">${I18N.t('allQuestions')}</span> &#9776;</button>`;
  document.getElementById('section-pills').innerHTML = html;
}

function allQuestionsHTML() {
  let html = '';
  DATA.sections.forEach((sec, sIdx) => {
    html += `<div class="list-section">${sec.label} &mdash; ${sec.name.replace(/<\/?em>/g, '')} &nbsp;&middot;&nbsp; ${sec.ref}</div>`;
    DATA.questions.forEach((q, qIdx) => {
      if (q.section !== sIdx) return;
      html += `
        <div class="list-q-item" id="li-${qIdx}" onclick="goToQuestion(${qIdx});">
          <div class="lq-num">${q.n}</div>
          <div class="lq-text">${q.text}</div>
        </div>`;
    });
  });
  return html;
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
      <div class="q-num-large">${I18N.t('question')} ${q.n}</div>
      <div class="q-text-main">${q.text}</div>
      <div class="q-refs">${refsHTML}</div>
      <button class="copy-link-btn" onclick="copyQuestionLink(${q.n}, this)" title="${I18N.t('copyLink')}">
        <span class="clb-icon">&#128279;</span> <span class="clb-label">${I18N.t('copyLink')}</span>
      </button>
    `;
    totalEl.innerHTML = `<strong>Q${q.n}</strong> ${I18N.t('of')} ${DATA.questions.length}`;
  } else {
    leftPanel.classList.add('hidden');
    stage.className = 'q-stage list-view';
    if (view.type === 'passages') {
      stage.innerHTML = `<div class="q-num-large">${I18N.t('scripturePassages')}</div>${passagesHTML()}`;
      totalEl.textContent = I18N.t('scripturePassages');
    } else if (view.type === 'voices') {
      stage.innerHTML = `<div class="q-num-large">${I18N.t('voicesForDiscussion')}</div>${voicesHTML()}`;
      totalEl.textContent = I18N.t('voicesForDiscussion');
    } else if (view.type === 'prayer') {
      stage.innerHTML = `<div class="q-num-large">${I18N.t('prayer')}</div>${prayerHTML()}`;
      totalEl.textContent = I18N.t('prayer');
    } else if (view.type === 'allquestions') {
      stage.innerHTML = `<div class="q-num-large">${I18N.t('allQuestions')}</div>${allQuestionsHTML()}`;
      totalEl.textContent = I18N.t('allQuestions');
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
    ? I18N.t('theEnd')
    : `${I18N.t('next')} <span class="arrow">&#8594;</span>`;

  /* Section pills */
  document.querySelectorAll('.section-pills button[data-target]').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeTarget = view.type === 'question'
    ? String(DATA.questions[view.qIndex].section)
    : view.type;
  const activePill = document.querySelector(`.section-pills button[data-target="${activeTarget}"]`);
  if (activePill) activePill.classList.add('active');

  /* All-questions list (when visible) */
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
          <div class="s-label">${I18N.t('voiceForDiscussion')}</div>
          <div class="s-quote">&ldquo;${s.quote}&rdquo;</div>
          <div class="s-attr">&#x2014; ${s.name}${s.role ? ' &nbsp;&middot;&nbsp; ' + s.role : ''}</div>
        </div>`;
    });
  }

  if (!leftHTML) {
    leftHTML = `<div class="no-scholar">${I18N.t('noCitation')}</div>`;
  }

  document.getElementById('left-body').innerHTML = leftHTML;
}

/* ════════════════════════════════════════
   COPY / SHARE A QUESTION
════════════════════════════════════════ */
function questionLinkUrl(n) {
  const url = new URL(location.href);
  url.searchParams.set('week', WEEK_ID);
  url.searchParams.set('q', n);
  const lang = I18N.get();
  if (lang && lang !== 'en') url.searchParams.set('lang', lang);
  else url.searchParams.delete('lang');
  return url.toString();
}

function copyQuestionLink(n, btn) {
  const url = questionLinkUrl(n);
  copyToClipboard(url).then(() => showCopyFeedback(btn));
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(textarea);
}

function showCopyFeedback(btn) {
  if (!btn) return;
  const label = btn.querySelector('.clb-label');
  if (!label) return;
  const original = label.textContent;
  btn.classList.add('copied');
  label.textContent = I18N.t('linkCopied');
  clearTimeout(btn._copyTimeout);
  btn._copyTimeout = setTimeout(() => {
    btn.classList.remove('copied');
    label.textContent = original;
  }, 1800);
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
  if (target === 'passages' || target === 'voices' || target === 'prayer' || target === 'allquestions') {
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
   KEYBOARD SHORTCUTS
════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (!DATA) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextQ(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prevQ(); }
  if (e.key === 'd' || e.key === 'D') { toggleTheme(); }
});

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
(async function main() {
  await I18N.init();
  applyStaticStrings();
  I18N.buildSwitcher(document.getElementById('lang-switcher'));
  loadWeek();
})();

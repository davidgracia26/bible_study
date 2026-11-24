/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
function applyTheme(theme, persist = true) {
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
  if (persist) { try { localStorage.setItem('bs-theme', theme); } catch(e) {} }
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
    else applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', false);
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
const FONT_MIN = -2;
const FONT_MAX = 6;
const MOBILE_MQ = window.matchMedia('(max-width: 900px)');

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
  let usedFallback = false;

  try {
    const loaded = await I18N.loadWeekJSON(weekId);
    DATA = loaded.data;
    usedFallback = loaded.usedFallback;

    // A translated week file may not have its own summary yet; show the
    // English one rather than dropping the Summary view for that language.
    if (!DATA.summary && !usedFallback) {
      const baseRes = await fetch(`data/${weekId}/${weekId}.json`, { cache: 'no-cache' });
      if (baseRes.ok) {
        const base = await baseRes.json();
        if (base.summary) DATA.summary = base.summary;
      }
    }

    // videoUrl is language-independent, so it lives only in manifest.json
    // rather than being duplicated into every translated week file.
    const manifestRes = await fetch('data/manifest.json', { cache: 'no-cache' });
    if (manifestRes.ok) {
      const manifest = await manifestRes.json();
      const entry = (manifest.weeks || []).find(w => w.id === weekId);
      if (entry && entry.videoUrl) DATA.meta.videoUrl = entry.videoUrl;
    }
  } catch (err) {
    const notFound = err.status === 404;
    showAppError(
      `${I18N.t(notFound ? 'studyNotFound' : 'couldNotLoadStudy')}` +
      ` <a href="index.html">${I18N.t('backToIndex')}</a>`,
      { detail: err.message, retry: !notFound }
    );
    return;
  }

  const requestedQ = parseInt(params.get('q'), 10);
  initPage(usedFallback, requestedQ);
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function plainText(html) {
  const el = document.createElement('div');
  el.innerHTML = html || '';
  return el.textContent.replace(/\s+/g, ' ').trim();
}

function showAppError(html, { detail, retry } = {}) {
  document.body.classList.add('study-error');
  const stage = document.getElementById('q-stage');
  if (stage) {
    stage.className = 'q-stage';
    stage.innerHTML = `
      <div class="app-error" role="alert">
        <div class="app-error-msg">${html}</div>
        ${detail ? `<div class="app-error-detail">${escapeHTML(detail)}</div>` : ''}
        ${retry ? `<button type="button" class="nav-btn primary app-error-retry" onclick="location.reload()">${I18N.t('tryAgain')}</button>` : ''}
      </div>`;
  }
  const chromeTitle = document.getElementById('chrome-title');
  if (chromeTitle) chromeTitle.textContent = I18N.t('landingTitle');
  document.title = `${I18N.t('errorTitle')} | ${I18N.t('landingTitle')}`;
}

function baseTitle() {
  const m = DATA.meta || {};
  if (m.pageTitle) return m.pageTitle;
  const name = plainText(`${m.title || ''} ${m.titleHighlight || ''}`);
  return [m.series, m.date, name].filter(Boolean).join(' | ') || I18N.t('landingTitle');
}

function updatePageTitle(view) {
  let label = '';
  if (view.type === 'question') label = `${I18N.t('question')} ${DATA.questions[view.qIndex].n}`;
  else if (view.type === 'summary') label = I18N.t('sermonSummary');
  else if (view.type === 'passages') label = I18N.t('scripturePassages');
  else if (view.type === 'voices') label = I18N.t('voicesForDiscussion');
  else if (view.type === 'prayer') label = I18N.t('prayer');
  else if (view.type === 'allquestions') label = I18N.t('allQuestions');
  document.title = label ? `${label} · ${baseTitle()}` : baseTitle();
}

/* ════════════════════════════════════════
   BUILD STATIC-ISH CHROME FROM DATA
════════════════════════════════════════ */
function initPage(usedFallback, requestedQ) {
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
  const summaryIdx = VIEWS.findIndex(v => v.type === 'summary');
  current = requestedIdx !== -1 ? requestedIdx
    : summaryIdx !== -1 ? summaryIdx
    : VIEWS.findIndex(v => v.type === 'question');
  render();
}

/* Translate the bits of chrome that are static HTML (not injected per-view). */
function applyStaticStrings() {
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  document.title = I18N.t('loadingStudy');
  set('home-btn-label', I18N.t('home'));
  set('app-loading', I18N.t('loadingStudy'));
  set('chrome-video-link-label', I18N.t('watchSermon'));
  set('btn-prev-label', I18N.t('prev'));
  set('btn-next-label', I18N.t('next'));
  set('chrome-video-link-hint', ` (${I18N.t('opensNewTab')})`);
  set('skip-link', I18N.t('skipToContent'));
  set('share-btn-label', I18N.t('share'));
  const setAria = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('aria-label', I18N.t(key));
  };
  setAria('section-pills', 'studySections');
  setAria('font-controls', 'fontSize');
  setAria('q-dots', 'questionsLabel');
  setAria('left-panel', 'passagesPanel');
  setAria('font-btn-smaller', 'smaller');
  setAria('font-btn-larger', 'larger');
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) homeBtn.title = I18N.t('backToHome');
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.title = I18N.t('toggleTheme');
  const smallerBtn = document.getElementById('font-btn-smaller');
  if (smallerBtn) smallerBtn.title = I18N.t('smaller');
  const largerBtn = document.getElementById('font-btn-larger');
  if (largerBtn) largerBtn.title = I18N.t('larger');
  set('menu-toggle-label', I18N.t('settings'));
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light', false);
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
   One continuous sequence: Summary (if any),
   Passages, then each question, then Voices (if any), then
   Prayer. Prev/Next step through all of it.
════════════════════════════════════════ */
function buildViews() {
  const hasVoices = Object.keys(DATA.scholars || {}).length > 0;
  VIEWS = [];
  if (hasSummary()) VIEWS.push({ type: 'summary' });
  VIEWS.push({ type: 'passages' });
  DATA.questions.forEach((q, i) => VIEWS.push({ type: 'question', qIndex: i }));
  if (hasVoices) VIEWS.push({ type: 'voices' });
  VIEWS.push({ type: 'prayer' });
  VIEWS.push({ type: 'allquestions' });
}

function hasSummary() {
  const s = DATA.summary;
  return !!(s && (s.bigIdea || s.overview || (s.points && s.points.length)));
}

function buildSectionPills() {
  const hasVoices = Object.keys(DATA.scholars || {}).length > 0;
  let html = '';
  if (hasSummary()) {
    html += `<button type="button" onclick="jumpToSection('summary')" data-target="summary">${I18N.t('summary')}</button>`;
  }
  html += `<button type="button" onclick="jumpToSection('passages')" data-target="passages">${I18N.t('passages')}</button>`;
  DATA.sections.forEach((sec, i) => {
    html += `<button type="button" onclick="jumpToSection('${i}')" data-target="${i}">${sec.label}</button>`;
  });
  if (hasVoices) {
    html += `<button type="button" onclick="jumpToSection('voices')" data-target="voices">${I18N.t('voices')}</button>`;
  }
  html += `<button type="button" onclick="jumpToSection('prayer')" data-target="prayer">${I18N.t('prayer')}</button>`;
  html += `<button type="button" class="list-toggle-btn" onclick="jumpToSection('allquestions')" data-target="allquestions"><span class="ltb-text">${I18N.t('allQuestions')}</span> <span aria-hidden="true">&#9776;</span></button>`;
  document.getElementById('section-pills').innerHTML = html;
}

function allQuestionsHTML() {
  let html = '';
  DATA.sections.forEach((sec, sIdx) => {
    html += `<div class="list-section">${sec.label} &mdash; ${sec.name.replace(/<\/?em>/g, '')} &nbsp;&middot;&nbsp; ${sec.ref}</div>`;
    DATA.questions.forEach((q, qIdx) => {
      if (q.section !== sIdx) return;
      html += `
        <div class="list-q-item" id="li-${qIdx}" role="button" tabindex="0" onclick="goToQuestion(${qIdx});">
          <div class="lq-num">${q.n}</div>
          <div class="lq-text">${q.text}</div>
        </div>`;
    });
  });
  return html;
}

function summaryHTML() {
  const s = DATA.summary || {};
  let html = '';
  if (s.bigIdea) {
    html += `
      <div class="sum-big-idea">
        <div class="sum-label">${I18N.t('bigIdea')}${s.speaker ? ' &nbsp;&middot;&nbsp; ' + s.speaker : ''}</div>
        <div class="sum-idea-text">${s.bigIdea}</div>
      </div>`;
  }
  if (s.overview) html += `<div class="sum-overview">${s.overview}</div>`;
  (s.points || []).forEach((pt, i) => {
    html += `
      <div class="sum-point">
        <div class="sum-point-num">${i + 1}</div>
        <div>
          <div class="sum-point-title">${pt.title || ''}</div>
          <div class="sum-point-text">${pt.text || ''}</div>
          ${pt.ref ? `<div class="sum-point-ref"><span>${pt.ref}</span></div>` : ''}
        </div>
      </div>`;
  });
  if (s.takeaway) {
    html += `
      <div class="sum-takeaway">
        <div class="sum-label">${I18N.t('takeaway')}</div>
        <div class="sum-takeaway-text">${s.takeaway}</div>
      </div>`;
  }
  return html;
}

function newTabHint() {
  return `<span class="sr-only"> (${I18N.t('opensNewTab')})</span>`;
}

function stageHeading(text) {
  return `<div class="q-num-large" role="heading" aria-level="2">${text}</div>`;
}

function passagesHTML() {
  let html = '';
  Object.values(DATA.passages || {}).forEach(p => {
    html += `
      <div class="sp-passage-card">
        <div class="sp-ref"><a href="${p.link}" target="_blank" rel="noopener">${p.ref}${newTabHint()}</a></div>
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
  if (hasSummary()) {
    const s = DATA.summary;
    html += `<div class="overview-summary">
      <div class="os-heading">${I18N.t('sermonSummary')}${s.speaker ? ' &mdash; ' + s.speaker : ''}</div>
      ${s.bigIdea ? `<p class="os-big-idea"><strong>${I18N.t('bigIdea')}:</strong> ${s.bigIdea}</p>` : ''}
      ${s.overview ? `<p>${s.overview}</p>` : ''}
      ${(s.points || []).map((pt, i) => `<p><strong>${i + 1}. ${pt.title || ''}</strong>${pt.ref ? ' (' + pt.ref + ')' : ''}<br>${pt.text || ''}</p>`).join('')}
      ${s.takeaway ? `<p><strong>${I18N.t('takeaway')}:</strong> ${s.takeaway}</p>` : ''}
    </div>`;
  }
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
   continuous sequence: Summary, Passages, Q1..Qn,
   Voices, Prayer. All views render into the
   same main panel (#q-stage) — no overlays.
════════════════════════════════════════ */
let hasRendered = false;
function render() {
  const view = VIEWS[current];
  updatePageTitle(view);
  const stage = document.getElementById('q-stage');
  const totalEl = document.getElementById('q-of-total');

  const leftPanel = document.getElementById('left-panel');
  const dotsEl = document.getElementById('q-dots');
  const focusInDots = dotsEl.contains(document.activeElement);
  const focusInStage = stage.contains(document.activeElement);

  if (view.type === 'question') {
    const q = DATA.questions[view.qIndex];
    leftPanel.classList.remove('hidden');
    renderLeftPanel(q);

    const refsHTML = q.refs.map(r => `<span>${r}</span>`).join('');
    stage.className = 'q-stage';
    stage.innerHTML = `
      ${stageHeading(`${I18N.t('question')} ${q.n}`)}
      <div class="q-text-main">${q.text}</div>
      <div class="q-refs">${refsHTML}</div>
      <button type="button" class="copy-link-btn" onclick="copyQuestionLink(${q.n}, this)" title="${I18N.t('copyLink')}">
        <span class="clb-icon" aria-hidden="true">&#128279;</span> <span class="clb-label" role="status" aria-live="polite">${I18N.t('copyLink')}</span>
      </button>
    `;
    totalEl.innerHTML = `<strong>Q${q.n}</strong> ${I18N.t('of')} ${DATA.questions.length}`;
  } else {
    leftPanel.classList.add('hidden');
    stage.className = 'q-stage list-view';
    if (view.type === 'summary') {
      stage.innerHTML = `${stageHeading(I18N.t('sermonSummary'))}${summaryHTML()}`;
      totalEl.textContent = I18N.t('sermonSummary');
    } else if (view.type === 'passages') {
      stage.innerHTML = `${stageHeading(I18N.t('scripturePassages'))}${passagesHTML()}`;
      totalEl.textContent = I18N.t('scripturePassages');
    } else if (view.type === 'voices') {
      stage.innerHTML = `${stageHeading(I18N.t('voicesForDiscussion'))}${voicesHTML()}`;
      totalEl.textContent = I18N.t('voicesForDiscussion');
    } else if (view.type === 'prayer') {
      stage.innerHTML = `${stageHeading(I18N.t('prayer'))}${prayerHTML()}`;
      totalEl.textContent = I18N.t('prayer');
    } else if (view.type === 'allquestions') {
      stage.innerHTML = `${stageHeading(I18N.t('allQuestions'))}${allQuestionsHTML()}`;
      totalEl.textContent = I18N.t('allQuestions');
    }
  }

  /* Dots (questions only) */
  let dotsHTML = '';
  DATA.questions.forEach((_, i) => {
    let cls = 'q-dot';
    let cur = '';
    if (view.type === 'question' && i === view.qIndex) { cls += ' active'; cur = ' aria-current="true"'; }
    dotsHTML += `<button type="button" class="${cls}" onclick="goToQuestion(${i})" title="Q${i+1}" aria-label="${I18N.t('goToQuestion')} ${i+1}"${cur}></button>`;
  });
  dotsEl.innerHTML = dotsHTML;

  /* Nav buttons */
  document.getElementById('btn-prev').disabled = current === 0;
  document.getElementById('btn-next').disabled = current === VIEWS.length - 1;
  document.getElementById('btn-next').innerHTML = current === VIEWS.length - 1
    ? I18N.t('theEnd')
    : `${I18N.t('next')} <span class="arrow" aria-hidden="true">&#8594;</span>`;

  /* Section pills */
  document.querySelectorAll('.section-pills button[data-target]').forEach(btn => {
    btn.classList.remove('active');
    btn.removeAttribute('aria-current');
  });
  const activeTarget = view.type === 'question'
    ? String(DATA.questions[view.qIndex].section)
    : view.type;
  const activePill = document.querySelector(`.section-pills button[data-target="${activeTarget}"]`);
  if (activePill) {
    activePill.classList.add('active');
    activePill.setAttribute('aria-current', 'true');
  }

  if (activePill) {
    const pills = document.getElementById('section-pills');
    if (pills.scrollWidth > pills.clientWidth) {
      pills.scrollLeft = activePill.offsetLeft - (pills.clientWidth - activePill.offsetWidth) / 2;
    }
  }

  /* All-questions list (when visible) */
  document.querySelectorAll('.list-q-item').forEach((el, i) => {
    el.classList.remove('active-item');
    el.removeAttribute('aria-current');
    if (view.type === 'question' && i === view.qIndex) {
      el.classList.add('active-item');
      el.setAttribute('aria-current', 'true');
    }
  });

  /* New view: start at the top (stacked layout scrolls the page; wide layout scrolls the stage) */
  if (hasRendered) {
    stage.scrollTop = 0;
    document.getElementById('left-body').scrollTop = 0;
    if (MOBILE_MQ.matches) {
      const bar = document.querySelector('.q-counter-bar');
      if (bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' });
    }
  }
  hasRendered = true;

  /* Rebuilt controls drop keyboard focus; hand it back */
  if (focusInDots) {
    const activeDot = dotsEl.querySelector('.q-dot.active');
    if (activeDot) activeDot.focus();
  } else if (focusInStage && !stage.contains(document.activeElement)) {
    stage.focus();
  }
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
        <div class="p-ref"><a href="${p.link}" target="_blank" rel="noopener">${p.ref}${newTabHint()}</a></div>
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
  const url = new URL(`s/${WEEK_ID}.html`, location.href);
  url.searchParams.set('q', n);
  const lang = I18N.get();
  if (lang && lang !== 'en') url.searchParams.set('lang', lang);
  else url.searchParams.delete('lang');
  return url.toString();
}

function currentPageUrl() {
  const view = VIEWS[current];
  if (view && view.type === 'question') return questionLinkUrl(DATA.questions[view.qIndex].n);
  const url = new URL(questionLinkUrl(0));
  url.searchParams.delete('q');
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
  if (target === 'summary' || target === 'passages' || target === 'voices' || target === 'prayer' || target === 'allquestions') {
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
function applyFontScale() {
  document.documentElement.style.setProperty('--font-mult', 1 + fontScale * 0.125);
  const smaller = document.getElementById('font-btn-smaller');
  const larger = document.getElementById('font-btn-larger');
  if (smaller) smaller.disabled = fontScale <= FONT_MIN;
  if (larger) larger.disabled = fontScale >= FONT_MAX;
}

function adjustFont(dir) {
  fontScale = Math.max(FONT_MIN, Math.min(FONT_MAX, fontScale + dir));
  applyFontScale();
  try { localStorage.setItem('bs-font', fontScale); } catch(e) {}
}

(function() {
  try {
    const saved = parseInt(localStorage.getItem('bs-font'), 10);
    if (Number.isInteger(saved)) fontScale = Math.max(FONT_MIN, Math.min(FONT_MAX, saved));
  } catch(e) {}
})();

/* ════════════════════════════════════════
   SETTINGS MENU (narrow screens)
════════════════════════════════════════ */
function toggleMenu(force) {
  const chrome = document.getElementById('top-chrome');
  const btn = document.getElementById('menu-toggle-btn');
  const open = typeof force === 'boolean' ? force : !chrome.classList.contains('menu-open');
  chrome.classList.toggle('menu-open', open);
  btn.setAttribute('aria-expanded', String(open));
}

/* ════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (!DATA || Share.isOpen()) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('list-q-item')) {
    e.preventDefault();
    e.target.click();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextQ(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prevQ(); }
  if (e.key === 'd' || e.key === 'D') { toggleTheme(); }
  if (e.key === 'Escape') toggleMenu(false);
});

/* ════════════════════════════════════════
   SWIPE GESTURES (mobile)
   Swipe left/right over the main workspace to
   go next/prev, mirroring the arrow-key nav.
   Vertical scrolling is left untouched.
════════════════════════════════════════ */
(function() {
  const SWIPE_MIN_DISTANCE = 50;   // px, minimum horizontal travel to count as a swipe
  const SWIPE_MAX_DURATION = 600;  // ms, ignore slow drags
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  let tracking = false;

  function onTouchStart(e) {
    if (e.touches.length !== 1) { tracking = false; return; }
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    tracking = true;
  }

  function onTouchEnd(e) {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    if (dt > SWIPE_MAX_DURATION) return;
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.5) return; // mostly vertical, treat as scroll
    if (!DATA) return;
    if (dx < 0) nextQ(); else prevQ();
  }

  const workspace = document.getElementById('main-workspace');
  if (workspace) {
    workspace.addEventListener('touchstart', onTouchStart, { passive: true });
    workspace.addEventListener('touchend', onTouchEnd, { passive: true });
  }
})();

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
(async function main() {
  await I18N.init();
  applyStaticStrings();
  applyFontScale();
  document.getElementById('menu-toggle-btn').addEventListener('click', () => toggleMenu());
  I18N.buildSwitcher(document.getElementById('lang-switcher'));
  Share.mount(document.getElementById('share-btn'), currentPageUrl);
  loadWeek();
})();

/* ════════════════════════════════════════
   I18N
   Shared language/translation helper used by
   both index.html and study.html. Loads
   data/languages.json (available languages)
   and data/strings.json (UI copy per language),
   remembers the chosen language in
   localStorage, and exposes helpers for
   translating UI strings and building the
   language switcher.
════════════════════════════════════════ */
const I18N = (function () {
  let strings = {};
  let languages = [{ code: 'en', label: 'English' }];
  let current = 'en';

  function detect() {
    try {
      const fromUrl = new URLSearchParams(location.search).get('lang');
      if (fromUrl) return fromUrl;
      const saved = localStorage.getItem('bs-lang');
      if (saved) return saved;
    } catch (e) {}
    return 'en';
  }

  async function init() {
    current = detect();
    try {
      const [sRes, lRes] = await Promise.all([
        fetch('data/strings.json'),
        fetch('data/languages.json'),
      ]);
      if (sRes.ok) strings = await sRes.json();
      if (lRes.ok) {
        const langData = await lRes.json();
        if (langData && Array.isArray(langData.languages) && langData.languages.length) {
          languages = langData.languages;
        }
      }
    } catch (e) {
      /* Fall back silently to English-only if the files can't be loaded. */
    }
    if (!strings[current]) current = 'en';
    try { document.documentElement.setAttribute('lang', current); } catch (e) {}
    return current;
  }

  function t(key, fallback) {
    return (strings[current] && strings[current][key])
      || (strings.en && strings.en[key])
      || fallback
      || key;
  }

  function get() { return current; }

  function set(code) {
    try { localStorage.setItem('bs-lang', code); } catch (e) {}
    location.reload();
  }

  /* Given a base data URL like "data/9_8.json", returns the localized
     variant for the current language, e.g. "data/9_8.es.json". For the
     default language ("en") this just returns the base URL unchanged. */
  function localize(baseUrl) {
    if (current === 'en') return baseUrl;
    return baseUrl.replace(/\.json$/, `.${current}.json`);
  }

  /* Loads a week's content JSON for the current language, falling back to
     the base (English) file if no translated version exists yet. Used by
     both study.html (single week) and index.html (landing page cards) so
     there is exactly one place that knows how to resolve a week's
     localized data. Returns { data, usedFallback }. */
  async function loadWeekJSON(weekId) {
    const baseUrl = `data/${weekId}.json`;
    const localizedUrl = localize(baseUrl);
    let usedFallback = false;

    let res = await fetch(localizedUrl);
    if (!res.ok && localizedUrl !== baseUrl) {
      usedFallback = true;
      res = await fetch(baseUrl);
    }
    if (!res.ok) throw new Error(`Could not load ${baseUrl} (${res.status})`);
    const data = await res.json();
    return { data, usedFallback };
  }

  function buildSwitcher(mountEl) {
    if (!mountEl || languages.length < 2) return;
    const select = document.createElement('select');
    select.className = 'lang-select';
    select.setAttribute('aria-label', t('language', 'Language'));
    languages.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.label;
      if (l.code === current) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', e => set(e.target.value));
    mountEl.appendChild(select);
  }

  return { init, t, get, set, localize, loadWeekJSON, buildSwitcher };
})();

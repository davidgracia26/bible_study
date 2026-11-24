/* ════════════════════════════════════════
   SHARE (QR code popover)
   Shared by index.html and study.html.
   Share.mount(btn, getUrl) opens a dialog with a
   QR code for getUrl() when btn is clicked.
   Needs js/qrcode.js and js/i18n.js.
════════════════════════════════════════ */
const Share = (function () {
  let dialog = null;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'share-dialog';
    dialog.setAttribute('aria-labelledby', 'share-title');
    dialog.innerHTML = `
      <div class="share-title" id="share-title"></div>
      <div class="share-qr" id="share-qr"></div>
      <div class="share-url" id="share-url"></div>
      <button type="button" class="nav-btn primary share-close" id="share-close"></button>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#share-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }

  function open(url) {
    if (!dialog) build();
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const svg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    dialog.querySelector('#share-title').textContent = I18N.t('shareScan');
    const qrEl = dialog.querySelector('#share-qr');
    qrEl.innerHTML = svg;
    const svgEl = qrEl.querySelector('svg');
    svgEl.setAttribute('role', 'img');
    svgEl.setAttribute('aria-label', I18N.t('shareQrLabel'));
    dialog.querySelector('#share-url').textContent = url;
    dialog.querySelector('#share-close').textContent = I18N.t('close');
    dialog.showModal();
  }

  function mount(btn, getUrl) {
    if (!btn) return;
    btn.addEventListener('click', () => open(getUrl()));
  }

  function isOpen() { return !!(dialog && dialog.open); }

  return { mount, open, isOpen };
})();

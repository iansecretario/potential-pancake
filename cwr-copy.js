// clipboard-snippet.js
(function () {
  // --- helpers ---
  function getPreText(preEl) {
    // If author lined code with <span> per line, rebuild with explicit \n
    const spans = preEl.querySelectorAll(':scope > span');
    if (spans.length) return Array.from(spans).map(s => s.textContent).join('\n');
    // Else: raw textContent, normalize CRLF -> LF
    return preEl.textContent.replace(/\r\n/g, '\n');
  }

  async function copyTextExactly(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  // --- bind a specific block/button pair (optional) ---
  function bindSingleButton() {
    const pre = document.getElementById('code-block');
    const btn = document.getElementById('copy-btn');
    if (!pre || !btn) return;

    // prevent duplicate handlers after rebinds
    const clone = btn.cloneNode(true);
    btn.replaceWith(clone);

    clone.addEventListener('click', async () => {
      const text = getPreText(pre);
      await copyTextExactly(text);
      const old = clone.textContent;
      clone.textContent = 'Copied';
      setTimeout(() => (clone.textContent = old), 1000);
    });
  }

  // --- auto-attach buttons to all <pre> (uses jQuery if present) ---
  function addClipboardToAllPres() {
    const pres = document.querySelectorAll('pre');
    pres.forEach(pre => {
      if (pre.classList.contains('clip-processed')) return;
      pre.classList.add('clip-processed');
      pre.style.position = pre.style.position || 'relative';

      const btn = document.createElement('button');
      btn.className = 'clipboard-button';
      btn.type = 'button';
      btn.title = 'Copy code';
      btn.innerHTML = '<i class="fa fa-clipboard" aria-hidden="true"></i>';
      btn.style.position = 'absolute';
      btn.style.top = '.5rem';
      btn.style.right = '1.5rem';
      btn.style.zIndex = '10000';
      btn.style.color = 'skyblue';
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.display = 'none';
      btn.style.cursor = 'pointer';

      btn.addEventListener('click', async () => {
        const rawAttr = pre.getAttribute('data-raw');
        const text = (rawAttr != null ? rawAttr : getPreText(pre));
        await copyTextExactly(text);
        btn.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
        setTimeout(() => { btn.innerHTML = '<i class="fa fa-clipboard" aria-hidden="true"></i>'; }, 1200);
      });

      pre.addEventListener('mouseenter', () => (btn.style.display = 'block'));
      pre.addEventListener('mouseleave', () => (btn.style.display = 'none'));

      pre.appendChild(btn);
    });
  }

  function initAll() {
    bindSingleButton();     // optional: only binds if #code-block/#copy-btn exist
    addClipboardToAllPres();
  }

  // Initial run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-bind when Thinkific swaps content
  if (typeof CoursePlayerV2 !== 'undefined') {
    CoursePlayerV2.on('hooks:contentDidChange', function () {
      setTimeout(initAll, 500);
    });
  }
})();

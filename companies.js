
(() => {
  // --- CONFIG ---
  const GROUPS = [
    { field: 'tags',    sourceSel: '[tag-container="tags"]',      targetSel: '[target="tags"]' },
    { field: 'country', sourceSel: '[tag-container="countries"]', targetSel: '[target="countries"]' },
  ];

  // Template (prefer native if present)
  function getTagTemplateHTML() {
    const native = document.querySelector('[fs-list-element="tag"]');
    if (native) return native.outerHTML;
    return [
      '<div fs-list-element="tag" class="filter_tag" tabindex="0" role="button">',
        '<div fs-list-element="tag-value"></div>',
        '<div fs-list-element="tag-field" class="hide"></div>',
        '<div fs-list-element="tag-operator" class="hide">=</div>',
        '<img src="https://cdn.prod.website-files.com/6821acfa86f43b193f8b39af/683534a85107e966b157069e_Group%2041.svg" ',
             'loading="lazy" fs-list-element="tag-remove" alt="" class="filter_tag-remove" role="button" tabindex="0">',
      '</div>'
    ].join('');
  }
  const TAG_TEMPLATE_HTML = getTagTemplateHTML();

  // Safe selector building
  const cssEscape = (str) =>
    (window.CSS && CSS.escape) ? CSS.escape(str) : String(str).replace(/["\\#.;?&]/g, '\\$&');

  // --- Inputs helpers --------------------------------------------------------
  function queryInputsByFieldAndValue(field, value) {
    const sel = [
      `input[fs-list-field="${field}"][fs-list-value="${cssEscape(value)}"]`,
      `input[fs-list-field="${field}"][value="${cssEscape(value)}"]`
    ].join(',');
    return Array.from(document.querySelectorAll(sel));
  }

  function clickInputOrLabel(inp) {
    const label = inp.closest('label');
    if (label) label.click(); else inp.click();
  }

  function toggleValue(field, value) {
    queryInputsByFieldAndValue(field, value).forEach(clickInputOrLabel);
  }

  function uncheckValueIfChecked(field, value) {
    queryInputsByFieldAndValue(field, value).forEach(inp => {
      const aria = inp.getAttribute('aria-checked');
      const isOn = inp.checked || aria === 'true';
      if (isOn) clickInputOrLabel(inp);
    });
  }

  // --- Read checked values ---------------------------------------------------
  function readSelectedValues(sourceEl, field) {
    const sel = [
      `input[fs-list-field="${field}"][type="checkbox"]:checked`,
      `input[fs-list-field="${field}"][type="radio"]:checked`
    ].join(',');
    const vals = new Set();
    sourceEl.querySelectorAll(sel).forEach(inp => {
      const v = (inp.getAttribute('fs-list-value') ?? inp.value ?? '').trim();
      if (v) vals.add(v);
    });
    return Array.from(vals);
  }

  // --- Build chip & wire events (pointer-first) ------------------------------
  function makeChip(labelText, field) {
    const wrap = document.createElement('div');
    wrap.innerHTML = TAG_TEMPLATE_HTML;
    const chip = wrap.firstElementChild;

    (chip.querySelector('[fs-list-element="tag-value"]') || chip).textContent = labelText;
    const fieldNode = chip.querySelector('[fs-list-element="tag-field"]');
    if (fieldNode) fieldNode.textContent = field;

    // Avoid text selection on first click
    chip.style.webkitUserSelect = 'none';
    chip.style.userSelect = 'none';

    return chip;
  }

  function onPointerActivate(el, handler) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler(e);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      }
    });

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler(e);
    });
  }

  // --- Render chips with "+N more" ------------------------------------------
  function renderChips(targetEl, field, values) {
    targetEl.innerHTML = '';

    // ✅ Update accessibility attributes only when there are active filters
    if (!values || values.length === 0) {
      targetEl.removeAttribute('aria-label');
      targetEl.removeAttribute('role');
      return;
    } else {
      targetEl.setAttribute('role', 'group');
      targetEl.setAttribute('aria-label', 'Active filters');
    }

    // First selected value → normal chip
    const firstVal = values[0];
    const firstChip = makeChip(firstVal, field);
    onPointerActivate(firstChip, () => toggleValue(field, firstVal));
    targetEl.appendChild(firstChip);

    // If more than one selected → single aggregate chip: "+N more"
    if (values.length > 1) {
      const extraCount = values.length - 1;
      const extraVals = values.slice(1);

      const aggChip = makeChip(`+${extraCount} more`, field);
      aggChip.classList.add('is-aggregate');
      aggChip.title = extraVals.join(', ');

      const removeEl = aggChip.querySelector('[fs-list-element="tag-remove"]');
      if (removeEl) {
        onPointerActivate(removeEl, () => {
          extraVals.forEach(v => uncheckValueIfChecked(field, v));
        });
      } else {
        onPointerActivate(aggChip, () => {
          extraVals.forEach(v => uncheckValueIfChecked(field, v));
        });
      }

      targetEl.appendChild(aggChip);
    }
  }

  // --- Relocate [target="..."] before its .w-dropdown-toggle -----------------
  function relocateTargetOutsideToggle(targetEl) {
    const toggle = targetEl.closest('.w-dropdown-toggle');
    if (!toggle) return;
    if (toggle.previousElementSibling === targetEl) return;
    toggle.parentNode.insertBefore(targetEl, toggle);
  }

  // --- Wire group ------------------------------------------------------------
  function wireGroup({ field, sourceSel, targetSel }) {
    const sourceEl = document.querySelector(sourceSel);
    const targetEl = document.querySelector(targetSel);
    if (!sourceEl || !targetEl) return;

    relocateTargetOutsideToggle(targetEl);

    let rafId = null;
    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const values = readSelectedValues(sourceEl, field);
        renderChips(targetEl, field, values);
      });
    };

    sourceEl.addEventListener('change', (e) => {
      const t = e.target;
      if (t && t.matches(`input[fs-list-field="${field}"]`)) schedule();
    });

    const mo = new MutationObserver(() => schedule());
    mo.observe(sourceEl, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['checked', 'class', 'value', 'aria-checked']
    });

    schedule();
  }

  // --- Boot ------------------------------------------------------------------
  const start = () => GROUPS.forEach(wireGroup);
  if (window.Webflow && Array.isArray(window.Webflow)) {
    window.Webflow.push(start);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

$(document).on('click', '[close-dropdown]', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const $dd   = $(this).closest('.w-dropdown');
  const $tg   = $dd.find('.w-dropdown-toggle').first();
  const $list = $dd.find('.w-dropdown-list').first();
  if ($tg.length === 0) return;

  const wasOpen = $tg.hasClass('w--open') || $list.hasClass('w--open');
  $tg.trigger('click');

  // If it was open and still is after a tick, fire a second click
  requestAnimationFrame(function () {
    const stillOpen = $tg.hasClass('w--open') || $list.hasClass('w--open');
    if (wasOpen && stillOpen) {
      setTimeout(function () { $tg.trigger('click'); }, 30);
    }
  });
});

$(document).on('click', '[close-dropdown]', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const dd = $(this).closest('.w-dropdown').get(0);
  if (!dd) return;

  const toggle = dd.querySelector('.w-dropdown-toggle');
  if (!toggle) return;

  // focus helps when Webflow listens to keyboard/tap semantics
  if (typeof toggle.focus === 'function') {
    try { toggle.focus({ preventScroll: true }); } catch(_) { toggle.focus(); }
  }

  // fire a realistic sequence of native events on the toggle
  const fire = (type, Ctor = MouseEvent, extra = {}) =>
    toggle.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, ...extra }));

  try {
    if (window.PointerEvent) {
      fire('pointerdown', PointerEvent);
      fire('pointerup',   PointerEvent);
    }
    fire('mousedown');
    fire('mouseup');
    // native .click() triggers Webflow's native listeners (nie jQuery)
    toggle.click();
  } catch {
    // awaryjnie chociaż to
    toggle.click();
  }

  // ewentualny drugi strzał, jeśli pierwszy nie „zaskoczył”
  requestAnimationFrame(() => {
    const list = dd.querySelector('.w-dropdown-list');
    const stillOpen = toggle.classList.contains('w--open') || (list && list.classList.contains('w--open'));
    if (stillOpen) setTimeout(() => toggle.click(), 40);
  });
});

document.querySelectorAll('.cms_ci.is-h-companies').forEach(el => {
  const card = el.querySelector('.companies-card_block');

  el.addEventListener('mouseenter', () => {
    // pokaż kartę, żeby miała wymiar
    card.style.opacity = '1';
    card.style.visibility = 'visible';

    const rect = card.getBoundingClientRect();
    const overflowBottom = rect.bottom - window.innerHeight;
    if (overflowBottom > 0) {
      card.classList.add('flip'); // twoja klasa
    } else {
      card.classList.remove('flip');
    }
  });

  el.addEventListener('mouseleave', () => {
    card.classList.remove('flip');
    card.style.opacity = '';
    card.style.visibility = '';
  });
});
</script>



  document.addEventListener("DOMContentLoaded", function () {
    const tooltips = document.querySelectorAll('.h_companies-card_block');
    if (!tooltips.length) return;

    const OFFSET = 12;   // odległość od kursora
    const PADDING = 8;   // minimalny margines od krawędzi okna

    // Helper: czy element jest widoczny (na tyle, by warto go korygować)
    function isVisible(el) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      // Nawet przy opacity 0 ustawimy pozycję, żeby przy wejściu była poprawna:
      return true;
    }

    // Wsparcie dla CSS 'translate' (Safari/Firefox różnie z tym bywa)
    const supportsTranslateProp = typeof CSS !== 'undefined'
      && CSS.supports && CSS.supports('translate', '1px');

    // Zapamiętaj bazowy transform, by nie nadpisać np. scale()/rotate()
    tooltips.forEach(tt => {
      const base = getComputedStyle(tt).transform;
      tt.__baseTransform = (base && base !== 'none') ? base : '';
      // Upewnij się, że ma pozycjonowanie zależne od left/top:
      const pos = getComputedStyle(tt).position;
      if (pos !== 'fixed' && pos !== 'absolute') {
        tt.style.position = 'fixed'; // najpewniejsze przy clientX/clientY
      }
    });

    // Reset translate/transform gdy tooltip jest niewidoczny
    function resetIfHidden(tt) {
      const cs = getComputedStyle(tt);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
        if (supportsTranslateProp) {
          tt.style.translate = '';
        } else {
          tt.style.transform = tt.__baseTransform;
        }
      }
    }

    document.addEventListener('mousemove', function (e) {
      tooltips.forEach(function (tt) {
        // Zawsze aktualizujemy pozycję – nawet jeśli teraz jest niewidoczny,
        // to gdy się pojawi (hover-in), będzie już dobrze ustawiony.
        tt.style.left = (e.clientX + OFFSET) + 'px';
        tt.style.top  = (e.clientY + OFFSET) + 'px';

        // Najpierw zresetuj korekty, policz świeże rect
        if (supportsTranslateProp) {
          tt.style.translate = '0px 0px';
        } else {
          tt.style.transform = tt.__baseTransform ? tt.__baseTransform + ' translate(0px, 0px)' : 'translate(0px, 0px)';
        }

        const rect = tt.getBoundingClientRect();
        let dx = 0, dy = 0;

        // Prawa krawędź
        const overRight = rect.right - (window.innerWidth - PADDING);
        if (overRight > 0) dx -= overRight;

        // Lewa krawędź
        const overLeft = PADDING - rect.left;
        if (overLeft > 0) dx += overLeft;

        // Dół
        const overBottom = rect.bottom - (window.innerHeight - PADDING);
        if (overBottom > 0) dy -= overBottom;

        // Góra
        const overTop = PADDING - rect.top;
        if (overTop > 0) dy += overTop;

        // Zastosuj korektę tylko gdy tooltip ma/bedzie miał sens bycia widocznym
        if (isVisible(tt)) {
          if (supportsTranslateProp) {
            tt.style.translate = `${dx}px ${dy}px`;
          } else {
            // dołóż translate do bazowego transform
            tt.style.transform = (tt.__baseTransform ? tt.__baseTransform + ' ' : '') + `translate(${dx}px, ${dy}px)`;
          }
        } else {
          // jeśli jest ukryty – trzymaj translate zresetowany
          resetIfHidden(tt);
        }
      });
    });

    // Dodatkowy „bezpiecznik”: na każdą zmianę rozmiaru okna przelicz korekty
    window.addEventListener('resize', () => {
      const evt = new MouseEvent('mousemove', {clientX: window.innerWidth - OFFSET - PADDING, clientY: window.innerHeight - OFFSET - PADDING});
      document.dispatchEvent(evt);
      tooltips.forEach(resetIfHidden);
    });

    // I przy przewijaniu (na wypadek fixed/absolute w różnych kontekstach)
    window.addEventListener('scroll', () => {
      tooltips.forEach(resetIfHidden);
    });
  });


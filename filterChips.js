/**
 * FILTER CHIPS MODULE
 * Manages filter chip rendering and visibility based on Finsweet filters
 * Based on the working implementation with direct input reading
 */

const FilterChips = (() => {
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

  // --- Public API ------------------------------------------------------------
  function init() {
    GROUPS.forEach(wireGroup);
  }

  return { init };
})();

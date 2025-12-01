/**
 * FILTER CHIPS MODULE
 * Manages dynamic filter chip rendering for tags and countries
 * Displays selected filters as clickable chips with "+N more" aggregation
 */

const FilterChips = (() => {
  console.log('📦 FilterChips module loading...');

  // ========================================================================
  // CONFIGURATION (Hardcoded selectors)
  // ========================================================================
  const GROUPS = [
    { field: 'tags', sourceSel: '[tag-container="tags"]', targetSel: '[target="tags"]' },
    { field: 'country', sourceSel: '[tag-container="countries"]', targetSel: '[target="countries"]' },
  ];

  // ========================================================================
  // TEMPLATE
  // ========================================================================
  /**
   * Get the chip template HTML
   * First tries to use native template from page, falls back to default
   */
  function getTagTemplateHTML() {
    const native = document.querySelector('[fs-list-element="tag"]');
    if (native) {
      console.log('   ℹ️  Using native tag template found on page');
      return native.outerHTML;
    }

    console.log('   ℹ️  Using default tag template');
    return [
      '<div fs-list-element="tag" class="filter_tag" tabindex="0" role="button">',
      '<div fs-list-element="tag-value"></div>',
      '<div fs-list-element="tag-field" class="hide"></div>',
      '<div fs-list-element="tag-operator" class="hide">=</div>',
      '<img src="https://cdn.prod.website-files.com/6821acfa86f43b193f8b39af/683534a85107e966b157069e_Group%2041.svg" loading="lazy" fs-list-element="tag-remove" alt="" class="filter_tag-remove" role="button" tabindex="0">',
      '</div>',
    ].join('');
  }

  const TAG_TEMPLATE_HTML = getTagTemplateHTML();

  // ========================================================================
  // INPUT FIELD HELPERS
  // ========================================================================

  /**
   * Read all currently selected filter values
   */
  function readSelectedValues(sourceEl, field) {
    const selector = [
      `input[fs-list-field="${field}"][type="checkbox"]:checked`,
      `input[fs-list-field="${field}"][type="radio"]:checked`,
    ].join(',');

    const vals = new Set();
    sourceEl.querySelectorAll(selector).forEach((inp) => {
      const value = (inp.getAttribute('fs-list-value') ?? inp.value ?? '').trim();
      if (value) vals.add(value);
    });

    return Array.from(vals);
  }

  /**
   * Toggle a filter value on/off
   */
  function toggleValue(field, value) {
    Utils.queryInputsByFieldAndValue(field, value).forEach(Utils.clickInputOrLabel);
  }

  /**
   * Uncheck a filter value if it's currently selected
   */
  function uncheckValueIfChecked(field, value) {
    Utils.queryInputsByFieldAndValue(field, value).forEach((inp) => {
      const aria = inp.getAttribute('aria-checked');
      const isOn = inp.checked || aria === 'true';
      if (isOn) Utils.clickInputOrLabel(inp);
    });
  }

  // ========================================================================
  // CHIP CREATION & EVENTS
  // ========================================================================

  /**
   * Create a new filter chip element from template
   */
  function makeChip(labelText, field) {
    const wrap = document.createElement('div');
    wrap.innerHTML = TAG_TEMPLATE_HTML;
    const chip = wrap.firstElementChild;

    (chip.querySelector('[fs-list-element="tag-value"]') || chip).textContent = labelText;

    const fieldNode = chip.querySelector('[fs-list-element="tag-field"]');
    if (fieldNode) fieldNode.textContent = field;

    chip.style.webkitUserSelect = 'none';
    chip.style.userSelect = 'none';

    return chip;
  }

  /**
   * Attach multi-modal event listeners (pointer, keyboard, click)
   */
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

  // ========================================================================
  // CHIP RENDERING
  // ========================================================================

  /**
   * Render filter chips to target container
   * Handles "+N more" aggregation when multiple filters selected
   */
  function renderChips(targetEl, field, values) {
    targetEl.innerHTML = '';

    // No filters: remove accessibility attributes
    if (!values || values.length === 0) {
      targetEl.removeAttribute('aria-label');
      targetEl.removeAttribute('role');
      return;
    }

    // Set accessibility attributes when filters active
    targetEl.setAttribute('role', 'group');
    targetEl.setAttribute('aria-label', 'Active filters');

    // First chip (always shown)
    const firstVal = values[0];
    const firstChip = makeChip(firstVal, field);
    onPointerActivate(firstChip, () => toggleValue(field, firstVal));
    targetEl.appendChild(firstChip);

    // Aggregate chip for remaining values
    if (values.length > 1) {
      const extraCount = values.length - 1;
      const extraVals = values.slice(1);

      const aggChip = makeChip(`+${extraCount} more`, field);
      aggChip.classList.add('is-aggregate');
      aggChip.title = extraVals.join(', ');

      const removeEl = aggChip.querySelector('[fs-list-element="tag-remove"]');

      const handler = () => {
        extraVals.forEach((v) => uncheckValueIfChecked(field, v));
      };

      if (removeEl) {
        onPointerActivate(removeEl, handler);
      } else {
        onPointerActivate(aggChip, handler);
      }

      targetEl.appendChild(aggChip);
    }
  }

  // ========================================================================
  // DROPDOWN RELOCATION
  // ========================================================================

  /**
   * Move chip container outside dropdown toggle for proper display
   */
  function relocateTargetOutsideToggle(targetEl) {
    const toggle = targetEl.closest('.w-dropdown-toggle');
    if (!toggle) return;
    if (toggle.previousElementSibling === targetEl) return;
    toggle.parentNode.insertBefore(targetEl, toggle);
  }

  // ========================================================================
  // WIRE GROUP
  // ========================================================================

  /**
   * Set up complete filter management for a group (tags or countries)
   */
  function wireGroup({ field, sourceSel, targetSel }) {
    const sourceEl = document.querySelector(sourceSel);
    const targetEl = document.querySelector(targetSel);

    if (!sourceEl || !targetEl) {
      console.warn(`   ⚠️  Missing elements for field "${field}"`, { sourceEl, targetEl });
      return;
    }

    console.log(`   🔗 Wiring filter group: ${field}`);

    relocateTargetOutsideToggle(targetEl);

    // Schedule rendering with requestAnimationFrame
    let rafId = null;
    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const values = readSelectedValues(sourceEl, field);
        renderChips(targetEl, field, values);
        
        // Hide/show placeholder based on whether filters are selected
        const dropdown = sourceEl.closest('.w-dropdown');
        if (dropdown) {
          const placeholder = dropdown.querySelector('.select-placeholder');
          if (placeholder) {
            if (values.length > 0) {
              placeholder.style.display = 'none';
            } else {
              placeholder.style.display = '';
            }
          }
        }
      });
    };

    // Listen for input change events
    sourceEl.addEventListener('change', (e) => {
      const t = e.target;
      if (t?.matches(`input[fs-list-field="${field}"]`)) {
        schedule();
      }
    });

    // Observe for dynamic DOM changes (pagination)
    const mo = new MutationObserver(() => schedule());
    mo.observe(sourceEl, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['checked', 'class', 'value', 'aria-checked'],
    });

    // Initial render
    schedule();
  }

  // ========================================================================
  // CLOSE DROPDOWN HANDLER
  // ========================================================================

  /**
   * Initialize close dropdown button handlers
   * Closes Webflow dropdown when [close-dropdown] is clicked
   * Simulates a click on the closest .w-dropdown parent
   */
  function initCloseDropdownHandlers() {
    console.log('   🔗 Initializing close dropdown handlers...');

    const closeButtons = document.querySelectorAll('[close-dropdown]');

    closeButtons.forEach((closeBtn) => {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const dropdown = closeBtn.closest('.w-dropdown');
        if (!dropdown) {
          console.warn('   ⚠️  No dropdown found for close button');
          return;
        }

        const toggle = dropdown.querySelector('.w-dropdown-toggle');
        const list = dropdown.querySelector('.w-dropdown-list');

        // Remove w--open classes to close dropdown
        if (toggle) {
          toggle.classList.remove('w--open');
          toggle.setAttribute('aria-expanded', 'false');
          console.log('   🖱️  Removed w--open from toggle:', toggle);
        }

        if (list) {
          list.classList.remove('w--open');
          console.log('   🖱️  Removed w--open from list:', list);
        }
      });
    });

    console.log(`   ✓ Found ${closeButtons.length} close button(s)`);
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Initialize all filter groups
   */
  function init() {
    console.log('🚀 FilterChips.init() called');
    GROUPS.forEach(wireGroup);
    initCloseDropdownHandlers();
    console.log('✅ FilterChips initialized');
  }

  return { init };
})();
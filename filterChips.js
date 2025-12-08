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
    { field: 'countries', sourceSel: '[tag-container="countries"]', targetSel: '[target="countries"]' },
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
   * Get the actual fs-list-field from inputs in a container
   * Falls back to the provided field if no inputs found
   */
  function getActualField(sourceEl, fallbackField) {
    const firstInput = sourceEl.querySelector('input[type="checkbox"], input[type="radio"]');
    return firstInput ? (firstInput.getAttribute('fs-list-field') || fallbackField) : fallbackField;
  }

  /**
   * Read all currently selected filter values
   * Automatically detects the actual fs-list-field from inputs in the container
   */
  function readSelectedValues(sourceEl, field) {
    const actualField = getActualField(sourceEl, field);
    
    const selector = [
      `input[fs-list-field="${actualField}"][type="checkbox"]:checked`,
      `input[fs-list-field="${actualField}"][type="radio"]:checked`,
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
   * Uses actualField if sourceEl is provided, otherwise uses field
   */
  function toggleValue(field, value, sourceEl = null) {
    const actualField = sourceEl ? getActualField(sourceEl, field) : field;
    Utils.queryInputsByFieldAndValue(actualField, value).forEach(Utils.clickInputOrLabel);
  }

  /**
   * Uncheck a filter value if it's currently selected
   * Uses actualField if sourceEl is provided, otherwise uses field
   */
  function uncheckValueIfChecked(field, value, sourceEl = null) {
    const actualField = sourceEl ? getActualField(sourceEl, field) : field;
    Utils.queryInputsByFieldAndValue(actualField, value).forEach((inp) => {
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
  function renderChips(targetEl, actualField, values, sourceEl) {
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
    const firstChip = makeChip(firstVal, actualField);
    onPointerActivate(firstChip, () => toggleValue(actualField, firstVal, sourceEl));
    targetEl.appendChild(firstChip);

    // Aggregate chip for remaining values
    if (values.length > 1) {
      const extraCount = values.length - 1;
      const extraVals = values.slice(1);

      const aggChip = makeChip(`+${extraCount} more`, actualField);
      aggChip.classList.add('is-aggregate');
      aggChip.title = extraVals.join(', ');

      const removeEl = aggChip.querySelector('[fs-list-element="tag-remove"]');

      const handler = () => {
        extraVals.forEach((v) => uncheckValueIfChecked(actualField, v, sourceEl));
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
   * Target is now inside .filter_dropdown-toggle-left, so we don't need to relocate
   */
  function relocateTargetOutsideToggle(targetEl) {
    // Target is now inside .filter_dropdown-toggle-left, no relocation needed
    // But we can ensure it's in the right place if needed
    const toggleLeft = targetEl.closest('.filter_dropdown-toggle-left');
    if (!toggleLeft) {
      // If not in toggle-left, try to find it and move it there
      const dropdown = targetEl.closest('.w-dropdown');
      if (dropdown) {
        const toggleLeft = dropdown.querySelector('.filter_dropdown-toggle-left');
        if (toggleLeft && !toggleLeft.contains(targetEl)) {
          toggleLeft.appendChild(targetEl);
        }
      }
    }
  }

  // ========================================================================
  // WIRE GROUP
  // ========================================================================

  /**
   * Set up complete filter management for a group (tags or countries)
   * Handles multiple dropdowns with the same field
   */
  function wireGroup({ field, sourceSel, targetSel }) {
    // Find all source elements (can be multiple dropdowns)
    const sourceElements = document.querySelectorAll(sourceSel);

    if (sourceElements.length === 0) {
      console.warn(`   ⚠️  Missing source elements for field "${field}"`, { 
        sourceCount: sourceElements.length
      });
      return;
    }

    // Match each source with its corresponding target in the same dropdown
    sourceElements.forEach((sourceEl) => {
      const dropdown = sourceEl.closest('.w-dropdown');
      if (!dropdown) return;

      // Find the target element in the same dropdown
      // First try the specific selector, then try any target element in the dropdown
      // This handles cases where target="tags" is used for all dropdowns
      let targetEl = dropdown.querySelector(targetSel);
      if (!targetEl) {
        // Fallback: find any target element in the dropdown (in case target attribute doesn't match field)
        // This is needed when HTML has target="tags" for all dropdowns
        targetEl = dropdown.querySelector('[target]');
      }
      if (!targetEl) {
        console.warn(`   ⚠️  No target element found in dropdown for field "${field}"`);
        return;
      }

      console.log(`   🔗 Wiring filter group: ${field} (found in dropdown)`);

      wireSingleDropdown({ field, sourceEl, targetEl, dropdown });
    });
  }

  /**
   * Wire a single dropdown for filter management
   */
  function wireSingleDropdown({ field, sourceEl, targetEl, dropdown }) {
    relocateTargetOutsideToggle(targetEl);

    // Détecter le fs-list-field réel une fois au début
    const actualField = getActualField(sourceEl, field);

    // Handle clear buttons in this dropdown - clear chips based on fs-list-field
    const clearButtons = dropdown.querySelectorAll('[fs-list-element="clear"]');
    clearButtons.forEach((clearBtn) => {
      clearBtn.addEventListener('click', () => {
        // Get the fs-list-field from the clear button
        const clearField = clearBtn.getAttribute('fs-list-field');
        if (!clearField) return;
        
        // Find the target element that corresponds to this field in this dropdown
        // The target has an attribute target="..." that should match the field
        let targetToClear = dropdown.querySelector(`[target="${clearField}"]`);
        
        // If no target found by attribute, check if current targetEl matches
        if (!targetToClear) {
          const targetField = targetEl.getAttribute('target');
          if (targetField === clearField || actualField === clearField) {
            targetToClear = targetEl;
          }
        }
        
        // If we found a target, clear only its chips
        if (targetToClear) {
          targetToClear.innerHTML = '';
          targetToClear.removeAttribute('aria-label');
          targetToClear.removeAttribute('role');
          targetToClear.style.display = 'none';
        }
        
        // Show placeholder
        const toggle = dropdown.querySelector('.w-dropdown-toggle');
        if (toggle) {
          const placeholder = toggle.querySelector('.select-placeholder');
          if (placeholder) {
            placeholder.style.removeProperty('display');
          }
        }
      });
    });

    // Schedule rendering with requestAnimationFrame
    let rafId = null;
    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Read values only from this specific source element
        const values = readSelectedValues(sourceEl, field);
        renderChips(targetEl, actualField, values, sourceEl);
        
        // Show/hide placeholder and target based on whether filters are selected
        const toggle = dropdown.querySelector('.w-dropdown-toggle');
        if (toggle) {
          const placeholder = toggle.querySelector('.select-placeholder');
          
          if (values.length > 0) {
            // Show target, hide placeholder
            targetEl.style.display = 'flex';
            if (placeholder) {
              placeholder.style.display = 'none';
            }
          } else {
            // Hide target, show placeholder
            targetEl.style.display = 'none';
            if (placeholder) {
              placeholder.style.removeProperty('display');
            }
          }
        }
        
        // Show/hide filter-clear elements in this dropdown based on whether filters are selected
        // Find all clear elements in this dropdown (regardless of fs-list-field value)
        // This handles cases where fs-list-field doesn't match the field (e.g., fs-list-field="tags" for all dropdowns)
        const filterClearElements = dropdown.querySelectorAll('[fs-list-element="clear"]');
        filterClearElements.forEach((el) => {
          if (values.length > 0) {
            el.style.display = '';
          } else {
            el.style.display = 'none';
          }
        });
      });
    };

    // Listen for input change events - utiliser actualField
    sourceEl.addEventListener('change', (e) => {
      const t = e.target;
      if (t?.matches(`input[fs-list-field="${actualField}"]`)) {
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
  // CLEAR FILTERS HANDLER
  // ========================================================================
  // NOTE: Finsweet Attributes gère automatiquement les boutons clear
  // avec fs-list-element="clear". On ne gère que l'affichage/masquage
  // des boutons clear dans wireSingleDropdown().
  // 
  // Pour que Finsweet gère correctement les clears, assurez-vous que :
  // - Les boutons clear ont fs-list-element="clear"
  // - Si clear d'un champ spécifique : ajoutez fs-list-field="IDENTIFIER"
  //   (le même que les inputs dans le conteneur)
  // - Si clear de tous les champs : pas de fs-list-field sur le bouton

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
          return;
        }

        const toggle = dropdown.querySelector('.w-dropdown-toggle');
        if (!toggle) {
          return;
        }

        // Focus helps when Webflow listens to keyboard/tap semantics
        if (typeof toggle.focus === 'function') {
          try {
            toggle.focus({ preventScroll: true });
          } catch (_) {
            toggle.focus();
          }
        }

        // Fire a realistic sequence of native events on the toggle
        const fire = (type, Ctor = MouseEvent, extra = {}) => {
          toggle.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, ...extra }));
        };

        try {
          if (window.PointerEvent) {
            fire('pointerdown', PointerEvent);
            fire('pointerup', PointerEvent);
          }
          fire('mousedown');
          fire('mouseup');
          // Native .click() triggers Webflow's native listeners
          toggle.click();
        } catch (err) {
          // Fallback: just click
          toggle.click();
        }

        // Second attempt if first one didn't work
        requestAnimationFrame(() => {
          const list = dropdown.querySelector('.w-dropdown-list');
          const stillOpen = toggle.classList.contains('w--open') || (list && list.classList.contains('w--open'));
          if (stillOpen) {
            setTimeout(() => toggle.click(), 40);
          }
        });
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
    // initClearFilterHandlers() supprimé - Finsweet gère les clears automatiquement
    initCloseDropdownHandlers();
    console.log('✅ FilterChips initialized');
  }

  return { init };
})();
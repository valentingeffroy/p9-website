/**
 * FILTER CHIPS MODULE
 * Manages filter chip rendering and visibility based on Finsweet filters
 */

const FilterChips = (() => {
  console.log('📦 FilterChips module loading...');

  // ========================================================================
  // TEMPLATE
  // ========================================================================
  
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
  // CHIP CREATION
  // ========================================================================

  function makeChip(labelText, field) {
    const wrap = document.createElement('div');
    wrap.innerHTML = TAG_TEMPLATE_HTML;
    const chip = wrap.firstElementChild;

    (chip.querySelector('[fs-list-element="tag-value"]') || chip).textContent = labelText;

    const fieldNode = chip.querySelector('[fs-list-element="tag-field"]');
    if (fieldNode) fieldNode.textContent = field;

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

  // ========================================================================
  // FINSWEET INTEGRATION
  // ========================================================================

  function removeFilterValue(fieldKey, value) {
    // Find and uncheck the input with this field and value
    const inputs = document.querySelectorAll(`input[fs-list-field="${fieldKey}"]`);
    inputs.forEach((input) => {
      const inputValue = input.getAttribute('fs-list-value') || input.value;
      if (inputValue === value && (input.checked || input.getAttribute('aria-checked') === 'true')) {
        Utils.clickInputOrLabel(input);
      }
    });
  }


  // ========================================================================
  // WIRE SINGLE DROPDOWN - Isolated management for each dropdown
  // ========================================================================

  /**
   * Sets up complete filter management for a single dropdown.
   * Wires the relationship between source inputs and target chip display.
   * Uses requestAnimationFrame with cancellation to prevent multiple renders.
   */
  function wireSingleDropdown(dropdown) {
    // Find the fieldKey for this dropdown
    const input = dropdown.querySelector('input[fs-list-field][type="checkbox"], input[fs-list-field][type="radio"]');
    if (!input) return;
    
    const fieldKey = input.getAttribute('fs-list-field');
    if (!fieldKey || fieldKey.includes(',')) return;

    // Find target element for chips in THIS dropdown only
    // Use class selector as target attribute may not match fieldKey (e.g., fieldKey="country" but target="countries")
    const targetEl = dropdown.querySelector('.tags-active-target');
    if (!targetEl) return;

    // Find source element (the dropdown list with inputs)
    const sourceEl = dropdown.querySelector('.w-dropdown-list');
    if (!sourceEl) return;

    // === Setup scheduled rendering with requestAnimationFrame ===
    let rafId = null;
    const schedule = () => {
      // Cancel any pending animation frame
      if (rafId) cancelAnimationFrame(rafId);
      
      // Schedule the render to happen on next animation frame
      rafId = requestAnimationFrame(() => {
        // Verify elements still exist (they might have been removed from DOM)
        if (!sourceEl || !targetEl || !document.contains(sourceEl) || !document.contains(targetEl)) {
          return;
        }

        // Get labels with is-list-active class WITHIN this specific dropdown only
        const allLabels = dropdown.querySelectorAll(`label.w-checkbox`);
        const activeLabels = Array.from(allLabels).filter(
          (label) => label.classList.contains('is-list-active')
        );
        
        // Extract values from active labels in this dropdown
        const filterValues = activeLabels.map((label) => {
          const labelInput = label.querySelector(`input[fs-list-field="${fieldKey}"]`);
          return labelInput ? (labelInput.getAttribute('fs-list-value') || labelInput.value) : null;
        }).filter((value) => value !== null);

        // Render chips
        targetEl.innerHTML = '';

        if (filterValues.length === 0) {
          targetEl.removeAttribute('aria-label');
          targetEl.removeAttribute('role');
          targetEl.style.display = 'none';
        } else {
          targetEl.setAttribute('role', 'group');
          targetEl.setAttribute('aria-label', 'Active filters');
          targetEl.style.display = 'flex';

          // First chip
          const firstVal = filterValues[0];
          const firstChip = makeChip(firstVal, fieldKey);
          onPointerActivate(firstChip, () => {
            removeFilterValue(fieldKey, firstVal);
          });
          targetEl.appendChild(firstChip);

          // Aggregate chip for remaining values
          if (filterValues.length > 1) {
            const extraCount = filterValues.length - 1;
            const extraVals = filterValues.slice(1);

            const aggChip = makeChip(`+${extraCount} more`, fieldKey);
            aggChip.classList.add('is-aggregate');
            aggChip.title = extraVals.join(', ');

            const removeEl = aggChip.querySelector('[fs-list-element="tag-remove"]');
            const handler = () => {
              extraVals.forEach((v) => removeFilterValue(fieldKey, v));
            };

            if (removeEl) {
              onPointerActivate(removeEl, handler);
            } else {
              onPointerActivate(aggChip, handler);
            }

            targetEl.appendChild(aggChip);
          }
        }

        // Update placeholder visibility
        const toggle = dropdown.querySelector('.w-dropdown-toggle');
        if (toggle) {
          const placeholder = toggle.querySelector('.select-placeholder');
          if (placeholder) {
            if (filterValues.length > 0) {
              placeholder.style.display = 'none';
            } else {
              placeholder.style.removeProperty('display');
            }
          }
        }

        // Update clear buttons visibility
        const clearButtons = dropdown.querySelectorAll(`[fs-list-element="clear"][fs-list-field="${fieldKey}"]`);
        clearButtons.forEach((clearBtn) => {
          if (filterValues.length > 0) {
            clearBtn.style.display = '';
          } else {
            clearBtn.style.display = 'none';
          }
        });
      });
    };

    // === Listen for input change events ONLY in this dropdown ===
    sourceEl.addEventListener('change', (e) => {
      const t = e.target;
      // Only re-render if the changed input belongs to this field
      if (t?.matches(`input[fs-list-field="${fieldKey}"]`)) {
        schedule();
      }
    });

    // === Observe for dynamic DOM changes in this dropdown ===
    const mo = new MutationObserver(() => schedule());
    mo.observe(sourceEl, {
      subtree: true,      // Watch all descendants
      childList: true,    // Watch for added/removed nodes
      attributes: true,   // Watch for attribute changes
      attributeFilter: ['checked', 'class', 'value', 'aria-checked'], // Only these attributes
    });

    // Perform initial render on setup
    schedule();
  }

  function initFinsweetIntegration() {
    console.log('   🔗 Initializing Finsweet integration...');

    if (!window.FinsweetAttributes) {
      console.warn('   ⚠️  FinsweetAttributes not available yet, waiting...');
      setTimeout(initFinsweetIntegration, 100);
      return;
    }

    window.FinsweetAttributes ||= [];
    window.FinsweetAttributes.push([
      'list',
      (listInstances) => {
        if (!listInstances || listInstances.length === 0) {
          console.warn('   ⚠️  No Finsweet list instances found');
          return;
        }

        console.log(`   ✓ Found ${listInstances.length} Finsweet list instance(s)`);

        // Find all dropdowns and wire each one independently
        const dropdowns = document.querySelectorAll('.w-dropdown');
        dropdowns.forEach((dropdown) => {
          // Check if this dropdown has filter inputs
          const hasFilterInputs = dropdown.querySelector('input[fs-list-field][type="checkbox"], input[fs-list-field][type="radio"]');
          if (hasFilterInputs) {
            wireSingleDropdown(dropdown);
          }
        });

        console.log('   ✅ Finsweet integration initialized');
      }
    ]);
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
   * Initialize filter chips module
   */
  function init() {
    console.log('🚀 FilterChips.init() called');
    initFinsweetIntegration();
    initCloseDropdownHandlers();
    console.log('✅ FilterChips initialized');
  }

  return { init };
})();

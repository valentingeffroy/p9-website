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
  // WIRE SINGLE DROPDOWN - Isolated management for each dropdown
  // ========================================================================

  /**
   * Sets up complete filter management for a single dropdown.
   * Observes is-list-active class changes on labels to update chips.
   * When clicking chip remove button, simulates click on corresponding label.
   */
  function wireSingleDropdown(dropdown) {
    console.log('🔧 wireSingleDropdown called for dropdown:', dropdown);
    
    // Find the fieldKey for this dropdown
    const input = dropdown.querySelector('input[fs-list-field][type="checkbox"], input[fs-list-field][type="radio"]');
    if (!input) {
      console.log('   ❌ No input found in dropdown');
      return;
    }
    
    const fieldKey = input.getAttribute('fs-list-field');
    console.log('   FieldKey:', fieldKey);
    if (!fieldKey || fieldKey.includes(',')) {
      console.log('   ❌ Invalid fieldKey');
      return;
    }

    // Find target element for chips in THIS dropdown only
    // Try multiple selectors: .tags-active-target, .filter_dropdown-toggle-left, or [target] attribute
    let targetEl = dropdown.querySelector('.tags-active-target');
    if (!targetEl) {
      targetEl = dropdown.querySelector('.filter_dropdown-toggle-left');
    }
    if (!targetEl) {
      // Fallback: find element with target attribute matching fieldKey
      targetEl = dropdown.querySelector(`[target="${fieldKey}"]`);
    }
    if (!targetEl) {
      console.log('   ❌ No targetEl found in dropdown (tried .tags-active-target, .filter_dropdown-toggle-left, [target])');
      return;
    }
    console.log('   ✅ targetEl found:', targetEl);

    // Find source element (the dropdown list with inputs)
    const sourceEl = dropdown.querySelector('.w-dropdown-list');
    if (!sourceEl) {
      console.log('   ❌ No sourceEl (.w-dropdown-list) found in dropdown');
      return;
    }
    console.log('   ✅ sourceEl found:', sourceEl);

    // Function to find label by value
    const findLabelByValue = (value) => {
      const allLabels = dropdown.querySelectorAll(`label.w-checkbox`);
      return Array.from(allLabels).find(label => {
        const labelInput = label.querySelector(`input[fs-list-field="${fieldKey}"]`);
        if (!labelInput) return false;
        const labelValue = labelInput.getAttribute('fs-list-value') || labelInput.value;
        return labelValue === value;
      });
    };

    // Function to update chips based on is-list-active class
    const updateChips = () => {
      console.log(`🔄 updateChips called for fieldKey: ${fieldKey}`);
      
      // Get all labels with is-list-active class in this dropdown
      const allLabels = dropdown.querySelectorAll(`label.w-checkbox`);
      console.log(`   Total labels in dropdown: ${allLabels.length}`);
      
      const activeLabels = Array.from(allLabels).filter(
        label => label.classList.contains('is-list-active')
      );
      console.log(`   Active labels (with is-list-active): ${activeLabels.length}`);
      
      // Extract values from active labels
      const filterValues = activeLabels.map(label => {
        const labelInput = label.querySelector(`input[fs-list-field="${fieldKey}"]`);
        const value = labelInput ? (labelInput.getAttribute('fs-list-value') || labelInput.value) : null;
        console.log(`   Active label value: ${value}`, label);
        return value;
      }).filter(value => value !== null);
      
      console.log(`   Filter values:`, filterValues);

      // Clear and rebuild chips
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
          // Simulate click on the label to remove filter
          const label = findLabelByValue(firstVal);
          if (label) label.click();
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
            // Simulate click on each label to remove filters
            extraVals.forEach(val => {
              const label = findLabelByValue(val);
              if (label) label.click();
            });
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
    };

    // Observe changes to is-list-active class on labels
    const mo = new MutationObserver((mutations) => {
      console.log(`👀 MutationObserver triggered for fieldKey: ${fieldKey}`, mutations);
      updateChips();
    });
    
    mo.observe(sourceEl, {
      subtree: true,      // Watch all descendants
      childList: true,    // Watch for added/removed nodes
      attributes: true,   // Watch for attribute changes
      attributeFilter: ['class'], // Only watch class changes (for is-list-active)
    });
    console.log(`   ✅ MutationObserver set up for fieldKey: ${fieldKey}`);

    // Also listen to change events for immediate reactivity
    const allInputs = dropdown.querySelectorAll(`input[fs-list-field="${fieldKey}"]`);
    console.log(`   Found ${allInputs.length} inputs for fieldKey: ${fieldKey}`);
    allInputs.forEach(input => {
      input.addEventListener('change', () => {
        console.log(`   📝 Change event on input for fieldKey: ${fieldKey}`);
        // Small delay to let Finsweet update is-list-active class
        setTimeout(updateChips, 10);
      });
    });

    // Initial render
    console.log(`   🎬 Calling initial updateChips for fieldKey: ${fieldKey}`);
    updateChips();
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
        console.log(`   Found ${dropdowns.length} dropdown(s) total`);
        dropdowns.forEach((dropdown, index) => {
          // Check if this dropdown has filter inputs
          const hasFilterInputs = dropdown.querySelector('input[fs-list-field][type="checkbox"], input[fs-list-field][type="radio"]');
          console.log(`   Dropdown ${index + 1}: hasFilterInputs = ${!!hasFilterInputs}`);
          if (hasFilterInputs) {
            console.log(`   🚀 Wiring dropdown ${index + 1}...`);
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

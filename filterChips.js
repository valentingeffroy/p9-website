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

  // ========================================================================
  // CHIP RENDERING
  // ========================================================================

  function renderChipsForField(fieldKey, filters) {
    // Find all dropdowns with this field
    const dropdowns = document.querySelectorAll('.w-dropdown');
    
    dropdowns.forEach((dropdown) => {
      // Check if this dropdown has inputs with this field
      const hasFieldInputs = dropdown.querySelector(`input[fs-list-field="${fieldKey}"]`);
      if (!hasFieldInputs) return;

      // Find target element for chips
      const targetEl = dropdown.querySelector(`[target="${fieldKey}"]`);
      if (!targetEl) return;

      // Get checked inputs WITHIN this specific dropdown
      const inputsInDropdown = dropdown.querySelectorAll(`input[fs-list-field="${fieldKey}"]`);
      const checkedInputs = Array.from(inputsInDropdown).filter(
        (input) => input.checked || input.getAttribute('aria-checked') === 'true'
      );
      
      // Extract values from checked inputs in this dropdown
      const filterValues = checkedInputs.map((input) => {
        return input.getAttribute('fs-list-value') || input.value;
      });

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
          // Remove this filter value
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
  }

  // ========================================================================
  // FINSWEET INTEGRATION
  // ========================================================================

  function getFilterValuesForField(filters, fieldKey) {
    const values = [];
    
    if (!filters) {
      console.log(`⚠️ No filters object for field "${fieldKey}"`);
      return values;
    }
    
    console.log(`🔍 Checking filters for field "${fieldKey}":`, filters);
    
    if (filters.groups && Array.isArray(filters.groups)) {
      filters.groups.forEach((group) => {
        if (group.conditions && Array.isArray(group.conditions)) {
          group.conditions.forEach((condition) => {
            console.log(`🔍 Condition:`, condition);
            if (condition.fieldKey === fieldKey && condition.value) {
              if (Array.isArray(condition.value)) {
                values.push(...condition.value);
              } else {
                values.push(String(condition.value));
              }
            }
          });
        }
      });
    }

    console.log(`✅ Values for "${fieldKey}":`, values);
    return values;
  }

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

  function getAllFieldKeys() {
    const allFieldKeys = new Set();
    document.querySelectorAll('input[fs-list-field][type="checkbox"], input[fs-list-field][type="radio"]').forEach((input) => {
      const fieldKey = input.getAttribute('fs-list-field');
      // Exclude fields with commas (like "name, fuzzy")
      if (fieldKey && !fieldKey.includes(',')) {
        allFieldKeys.add(fieldKey);
      }
    });
    return Array.from(allFieldKeys);
  }

  function renderChipsForSingleDropdown(dropdown) {
    console.log('🔍 renderChipsForSingleDropdown called');
    console.log('   Dropdown element:', dropdown);
    console.log('   Dropdown ID:', dropdown.id || 'no ID');
    console.log('   Dropdown classes:', dropdown.className);
    
    // Find the fieldKey for this dropdown
    const input = dropdown.querySelector('input[fs-list-field][type="checkbox"], input[fs-list-field][type="radio"]');
    if (!input) {
      console.log('   ❌ No input found in dropdown');
      return;
    }
    
    const fieldKey = input.getAttribute('fs-list-field');
    console.log('   FieldKey found:', fieldKey);
    if (!fieldKey || fieldKey.includes(',')) {
      console.log('   ❌ Invalid fieldKey');
      return;
    }

    // Find target element for chips in THIS dropdown only
    const targetEl = dropdown.querySelector(`[target="${fieldKey}"]`);
    console.log('   Target element found:', targetEl);
    console.log('   Target element parent:', targetEl?.parentElement);
    if (!targetEl) {
      console.log('   ❌ No target element found');
      return;
    }

    // Get labels with is-list-active class WITHIN this specific dropdown only
    // The class is-list-active is on the label, not the input
    const allLabels = dropdown.querySelectorAll(`label.w-checkbox`);
    console.log('   Total labels in dropdown:', allLabels.length);
    const activeLabels = Array.from(allLabels).filter(
      (label) => label.classList.contains('is-list-active')
    );
    console.log('   Active labels (with is-list-active):', activeLabels.length);
    activeLabels.forEach((label, index) => {
      const labelInput = label.querySelector(`input[fs-list-field="${fieldKey}"]`);
      const value = labelInput ? (labelInput.getAttribute('fs-list-value') || labelInput.value) : null;
      console.log(`   Active label ${index + 1}:`, value, label);
    });
    
    // Extract values from active labels in this dropdown
    const filterValues = activeLabels.map((label) => {
      const input = label.querySelector(`input[fs-list-field="${fieldKey}"]`);
      return input ? (input.getAttribute('fs-list-value') || input.value) : null;
    }).filter((value) => value !== null);
    
    console.log('   Filter values extracted:', filterValues);

    // Render chips ONLY in this dropdown
    console.log('   🎨 Rendering chips in targetEl:', targetEl);
    console.log('   TargetEl before clear:', targetEl.innerHTML.substring(0, 100));
    targetEl.innerHTML = '';
    console.log('   TargetEl after clear:', targetEl.innerHTML);

    if (filterValues.length === 0) {
      console.log('   ✅ No filter values, hiding targetEl');
      targetEl.removeAttribute('aria-label');
      targetEl.removeAttribute('role');
      targetEl.style.display = 'none';
    } else {
      console.log('   ✅ Has filter values, showing chips');
      targetEl.setAttribute('role', 'group');
      targetEl.setAttribute('aria-label', 'Active filters');
      targetEl.style.display = 'flex';

      // First chip
      const firstVal = filterValues[0];
      const firstChip = makeChip(firstVal, fieldKey);
      onPointerActivate(firstChip, () => {
        // Remove this filter value
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

    // Update placeholder visibility ONLY for this dropdown
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

    // Update clear buttons visibility ONLY for this dropdown
    const clearButtons = dropdown.querySelectorAll(`[fs-list-element="clear"][fs-list-field="${fieldKey}"]`);
    clearButtons.forEach((clearBtn) => {
      if (filterValues.length > 0) {
        clearBtn.style.display = '';
      } else {
        clearBtn.style.display = 'none';
      }
    });
  }

  function renderChipsForDropdown(dropdown) {
    // Use the single dropdown function instead of looping through all dropdowns
    renderChipsForSingleDropdown(dropdown);
  }

  function renderAllChips(filters = null) {
    const allFieldKeys = getAllFieldKeys();
    console.log('📋 Field keys found:', allFieldKeys);

    // Render chips for all fields
    allFieldKeys.forEach((fieldKey) => {
      renderChipsForField(fieldKey, filters);
    });
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

          // DISABLED: effect() for chips - we use event listeners based on is-list-active class instead
          // This prevents interference and ensures each dropdown is updated independently
          // listInstances.forEach((listInstance) => {
          //   listInstance.effect(() => {
          //     const currentFilters = listInstance.filters.value;
          //     renderAllChips(currentFilters);
          //   });
          // });

        // Listen to checkbox changes - based on is-list-active class on labels
        document.addEventListener('change', (e) => {
          const input = e.target;
          if (input.matches('input[fs-list-field][type="checkbox"], input[fs-list-field][type="radio"]')) {
            console.log('📝 Checkbox changed');
            console.log('   Input element:', input);
            console.log('   Input value:', input.getAttribute('fs-list-value') || input.value);
            
            const fieldKey = input.getAttribute('fs-list-field');
            console.log('   Input fieldKey:', fieldKey);
            if (fieldKey && !fieldKey.includes(',')) {
              // Find the dropdown that contains this input
              const dropdown = input.closest('.w-dropdown');
              console.log('   Dropdown found via closest(.w-dropdown):', dropdown);
              console.log('   Dropdown ID:', dropdown?.id || 'no ID');
              
              if (dropdown) {
                console.log('✅ Input changed, re-rendering chips for this dropdown only...');
                // Small delay to ensure Finsweet has updated the is-list-active class
                setTimeout(() => {
                  console.log('⏰ Timeout fired, calling renderChipsForDropdown');
                  renderChipsForDropdown(dropdown);
                }, 20);
              } else {
                console.log('❌ No dropdown found for input');
              }
            }
          }
        });

        // Listen to clear button clicks
        // Use capture phase to catch all clear buttons
        document.addEventListener('click', (e) => {
          const clearBtn = e.target.closest('[fs-list-element="clear"]');
          if (clearBtn) {
            console.log('🖱️ Clear button clicked');
            console.log('   Clear button element:', clearBtn);
            console.log('   Clear button text:', clearBtn.textContent?.trim());
            console.log('   Clicked element:', e.target);
            
            const fieldKey = clearBtn.getAttribute('fs-list-field');
            console.log('   Clear button fieldKey:', fieldKey);
            if (fieldKey && !fieldKey.includes(',')) {
              // Find the dropdown that contains this clear button
              const dropdown = clearBtn.closest('.w-dropdown');
              console.log('   Dropdown found via closest(.w-dropdown):', dropdown);
              console.log('   Dropdown ID:', dropdown?.id || 'no ID');
              console.log('   Dropdown classes:', dropdown?.className);
              
              // Check if there are other dropdowns in the DOM
              const allDropdowns = document.querySelectorAll('.w-dropdown');
              console.log('   Total dropdowns in DOM:', allDropdowns.length);
              allDropdowns.forEach((dd, index) => {
                const ddFieldKey = dd.querySelector('input[fs-list-field]')?.getAttribute('fs-list-field');
                console.log(`   Dropdown ${index + 1}: ID=${dd.id || 'no ID'}, fieldKey=${ddFieldKey}`);
              });
              
              if (dropdown) {
                console.log('✅ Clear button clicked, re-rendering chips for this dropdown only...');
                // Small delay to ensure Finsweet has removed is-list-active classes
                setTimeout(() => {
                  console.log('⏰ Timeout fired, calling renderChipsForDropdown');
                  renderChipsForDropdown(dropdown);
                }, 20);
              } else {
                console.log('❌ No dropdown found for clear button');
              }
            }
          }
        }, true); // Use capture phase

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

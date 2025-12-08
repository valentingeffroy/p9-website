/**
 * FILTER CHIPS MODULE
 * Manages visibility of placeholders and clear buttons based on Finsweet filters
 * Finsweet handles chip creation, we only manage UI visibility
 */

const FilterChips = (() => {
  console.log('📦 FilterChips module loading...');

  /**
   * Update visibility of placeholder and clear buttons for a specific field
   * @param {string} fieldKey - The field key (e.g., 'collection', 'type')
   * @param {boolean} hasFilters - Whether there are active filters for this field
   */
  function updateFieldVisibility(fieldKey, hasFilters) {
    // Find all dropdowns that contain inputs with this field
    const dropdowns = document.querySelectorAll('.w-dropdown');
    
    dropdowns.forEach((dropdown) => {
      // Check if this dropdown has inputs with this field
      const hasFieldInputs = dropdown.querySelector(`input[fs-list-field="${fieldKey}"]`);
      if (!hasFieldInputs) return;

      // Find placeholder in this dropdown
      const toggle = dropdown.querySelector('.w-dropdown-toggle');
      if (toggle) {
        const placeholder = toggle.querySelector('.select-placeholder');
        if (placeholder) {
          if (hasFilters) {
            placeholder.style.display = 'none';
          } else {
            placeholder.style.removeProperty('display');
          }
        }
      }

      // Find and update clear buttons with matching fs-list-field
      const clearButtons = dropdown.querySelectorAll(`[fs-list-element="clear"][fs-list-field="${fieldKey}"]`);
      clearButtons.forEach((clearBtn) => {
        if (hasFilters) {
          clearBtn.style.display = '';
        } else {
          clearBtn.style.display = 'none';
        }
      });
    });
  }

  /**
   * Check if a field has active filters
   * @param {Object} filters - The filters object from Finsweet
   * @param {string} fieldKey - The field key to check
   * @returns {boolean} True if the field has active filters
   */
  function hasActiveFiltersForField(filters, fieldKey) {
    if (!filters || !filters.groups || !Array.isArray(filters.groups)) {
      return false;
    }

    // Check all groups and conditions
    for (const group of filters.groups) {
      if (group.conditions && Array.isArray(group.conditions)) {
        for (const condition of group.conditions) {
          if (condition.fieldKey === fieldKey && condition.value) {
            // Check if value is not empty
            if (Array.isArray(condition.value)) {
              if (condition.value.length > 0) return true;
            } else if (String(condition.value).trim() !== '') {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all unique field keys from filters
   * @param {Object} filters - The filters object from Finsweet
   * @returns {Set<string>} Set of unique field keys
   */
  function getFieldKeysFromFilters(filters) {
    const fieldKeys = new Set();
    
    if (filters && filters.groups && Array.isArray(filters.groups)) {
      filters.groups.forEach((group) => {
        if (group.conditions && Array.isArray(group.conditions)) {
          group.conditions.forEach((condition) => {
            if (condition.fieldKey) {
              fieldKeys.add(condition.fieldKey);
            }
          });
        }
      });
    }

    return fieldKeys;
  }

  /**
   * Initialize Finsweet list integration
   */
  function initFinsweetIntegration() {
    console.log('   🔗 Initializing Finsweet integration...');

    // Wait for Finsweet Attributes to be available
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

        // For each list instance, observe filter changes
        listInstances.forEach((listInstance) => {
          // Watch for filter changes
          listInstance.watch(
            () => listInstance.filters,
            (newFilters) => {
              // Get all field keys that have filters
              const activeFieldKeys = getFieldKeysFromFilters(newFilters);

              // Update visibility for each field
              activeFieldKeys.forEach((fieldKey) => {
                const hasFilters = hasActiveFiltersForField(newFilters, fieldKey);
                updateFieldVisibility(fieldKey, hasFilters);
              });

              // Also check all fields that might have been cleared
              // Find all unique field keys from all inputs on the page
              const allFieldKeys = new Set();
              document.querySelectorAll('input[fs-list-field]').forEach((input) => {
                const fieldKey = input.getAttribute('fs-list-field');
                if (fieldKey) {
                  allFieldKeys.add(fieldKey);
                }
              });

              // Update visibility for all fields (active or not)
              allFieldKeys.forEach((fieldKey) => {
                const hasFilters = hasActiveFiltersForField(newFilters, fieldKey);
                updateFieldVisibility(fieldKey, hasFilters);
              });
            }
          );

          // Initial update
          if (listInstance.filters) {
            const activeFieldKeys = getFieldKeysFromFilters(listInstance.filters.value);
            activeFieldKeys.forEach((fieldKey) => {
              const hasFilters = hasActiveFiltersForField(listInstance.filters.value, fieldKey);
              updateFieldVisibility(fieldKey, hasFilters);
            });
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

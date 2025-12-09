/**
 * FILTER CHIPS MODULE
 * Manages filter chip rendering and visibility based on Finsweet filters
 */

const FilterChips = (() => {
  // ========================================================================
  // TEMPLATE
  // ========================================================================
  
  function getTagTemplateHTML() {
    const native = document.querySelector('[fs-list-element="tag"]');
    if (native) {
      return native.outerHTML;
    }

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
  // CLOSE DROPDOWN HANDLER
  // ========================================================================

  /**
   * Initialize close dropdown button handlers
   * Closes Webflow dropdown when [close-dropdown] is clicked
   * Simulates a click on the closest .w-dropdown parent
   */
  function initCloseDropdownHandlers() {
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
  }

  // ========================================================================
  // CLEAR BUTTONS HANDLER
  // ========================================================================

  /**
   * Initialize clear button handlers
   * Manages clear buttons with custom attributes (element="clear" and field="...")
   * Resets only the specific field to fix Finsweet's bug
   */
  function initClearButtons() {
    window.FinsweetAttributes ||= [];
    window.FinsweetAttributes.push([
      'list',
      (listInstances) => {
        if (!listInstances || listInstances.length === 0) {
          console.warn('⚠️  No Finsweet list instances found for clear buttons');
          return;
        }
        
        const listInstance = listInstances[0];
        const clearButtons = document.querySelectorAll('[element="clear"]');
        
        console.log(`🔧 Setting up ${clearButtons.length} clear button(s)`);
        
        clearButtons.forEach(clearBtn => {
          clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const field = clearBtn.getAttribute('field');
            if (!field) {
              console.warn('⚠️  Clear button has no field attribute');
              return;
            }
            
            console.log(`🧹 Clear button clicked for field: "${field}"`);
            
            // ÉTAPE 1 : Décocher manuellement les checkboxes dans le bon scope
            const dropdown = clearBtn.closest('.w-dropdown');
            if (dropdown) {
              // Trouver tous les checkboxes checked avec ce field dans CE dropdown uniquement
              const checkboxes = dropdown.querySelectorAll(
                `input[fs-list-field="${field}"][type="checkbox"]:checked`
              );
              
              console.log(`📋 Found ${checkboxes.length} checked checkbox(es) in dropdown for field "${field}"`);
              
              checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                // Déclencher l'événement change pour notifier Finsweet
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
              });
            } else {
              // Fallback : chercher dans tout le document si pas de dropdown parent
              const checkboxes = document.querySelectorAll(
                `input[fs-list-field="${field}"][type="checkbox"]:checked`
              );
              
              console.log(`📋 Found ${checkboxes.length} checked checkbox(es) for field "${field}"`);
              
              checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
              });
            }
            
            // ÉTAPE 2 : Reset via l'API Finsweet pour synchroniser les filtres
            // Log des filtres avant le reset (sans cloner pour éviter DataCloneError)
            const filtersBefore = listInstance.filters?.value;
            console.log('📊 Filters before reset:', {
              groupsCount: filtersBefore?.groups?.length || 0,
              conditions: filtersBefore?.groups?.flatMap(g => g.conditions.map(c => ({
                fieldKey: c.fieldKey,
                value: c.value
              }))) || []
            });
            
            // Modifier les filtres de manière sûre
            if (listInstance.filters?.value?.groups) {
              // Créer un nouveau tableau de groupes pour éviter la mutation directe
              const newGroups = listInstance.filters.value.groups
                .map(group => {
                  const filteredConditions = group.conditions.filter(
                    condition => condition.fieldKey !== field
                  );
                  return filteredConditions.length > 0 
                    ? { ...group, conditions: filteredConditions }
                    : null;
                })
                .filter(group => group !== null);
              
              // Assigner le nouveau tableau
              listInstance.filters.value.groups = newGroups;
            }
            
            // Log des filtres après le reset (sans cloner)
            const filtersAfter = listInstance.filters?.value;
            console.log('📊 Filters after reset:', {
              groupsCount: filtersAfter?.groups?.length || 0,
              conditions: filtersAfter?.groups?.flatMap(g => g.conditions.map(c => ({
                fieldKey: c.fieldKey,
                value: c.value
              }))) || []
            });
            
            // Log des filtres actifs restants
            const activeFilters = [];
            if (listInstance.filters?.value?.groups) {
              listInstance.filters.value.groups.forEach(group => {
                group.conditions.forEach(condition => {
                  if (condition.value && condition.value.length > 0) {
                    activeFilters.push({
                      fieldKey: condition.fieldKey,
                      value: condition.value
                    });
                  }
                });
              });
            }
            console.log('✅ Active filters remaining:', activeFilters);
          }, true); // Capture phase (s'exécute avant Finsweet)
        });
      }
    ]);
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Initialize filter chips module
   */
  function init() {
    initCloseDropdownHandlers();
    initClearButtons();
  }

  return { init };
})();

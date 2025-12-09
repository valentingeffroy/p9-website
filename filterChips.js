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
  // CHIP DISPLAY MANAGEMENT
  // ========================================================================

  /**
   * Update chips display in target element
   * Shows first chip value, then "+N more" for remaining chips
   * Manages placeholder visibility
   * @param {HTMLElement} targetEl - Target element where chips are displayed
   * @param {string} field - Field name (fs-list-field value)
   * @param {HTMLElement} dropdown - Dropdown container
   */
  function updateChipsDisplay(targetEl, field, dropdown) {
    // Récupérer toutes les checkboxes cochées pour ce field dans ce dropdown
    const checkedCheckboxes = Array.from(
      dropdown.querySelectorAll(`input[fs-list-field="${field}"][type="checkbox"]:checked`)
    );
    
    // Vider le targetEl
    targetEl.innerHTML = '';
    
    // Trouver le placeholder dans le dropdown
    const placeholder = dropdown.querySelector('.select-placeholder');
    
    // Si aucune checkbox cochée, afficher le placeholder et retourner
    if (checkedCheckboxes.length === 0) {
      if (placeholder) {
        placeholder.style.display = '';
      }
      return;
    }
    
    // Cacher le placeholder s'il y a des chips
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    
    // Récupérer les valeurs des checkboxes cochées
    const values = checkedCheckboxes.map(cb => {
      return cb.getAttribute('fs-list-value') || cb.value;
    }).filter(Boolean);
    
    if (values.length === 0) {
      return;
    }
    
    // Créer la première chip avec la première valeur
    const firstValue = values[0];
    const wrap1 = document.createElement('div');
    wrap1.innerHTML = TAG_TEMPLATE_HTML;
    const firstChip = wrap1.firstElementChild;
    
    const valueEl1 = firstChip.querySelector('[fs-list-element="tag-value"]');
    if (valueEl1) {
      valueEl1.textContent = firstValue;
    } else {
      firstChip.textContent = firstValue;
    }
    
    targetEl.appendChild(firstChip);
    
    // Si plus d'une checkbox cochée, créer une chip "+N more"
    if (values.length > 1) {
      const moreCount = values.length - 1;
      const wrap2 = document.createElement('div');
      wrap2.innerHTML = TAG_TEMPLATE_HTML;
      const moreChip = wrap2.firstElementChild;
      
      const valueEl2 = moreChip.querySelector('[fs-list-element="tag-value"]');
      if (valueEl2) {
        valueEl2.textContent = `+${moreCount} more`;
      } else {
        moreChip.textContent = `+${moreCount} more`;
      }
      
      targetEl.appendChild(moreChip);
    }
    
    console.log(`✨ Updated chips display: ${values.length} filter(s) - showing "${firstValue}"${values.length > 1 ? ` and "+${values.length - 1} more"` : ''}`);
  }

  // ========================================================================
  // CHIP REMOVAL
  // ========================================================================

  /**
   * Initialize chip removal handlers
   * When clicking on a custom chip, clicks on the label parent of the corresponding checkbox
   * For "+N more" chips, clicks on the label parent of all checkboxes except the first one
   */
  function initChipRemoval() {
    // Utiliser la délégation d'événement car les chips sont créés dynamiquement
    document.addEventListener('click', (e) => {
      // Vérifier si le clic est sur une chip custom (dans un élément target avec target="chips")
      const clickedChip = e.target.closest('[fs-list-element="tag"]');
      if (!clickedChip) {
        return;
      }
      
      // Vérifier que la chip est dans un élément target (nos chips custom)
      const targetEl = clickedChip.closest('[target="chips"]');
      if (!targetEl) {
        // Si la chip n'est pas dans un target, c'est probablement un tag Finsweet, on ne fait rien
        return;
      }
      
      // Récupérer la valeur de la chip cliquée
      const valueEl = clickedChip.querySelector('[fs-list-element="tag-value"]');
      if (!valueEl) {
        console.warn('⚠️  Chip has no tag-value element');
        return;
      }
      
      const chipValue = valueEl.textContent.trim();
      const dropdown = targetEl.closest('.w-dropdown');
      if (!dropdown) {
        console.warn('⚠️  No dropdown found');
        return;
      }
      
      // Récupérer le field depuis target-value
      const field = targetEl.getAttribute('target-value');
      if (!field) {
        console.warn('⚠️  Target has no target-value attribute');
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Si c'est une chip "+N more"
      if (chipValue.startsWith('+') && chipValue.includes('more')) {
        console.log(`🖱️  "+N more" chip clicked, removing all except first`);
        
        // Récupérer toutes les checkboxes cochées pour ce field
        const checkedCheckboxes = Array.from(
          dropdown.querySelectorAll(`input[fs-list-field="${field}"][type="checkbox"]:checked`)
        );
        
        // Cliquer sur le label parent de toutes les checkboxes sauf la première
        if (checkedCheckboxes.length > 1) {
          for (let i = 1; i < checkedCheckboxes.length; i++) {
            const checkbox = checkedCheckboxes[i];
            const label = checkbox.closest('label.checkbox_field.is-tags');
            if (label) {
              label.click();
            } else {
              // Fallback : cliquer sur la checkbox directement
              checkbox.click();
            }
          }
        }
      } else {
        // C'est une chip normale, trouver la checkbox correspondante et cliquer sur son label parent
        console.log(`🖱️  Chip clicked: "${chipValue}"`);
        
        // Trouver la checkbox avec cette valeur
        const checkbox = dropdown.querySelector(
          `input[fs-list-field="${field}"][fs-list-value="${chipValue}"][type="checkbox"]`
        );
        
        if (!checkbox) {
          console.warn(`⚠️  No checkbox found for value: "${chipValue}"`);
          return;
        }
        
        // Trouver le label parent (checkbox_field is-tags) et cliquer dessus
        const label = checkbox.closest('label.checkbox_field.is-tags');
        if (label) {
          label.click();
        } else {
          // Fallback : cliquer sur la checkbox directement
          checkbox.click();
        }
      }
    });
    
    console.log('🔧 Chip removal handlers initialized');
  }

  // ========================================================================
  // CHIP CREATION
  // ========================================================================

  /**
   * Initialize chip creation when checkboxes are checked
   * Updates chips display using updateChipsDisplay() when checkboxes change
   */
  function initChipCreation() {
    // Trouver tous les checkboxes de filtre
    const filterCheckboxes = document.querySelectorAll('input[fs-list-field][type="checkbox"]');
    
    console.log(`🔧 Setting up chip creation for ${filterCheckboxes.length} checkbox(es)`);
    
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const checkboxEl = e.target;
        
        // Récupérer le field de la checkbox (important pour trouver le target)
        const field = checkboxEl.getAttribute('fs-list-field');
        if (!field) {
          console.warn('⚠️  Checkbox has no fs-list-field attribute');
          return;
        }
        
        // Trouver le dropdown parent
        const dropdown = checkboxEl.closest('.w-dropdown');
        if (!dropdown) {
          console.warn('⚠️  Checkbox is not inside a .w-dropdown');
          return;
        }
        
        // Trouver l'élément target avec target="chips" et target-value correspondant au FIELD
        const targetEl = dropdown.querySelector(`[target="chips"][target-value="${field}"]`);
        if (!targetEl) {
          console.warn(`⚠️  No target element found with target="chips" and target-value="${field}" in dropdown`);
          return;
        }
        
        // Utiliser updateChipsDisplay() pour mettre à jour l'affichage
        // Cela gère à la fois le coché et le décoché
        updateChipsDisplay(targetEl, field, dropdown);
      });
    });
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Initialize filter chips module
   */
  function init() {
    initCloseDropdownHandlers();
    initChipCreation();
    initChipRemoval();
  }

  return { init };
})();

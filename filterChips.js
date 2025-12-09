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
  // PUBLIC API
  // ========================================================================

  /**
   * Initialize filter chips module
   */
  function init() {
    initCloseDropdownHandlers();
  }

  return { init };
})();

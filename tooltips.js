/**
 * TOOLTIPS MODULE
 * Smart positioning for tooltip/card elements that follow the cursor
 * Automatically adjusts position to stay within viewport bounds
 */

const Tooltips = (() => {
  console.log('📦 Tooltips module loading...');

  // ========================================================================
  // CONFIGURATION (Hardcoded values)
  // ========================================================================
  const OFFSET = 12;   // Distance from cursor
  const PADDING = 8;   // Minimum margin from window edge

  // ========================================================================
  // HELPERS
  // ========================================================================

  /**
   * Reset translate/transform when tooltip is hidden
   */
  function resetIfHidden(tt, supportsTranslateProp) {
    const cs = getComputedStyle(tt);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
      if (supportsTranslateProp) {
        tt.style.translate = '';
      } else {
        tt.style.transform = tt.__baseTransform || '';
      }
    }
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * Initialize tooltip positioning system
   */
  function init() {
    console.log('🚀 Tooltips.init() called');

    const tooltips = document.querySelectorAll('.h_companies-card_block');

    if (!tooltips.length) {
      console.warn('   ⚠️  No tooltip elements found (.h_companies-card_block)');
      return;
    }

    console.log(`   📍 Found ${tooltips.length} tooltip element(s)`);

    // Check if browser supports CSS translate property
    const supportsTranslateProp = typeof CSS !== 'undefined'
      && CSS.supports
      && CSS.supports('translate', '1px');

    console.log(`   🖥️  CSS translate support: ${supportsTranslateProp ? 'YES' : 'NO'}`);

    // ========================================================================
    // SETUP: Initialize all tooltips
    // ========================================================================
    tooltips.forEach((tooltip, idx) => {
      // Save original transform to avoid overwriting scale/rotate
      const base = getComputedStyle(tooltip).transform;
      tooltip.__baseTransform = (base && base !== 'none') ? base : '';

      // Ensure fixed positioning for accurate cursor tracking
      const pos = getComputedStyle(tooltip).position;
      if (pos !== 'fixed' && pos !== 'absolute') {
        tooltip.style.position = 'fixed';
      }

      // Mark tooltip as inactive initially
      tooltip.__isActive = false;

      console.log(`   ✓ Tooltip ${idx + 1} initialized`);
    });

    // ========================================================================
    // SETUP: Wire parents to activate/deactivate tooltips
    // ========================================================================
    const parents = document.querySelectorAll('.cms_ci.is-h-companies');
    
    parents.forEach((parent) => {
      const tooltip = parent.querySelector('.h_companies-card_block');
      
      if (!tooltip) return;

      // Activate tooltip when hovering parent
      parent.addEventListener('mouseenter', () => {
        tooltip.__isActive = true;
        // Cache visibility on activation
        tooltip.__isVisible = true;
      });

      // Deactivate tooltip when leaving parent
      parent.addEventListener('mouseleave', () => {
        tooltip.__isActive = false;
        tooltip.__isVisible = false;
        // Reset position
        if (supportsTranslateProp) {
          tooltip.style.translate = '';
        } else {
          tooltip.style.transform = tooltip.__baseTransform || '';
        }
        tooltip.style.left = '';
        tooltip.style.top = '';
      });
    });

    // ========================================================================
    // OPTIMIZED MOUSE MOVE: Use requestAnimationFrame for smooth updates
    // ========================================================================
    let rafId = null;
    let pendingMouseEvent = null;
    const activeTooltips = Array.from(tooltips);

    function updateTooltips(mouseX, mouseY) {
      // Update base position for all tooltips (lightweight, no reflow)
      activeTooltips.forEach(function (tt) {
        tt.style.left = (mouseX + OFFSET) + 'px';
        tt.style.top = (mouseY + OFFSET) + 'px';
      });

      // Only process active tooltips for expensive calculations (bounding rect, corrections)
      const active = activeTooltips.filter(tt => tt.__isActive && tt.__isVisible !== false);
      
      active.forEach(function (tt) {
        // Reset translate to get accurate bounding rect
        if (supportsTranslateProp) {
          tt.style.translate = '0px 0px';
        } else {
          tt.style.transform = tt.__baseTransform
            ? tt.__baseTransform + ' translate(0px, 0px)'
            : 'translate(0px, 0px)';
        }

        // Only calculate bounding rect for active tooltips (this is the expensive operation)
        const rect = tt.getBoundingClientRect();
        let dx = 0, dy = 0;

        // Right edge
        const overRight = rect.right - (window.innerWidth - PADDING);
        if (overRight > 0) dx -= overRight;

        // Left edge
        const overLeft = PADDING - rect.left;
        if (overLeft > 0) dx += overLeft;

        // Bottom
        const overBottom = rect.bottom - (window.innerHeight - PADDING);
        if (overBottom > 0) dy -= overBottom;

        // Top
        const overTop = PADDING - rect.top;
        if (overTop > 0) dy += overTop;

        // Apply correction
        if (supportsTranslateProp) {
          tt.style.translate = `${dx}px ${dy}px`;
        } else {
          tt.style.transform = (tt.__baseTransform ? tt.__baseTransform + ' ' : '')
            + `translate(${dx}px, ${dy}px)`;
        }
      });

      // Reset translate for inactive tooltips
      const inactive = activeTooltips.filter(tt => !tt.__isActive);
      inactive.forEach(function (tt) {
        if (supportsTranslateProp) {
          tt.style.translate = '';
        } else {
          tt.style.transform = tt.__baseTransform || '';
        }
      });
    }

    document.addEventListener('mousemove', function (e) {
      // Store the latest mouse position
      pendingMouseEvent = { x: e.clientX, y: e.clientY };

      // If no animation frame is scheduled, schedule one
      if (!rafId) {
        rafId = requestAnimationFrame(function () {
          if (pendingMouseEvent) {
            updateTooltips(pendingMouseEvent.x, pendingMouseEvent.y);
            pendingMouseEvent = null;
          }
          rafId = null;
        });
      }
    });

    // ========================================================================
    // WINDOW RESIZE: Recalculate corrections
    // ========================================================================
    let resizeRafId = null;
    window.addEventListener('resize', () => {
      // Use RAF to debounce resize and recalculate positions smoothly
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      
      resizeRafId = requestAnimationFrame(() => {
        // If we have a pending mouse event, recalculate with it
        // Otherwise use the last known position or center of viewport
        if (pendingMouseEvent) {
          updateTooltips(pendingMouseEvent.x, pendingMouseEvent.y);
        } else {
          // Use center of viewport as fallback
          updateTooltips(window.innerWidth / 2, window.innerHeight / 2);
        }
        activeTooltips.forEach(tt => resetIfHidden(tt, supportsTranslateProp));
        resizeRafId = null;
      });
    });

    // ========================================================================
    // WINDOW SCROLL: Reset hidden tooltips (in case of fixed/absolute contexts)
    // ========================================================================
    let scrollRafId = null;
    window.addEventListener('scroll', () => {
      // Use RAF to throttle scroll events
      if (scrollRafId) return;
      
      scrollRafId = requestAnimationFrame(() => {
        activeTooltips.forEach(tt => resetIfHidden(tt, supportsTranslateProp));
        scrollRafId = null;
      });
    });

    console.log('✅ Tooltips initialized');
  }

  return { init };
})();
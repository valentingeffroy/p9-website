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
   * Check if element is visible (enough to be worth correcting)
   */
  function isVisible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    // Even with opacity 0, we'll set position so it's correct when it appears
    return true;
  }

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
      });

      // Deactivate tooltip when leaving parent
      parent.addEventListener('mouseleave', () => {
        tooltip.__isActive = false;
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
    // GLOBAL MOUSE MOVE: Update all tooltips on every mouse movement
    // ========================================================================
    document.addEventListener('mousemove', function (e) {
      tooltips.forEach(function (tt) {
        // Always update position – even if tooltip is currently hidden,
        // when it appears (hover-in), it will already be correctly positioned
        tt.style.left = (e.clientX + OFFSET) + 'px';
        tt.style.top = (e.clientY + OFFSET) + 'px';

        // First reset corrections, get fresh rect
        if (supportsTranslateProp) {
          tt.style.translate = '0px 0px';
        } else {
          tt.style.transform = tt.__baseTransform
            ? tt.__baseTransform + ' translate(0px, 0px)'
            : 'translate(0px, 0px)';
        }

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

        // Apply correction only if tooltip is visible/active
        if (tt.__isActive && isVisible(tt)) {
          if (supportsTranslateProp) {
            tt.style.translate = `${dx}px ${dy}px`;
          } else {
            // Add translate to base transform
            tt.style.transform = (tt.__baseTransform ? tt.__baseTransform + ' ' : '')
              + `translate(${dx}px, ${dy}px)`;
          }
        } else {
          // If hidden – keep translate reset
          resetIfHidden(tt, supportsTranslateProp);
        }
      });
    });

    // ========================================================================
    // WINDOW RESIZE: Recalculate corrections
    // ========================================================================
    window.addEventListener('resize', () => {
      // Trigger mousemove to recalculate positions
      const evt = new MouseEvent('mousemove', {
        clientX: window.innerWidth - OFFSET - PADDING,
        clientY: window.innerHeight - OFFSET - PADDING
      });
      document.dispatchEvent(evt);
      tooltips.forEach(tt => resetIfHidden(tt, supportsTranslateProp));
    });

    // ========================================================================
    // WINDOW SCROLL: Reset hidden tooltips (in case of fixed/absolute contexts)
    // ========================================================================
    window.addEventListener('scroll', () => {
      tooltips.forEach(tt => resetIfHidden(tt, supportsTranslateProp));
    });

    console.log('✅ Tooltips initialized');
  }

  return { init };
})();
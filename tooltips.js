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

    console.log(`   📍 Found ${tooltips.length} tooltip(s)`);

    // Check if browser supports CSS translate property
    const supportsTranslateProp = typeof CSS !== 'undefined'
      && CSS.supports 
      && CSS.supports('translate', '1px');

    console.log(`   🖥️  CSS translate support: ${supportsTranslateProp ? 'YES' : 'NO'}`);

    // ========================================================================
    // SETUP: Store base transform and ensure fixed positioning
    // ========================================================================
    tooltips.forEach((tt, idx) => {
      // Save original transform to avoid overwriting scale/rotate
      const base = getComputedStyle(tt).transform;
      tt.__baseTransform = (base && base !== 'none') ? base : '';

      // Ensure fixed positioning for accurate cursor tracking
      const pos = getComputedStyle(tt).position;
      if (pos !== 'fixed' && pos !== 'absolute') {
        tt.style.position = 'fixed';
      }

      console.log(`   ✓ Tooltip ${idx + 1} initialized`);
    });

    // ========================================================================
    // HELPER: Reset translate/transform when hidden
    // ========================================================================
    function resetIfHidden(tt) {
      const cs = getComputedStyle(tt);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
        if (supportsTranslateProp) {
          tt.style.translate = '';
        } else {
          tt.style.transform = tt.__baseTransform;
        }
      }
    }

    // ========================================================================
    // MAIN: Mouse move listener for positioning
    // ========================================================================
    document.addEventListener('mousemove', (e) => {
      tooltips.forEach((tt) => {
        // Set base position (cursor + offset)
        tt.style.left = (e.clientX + OFFSET) + 'px';
        tt.style.top = (e.clientY + OFFSET) + 'px';

        // Reset translate to get accurate bounding rect
        if (supportsTranslateProp) {
          tt.style.translate = '0px 0px';
        } else {
          tt.style.transform = tt.__baseTransform 
            ? tt.__baseTransform + ' translate(0px, 0px)' 
            : 'translate(0px, 0px)';
        }

        // Calculate adjustment needed
        const rect = tt.getBoundingClientRect();
        let dx = 0, dy = 0;

        // Check right edge overflow
        const overRight = rect.right - (window.innerWidth - PADDING);
        if (overRight > 0) dx -= overRight;

        // Check left edge overflow
        const overLeft = PADDING - rect.left;
        if (overLeft > 0) dx += overLeft;

        // Check bottom edge overflow
        const overBottom = rect.bottom - (window.innerHeight - PADDING);
        if (overBottom > 0) dy -= overBottom;

        // Check top edge overflow
        const overTop = PADDING - rect.top;
        if (overTop > 0) dy += overTop;

        // Apply correction only if visible
        if (Utils.isVisible(tt)) {
          if (supportsTranslateProp) {
            tt.style.translate = `${dx}px ${dy}px`;
          } else {
            tt.style.transform = (tt.__baseTransform ? tt.__baseTransform + ' ' : '') 
              + `translate(${dx}px, ${dy}px)`;
          }
        } else {
          resetIfHidden(tt);
        }
      });
    });

    // ========================================================================
    // WINDOW RESIZE LISTENER
    // ========================================================================
    window.addEventListener('resize', () => {
      console.log('   🔄 Window resized, recalculating tooltip positions');
      const evt = new MouseEvent('mousemove', {
        clientX: window.innerWidth - OFFSET - PADDING,
        clientY: window.innerHeight - OFFSET - PADDING,
      });
      document.dispatchEvent(evt);
      tooltips.forEach(resetIfHidden);
    });

    // ========================================================================
    // SCROLL LISTENER
    // ========================================================================
    window.addEventListener('scroll', () => {
      tooltips.forEach(resetIfHidden);
    });

    console.log('✅ Tooltips initialized');
  }

  return { init };
})();
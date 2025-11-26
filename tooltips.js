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

    const parents = document.querySelectorAll('.cms_ci.is-h-companies');

    if (!parents.length) {
      console.warn('   ⚠️  No parent elements found (.cms_ci.is-h-companies)');
      return;
    }

    console.log(`   📍 Found ${parents.length} parent element(s)`);

    // Check if browser supports CSS translate property
    const supportsTranslateProp = typeof CSS !== 'undefined'
      && CSS.supports
      && CSS.supports('translate', '1px');

    console.log(`   🖥️  CSS translate support: ${supportsTranslateProp ? 'YES' : 'NO'}`);

    // ========================================================================
    // SETUP: Wire each parent with its tooltip
    // ========================================================================
    parents.forEach((parent, idx) => {
      const tooltip = parent.querySelector('.h_companies-card_block');

      if (!tooltip) {
        console.warn(`   ⚠️  No tooltip found in parent ${idx + 1}`);
        return;
      }

      // Save original transform to avoid overwriting scale/rotate
      const base = getComputedStyle(tooltip).transform;
      tooltip.__baseTransform = (base && base !== 'none') ? base : '';

      // Ensure fixed positioning for accurate cursor tracking
      const pos = getComputedStyle(tooltip).position;
      if (pos !== 'fixed' && pos !== 'absolute') {
        tooltip.style.position = 'fixed';
      }

      console.log(`   ✓ Tooltip ${idx + 1} initialized`);

      // ========================================================================
      // MOUSE MOVE: Track cursor only when hovering this parent
      // ========================================================================
      parent.addEventListener('mousemove', (e) => {
        // Set base position (cursor + offset)
        tooltip.style.left = (e.clientX + OFFSET) + 'px';
        tooltip.style.top = (e.clientY + OFFSET) + 'px';

        // Reset translate to get accurate bounding rect
        if (supportsTranslateProp) {
          tooltip.style.translate = '0px 0px';
        } else {
          tooltip.style.transform = tooltip.__baseTransform
            ? tooltip.__baseTransform + ' translate(0px, 0px)'
            : 'translate(0px, 0px)';
        }

        // Calculate adjustment needed
        const rect = tooltip.getBoundingClientRect();
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

        // Apply correction
        if (supportsTranslateProp) {
          tooltip.style.translate = `${dx}px ${dy}px`;
        } else {
          tooltip.style.transform = (tooltip.__baseTransform ? tooltip.__baseTransform + ' ' : '')
            + `translate(${dx}px, ${dy}px)`;
        }
      });

      // ========================================================================
      // MOUSE LEAVE: Reset tooltip position
      // ========================================================================
      parent.addEventListener('mouseleave', () => {
        if (supportsTranslateProp) {
          tooltip.style.translate = '';
        } else {
          tooltip.style.transform = tooltip.__baseTransform;
        }
        tooltip.style.left = '';
        tooltip.style.top = '';
      });
    });

    console.log('✅ Tooltips initialized');
  }

  return { init };
})();
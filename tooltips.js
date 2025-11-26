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
   * Update tooltip content from source element
   */
  function updateTooltipContent(tooltip, sourceContent) {
    if (!tooltip || !sourceContent) return;

    // Find source elements
    const sourceImage = sourceContent.querySelector('[tooltip="image"]');
    const sourceText = sourceContent.querySelector('[tooltip="text"]');

    // Find target elements in tooltip
    const targetImage = tooltip.querySelector('[tooltip="image"]');
    const targetText = tooltip.querySelector('[tooltip="text"]');

    // Copy image
    if (sourceImage && targetImage) {
      const src = sourceImage.getAttribute('src');
      const alt = sourceImage.getAttribute('alt') || '';
      if (src) {
        targetImage.setAttribute('src', src);
        targetImage.setAttribute('alt', alt);
      }
    }

    // Copy text
    if (sourceText && targetText) {
      targetText.textContent = sourceText.textContent;
    }
  }

  /**
   * Initialize tooltip positioning system
   */
  function init() {
    console.log('🚀 Tooltips.init() called');

    // Find single global tooltip
    const tooltip = document.querySelector('[tooltip="tooltip"]');

    if (!tooltip) {
      console.warn('   ⚠️  No tooltip element found ([tooltip="tooltip"])');
      return;
    }

    console.log('   ✓ Single tooltip found');

    // Check if browser supports CSS translate property
    const supportsTranslateProp = typeof CSS !== 'undefined'
      && CSS.supports
      && CSS.supports('translate', '1px');

    console.log(`   🖥️  CSS translate support: ${supportsTranslateProp ? 'YES' : 'NO'}`);

    // ========================================================================
    // SETUP: Initialize single tooltip
    // ========================================================================
    
    // Save original transform to avoid overwriting scale/rotate
    const base = getComputedStyle(tooltip).transform;
    tooltip.__baseTransform = (base && base !== 'none') ? base : '';

    // Ensure fixed positioning for accurate cursor tracking
    const pos = getComputedStyle(tooltip).position;
    if (pos !== 'fixed' && pos !== 'absolute') {
      tooltip.style.position = 'fixed';
    }

    // Track tooltip state
    let isActive = false;
    let currentParent = null;

    // ========================================================================
    // SETUP: Wire parents to update content and activate tooltip
    // ========================================================================
    const parents = document.querySelectorAll('.cms_ci.is-h-companies');
    
    console.log(`   📍 Found ${parents.length} parent element(s)`);
    
    parents.forEach((parent) => {
      const sourceContent = parent.querySelector('[tooltip="content"]');
      
      if (!sourceContent) {
        console.warn('   ⚠️  No [tooltip="content"] found in parent');
        return;
      }

      // Activate tooltip when hovering parent
      parent.addEventListener('mouseenter', () => {
        // Update content before showing
        updateTooltipContent(tooltip, sourceContent);
        
        isActive = true;
        currentParent = parent;
      });

      // Deactivate tooltip when leaving parent
      parent.addEventListener('mouseleave', () => {
        isActive = false;
        currentParent = null;
        
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

    function updateTooltip(mouseX, mouseY) {
      if (!isActive) return;

      // Update base position
      tooltip.style.left = (mouseX + OFFSET) + 'px';
      tooltip.style.top = (mouseY + OFFSET) + 'px';

      // Reset translate to get accurate bounding rect
      if (supportsTranslateProp) {
        tooltip.style.translate = '0px 0px';
      } else {
        tooltip.style.transform = tooltip.__baseTransform
          ? tooltip.__baseTransform + ' translate(0px, 0px)'
          : 'translate(0px, 0px)';
      }

      // Calculate bounding rect (only once for single tooltip)
      const rect = tooltip.getBoundingClientRect();
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
        tooltip.style.translate = `${dx}px ${dy}px`;
      } else {
        tooltip.style.transform = (tooltip.__baseTransform ? tooltip.__baseTransform + ' ' : '')
          + `translate(${dx}px, ${dy}px)`;
      }
    }

    document.addEventListener('mousemove', function (e) {
      // Store the latest mouse position
      pendingMouseEvent = { x: e.clientX, y: e.clientY };

      // If no animation frame is scheduled, schedule one
      if (!rafId) {
        rafId = requestAnimationFrame(function () {
          if (pendingMouseEvent) {
            updateTooltip(pendingMouseEvent.x, pendingMouseEvent.y);
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
          updateTooltip(pendingMouseEvent.x, pendingMouseEvent.y);
        } else {
          // Use center of viewport as fallback
          updateTooltip(window.innerWidth / 2, window.innerHeight / 2);
        }
        resetIfHidden(tooltip, supportsTranslateProp);
        resizeRafId = null;
      });
    });

    // ========================================================================
    // WINDOW SCROLL: Reset hidden tooltip (in case of fixed/absolute contexts)
    // ========================================================================
    let scrollRafId = null;
    window.addEventListener('scroll', () => {
      // Use RAF to throttle scroll events
      if (scrollRafId) return;
      
      scrollRafId = requestAnimationFrame(() => {
        resetIfHidden(tooltip, supportsTranslateProp);
        scrollRafId = null;
      });
    });

    console.log('✅ Tooltips initialized');
  }

  return { init };
})();
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
  const TRANSITION_DURATION = 400; // Opacity transition and hide delay duration in ms (increased for smoother animation)

  // ========================================================================
  // HELPERS
  // ========================================================================

  /**
   * Reset translate/transform when tooltip is hidden
   */
  function resetIfHidden(tt, supportsTranslateProp) {
    const cs = getComputedStyle(tt);
    if (cs.display === 'none' || cs.visibility === 'hidden') {
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
  function updateTooltipContent(tooltip, source) {
    console.log('🔄 updateTooltipContent called');
    console.log('   tooltip:', tooltip);
    console.log('   source:', source);
    
    if (!tooltip || !source) {
      console.warn('   ⚠️  Missing tooltip or source');
      return;
    }

    // Find source elements directly in [tooltip="source"]
    const sourceImage = source.querySelector('[tooltip="image"]');
    const sourceParagraph = source.querySelector('[tooltip="paragraph"]');
    
    console.log('   sourceImage:', sourceImage);
    console.log('   sourceParagraph:', sourceParagraph);

    // Find target elements in tooltip
    const targetImage = tooltip.querySelector('[tooltip="image"]');
    const targetParagraph = tooltip.querySelector('[tooltip="paragraph"]');
    
    console.log('   targetImage:', targetImage);
    console.log('   targetParagraph:', targetParagraph);

    // Copy image
    if (sourceImage && targetImage) {
      const src = sourceImage.getAttribute('src');
      const alt = sourceImage.getAttribute('alt') || '';
      console.log('   📸 Copying image - src:', src, 'alt:', alt);
      if (src) {
        targetImage.setAttribute('src', src);
        targetImage.setAttribute('alt', alt);
        console.log('   ✅ Image copied');
      } else {
        console.warn('   ⚠️  No src attribute on source image');
      }
    } else {
      console.warn('   ⚠️  Missing sourceImage or targetImage', { sourceImage: !!sourceImage, targetImage: !!targetImage });
    }

    // Copy paragraph text
    if (sourceParagraph && targetParagraph) {
      const text = sourceParagraph.textContent;
      console.log('   📝 Copying paragraph:', text);
      targetParagraph.textContent = text;
      console.log('   ✅ Paragraph copied');
    } else {
      console.warn('   ⚠️  Missing sourceParagraph or targetParagraph', { sourceParagraph: !!sourceParagraph, targetParagraph: !!targetParagraph });
    }
  }

  /**
   * Initialize tooltip positioning system
   */
  function init() {
    console.log('🚀 Tooltips.init() called');

    // Find single global tooltip target
    const tooltip = document.querySelector('[tooltip="target"]');

    if (!tooltip) {
      console.warn('   ⚠️  No tooltip element found ([tooltip="target"])');
      return;
    }

    console.log('   ✓ Single tooltip found');
    console.log('   Tooltip element:', tooltip);
    console.log('   Tooltip innerHTML preview:', tooltip.innerHTML.substring(0, 200));
    
    // Vérifier les éléments enfants du tooltip
    const tooltipImage = tooltip.querySelector('[tooltip="image"]');
    const tooltipParagraph = tooltip.querySelector('[tooltip="paragraph"]');
    console.log('   Tooltip [tooltip="image"] found:', !!tooltipImage);
    console.log('   Tooltip [tooltip="paragraph"] found:', !!tooltipParagraph);
    if (tooltipImage) {
      console.log('   Tooltip image current src:', tooltipImage.getAttribute('src'));
    }
    if (tooltipParagraph) {
      console.log('   Tooltip paragraph current content:', tooltipParagraph.textContent);
    }

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

    // Set transition for opacity
    tooltip.style.transition = `opacity ${TRANSITION_DURATION}ms ease, visibility ${TRANSITION_DURATION}ms ease`;

    // Track tooltip state
    let isActive = false;
    let currentSource = null;
    let lastMouseX = null;
    let lastMouseY = null;
    let hideTimeout = null;

    // Helper functions to show/hide tooltip
    function showTooltip() {
      // Annuler tout masquage en cours
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      
      tooltip.style.display = 'block';
      // Use requestAnimationFrame to ensure display:block happens before opacity transition
      requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
        tooltip.style.pointerEvents = 'auto';
      });
    }

    function hideTooltip() {
      // Annuler tout timeout existant
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      // Commencer la transition d'opacité
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
      tooltip.style.pointerEvents = 'none';
      
      // Cacher complètement après la transition
      hideTimeout = setTimeout(() => {
        // Vérifier qu'on n'est pas entré dans un autre source entre temps
        if (!isActive) {
          tooltip.style.display = 'none';
          // Reset position seulement si vraiment caché
          if (supportsTranslateProp) {
            tooltip.style.translate = '';
          } else {
            tooltip.style.transform = tooltip.__baseTransform || '';
          }
          tooltip.style.left = '';
          tooltip.style.top = '';
        }
        hideTimeout = null;
      }, TRANSITION_DURATION);
    }

    // Initially hide the tooltip
    hideTooltip();

    // ========================================================================
    // SETUP: Wire sources to update content and activate tooltip
    // ========================================================================
    const sources = document.querySelectorAll('[tooltip="source"]');
    
    console.log(`   📍 Found ${sources.length} source element(s)`);
    
    sources.forEach((source) => {
      const sourceImageCheck = source.querySelector('[tooltip="image"]');
      const sourceParagraphCheck = source.querySelector('[tooltip="paragraph"]');
      console.log('   Source [tooltip="image"] found:', !!sourceImageCheck);
      console.log('   Source [tooltip="paragraph"] found:', !!sourceParagraphCheck);

      // Activate tooltip when hovering source
      source.addEventListener('mouseenter', () => {
        console.log('🖱️  mouseenter on source:', source);
        console.log('   tooltip found:', !!tooltip);
        
        // Annuler tout masquage en cours
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        
        // Update content before showing
        updateTooltipContent(tooltip, source);
        
        isActive = true;
        currentSource = source;
        
        // Show tooltip (l'opacité va remonter si elle était en train de baisser)
        showTooltip();
        console.log('   ✅ Tooltip shown');
        
        // Immediately position tooltip if we have a last known mouse position
        if (lastMouseX !== null && lastMouseY !== null) {
          updateTooltip(lastMouseX, lastMouseY);
        }
      });

      // Deactivate tooltip when leaving source
      source.addEventListener('mouseleave', () => {
        isActive = false;
        currentSource = null;
        
        // Hide tooltip (commence la transition d'opacité)
        hideTooltip();
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
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
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

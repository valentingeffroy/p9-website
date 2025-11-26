/**
 * GLOBAL SITE MODULE
 * Contains site-wide functionality that runs on all pages:
 * - Menu animation (GSAP)
 * - Navbar shadow on scroll
 */

const GlobalSite = (() => {
  console.log('📦 GlobalSite module loading...');

  // ========================================================================
  // MENU ANIMATION MODULE
  // ========================================================================

  function initMenuAnimation() {
    console.log('   🎬 Initializing menu animation...');

    // Guards: require GSAP & jQuery
    if (typeof gsap === 'undefined' || typeof $ === 'undefined') {
      console.warn('   ⚠️  GSAP or jQuery not available, skipping menu animation');
      return;
    }

    // Selectors
    const TOGGLE_BTN = '.nav_cta-block';
    const PANEL = '.navbar_menu-wrapper-side';
    const LINKS = '.navbar_link';
    const LOGO = '.navbar_branding-logo';

    // Breakpoint helper (Webflow tablet and below)
    const mq = window.matchMedia('(max-width: 991px)');
    const isTablet = () => mq.matches;

    // Build a paused timeline for link reveal (top -> bottom)
    const linkEls = gsap.utils.toArray(LINKS);
    if (linkEls.length === 0) {
      console.warn('   ⚠️  No menu links found');
      return;
    }

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power3.out' }
    });

    // Smooth reveal: slide up + fade, top-to-bottom, total stagger ~1s
    tl.from(linkEls, {
      yPercent: 120,
      autoAlpha: 0,
      duration: 0.225,                 // per-item
      stagger: { amount: 0.5, from: 'start' } // ~1s total across all items
    }, 0);

    // Helpers for panel/branding transitions
    const openPanel = () => {
      if (isTablet()) {
        gsap.to(PANEL, { y: '0%', duration: 0.3, ease: 'power2.out' });
        gsap.to(LOGO, { color: 'white', duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.to(PANEL, { x: '0%', duration: 0.3, ease: 'power2.out' });
      }
    };

    const closePanel = () => {
      if (isTablet()) {
        gsap.to(PANEL, { y: '-100%', duration: 0.3, ease: 'power2.in' });
        gsap.to(LOGO, { color: 'black', duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.to(PANEL, { x: '100%', duration: 0.3, ease: 'power2.in' });
      }
    };

    // Click handler (prevent double-bind)
    $(document).off('click.menuAnimation', TOGGLE_BTN).on('click.menuAnimation', TOGGLE_BTN, function () {
      const $btn = $(this);

      // Debounce rapid clicks while animating
      if (gsap.isTweening(PANEL)) return;

      $btn.toggleClass('clicked');
      const opening = $btn.hasClass('clicked');

      if (opening) {
        // 1) Slide panel in
        openPanel();

        // 2) Play link reveal from start (no global delay)
        tl.progress(0).play();
      } else {
        // 1) Reverse link reveal smoothly
        tl.eventCallback('onReverseComplete', () => {
          // 2) After links hide, slide panel out
          closePanel();

          // 3) Reset callbacks to avoid duplicates
          tl.eventCallback('onReverseComplete', null);
        });

        tl.reverse();
      }
    });

    // Keep behavior in sync when viewport crosses breakpoint
    if (mq.addEventListener) {
      mq.addEventListener('change', () => {
        // If menu is open and breakpoint changed, nudge panel to correct axis
        const isOpen = $(TOGGLE_BTN).hasClass('clicked');
        if (!isOpen) return;

        // Instantly set correct axis position without re-playing the reveal
        gsap.set(PANEL, { x: '0%', y: '0%' });
      });
    }

    console.log('   ✓ Menu animation initialized');
  }

  // ========================================================================
  // NAVBAR SHADOW MODULE
  // ========================================================================

  function initNavbarShadow() {
    console.log('   🌑 Initializing navbar shadow...');

    // Guard: require ScrollTrigger
    if (typeof ScrollTrigger === 'undefined') {
      console.warn('   ⚠️  ScrollTrigger not available, skipping navbar shadow');
      return;
    }

    const nav = document.querySelector('.nav');
    const navbarShadow = document.querySelector('.navbar-shadow');

    if (!nav || !navbarShadow) {
      console.warn('   ⚠️  Nav or navbar-shadow elements not found');
      return;
    }

    let isActive = false;   // true only after .nav top touches viewport top
    let hideTimer = null;

    // Helper to show + schedule hide after 1000ms of no scroll
    const bumpVisibility = () => {
      navbarShadow.style.opacity = '1';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        navbarShadow.style.opacity = '0';
      }, 1000); // linger for 1s after scroll stops
    };

    // Track when .nav reaches the top of viewport
    ScrollTrigger.create({
      trigger: nav,
      start: 'top top',
      onEnter: () => { 
        isActive = true; 
      }, // from below → active
      onLeaveBack: () => { // scrolling back up past start
        isActive = false;
        clearTimeout(hideTimer);
        navbarShadow.style.opacity = '0'; // ensure hidden before activation zone
      }
    });

    // Scroll listener: only runs while active
    window.addEventListener('scroll', () => {
      if (!isActive) return;
      bumpVisibility();
    }, { passive: true });

    console.log('   ✓ Navbar shadow initialized');
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  function init() {
    console.log('🚀 GlobalSite.init() called');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initMenuAnimation();
        initNavbarShadow();
        console.log('✅ GlobalSite initialized');
      });
    } else {
      // DOM already ready
      initMenuAnimation();
      initNavbarShadow();
      console.log('✅ GlobalSite initialized');
    }
  }

  // Auto-initialize when script loads
  init();

  return { init };
})();


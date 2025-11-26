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
    const CLOSE_BTN = '.nav_cta-block-close';
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

    // Create timeline - using fromTo to avoid issues with reverse
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power3.out' }
    });

    // Set initial state
    gsap.set(linkEls, { yPercent: 120, autoAlpha: 0 });

    // Smooth reveal: slide up + fade, top-to-bottom, total stagger ~1s
    tl.to(linkEls, {
      yPercent: 0,
      autoAlpha: 1,
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

    // Function to open menu
    const openMenu = () => {
      const $btn = $(TOGGLE_BTN);
      
      // Reset timeline to start
      tl.progress(0);
      
      // Set initial state for links
      gsap.set(linkEls, { yPercent: 120, autoAlpha: 0 });
      
      // Slide panel in
      openPanel();
      
      // Play link reveal
      tl.play();
      
      $btn.addClass('clicked');
    };

    // Function to close menu
    const closeMenu = () => {
      const $btn = $(TOGGLE_BTN);
      
      // Reverse link reveal smoothly
      tl.eventCallback('onReverseComplete', () => {
        // After links hide, slide panel out
        closePanel();
        $btn.removeClass('clicked');
        
        // Reset callback to avoid duplicates
        tl.eventCallback('onReverseComplete', null);
        
        // Reset timeline progress for next opening
        tl.progress(0);
        gsap.set(linkEls, { yPercent: 120, autoAlpha: 0 });
      });
      
      tl.reverse();
    };

    // Toggle function for toggle button
    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Debounce rapid clicks while animating
      if (gsap.isTweening(PANEL)) return;

      const $btn = $(TOGGLE_BTN);
      const isOpen = $btn.hasClass('clicked');

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    // Click handler on toggle button
    $(document).off('click.menuAnimation', TOGGLE_BTN).on('click.menuAnimation', TOGGLE_BTN, toggleMenu);

    // Click handler on close button
    $(document).off('click.menuAnimation', CLOSE_BTN).on('click.menuAnimation', CLOSE_BTN, (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const $btn = $(TOGGLE_BTN);
      if ($btn.hasClass('clicked')) {
        closeMenu();
      }
    });

    // Close menu when clicking outside
    $(document).off('click.menuOutside').on('click.menuOutside', (e) => {
      const $btn = $(TOGGLE_BTN);
      const isOpen = $btn.hasClass('clicked');
      
      if (!isOpen) return;

      const $target = $(e.target);
      
      // Don't close if clicking on the toggle button, close button, or inside the panel
      if (
        $target.closest(TOGGLE_BTN).length > 0 ||
        $target.closest(CLOSE_BTN).length > 0 ||
        $target.closest(PANEL).length > 0
      ) {
        return;
      }

      closeMenu();
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


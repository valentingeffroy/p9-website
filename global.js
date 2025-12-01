/**
 * GLOBAL SITE MODULE
 * Contains site-wide functionality that runs on all pages:
 * - Menu animation (GSAP)
 * - Navbar shadow on scroll
 */

// Load GSAP if not already loaded
if (typeof gsap === 'undefined') {
  const gsapScript = document.createElement('script');
  gsapScript.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
  document.head.appendChild(gsapScript);
}

const GlobalSite = (() => {
  console.log('📦 GlobalSite module loading...');

  // ========================================================================
  // MENU ANIMATION MODULE
  // ========================================================================

  function initMenuAnimation() {
    console.log('   🎬 Initializing menu animation...');

    // Guards: require GSAP
    if (typeof gsap === 'undefined') {
      console.warn('   ⚠️  GSAP not available, skipping menu animation');
      return;
    }

    // Selectors basés sur les attributs
    const TOGGLE_BTN = '[navbar="icon"]';
    const CLOSE_BTN = '[navbar="menu"] .navbar1_menu-button';
    const PANEL = '[navbar="menu"]';
    const LINKS = '.navbar1_link';

    // Vérifier que les éléments sont trouvés
    const toggleBtn = document.querySelector(TOGGLE_BTN);
    const panel = document.querySelector(PANEL);
    const closeBtn = document.querySelector(CLOSE_BTN);
    
    console.log('   🔍 Debug - Toggle button found:', !!toggleBtn, toggleBtn);
    console.log('   🔍 Debug - Panel found:', !!panel, panel);
    console.log('   🔍 Debug - Close button found:', !!closeBtn, closeBtn);

    // Build a paused timeline for link reveal (top -> bottom)
    const linkEls = gsap.utils.toArray(LINKS);
    console.log('   🔍 Debug - Links found:', linkEls.length, linkEls);
    if (linkEls.length === 0) {
      console.warn('   ⚠️  No menu links found');
      return;
    }

    // Create timeline - using fromTo to avoid issues with reverse
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power3.out' }
    });

    // Set initial state for links
    gsap.set(linkEls, { yPercent: 120, autoAlpha: 0 });

    // Smooth reveal: slide up + fade, top-to-bottom, avec stagger
    tl.to(linkEls, {
      yPercent: 0,
      autoAlpha: 1,
      duration: 0.225,                 // per-item
      stagger: { amount: 0.5, from: 'start' } // ~1s total across all items
    }, 0);

    // Helpers for panel transitions
    const openPanel = () => {
      console.log('   📂 openPanel() called');
      // Translate de 100% à 0% en 300ms
      gsap.to(PANEL, { 
        x: '0%', 
        duration: 0.3, 
        ease: 'power2.out' 
      });
      console.log('   📂 Panel animation started (x: 0%)');
    };

    const closePanel = () => {
      console.log('   📂 closePanel() called');
      // Translate de 0% à 100% en 300ms
      gsap.to(PANEL, { 
        x: '100%', 
        duration: 0.3, 
        ease: 'power2.in' 
      });
      console.log('   📂 Panel animation started (x: 100%)');
    };

    // Function to open menu
    const openMenu = () => {
      console.log('   🟢 openMenu() called');
      const btn = document.querySelector(TOGGLE_BTN);
      console.log('   🟢 Toggle button element:', !!btn, btn);
      
      // Reset timeline to start
      tl.progress(0);
      
      // Set initial state for links
      gsap.set(linkEls, { yPercent: 120, autoAlpha: 0 });
      
      // Slide panel in
      openPanel();
      
      // Play link reveal
      tl.play();
      console.log('   🟢 Timeline played');
      
      if (btn) btn.classList.add('clicked');
      console.log('   🟢 Added "clicked" class to toggle button');
    };

    // Function to close menu
    const closeMenu = () => {
      console.log('   🔴 closeMenu() called');
      const btn = document.querySelector(TOGGLE_BTN);
      
      // Reverse link reveal smoothly
      tl.eventCallback('onReverseComplete', () => {
        console.log('   🔴 Timeline reverse complete');
        // After links hide, slide panel out
        closePanel();
        if (btn) btn.classList.remove('clicked');
        console.log('   🔴 Removed "clicked" class from toggle button');
        
        // Reset callback to avoid duplicates
        tl.eventCallback('onReverseComplete', null);
        
        // Reset timeline progress for next opening
        tl.progress(0);
        gsap.set(linkEls, { yPercent: 120, autoAlpha: 0 });
      });
      
      tl.reverse();
      console.log('   🔴 Timeline reversed');
    };

    // Toggle function for toggle button
    const toggleMenu = (e) => {
      console.log('   🖱️  toggleMenu() called - Click detected!', e);
      e.preventDefault();
      e.stopPropagation();

      // Debounce rapid clicks while animating
      const isTweening = gsap.isTweening(PANEL);
      console.log('   🖱️  Is panel tweening?', isTweening);
      if (isTweening) {
        console.log('   🖱️  Panel is animating, ignoring click');
        return;
      }

      const btn = document.querySelector(TOGGLE_BTN);
      const isOpen = btn && btn.classList.contains('clicked');
      console.log('   🖱️  Menu is open?', isOpen);

      if (isOpen) {
        console.log('   🖱️  Closing menu...');
        closeMenu();
      } else {
        console.log('   🖱️  Opening menu...');
        openMenu();
      }
    };

    // Click handler on toggle button
    console.log('   🔗 Attaching click handler to:', TOGGLE_BTN);
    const toggleBtnEl = document.querySelector(TOGGLE_BTN);
    if (toggleBtnEl) {
      toggleBtnEl.addEventListener('click', toggleMenu);
      console.log('   🔗 Click handler attached');
    }

    // Click handler on close button
    const closeBtnEl = document.querySelector(CLOSE_BTN);
    if (closeBtnEl) {
      closeBtnEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = document.querySelector(TOGGLE_BTN);
        if (btn && btn.classList.contains('clicked')) {
          closeMenu();
        }
      });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const btn = document.querySelector(TOGGLE_BTN);
      const isOpen = btn && btn.classList.contains('clicked');
      
      if (!isOpen) return;

      const target = e.target;
      
      // Don't close if clicking on the toggle button, close button, or inside the panel
      if (
        target.closest(TOGGLE_BTN) ||
        target.closest(CLOSE_BTN) ||
        target.closest(PANEL)
      ) {
        return;
      }

      closeMenu();
    });

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
        // initNavbarShadow(); // Désactivé - animation box-shadow désactivée
        console.log('✅ GlobalSite initialized');
      });
    } else {
      // DOM already ready
      initMenuAnimation();
      // initNavbarShadow(); // Désactivé - animation box-shadow désactivée
      console.log('✅ GlobalSite initialized');
    }
  }

  return { init };
})();


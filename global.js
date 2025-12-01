/**
 * GLOBAL SITE MODULE
 * Contains site-wide functionality that runs on all pages:
 * - Menu link animation on open
 */

const GlobalSite = (() => {
  console.log('📦 GlobalSite module loading...');

  // ========================================================================
  // MENU ANIMATION MODULE
  // ========================================================================

  function initMenuAnimation() {
    console.log('   🎬 Initializing menu animation...');

    const MENU_BUTTON = '.navbar1_menu-button.w-nav-button';
    const LINKS = '.navbar1_link';

    // Get menu button and links
    const menuButton = document.querySelector(MENU_BUTTON);
    const links = document.querySelectorAll(LINKS);

    if (!menuButton) {
      console.warn('   ⚠️  Menu button not found');
      return;
    }

    if (links.length === 0) {
      console.warn('   ⚠️  No menu links found');
      return;
    }

    console.log(`   ✓ Found ${links.length} menu links`);

    // Set initial state for links (hidden)
    links.forEach(link => {
      link.style.opacity = '0';
      link.style.transform = 'translateY(20px)';
      link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });

    // Function to animate links in with stagger
    function animateLinksIn() {
      links.forEach((link, index) => {
        setTimeout(() => {
          link.style.opacity = '1';
          link.style.transform = 'translateY(0)';
        }, index * 50); // 50ms stagger between each link
      });
    }

    // Function to reset links (hide them)
    function resetLinks() {
      links.forEach(link => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(20px)';
      });
    }

    // Observe when w--open class is added to menu button
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasOpenClass = menuButton.classList.contains('w--open');
          
          if (hasOpenClass) {
            // Wait 400ms then animate links in
            setTimeout(() => {
              animateLinksIn();
            }, 400);
          } else {
            // Reset links when menu closes
            resetLinks();
          }
        }
      });
    });

    // Start observing the menu button
    observer.observe(menuButton, {
      attributes: true,
      attributeFilter: ['class']
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
        console.log('✅ GlobalSite initialized');
      });
    } else {
      // DOM already ready
      initMenuAnimation();
      console.log('✅ GlobalSite initialized');
    }
  }

  return { init };
})();


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
    const DELAY_BEFORE_ANIMATION = 300; // Délai avant de commencer l'animation (ms)
    const STAGGER_DELAY = 100; // Délai entre chaque lien (ms)

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
        }, index * STAGGER_DELAY);
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
            // Wait DELAY_BEFORE_ANIMATION then animate links in
            setTimeout(() => {
              animateLinksIn();
            }, DELAY_BEFORE_ANIMATION);
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

    const NAVBAR = '.navbar1_component';

    const navbar = document.querySelector(NAVBAR);

    if (!navbar) {
      console.warn('   ⚠️  Navbar not found (.navbar1_component)');
      return;
    }

    // Use IntersectionObserver to detect when navbar top touches viewport top
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.boundingClientRect.top <= 0) {
            // Navbar top is at or above viewport top - add shadow
            navbar.classList.add('is-shadow');
          } else {
            // Navbar top is below viewport top - remove shadow
            navbar.classList.remove('is-shadow');
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0 // Trigger as soon as any part enters
      }
    );

    // Observe the navbar
    observer.observe(navbar);

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

  return { init };
})();


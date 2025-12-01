/**
 * LIBRARY PAGE
 * Initializes: FilterChips + Tooltips + GlobalSite (navbar menu)
 */

console.log('═════════════════════════════════════════════════════════════');
console.log('📚 LIBRARY PAGE SCRIPT LOADING');
console.log('═════════════════════════════════════════════════════════════');

/**
 * Wait for a module to be available before initializing
 */
function waitForModule(moduleName, callback, maxAttempts = 50, interval = 100) {
  let attempts = 0;
  const checkModule = () => {
    if (typeof window[moduleName] !== 'undefined') {
      callback();
    } else {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkModule, interval);
      } else {
        console.error(`   ❌ ${moduleName} module not loaded after ${maxAttempts * interval}ms`);
      }
    }
  };
  checkModule();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📍 DOMContentLoaded event fired');

  // Wait for GlobalSite to be loaded
  waitForModule('GlobalSite', () => {
    try {
      console.log('1️⃣  Initializing GlobalSite (Navbar Menu)...');
      GlobalSite.init();
    } catch (e) {
      console.error('   ❌ Error in GlobalSite.init():', e);
    }
  });

  try {
    console.log('2️⃣  Initializing Filter Chips...');
    FilterChips.init();
  } catch (e) {
    console.error('   ❌ Error in FilterChips.init():', e);
  }

  try {
    console.log('3️⃣  Initializing Tooltips...');
    Tooltips.init();
  } catch (e) {
    console.error('   ❌ Error in Tooltips.init():', e);
  }

  console.log('═════════════════════════════════════════════════════════════');
  console.log('✨ LIBRARY PAGE INITIALIZATION COMPLETE ✨');
  console.log('═════════════════════════════════════════════════════════════');
});
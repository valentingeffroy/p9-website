/**
 * LIBRARY PAGE
 * Initializes: FilterChips + GlobalSite (navbar menu)
 */

// console.log('═════════════════════════════════════════════════════════════');
// console.log('📚 LIBRARY PAGE SCRIPT LOADING');
// console.log('═════════════════════════════════════════════════════════════');

document.addEventListener('DOMContentLoaded', () => {
  // console.log('📍 DOMContentLoaded event fired');

  try {
    // console.log('1️⃣  Initializing GlobalSite (Navbar Menu)...');
    GlobalSite.init();
  } catch (e) {
    console.error('   ❌ Error in GlobalSite.init():', e);
  }

  try {
    // console.log('2️⃣  Initializing Filter Chips...');
    FilterChips.init();
  } catch (e) {
    console.error('   ❌ Error in FilterChips.init():', e);
  }

  // console.log('═════════════════════════════════════════════════════════════');
  // console.log('✨ LIBRARY PAGE INITIALIZATION COMPLETE ✨');
  // console.log('═════════════════════════════════════════════════════════════');
});
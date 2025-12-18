/**
 * COMPANIES PAGE
 * Initializes: FilterChips, Tooltips, GlobalSite (navbar menu), GridResize
 */

// console.log('═════════════════════════════════════════════════════════════');
// console.log('🏢 COMPANIES PAGE SCRIPT LOADING');
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

  try {
    // console.log('2.5️⃣  Initializing Hide Zero Facet Filters...');
    HideZeroFacetFilters.init();
  } catch (e) {
    console.error('   ❌ Error in HideZeroFacetFilters.init():', e);
  }

  try {
    // console.log('3️⃣  Initializing Tooltips...');
    Tooltips.init();
  } catch (e) {
    console.error('   ❌ Error in Tooltips.init():', e);
  }

  try {
    // console.log('4️⃣  Initializing Grid Resize...');
    GridResize.init();
  } catch (e) {
    console.error('   ❌ Error in GridResize.init():', e);
  }

  try {
    // console.log('5️⃣  Initializing Unicorn Sort...');
    UnicornSort.init();
  } catch (e) {
    console.error('   ❌ Error in UnicornSort.init():', e);
  }

  // console.log('═════════════════════════════════════════════════════════════');
  // console.log('✨ COMPANIES PAGE INITIALIZATION COMPLETE ✨');
  // console.log('═════════════════════════════════════════════════════════════');
});
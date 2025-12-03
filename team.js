/**
 * TEAM PAGE
 * Initializes: GlobalSite (navbar menu) + Utils
 */

console.log('═════════════════════════════════════════════════════════════');
console.log('👥 TEAM PAGE SCRIPT LOADING');
console.log('═════════════════════════════════════════════════════════════');

document.addEventListener('DOMContentLoaded', () => {
  console.log('📍 DOMContentLoaded event fired');

  try {
    console.log('1️⃣  Initializing GlobalSite (Navbar Menu)...');
    GlobalSite.init();
  } catch (e) {
    console.error('   ❌ Error in GlobalSite.init():', e);
  }

  // Utils est un module partagé, pas besoin d'initialisation
  // Il est chargé automatiquement et utilisé par d'autres modules

  console.log('═════════════════════════════════════════════════════════════');
  console.log('✨ TEAM PAGE INITIALIZATION COMPLETE ✨');
  console.log('═════════════════════════════════════════════════════════════');
});


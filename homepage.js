/**
 * HOME PAGE
 * Initializes: Tooltips + VimeoLightbox + GlobalSite (navbar menu)
 */

// Load required modules
//= require utils.js
//= require global.js
//= require tooltips.js
//= require vimeoLightbox.js

console.log('═════════════════════════════════════════════════════════════');
console.log('🏠 HOME PAGE SCRIPT LOADING');
console.log('═════════════════════════════════════════════════════════════');

document.addEventListener('DOMContentLoaded', () => {
  console.log('📍 DOMContentLoaded event fired');

  try {
    console.log('1️⃣  Initializing GlobalSite (Navbar Menu)...');
    GlobalSite.init();
  } catch (e) {
    console.error('   ❌ Error in GlobalSite.init():', e);
  }

  try {
    console.log('2️⃣  Initializing Tooltips...');
    Tooltips.init();
  } catch (e) {
    console.error('   ❌ Error in Tooltips.init():', e);
  }

  try {
    console.log('3️⃣  Initializing Vimeo Lightbox...');
    VimeoLightbox.init();
  } catch (e) {
    console.error('   ❌ Error in VimeoLightbox.init():', e);
  }

  console.log('═════════════════════════════════════════════════════════════');
  console.log('✨ HOME PAGE INITIALIZATION COMPLETE ✨');
  console.log('═════════════════════════════════════════════════════════════');
});
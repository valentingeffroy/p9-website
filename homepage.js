/**
 * HOME PAGE
 * Initializes: Tooltips + VimeoLightbox + GlobalSite (navbar menu)
 */

// Load required modules
//= require utils.js
//= require tooltips.js
//= require vimeoLightbox.js

console.log('═════════════════════════════════════════════════════════════');
console.log('🏠 HOME PAGE SCRIPT LOADING');
console.log('═════════════════════════════════════════════════════════════');

document.addEventListener('DOMContentLoaded', () => {
  console.log('📍 DOMContentLoaded event fired');

  try {
    console.log('1️⃣  Initializing GlobalSite (Navbar Menu)...');
    if (typeof GlobalSite !== 'undefined') {
      GlobalSite.init();
    } else {
      console.error('   ❌ GlobalSite module not loaded!');
      console.error('   📝 Make sure to load global.js BEFORE homepage.js in your HTML:');
      console.error('   <script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/src/global.js"></script>');
      console.error('   <script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/src/homepage.js"></script>');
    }
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
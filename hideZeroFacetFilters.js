/**
 * HIDE ZERO FACET FILTERS MODULE
 * Hides filter options with facet-count = 0 in each filter dropdown
 * Waits for Finsweet list instances to be loaded before executing
 */

const HideZeroFacetFilters = (() => {
  // console.log('📦 HideZeroFacetFilters module loading...');

  /**
   * Hide all filter labels that have a facet-count of 0
   * Finds all dropdowns, then for each dropdown finds elements with facet-count = 0
   * and hides their parent label.checkbox_field.is-tags
   */
  function hideZeroFacetCountElements() {
    // Trouver tous les dropdowns de filtres
    const dropdowns = document.querySelectorAll('.w-dropdown');
    
    if (dropdowns.length === 0) {
      // console.warn('   ⚠️  No dropdowns found');
      return;
    }

    let hiddenCount = 0;

    dropdowns.forEach((dropdown) => {
      // Trouver tous les éléments avec facet-count dans ce dropdown
      const facetCountElements = dropdown.querySelectorAll('[fs-list-element="facet-count"]');
      
      facetCountElements.forEach((facetCountEl) => {
        // Vérifier si le contenu textuel est égal à "0"
        const countText = facetCountEl.textContent.trim();
        
        if (countText === '0') {
          // Trouver le label parent (checkbox_field is-tags)
          const label = facetCountEl.closest('label.checkbox_field.is-tags');
          
          if (label) {
            // Masquer le label avec display: none
            label.style.display = 'none';
            hiddenCount++;
          }
        }
      });
    });

    // console.log(`   ✅ Hidden ${hiddenCount} filter option(s) with facet-count = 0`);
  }

  /**
   * Initialize the module
   * Waits for Finsweet Attributes to be available, then uses the list API
   * to wait for list instances to be loaded and uses the afterRender hook
   * to ensure facet-counts are calculated before hiding zero-count filters
   */
  function init() {
    // console.log('🚀 HideZeroFacetFilters.init() called');

    // Wait for Finsweet Attributes to be available
    if (!window.FinsweetAttributes) {
      // console.warn('   ⚠️  FinsweetAttributes not available yet, waiting...');
      // Try again after a short delay
      setTimeout(init, 100);
      return;
    }

    // Use Finsweet list API to wait for list instances to be loaded
    window.FinsweetAttributes ||= [];
    window.FinsweetAttributes.push([
      'list',
      (listInstances) => {
        if (!listInstances || listInstances.length === 0) {
          // console.warn('   ⚠️  No Finsweet list instances found');
          return;
        }

        // Flag to ensure we only run once
        let hasRun = false;

        // Use the afterRender hook to ensure everything is rendered
        // This ensures facet-counts are calculated and displayed
        listInstances.forEach((listInstance) => {
          if (listInstance.addHook) {
            listInstance.addHook('afterRender', () => {
              // Only run once after the initial render
              if (!hasRun) {
                hasRun = true;
                // Small delay to ensure facet-counts are fully updated in the DOM
                setTimeout(() => {
                  hideZeroFacetCountElements();
                  // console.log('✅ HideZeroFacetFilters initialized');
                }, 100);
              }
            });
          }
        });
      }
    ]);
  }

  return { init };
})();


/**
 * HIDE ZERO FACET FILTERS MODULE
 * Hides filter options with facet-count = 0 in filter dropdowns and direct filter lists
 * Waits for Finsweet list instances to be loaded and filter phase to complete before executing
 */

const HideZeroFacetFilters = (() => {
  // console.log('📦 HideZeroFacetFilters module loading...');

  /**
   * Hide all filter labels that have a facet-count of 0
   * Finds all elements with facet-count in the page, then hides their parent label.checkbox_field
   * Works for both dropdown filters and direct filter lists
   */
  function hideZeroFacetCountElements() {
    // Trouver tous les éléments avec facet-count dans la page
    // Pas seulement dans les dropdowns, mais aussi dans les listes de filtres directes
    const facetCountElements = document.querySelectorAll('[fs-list-element="facet-count"]');
    
    if (facetCountElements.length === 0) {
      // console.warn('   ⚠️  No facet-count elements found');
      return;
    }

    let hiddenCount = 0;

    facetCountElements.forEach((facetCountEl) => {
      // Vérifier si le contenu textuel est égal à "0"
      const countText = facetCountEl.textContent.trim();
      
      if (countText === '0') {
        // Trouver le label parent (checkbox_field, avec ou sans is-tags)
        // Chercher d'abord avec is-tags, puis sans
        let label = facetCountEl.closest('label.checkbox_field.is-tags');
        if (!label) {
          label = facetCountEl.closest('label.checkbox_field');
        }
        
        if (label) {
          // Vérifier que le label n'est pas déjà masqué
          if (label.style.display !== 'none') {
            // Masquer le label avec display: none
            label.style.display = 'none';
            hiddenCount++;
          }
        }
      }
    });

    // console.log(`   ✅ Hidden ${hiddenCount} filter option(s) with facet-count = 0`);
  }

  /**
   * Initialize the module
   * Waits for Finsweet Attributes to be available, then uses the list API
   * to wait for list instances to be loaded and uses the filter + afterRender hooks
   * to ensure facet-counts are calculated before hiding zero-count filters
   * Only runs once on page load, not when filters change
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

        // Flag to ensure we only run once on initial page load
        let hasRun = false;

        // Use both filter and afterRender hooks to ensure facet-counts are calculated
        // The filter hook ensures filtering is complete, afterRender ensures DOM is updated
        listInstances.forEach((listInstance) => {
          if (listInstance.addHook) {
            // Hook into filter phase to wait for initial filtering to complete
            listInstance.addHook('filter', async (items) => {
              // Return items unchanged, we just want to wait for this phase
              return items;
            });

            // Hook into afterRender to hide zero-count filters after facet-counts are updated
            // Only run once after the initial render
            listInstance.addHook('afterRender', () => {
              if (!hasRun) {
                hasRun = true;
                // Use a small delay to ensure facet-counts are fully updated in the DOM
                // after the filter phase completes
                setTimeout(() => {
                  hideZeroFacetCountElements();
                  // console.log('✅ HideZeroFacetFilters initialized');
                }, 150);
              }
            });
          }
        });
      }
    ]);
  }

  return { init };
})();


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
   * to wait for list instances to be loaded and uses the afterRender hook
   * to ensure facet-counts are calculated before hiding zero-count filters
   * Uses a retry mechanism (5000ms initial, then every 1000ms, max 5 attempts)
   * Stops if user interacts with filters or when facet-counts are ready
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
        let attemptCount = 0;
        const maxAttempts = 5;
        let timeoutId = null;

        // Function to check and hide zero-count filters
        const checkAndHide = () => {
          // Si l'utilisateur a déjà interagi avec les filtres, arrêter
          // On vérifie si des checkboxes sont cochées (interaction utilisateur)
          const hasUserInteraction = document.querySelectorAll('input[fs-list-field][type="checkbox"]:checked').length > 0;
          
          if (hasUserInteraction) {
            // console.log('   ⚠️  User has interacted with filters, stopping attempts');
            if (timeoutId) clearTimeout(timeoutId);
            return;
          }

          // Si on a déjà vérifié et masqué les filtres, arrêter
          if (hasRun) {
            if (timeoutId) clearTimeout(timeoutId);
            return;
          }

          // Vérifier si les facet-counts sont présents et ont des valeurs
          const facetCountElements = document.querySelectorAll('[fs-list-element="facet-count"]');
          
          if (facetCountElements.length === 0) {
            // Si aucun facet-count trouvé, réessayer
            attemptCount++;
            if (attemptCount < maxAttempts) {
              timeoutId = setTimeout(checkAndHide, 1000);
            }
            return;
          }

          // Vérifier si au moins un facet-count a une valeur numérique
          let hasValues = false;
          facetCountElements.forEach((el) => {
            const text = el.textContent.trim();
            if (text !== '' && !isNaN(text)) {
              hasValues = true;
            }
          });

          if (!hasValues) {
            // Si les facet-counts n'ont pas encore de valeurs, réessayer
            attemptCount++;
            if (attemptCount < maxAttempts) {
              timeoutId = setTimeout(checkAndHide, 1000);
            }
            return;
          }

          // Les facet-counts sont prêts (présents et avec valeurs), on peut masquer les filtres à 0
          hideZeroFacetCountElements();
          hasRun = true; // Arrêter les tentatives, même si aucun filtre n'a été masqué
          // console.log(`✅ HideZeroFacetFilters initialized after ${attemptCount + 1} attempt(s)`);
        };

        // Use afterRender hook to ensure DOM is updated with facet-counts
        // The afterRender hook is called after the DOM is updated, which is when facet-counts are available
        listInstances.forEach((listInstance) => {
          if (listInstance.addHook) {
            // Hook into afterRender to start checking for facet-counts
            // Only run once after the initial render
            listInstance.addHook('afterRender', () => {
              if (!hasRun) {
                // Attendre 5 secondes initial, puis commencer les tentatives
                timeoutId = setTimeout(checkAndHide, 5000);
              }
            });
          }
        });
      }
    ]);
  }

  return { init };
})();


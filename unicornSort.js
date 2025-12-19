/**
 * UNICORN SORT MODULE
 * Custom sorting for companies list: puts unicorn companies first when checkbox is active
 * Works with Finsweet V2 and pagination
 */

const UnicornSort = (() => {
  // console.log('📦 UnicornSort module loading...');

  /**
   * Check if a ListItem is a unicorn (contains <div sort="unicorn">true</div>)
   * @param {ListItem} item - The list item to check
   * @returns {boolean} True if the item is a unicorn
   */
  function isUnicorn(item) {
    // Access the DOM element of the item
    const element = item.element;
    if (!element) return false;
    
    const unicornDiv = element.querySelector('div[sort="unicorn"]');
    if (!unicornDiv) return false;
    return unicornDiv.textContent.trim() === 'true';
  }

  /**
   * Get company name for sorting (case-insensitive)
   * @param {ListItem} item - The list item
   * @returns {string} Company name in lowercase for comparison
   */
  function getCompanyName(item) {
    if (!item.element) return '';
    
    // Find the element with sort="name" attribute
    const nameElement = item.element.querySelector('div[sort="name"]');
    if (nameElement) {
      return nameElement.textContent.trim().toLowerCase();
    }
    
    // Fallback: empty string if not found
    return '';
  }

  /**
   * Initialize unicorn sort functionality
   */
  function init() {
    // console.log('🚀 UnicornSort.init() called');

    // Wait for Finsweet Attributes to be available
    if (!window.FinsweetAttributes) {
      console.warn('   ⚠️  FinsweetAttributes not available yet, waiting...');
      // Try again after a short delay
      setTimeout(init, 100);
      return;
    }

    // Find the checkbox with sort="unicorn"
    const checkbox = document.querySelector('input[sort="unicorn"]');
    
    if (!checkbox) {
      console.warn('   ⚠️  No checkbox found with sort="unicorn"');
      return;
    }

    // Find the list container to identify the list instance
    const listContainer = document.querySelector('[fs-list-element="list"]');
    
    if (!listContainer) {
      console.warn('   ⚠️  No list container found with fs-list-element="list"');
      return;
    }

    // Access Finsweet list instances
    window.FinsweetAttributes ||= [];
    window.FinsweetAttributes.push([
      'list',
      (listInstances) => {
        if (!listInstances || listInstances.length === 0) {
          console.warn('   ⚠️  No Finsweet list instances found');
          return;
        }

        // Find the list instance that matches our list container
        const listInstance = listInstances.find(instance => 
          instance.listElement === listContainer
        );

        if (!listInstance) {
          console.warn('   ⚠️  No matching list instance found for the list container');
          return;
        }

        // console.log('   ✓ Checkbox and list instance found');

        // Flag to control whether unicorn sort is active
        let isUnicornSortActive = checkbox.checked;

        // Add the sort hook
        listInstance.addHook('sort', (items) => {
          // If sort is not active, return items as-is (original order)
          if (!isUnicornSortActive) {
            return items;
          }

          // Separate unicorns from others
          const unicorns = [];
          const others = [];

          items.forEach(item => {
            if (isUnicorn(item)) {
              unicorns.push(item);
            } else {
              others.push(item);
            }
          });

          // Sort unicorns alphabetically (case-insensitive)
          unicorns.sort((a, b) => {
            const nameA = getCompanyName(a);
            const nameB = getCompanyName(b);
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
          });

          // Sort others alphabetically (case-insensitive)
          others.sort((a, b) => {
            const nameA = getCompanyName(a);
            const nameB = getCompanyName(b);
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
          });

          // console.log(`   🦄 Sorting: ${unicorns.length} unicorn(s) first, ${others.length} other(s)`);

          // Return unicorns first, then others
          return [...unicorns, ...others];
        });

        // Listen for changes on the checkbox
        checkbox.addEventListener('change', (e) => {
          const isChecked = e.target.checked;
          isUnicornSortActive = isChecked;

          if (isChecked) {
            // console.log('   🦄 Unicorn sort activated');
          } else {
            // console.log('   🔄 Unicorn sort deactivated - restoring default order');
          }

          // Trigger a re-sort to apply the change
          listInstance.triggerHook('sort');
        });

        // If checkbox is already checked on page load, the hook will handle it
        if (checkbox.checked) {
          // console.log('   ℹ️  Checkbox already checked on load, unicorn sort will be applied');
        }

        // console.log('✅ UnicornSort initialized');
      }
    ]);
  }

  return { init };
})();

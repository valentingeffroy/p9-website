/**
 * UNICORN SORT MODULE
 * Custom sorting for companies list: puts unicorn companies first when checkbox is active
 */

const UnicornSort = (() => {
  console.log('📦 UnicornSort module loading...');

  /**
   * Check if an element is a unicorn (contains <div sort="unicorn">true</div>)
   * @param {HTMLElement} element - The list item element to check
   * @returns {boolean} True if the element is a unicorn
   */
  function isUnicorn(element) {
    const unicornDiv = element.querySelector('div[sort="unicorn"]');
    if (!unicornDiv) return false;
    return unicornDiv.textContent.trim() === 'true';
  }

  /**
   * Sort list elements: unicorns first, then others
   * @param {HTMLElement} listContainer - The container with fs-list-element="list"
   */
  function sortList(listContainer) {
    // Get all direct children (list items)
    const items = Array.from(listContainer.children);
    
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

    // Reorder: unicorns first, then others
    // appendChild automatically moves elements if they already exist in the DOM
    unicorns.forEach(item => listContainer.appendChild(item));
    others.forEach(item => listContainer.appendChild(item));

    console.log(`   ✅ Sorted list: ${unicorns.length} unicorn(s) first, ${others.length} other(s)`);
  }

  /**
   * Initialize unicorn sort functionality
   */
  function init() {
    console.log('🚀 UnicornSort.init() called');

    // Find the checkbox with sort="unicorn"
    const checkbox = document.querySelector('input[sort="unicorn"]');
    
    if (!checkbox) {
      console.warn('   ⚠️  No checkbox found with sort="unicorn"');
      return;
    }

    // Find the list container
    const listContainer = document.querySelector('[fs-list-element="list"]');
    
    if (!listContainer) {
      console.warn('   ⚠️  No list container found with fs-list-element="list"');
      return;
    }

    console.log('   ✓ Checkbox and list container found');

    // Listen for changes on the checkbox
    checkbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      
      if (isChecked) {
        console.log('   🦄 Unicorn sort activated');
        sortList(listContainer);
      } else {
        console.log('   🔄 Unicorn sort deactivated - Webflow will restore default order');
        // Do nothing - Webflow will automatically restore the default order
      }
    });

    // If checkbox is already checked on page load, apply sort immediately
    if (checkbox.checked) {
      console.log('   ℹ️  Checkbox already checked on load, applying sort');
      sortList(listContainer);
    }

    console.log('✅ UnicornSort initialized');
  }

  return { init };
})();


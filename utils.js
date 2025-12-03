/**
 * UTILS - Shared utility functions
 * Used across all modules
 */

const Utils = (() => {
  console.log('📦 Utils module loading...');

  /**
   * Safely escape special characters in CSS selectors
   * Prevents CSS injection and handles special chars like quotes, backslashes, etc.
   * 
   * @param {string} str - The string to escape
   * @returns {string} CSS-safe escaped string
   */
  const cssEscape = (str) => {
    if (window.CSS?.escape) {
      return CSS.escape(str);
    }
    return String(str).replace(/["\\#.;?&]/g, '\\$&');
  };

  /**
   * Query all input elements by field and value
   * Searches both fs-list-value and value attributes
   * 
   * @param {string} field - The field name (e.g., 'tags', 'country')
   * @param {string} value - The value to search for
   * @returns {Array<HTMLInputElement>} Array of matching inputs
   */
  const queryInputsByFieldAndValue = (field, value) => {
    const selector = [
      `input[fs-list-field="${field}"][fs-list-value="${cssEscape(value)}"]`,
      `input[fs-list-field="${field}"][value="${cssEscape(value)}"]`,
    ].join(',');
    return Array.from(document.querySelectorAll(selector));
  };

  /**
   * Click input or its associated label
   * Clicking the label ensures proper toggle behavior
   * 
   * @param {HTMLInputElement} inp - Input element to click
   */
  const clickInputOrLabel = (inp) => {
    const label = inp.closest('label');
    (label || inp).click();
  };

  console.log('✅ Utils module loaded');

  return {
    cssEscape,
    queryInputsByFieldAndValue,
    clickInputOrLabel,
  };
})();
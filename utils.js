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
   * Extract Vimeo video ID from various formats
   * Handles: "12345", "https://vimeo.com/12345", "https://vimeo.com/video/12345"
   * 
   * @param {string} raw - The raw video ID or URL
   * @returns {string|null} Extracted Vimeo ID or null if invalid
   */
  const extractVimeoId = (raw) => {
    if (!raw) return null;
    if (/^\d+$/.test(raw)) return raw;
    const match = String(raw).match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  /**
   * Format seconds to MM:SS format
   * 
   * @param {number} seconds - Total seconds
   * @returns {string} Formatted time string (e.g., "2:45")
   */
  const formatTime = (s) => {
    const minutes = Math.floor(s / 60);
    const secs = Math.floor(s % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  /**
   * Check if element is visible (not display:none, not visibility:hidden)
   * 
   * @param {HTMLElement} el - Element to check
   * @returns {boolean} True if element is visible
   */
  const isVisible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    return true;
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
    extractVimeoId,
    formatTime,
    isVisible,
    queryInputsByFieldAndValue,
    clickInputOrLabel,
  };
})();
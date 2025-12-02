/**
 * GRID RESIZE MODULE
 * Dynamically adjusts company grid column widths based on content
 * Uses max-content approach: columns grow but never shrink
 */

const GridResize = (() => {
  let styleElement = null;
  let currentMaxWidths = [0, 0, 0, 0];
  let clickHandler = null;
  let observer = null;

  function adjustGrids() {
    const grids = document.querySelectorAll('.company_grid');
    if (grids.length === 0) return;

    const columnWidths = [0, 0, 0, 0];
    const paddingRight = 16;

    grids.forEach(grid => {
      Array.from(grid.children).forEach((cell, index) => {
        if (index < 4) {
          // Créer un élément temporaire avec les styles CSS de la cellule originale
          // (scrollWidth inclut les contraintes CSS comme min-width, donc on évite de l'utiliser)
          const temp = document.createElement('div');
          const computedStyle = window.getComputedStyle(cell);
          
          // Copier les styles pertinents pour la largeur
          temp.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font-family: ${computedStyle.fontFamily};
            font-size: ${computedStyle.fontSize};
            font-weight: ${computedStyle.fontWeight};
            font-style: ${computedStyle.fontStyle};
            letter-spacing: ${computedStyle.letterSpacing};
            text-transform: ${computedStyle.textTransform};
          `;
          
          temp.innerHTML = cell.innerHTML;
          document.body.appendChild(temp);
          let width = temp.offsetWidth;
          document.body.removeChild(temp);
          
          // Ajouter le padding-right de 16px
          width += paddingRight;
          
          if (width > columnWidths[index]) {
            columnWidths[index] = width;
          }
        }
      });
    });

    // Ne grandir que si nécessaire (jamais rétrécir)
    let hasChanged = false;
    columnWidths.forEach((width, i) => {
      if (width > currentMaxWidths[i]) {
        currentMaxWidths[i] = width;
        hasChanged = true;
      }
    });

    if (hasChanged) {
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'company-grid-dynamic';
        document.head.appendChild(styleElement);
      }
      
      // Min = largeur actuelle calculée, Max = peut grandir pour remplir 100% de la largeur
      const template = currentMaxWidths.map(w => 
        `minmax(${w}px, 1fr)`
      ).join(' ');
      
      styleElement.textContent = `.company_grid { grid-template-columns: ${template} !important; }`;
    }
  }

  function init() {
    // Initial adjustment
    adjustGrids();
    
    // Handle "Load More" button clicks
    clickHandler = (e) => {
      if (e.target.closest('.w-pagination-next')) {
        setTimeout(adjustGrids, 400);
      }
    };
    document.addEventListener('click', clickHandler);

    // Watch for dynamic content changes
    const list = document.querySelector('.cms_cl.is-companies');
    if (list) {
      observer = new MutationObserver(() => setTimeout(adjustGrids, 100));
      observer.observe(list, {childList: true});
    }
  }

  return { init };
})();
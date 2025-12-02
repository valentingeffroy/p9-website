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

    grids.forEach(grid => {
      Array.from(grid.children).forEach((cell, index) => {
        if (index < 4) {
          const temp = document.createElement('div');
          temp.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
          temp.innerHTML = cell.innerHTML;
          document.body.appendChild(temp);
          const contentWidth = temp.offsetWidth;
          const width = contentWidth;
          document.body.removeChild(temp);
          
          if (width > columnWidths[index]) {
            const columnNames = ['COMPANY', 'P9 INVESTMENT', 'LOCATION', 'STATUS'];
            console.log(`📏 Colonne ${index} (${columnNames[index]}): ${width}px (contenu: ${contentWidth}px)`);
            console.log(`   Contenu HTML:`, cell.innerHTML.substring(0, 100) + (cell.innerHTML.length > 100 ? '...' : ''));
            console.log(`   Cellule:`, cell);
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
      console.log('📊 Largeurs:', currentMaxWidths);
    }
  }

  function init() {
    // Initial adjustment
    adjustGrids();
    
    // Handle "Load More" button clicks
    clickHandler = (e) => {
      if (e.target.closest('.w-pagination-next')) {
        console.log('🔄 Load More');
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

    console.log('✅ GridResize initialized');
  }

  return { init };
})();
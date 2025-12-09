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

    // Collecter toutes les cellules company_flex-block de tous les grids
    const allCells = [];
    grids.forEach(grid => {
      const cells = Array.from(grid.children).filter(cell => 
        cell.classList.contains('company_flex-block')
      );
      allCells.push(...cells);
    });

    // Si pas de cellules company_flex-block, utiliser tous les enfants de tous les grids
    const cellsToMeasure = allCells.length > 0 ? allCells : 
      Array.from(grids).flatMap(grid => Array.from(grid.children));

    // console.log('📊 Nombre de grids:', grids.length);
    // console.log('📊 Nombre de cellules à mesurer:', cellsToMeasure.length);
    // console.log('📊 Premières cellules:', cellsToMeasure.slice(0, 12).map((c, i) => ({
      index: i,
      column: i % 4,
      content: c.textContent.substring(0, 40).trim(),
      hasClass: c.classList.contains('company_flex-block'),
      html: c.innerHTML.substring(0, 50)
    })));

    // Mesurer toutes les cellules et déterminer la colonne globalement
    cellsToMeasure.forEach((cell, index) => {
      // Déterminer la colonne : dans une grid à 4 colonnes, index % 4 donne la colonne
      const columnIndex = index % 4;
      
      if (columnIndex < 4) {
        // Créer un élément temporaire avec les styles CSS de la cellule originale
        // (scrollWidth inclut les contraintes CSS comme min-width, donc on évite de l'utiliser)
        const temp = document.createElement('div');
        const computedStyle = window.getComputedStyle(cell);
        
        // Copier tous les styles pertinents pour la largeur
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
          box-sizing: ${computedStyle.boxSizing};
          padding-left: ${computedStyle.paddingLeft};
          padding-right: ${computedStyle.paddingRight};
          padding-top: ${computedStyle.paddingTop};
          padding-bottom: ${computedStyle.paddingBottom};
          margin-left: ${computedStyle.marginLeft};
          margin-right: ${computedStyle.marginRight};
          border-left-width: ${computedStyle.borderLeftWidth};
          border-right-width: ${computedStyle.borderRightWidth};
          display: ${computedStyle.display};
        `;
        
        temp.innerHTML = cell.innerHTML;
        document.body.appendChild(temp);
        let width = temp.offsetWidth;
        document.body.removeChild(temp);
        
        // Ajouter le padding-right de 16px pour l'espacement entre colonnes
        width += paddingRight;
        
        if (width > columnWidths[columnIndex]) {
          columnWidths[columnIndex] = width;
          // console.log(`📏 Colonne ${columnIndex} mise à jour: ${width}px (contenu: ${cell.textContent.substring(0, 30)})`);
        }
      }
    });

    // console.log('📊 Largeurs calculées (columnWidths):', columnWidths);
    // console.log('📊 Largeurs actuelles (currentMaxWidths):', currentMaxWidths);

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
      // console.log('📊 CSS appliqué:', styleElement.textContent);
      // console.log('📊 Largeurs finales (currentMaxWidths):', currentMaxWidths);
    }
    
    // Recalculer le fade mobile après ajustement des grids
    handleFadeMobile();
  }

  function handleFadeMobile() {
    const scrollContainer = document.querySelector('.filter_block.is-data');
    const fade = document.querySelector('.companies_fade-mobile');
    
    if (!scrollContainer || !fade) return;
    
    // Vérifier s'il y a overflow horizontal
    const hasOverflow = scrollContainer.scrollWidth > scrollContainer.clientWidth;
    
    if (!hasOverflow) {
      fade.style.display = 'none';
      return;
    }
    
    // Vérifier si on est tout à droite (avec une petite tolérance)
    const isAtRight = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 1;
    
    if (isAtRight) {
      fade.style.display = 'none';
    } else {
      fade.style.display = 'block';
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

    // Gérer le fade mobile
    const scrollContainer = document.querySelector('.filter_block.is-data');
    if (scrollContainer) {
      // Vérification initiale
      handleFadeMobile();
      
      // Écouter le scroll
      scrollContainer.addEventListener('scroll', handleFadeMobile, { passive: true });
      
      // Écouter le resize pour recalculer
      window.addEventListener('resize', handleFadeMobile, { passive: true });
    }
  }

  return { init };
})();
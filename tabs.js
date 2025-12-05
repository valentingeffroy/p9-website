/**
 * TABS MODULE
 * Manages custom tab system with [tabs] attributes
 * Handles tab switching by adding/removing 'is-active' class
 */

const Tabs = (() => {
  function init() {
    document.querySelectorAll('[tabs="tabs"]').forEach(container => {
      const menu = container.querySelector('[tabs="menu"]');
      if (!menu) return;

      const links = menu.querySelectorAll('[tabs="link"]');
      const panes = container.querySelectorAll('[tabs="pane"]');

      links.forEach((link, index) => {
        link.addEventListener('click', () => {
          links.forEach(l => l.classList.remove('is-active'));
          panes.forEach(p => p.classList.remove('is-active'));

          link.classList.add('is-active');
          if (panes[index]) {
            panes[index].classList.add('is-active');
          }
        });
      });
    });
  }

  return { init };
})();

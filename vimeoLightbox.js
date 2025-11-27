/**
 * VIMEO LIGHTBOX MODULE WITH PLYR
 * Simple tab-based system for Vimeo videos
 * Plyr is loaded automatically if not already present
 */

const VimeoLightbox = (() => {
  console.log('📦 VimeoLightbox module loading...');

  // State
  let lightbox = null;
  let thumbnails = [];
  let videoContainers = [];
  let players = []; // Array to store Plyr instances
  let activeIndex = -1;
  let isOpen = false;
  let plyrLoadPromise = null;

  /**
   * Load Plyr CSS and JS dynamically if not already loaded
   * @returns {Promise<void>} Resolves when Plyr is ready
   */
  function loadPlyr() {
    // Return cached promise if already loading/loaded
    if (plyrLoadPromise) {
      return plyrLoadPromise;
    }

    // Check if Plyr is already loaded
    if (typeof Plyr !== 'undefined') {
      console.log('   ✓ Plyr already loaded');
      plyrLoadPromise = Promise.resolve();
      return plyrLoadPromise;
    }

    console.log('   📥 Loading Plyr...');

    // Create promise to load Plyr
    plyrLoadPromise = new Promise((resolve, reject) => {
      // Load CSS first
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdn.plyr.io/3.8.3/plyr.css';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://cdn.plyr.io/3.8.3/plyr.polyfilled.js';
      script.async = true;

      script.addEventListener('load', () => {
        if (typeof Plyr !== 'undefined') {
          console.log('   ✓ Plyr loaded successfully');
          resolve();
        } else {
          reject(new Error('Plyr failed to initialize'));
        }
      });

      script.addEventListener('error', () => {
        reject(new Error('Failed to load Plyr script'));
      });

      document.head.appendChild(script);
    });

    return plyrLoadPromise;
  }

  /**
   * Initialize Plyr for a specific video by index
   * @param {number} index - Index of the video to initialize
   */
  async function initPlyrForVideo(index) {
    if (players[index]) {
      // Already initialized
      return players[index];
    }

    const videoContainer = videoContainers[index];
    if (!videoContainer) return null;

    const iframe = videoContainer.querySelector('iframe');
    if (!iframe) return null;

    // Ensure Plyr is loaded
    try {
      await loadPlyr();
    } catch (error) {
      console.error('Failed to load Plyr:', error);
      return null;
    }

    // Check if Plyr is available
    if (typeof Plyr === 'undefined') {
      console.warn('Plyr is not available');
      return null;
    }

    // Initialize Plyr for this iframe
    const player = new Plyr(iframe, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      settings: [],
      ratio: null, // Responsive
    });

    players[index] = player;
    console.log(`   ✓ Plyr initialized for video ${index}`);
    return player;
  }

  /**
   * Update thumbnail opacity based on active index
   * @param {number} activeIndex - Index of the active thumbnail
   */
  function updateThumbnails(activeIndex) {
    thumbnails.forEach((thumb, index) => {
      const collectionItem = thumb.closest('.video-lightbox_collection-item');
      if (collectionItem) {
        if (index === activeIndex) {
          collectionItem.classList.add('is-active');
          collectionItem.style.opacity = '1';
        } else {
          collectionItem.classList.remove('is-active');
          collectionItem.style.opacity = '0.4';
        }
      }
    });
  }

  /**
   * Switch to a video by index
   * @param {number} index - Index of the video to show
   */
  async function switchVideo(index) {
    // Check if already active
    if (index === activeIndex) {
      return;
    }

    // Validate index
    if (index < 0 || index >= videoContainers.length) {
      console.warn(`Invalid video index: ${index}`);
      return;
    }

    // Hide current video
    if (activeIndex >= 0 && activeIndex < videoContainers.length) {
      const currentContainer = videoContainers[activeIndex];
      if (currentContainer) {
        currentContainer.style.display = 'none';
        
        // Pause current player if exists
        if (players[activeIndex]) {
          players[activeIndex].pause();
        }
      }
    }

    // Show new video
    const newContainer = videoContainers[index];
    if (newContainer) {
      newContainer.style.display = 'block';
      
      // Initialize Plyr if not already done
      const player = await initPlyrForVideo(index);
      
      // Update active index
      activeIndex = index;
      
      // Update thumbnails
      updateThumbnails(activeIndex);
      
      // Auto-play the video
      if (player) {
        setTimeout(() => {
          player.play().catch(err => {
            console.warn('Auto-play prevented:', err);
          });
        }, 100);
      }
    }
  }

  /**
   * Open the lightbox and show first video
   */
  async function openLightbox() {
    if (isOpen) return;

    isOpen = true;
    lightbox.classList.add('is-open');
    
    // Show first video (index 0)
    if (videoContainers.length > 0) {
      await switchVideo(0);
    }
  }

  /**
   * Close the lightbox
   */
  function closeLightbox() {
    if (!isOpen) return;

    isOpen = false;
    lightbox.classList.remove('is-open');

    // Pause active video
    if (activeIndex >= 0 && players[activeIndex]) {
      players[activeIndex].pause();
    }

    // Hide all videos
    videoContainers.forEach(container => {
      container.style.display = 'none';
    });

    activeIndex = -1;
  }

  /**
   * Initialize the lightbox system
   */
  async function init() {
    console.log('🚀 VimeoLightbox.init() called');

    // Find lightbox container
    lightbox = document.querySelector('.video-lightbox');
    if (!lightbox) {
      console.warn('   ⚠️  No lightbox container found (.video-lightbox)');
      return;
    }

    // Get all thumbnails
    thumbnails = Array.from(document.querySelectorAll('[lightbox="thumbnail"]'));
    console.log(`   ✓ Found ${thumbnails.length} thumbnails`);

    // Get all video containers
    videoContainers = Array.from(document.querySelectorAll('.video-ligthbox_right-content .w-dyn-item'));
    console.log(`   ✓ Found ${videoContainers.length} video containers`);

    // Validate that we have matching counts
    if (thumbnails.length !== videoContainers.length) {
      console.warn(`   ⚠️  Mismatch: ${thumbnails.length} thumbnails vs ${videoContainers.length} videos`);
    }

    // Initialize players array
    players = new Array(videoContainers.length).fill(null);

    // Hide all videos by default
    videoContainers.forEach(container => {
      container.style.display = 'none';
    });

    // Set default thumbnail opacity
    thumbnails.forEach((thumb, index) => {
      const collectionItem = thumb.closest('.video-lightbox_collection-item');
      if (collectionItem) {
        collectionItem.style.opacity = '0.4';
        collectionItem.classList.remove('is-active');
      }
    });

    // Add click handlers to thumbnails (on the collection item to include overlay)
    thumbnails.forEach((thumb, index) => {
      const collectionItem = thumb.closest('.video-lightbox_collection-item');
      if (collectionItem) {
        collectionItem.style.cursor = 'pointer';
        collectionItem.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (isOpen) {
            await switchVideo(index);
          }
        });
      }
    });

    // Prevent clicks on video iframes from doing anything
    videoContainers.forEach(container => {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        iframe.addEventListener('click', (e) => {
          // Do nothing - clicks on videos are ignored
          e.stopPropagation();
        });
      }
    });

    // Handle external open button
    const openButtons = document.querySelectorAll('[data-vimeo-lightbox-control="open"]');
    openButtons.forEach(btn => {
      // Only handle buttons outside the lightbox
      if (!lightbox.contains(btn)) {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await openLightbox();
        });
      }
    });

    // Handle close buttons
    const closeButtons = document.querySelectorAll('[data-vimeo-lightbox-control="close"]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
      });
    });

    // Handle Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeLightbox();
      }
    });

    // Check if lightbox should be open by default (if it has is-open class)
    if (lightbox.classList.contains('is-open')) {
      isOpen = true;
      if (videoContainers.length > 0) {
        await switchVideo(0);
      }
    }

    console.log('✅ VimeoLightbox initialized');
  }

  return { init };
})();

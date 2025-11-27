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
  let lastActiveIndex = 0; // Remember last active video for reopening
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
      console.log(`   ✓ Plyr already initialized for video ${index}`);
      return players[index];
    }

    const videoContainer = videoContainers[index];
    if (!videoContainer) {
      console.warn(`   ⚠️  Video container not found for index ${index}`);
      return null;
    }

    // Find the Plyr container (.plyr__video-embed) or iframe
    const plyrContainer = videoContainer.querySelector('.plyr__video-embed');
    const targetElement = plyrContainer || videoContainer.querySelector('iframe');
    
    if (!targetElement) {
      console.warn(`   ⚠️  No iframe or Plyr container found for video ${index}`);
      return null;
    }

    // Ensure Plyr is loaded
    try {
      await loadPlyr();
    } catch (error) {
      console.error('   ❌ Failed to load Plyr:', error);
      return null;
    }

    // Check if Plyr is available
    if (typeof Plyr === 'undefined') {
      console.warn('   ⚠️  Plyr is not available');
      return null;
    }

    console.log(`   📹 Initializing Plyr for video ${index}...`);

    // Initialize Plyr - use the container or iframe
    const player = new Plyr(targetElement, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      settings: [],
      ratio: null, // Responsive
    });

    // Wait for Plyr to be ready
    return new Promise((resolve) => {
      player.on('ready', () => {
        console.log(`   ✓ Plyr ready for video ${index}`);
        players[index] = player;
        resolve(player);
      });

      // Fallback: resolve after a short delay if ready event doesn't fire
      setTimeout(() => {
        if (!players[index]) {
          console.log(`   ✓ Plyr initialized for video ${index} (timeout fallback)`);
          players[index] = player;
          resolve(player);
        }
      }, 500);
    });
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
      lastActiveIndex = index; // Remember this as the last active video
      
      // Update thumbnails
      updateThumbnails(activeIndex);
      
      // Auto-play the video
      if (player && typeof player.play === 'function') {
        console.log(`   ▶️  Attempting to play video ${index}...`);
        
        // Wait a bit for the iframe to be visible and ready
        setTimeout(() => {
          try {
            const playPromise = player.play();
            if (playPromise && typeof playPromise.then === 'function') {
              playPromise
                .then(() => {
                  console.log(`   ✓ Video ${index} playing`);
                })
                .catch(err => {
                  console.warn(`   ⚠️  Auto-play prevented for video ${index}:`, err.message || err);
                });
            } else {
              console.warn(`   ⚠️  player.play() did not return a Promise for video ${index}`);
            }
          } catch (err) {
            console.error(`   ❌ Error playing video ${index}:`, err);
          }
        }, 300);
      } else {
        console.warn(`   ⚠️  Player not available or play() method missing for video ${index}`);
      }
    }
  }

  /**
   * Open the lightbox and show last active video (or first if none)
   */
  async function openLightbox() {
    if (isOpen) return;

    isOpen = true;
    lightbox.classList.add('is-open');
    
    // Show last active video (or first if none was played)
    if (videoContainers.length > 0) {
      const videoToShow = lastActiveIndex >= 0 && lastActiveIndex < videoContainers.length 
        ? lastActiveIndex 
        : 0;
      await switchVideo(videoToShow);
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
   * Preload Vimeo iframes by making them load in background
   * This makes switching between videos smoother
   */
  function preloadVimeoIframes() {
    console.log('   📥 Preloading Vimeo iframes...');
    
    videoContainers.forEach((container, index) => {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        // Force iframe to load by temporarily making it visible
        const originalDisplay = container.style.display;
        container.style.display = 'block';
        container.style.visibility = 'hidden';
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '1px';
        container.style.height = '1px';
        
        // Restore after a short delay (iframe will continue loading)
        setTimeout(() => {
          container.style.display = originalDisplay;
          container.style.visibility = '';
          container.style.position = '';
          container.style.left = '';
          container.style.width = '';
          container.style.height = '';
        }, 100);
        
        console.log(`   ✓ Preloading iframe ${index}`);
      }
    });
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
        // Use last active index if available, otherwise start with first video
        const videoToShow = lastActiveIndex >= 0 && lastActiveIndex < videoContainers.length 
          ? lastActiveIndex 
          : 0;
        await switchVideo(videoToShow);
      }
    }

    // Preload all Vimeo iframes in the background after a short delay
    // This makes switching between videos smoother
    setTimeout(() => {
      preloadVimeoIframes();
    }, 500);

    console.log('✅ VimeoLightbox initialized');
  }

  return { init };
})();

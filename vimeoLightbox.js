/**
 * VIMEO LIGHTBOX MODULE
 * Advanced Vimeo player with lightbox, playlist support, and controls
 * Features: play/pause, mute, timeline, fullscreen, responsive sizing
 */

const VimeoLightbox = (() => {
  console.log('📦 VimeoLightbox module loading...');

  // ========================================================================
  // SDK LOADER
  // ========================================================================

  let vimeoSDKPromise = null;

  /**
   * Load Vimeo SDK dynamically if not already loaded
   * @returns {Promise<void>} Resolves when SDK is ready
   */
  function loadVimeoSDK() {
    // Return cached promise if already loading/loaded
    if (vimeoSDKPromise) {
      return vimeoSDKPromise;
    }

    // Check if SDK is already loaded
    if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
      console.log('   ✓ Vimeo SDK already loaded');
      vimeoSDKPromise = Promise.resolve();
      return vimeoSDKPromise;
    }

    console.log('   📥 Loading Vimeo SDK...');

    // Create new promise to load SDK
    vimeoSDKPromise = new Promise((resolve, reject) => {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src="https://player.vimeo.com/api/player.js"]');
      if (existingScript) {
        // Wait for existing script to load
        existingScript.addEventListener('load', () => {
          if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
            console.log('   ✓ Vimeo SDK loaded (existing script)');
            resolve();
          } else {
            reject(new Error('Vimeo SDK failed to load'));
          }
        });
        existingScript.addEventListener('error', () => {
          reject(new Error('Vimeo SDK script failed to load'));
        });
        return;
      }

      // Create and append script tag
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;

      script.addEventListener('load', () => {
        if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
          console.log('   ✓ Vimeo SDK loaded successfully');
          resolve();
        } else {
          reject(new Error('Vimeo SDK failed to initialize'));
        }
      });

      script.addEventListener('error', () => {
        reject(new Error('Failed to load Vimeo SDK script'));
      });

      document.head.appendChild(script);
    });

    return vimeoSDKPromise;
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Initialize Vimeo lightbox system
   */
  function init() {
    console.log('🚀 VimeoLightbox.init() called');

    const lightbox = document.querySelector('[data-vimeo-lightbox-init]');
    if (!lightbox) {
      console.warn('   ⚠️  No lightbox container found ([data-vimeo-lightbox-init])');
      return;
    }

    console.log('   ✓ Lightbox container found');

    // ========================================================================
    // STATE & CONFIGURATION
    // ========================================================================

    const openButtonsAll = document.querySelectorAll('[data-vimeo-lightbox-control="open"]');
    const closeButtons = document.querySelectorAll('[data-vimeo-lightbox-control="close"]');

    let iframe = lightbox.querySelector('iframe');
    const placeholder = lightbox.querySelector('.vimeo-lightbox__placeholder');
    const calcEl = lightbox.querySelector('.vimeo-lightbox__calc');
    const wrapEl = lightbox.querySelector('.vimeo-lightbox__calc-wrap');
    const playerContainer = lightbox.querySelector('[data-vimeo-lightbox-player]');

    let player = null;
    let currentVideoID = null;
    let videoAspectRatio = null;
    let globalMuted = lightbox.getAttribute('data-vimeo-muted') === 'true';
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const playedOnce = new Set();

    console.log(`   📱 Touch device: ${isTouch ? 'YES' : 'NO'}`);
    console.log(`   🔇 Global muted: ${globalMuted ? 'YES' : 'NO'}`);

    // ========================================================================
    // LAYOUT HELPERS
    // ========================================================================

    function clampWrapSize(ar) {
      const w = calcEl.offsetWidth;
      const h = calcEl.offsetHeight;
      wrapEl.style.maxWidth = Math.min(w, h / ar) + 'px';
    }

    function adjustCoverSizing() {
      if (!videoAspectRatio) return;
      const cH = playerContainer.offsetHeight;
      const cW = playerContainer.offsetWidth;
      const r = cH / cW;
      const wEl = lightbox.querySelector('.vimeo-lightbox__iframe');
      if (r > videoAspectRatio) {
        wEl.style.width = (r / videoAspectRatio * 100) + '%';
        wEl.style.height = '100%';
      } else {
        wEl.style.height = (videoAspectRatio / r * 100) + '%';
        wEl.style.width = '100%';
      }
    }

    function markActive(btn) {
      document.querySelectorAll('.team-videos_ci.video-active').forEach(el => {
        el.classList.remove('video-active');
      });
      const card = btn.closest('.team-videos_ci');
      if (card) card.classList.add('video-active');
    }

    function closeLightbox() {
      console.log('   🔴 Closing lightbox');
      lightbox.setAttribute('data-vimeo-activated', 'false');
      if (player) {
        player.pause();
        lightbox.setAttribute('data-vimeo-playing', 'false');
      }
    }

    // ========================================================================
    // CLOSE HANDLERS
    // ========================================================================

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    closeButtons.forEach((btn) => {
      btn.addEventListener('click', closeLightbox);
    });

    // ========================================================================
    // PLAYER EVENT SETUP
    // ========================================================================

    async function refreshDurationAndTimeline() {
      try {
        const d = await player.getDuration();
        const durEl = lightbox.querySelector('[data-vimeo-duration]');
        if (durEl) durEl.textContent = Utils.formatTime(d);
        lightbox.querySelectorAll('[data-vimeo-control="timeline"],progress').forEach(el => {
          el.max = d;
        });
        const tl = lightbox.querySelector('[data-vimeo-control="timeline"]');
        const pr = lightbox.querySelector('progress');
        if (tl) tl.value = 0;
        if (pr) pr.value = 0;
      } catch (_) {}
    }

    function setupPlayerEvents() {
      console.log('   🎬 Setting up player events');

      player.on('play', () => {
        lightbox.setAttribute('data-vimeo-loaded', 'true');
        lightbox.setAttribute('data-vimeo-playing', 'true');
      });

      player.on('ended', () => {
        lightbox.setAttribute('data-vimeo-playing', 'false');
      });

      player.on('pause', () => {
        lightbox.setAttribute('data-vimeo-playing', 'false');
      });

      refreshDurationAndTimeline();

      // Timeline/progress tracking
      const tl = lightbox.querySelector('[data-vimeo-control="timeline"]');
      const pr = lightbox.querySelector('progress');
      player.on('timeupdate', (data) => {
        if (tl) tl.value = data.seconds;
        if (pr) pr.value = data.seconds;
        const curEl = lightbox.querySelector('[data-vimeo-duration]');
        if (curEl) curEl.textContent = Utils.formatTime(Math.trunc(data.seconds));
      });

      // Timeline input
      if (tl) {
        ['input', 'change'].forEach((evt) => {
          tl.addEventListener(evt, (e) => {
            const v = Number(e.target.value || 0);
            player.setCurrentTime(v);
            if (pr) pr.value = v;
          });
        });
      }

      // Hover controls
      let hoverTimer;
      playerContainer.addEventListener('mousemove', () => {
        lightbox.setAttribute('data-vimeo-hover', 'true');
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          lightbox.setAttribute('data-vimeo-hover', 'false');
        }, 3000);
      });

      // Fullscreen button
      const fsBtn = lightbox.querySelector('[data-vimeo-control="fullscreen"]');
      if (fsBtn) {
        const isFS = () => document.fullscreenElement || document.webkitFullscreenElement;
        if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
          fsBtn.style.display = 'none';
        }

        fsBtn.addEventListener('click', () => {
          if (isFS()) {
            lightbox.setAttribute('data-vimeo-fullscreen', 'false');
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          } else {
            lightbox.setAttribute('data-vimeo-fullscreen', 'true');
            (playerContainer.requestFullscreen || playerContainer.webkitRequestFullscreen).call(playerContainer);
          }
        });

        ['fullscreenchange', 'webkitfullscreenchange'].forEach((evt) => {
          document.addEventListener(evt, () => {
            lightbox.setAttribute('data-vimeo-fullscreen',
              (document.fullscreenElement || document.webkitFullscreenElement) ? 'true' : 'false'
            );
          });
        });
      }
    }

    // ========================================================================
    // SIZING
    // ========================================================================

    async function runSizing() {
      const mode = lightbox.getAttribute('data-vimeo-update-size');
      const w = await player.getVideoWidth();
      const h = await player.getVideoHeight();
      const ar = h / w;
      const bef = lightbox.querySelector('.vimeo-lightbox__before');

      if (mode === 'true') {
        if (bef) bef.style.paddingTop = (ar * 100) + '%';
        clampWrapSize(ar);
      } else if (mode === 'cover') {
        videoAspectRatio = ar;
        if (bef) bef.style.paddingTop = '0%';
        adjustCoverSizing();
      } else {
        clampWrapSize(ar);
      }
    }

    window.addEventListener('resize', () => {
      if (player) runSizing();
    });

    // ========================================================================
    // VIDEO SWITCHING
    // ========================================================================

    async function switchVideo(id, placeholderBtn, forceAutoplay = false) {
      const vid = Utils.extractVimeoId(id);
      if (!vid) {
        console.warn('[Vimeo] Invalid video ID:', id);
        return;
      }

      console.log(`   🎥 Switching to video: ${vid}`);

      if (placeholderBtn && placeholder) {
        ['src', 'srcset', 'sizes', 'alt', 'width'].forEach((attr) => {
          const val = placeholderBtn.getAttribute(attr);
          if (val != null) placeholder.setAttribute(attr, val);
        });
      }

      if (vid === currentVideoID) {
        try {
          await player.setCurrentTime(0);
        } catch (_) {}
        await player.setVolume(globalMuted ? 0 : 1);
        lightbox.setAttribute('data-vimeo-playing', 'true');
        return player.play();
      }

      lightbox.setAttribute('data-vimeo-loaded', 'false');
      lightbox.setAttribute('data-vimeo-playing', 'false');

      try {
        await player.pause();
        await player.loadVideo(vid);
        currentVideoID = vid;

        await refreshDurationAndTimeline();
        await runSizing();
        lightbox.setAttribute('data-vimeo-loaded', 'true');

        if (forceAutoplay || !isTouch || playedOnce.has(currentVideoID)) {
          await player.setVolume(globalMuted ? 0 : 1);
          lightbox.setAttribute('data-vimeo-playing', 'true');
          await player.play();
          playedOnce.add(currentVideoID);
        }
      } catch (err) {
        console.warn('   ⚠️  Error switching video, opening fresh lightbox');
        return openLightbox(vid, placeholderBtn, forceAutoplay);
      }
    }

    // ========================================================================
    // LIGHTBOX OPENING
    // ========================================================================

    async function openLightbox(id, placeholderBtn, forceAutoplay = false) {
      const vid = Utils.extractVimeoId(id);
      if (!vid) {
        console.warn('[Vimeo] Invalid video ID:', id);
        return;
      }

      console.log(`   🎬 Opening lightbox with video: ${vid}`);

      lightbox.setAttribute('data-vimeo-activated', 'loading');
      lightbox.setAttribute('data-vimeo-loaded', 'false');

      if (player && vid !== currentVideoID) {
        await player.pause();
        await player.unload();

        const oldIframe = iframe;
        const newIframe = document.createElement('iframe');
        newIframe.className = oldIframe.className;
        newIframe.setAttribute('allow', oldIframe.getAttribute('allow') || 'autoplay; encrypted-media');
        newIframe.setAttribute('frameborder', '0');
        newIframe.setAttribute('allowfullscreen', 'true');
        oldIframe.parentNode.replaceChild(newIframe, oldIframe);

        iframe = newIframe;
        player = null;
        currentVideoID = null;
        lightbox.setAttribute('data-vimeo-playing', 'false');
      }

      if (placeholderBtn && placeholder) {
        ['src', 'srcset', 'sizes', 'alt', 'width'].forEach((attr) => {
          const val = placeholderBtn.getAttribute(attr);
          if (val != null) placeholder.setAttribute(attr, val);
        });
      }

      if (!player) {
        // Ensure Vimeo SDK is loaded before creating player
        try {
          await loadVimeoSDK();
        } catch (error) {
          console.error('   ❌ Failed to load Vimeo SDK:', error);
          lightbox.setAttribute('data-vimeo-activated', 'false');
          return;
        }

        iframe.src = `https://player.vimeo.com/video/${vid}?api=1&background=1&autoplay=0&loop=0&muted=0`;
        
        if (typeof window.Vimeo === 'undefined' || !window.Vimeo.Player) {
          console.error('   ❌ Vimeo SDK not available after loading');
          lightbox.setAttribute('data-vimeo-activated', 'false');
          return;
        }

        player = new window.Vimeo.Player(iframe);
        setupPlayerEvents();
        currentVideoID = vid;
        await runSizing();
      }

      lightbox.setAttribute('data-vimeo-activated', 'true');

      if (forceAutoplay || !isTouch || playedOnce.has(currentVideoID)) {
        player.setVolume(globalMuted ? 0 : 1).then(() => {
          lightbox.setAttribute('data-vimeo-playing', 'true');
          setTimeout(() => player.play(), 50);
          playedOnce.add(currentVideoID);
        });
      }
    }

    // ========================================================================
    // CONTROL BUTTONS
    // ========================================================================

    const playBtn = lightbox.querySelector('[data-vimeo-control="play"]');
    const pauseBtn = lightbox.querySelector('[data-vimeo-control="pause"]');
    const muteBtn = lightbox.querySelector('[data-vimeo-control="mute"]');

    if (playBtn) {
      playBtn.addEventListener('click', () => player.play());
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => player.pause());
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        globalMuted = !globalMuted;
        player.setVolume(globalMuted ? 0 : 1).then(() => {
          lightbox.setAttribute('data-vimeo-muted', globalMuted ? 'true' : 'false');
        });
      });
    }

    // ========================================================================
    // OPEN BUTTONS
    // ========================================================================

    function getFirstListVideo() {
      const firstCard = document.querySelector('.team-videos_cl .team-videos_ci');
      if (!firstCard) return { id: null, imgEl: null, card: null };
      const btn = firstCard.querySelector('[data-vimeo-lightbox-control="open"]');
      const raw = btn ? btn.getAttribute('data-vimeo-lightbox-id') : null;
      const id = Utils.extractVimeoId(raw);
      const imgEl = (btn && btn.querySelector('[data-vimeo-lightbox-placeholder]')) 
        || firstCard.querySelector('.team-videos_image');
      return { id, imgEl, card: firstCard };
    }

    openButtonsAll.forEach((btn) => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const inside = lightbox.contains(btn);
        let vid, img;

        if (!inside) {
          const first = getFirstListVideo();
          vid = first.id;
          img = first.imgEl;
        } else {
          const raw = btn.getAttribute('data-vimeo-lightbox-id');
          vid = Utils.extractVimeoId(raw);
          img = btn.querySelector('[data-vimeo-lightbox-placeholder]');
        }

        if (!vid) {
          console.warn('[Vimeo] Missing/invalid video id for open:', btn);
          return;
        }

        if (inside) {
          markActive(btn);
          switchVideo(vid, img, true);
        } else {
          openLightbox(vid, img, true);
        }
      };

      btn.addEventListener('click', handler);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handler(e);
      });
    });

    // ========================================================================
    // INITIAL STATE
    // ========================================================================

    const firstCard = document.querySelector('.team-videos_ci');
    if (firstCard && !firstCard.classList.contains('video-active')) {
      firstCard.classList.add('video-active');
    }

    // Bootstrap first poster
    (function bootstrapFirstPoster() {
      const { id, imgEl } = getFirstListVideo();
      if (imgEl && placeholder) {
        ['src', 'srcset', 'sizes', 'alt', 'width'].forEach((attr) => {
          const val = imgEl.getAttribute(attr);
          if (val != null) placeholder.setAttribute(attr, val);
        });
      }

      document.querySelectorAll('[data-vimeo-lightbox-control="open"]').forEach((btn) => {
        if (lightbox.contains(btn)) return;
        const img = btn.querySelector('[data-vimeo-lightbox-placeholder]');
        if (!img) return;
        const src = img.getAttribute('src') || '';
        if (!src || /image\.jpg$/i.test(src)) {
          if (imgEl) {
            ['src', 'srcset', 'sizes', 'alt', 'width'].forEach((attr) => {
              const val = imgEl.getAttribute(attr);
              if (val != null) img.setAttribute(attr, val);
            });
          } else {
            img.removeAttribute('src');
          }
        }
      });
    })();

    // Preload Vimeo SDK in background for faster first video load
    loadVimeoSDK().catch(err => {
      console.warn('   ⚠️  Failed to preload Vimeo SDK (will retry on first video):', err);
    });

    console.log('✅ VimeoLightbox initialized');
  }

  return { init };
})();
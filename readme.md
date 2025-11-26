# Webflow Custom Scripts

Custom JavaScript modules for Webflow pages, delivered via jsDelivr CDN.

## 📁 Structure

```
src/
├── utils.js              # Shared utilities (cssEscape, extractVimeoId, etc.)
├── tooltips.js           # Smart tooltip positioning following cursor
├── filterChips.js        # Dynamic filter chip system (tags, countries)
├── vimeoLightbox.js      # Advanced Vimeo player with lightbox
├── home.js               # Home page initialization
├── companies.js          # Companies page initialization
└── library.js            # Library page initialization
```

## 🚀 Installation on Webflow

### Home Page
```html
<script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/src/home.js"></script>
```

### Companies Page
```html
<script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/src/companies.js"></script>
```

### Library Page
```html
<script src="https://cdn.jsdelivr.net/gh/USERNAME/REPO@main/src/library.js"></script>
```

## 📦 Modules

### Utils
Core helper functions used by all modules:
- `cssEscape(str)` - Safely escape CSS selectors
- `extractVimeoId(raw)` - Extract Vimeo ID from URL or string
- `formatTime(seconds)` - Format seconds to MM:SS
- `isVisible(el)` - Check if element is visible
- `queryInputsByFieldAndValue(field, value)` - Query filter inputs
- `clickInputOrLabel(inp)` - Click input or its label

### Tooltips
Smart positioning for tooltip/card elements that follow the cursor.

**Element selector:** `.h_companies-card_block`

**Features:**
- Follows cursor with offset (12px)
- Auto-adjusts position to stay within viewport
- Respects padding from edges (8px)
- Handles window resize and scroll
- CSS `translate` with fallback to `transform`

**Usage:**
```javascript
Tooltips.init();
```

### FilterChips
Dynamic filter chip rendering for tags and countries.

**Element selectors:** 
- Tags source: `[tag-container="tags"]`
- Tags target: `[target="tags"]`
- Countries source: `[tag-container="countries"]`
- Countries target: `[target="countries"]`

**Features:**
- Real-time chip rendering when filters change
- "+N more" aggregation for multiple filters
- Mutation observation for pagination
- Keyboard and pointer event handling

**Usage:**
```javascript
FilterChips.init();
```

### VimeoLightbox
Advanced Vimeo player with lightbox, playlist, and controls.

**Element selectors:**
- Lightbox container: `[data-vimeo-lightbox-init]`
- Player container: `[data-vimeo-lightbox-player]`
- Open buttons: `[data-vimeo-lightbox-control="open"]`
- Close buttons: `[data-vimeo-lightbox-control="close"]`
- Video ID attribute: `data-vimeo-lightbox-id`

**Features:**
- Lightbox modal with Escape key close
- Play/pause/mute controls
- Timeline and progress tracking
- Fullscreen support
- Responsive sizing (contain/cover modes)
- Playlist switching
- Touch device handling (disables autoplay)
- Remembers played videos

**Usage:**
```javascript
VimeoLightbox.init();
```

## 🔄 How Pages Work

Each page file (`home.js`, `companies.js`, `library.js`) is self-contained:

1. **Requires** the modules it needs using `//= require`
2. **Waits** for `DOMContentLoaded` event
3. **Initializes** only the modules needed for that page
4. **Logs** debug info to console

Example (home.js):
```javascript
//= require utils.js
//= require tooltips.js
//= require vimeoLightbox.js

document.addEventListener('DOMContentLoaded', () => {
  Tooltips.init();
  VimeoLightbox.init();
});
```

## 🐛 Debugging

All modules log to console with clear formatting:
- `📦` Module loading
- `🚀` Initialization start
- `✅` Success messages
- `⚠️` Warnings
- `❌` Errors
- `📍` Lifecycle events

Open browser DevTools Console to see detailed logs.

## 🔧 Customization

### Change Tooltip Offset/Padding
Edit in `tooltips.js`:
```javascript
const OFFSET = 12;   // Distance from cursor
const PADDING = 8;   // Margin from window edge
```

### Change Filter Selectors
Edit in `filterChips.js`:
```javascript
const GROUPS = [
  { field: 'tags', sourceSel: '[tag-container="tags"]', targetSel: '[target="tags"]' },
  // ... etc
];
```

### Change Vimeo Settings
Edit in `vimeoLightbox.js`:
```javascript
const lightbox = document.querySelector('[data-vimeo-lightbox-init]');
let globalMuted = lightbox.getAttribute('data-vimeo-muted') === 'true';
```

## 📝 Notes

- **No build required** - Push to GitHub, live on jsDelivr
- **Sprockets requires** - Uses `//= require` syntax (not ES6 imports)
- **CDN caching** - May take a few minutes to reflect changes globally
- **Version pinning** - Can pin to specific commits: `@COMMIT_HASH` instead of `@main`

## 🔗 Resources

- [jsDelivr Documentation](https://www.jsdelivr.com/)
- [Vimeo Player API](https://developer.vimeo.com/player/api)
- [Webflow University](https://university.webflow.com/)
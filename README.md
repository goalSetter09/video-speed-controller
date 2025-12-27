# Video Speed Controller - Chrome Extension

A lightweight Chrome extension that lets online learners precisely control video playback speed with simple keyboard shortcuts and a minimal overlay.

## Features

- **Fine-grained speed control**: Adjust video playback speed in 0.1× increments
- **Keyboard shortcuts**: Control speed without touching the mouse
  - `,` (comma): Decrease speed by 0.1×
  - `.` (period): Increase speed by 0.1×
  - `r`: Toggle between current speed and your preferred speed
- **Visual feedback**: Minimal overlay shows current speed for 1.2 seconds
- **Customizable**: Set your preferred speed through the extension popup
- **Privacy-friendly**: No external network calls, all data stored locally
- **Lightweight**: Minimal CPU and memory footprint

## Installation (Development Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the project root directory (`video-speed-controller/`)

## Usage

### Keyboard Shortcuts

- **`,` (comma) or `<`**: Decrease playback speed by 0.1×
- **`.` (period) or `>`**: Increase playback speed by 0.1×
- **`r`**: Toggle between current speed and your preferred speed (default: 1.8×)
  - Note: `Command+R` (Mac) or `Ctrl+R` (Windows) will still refresh the page as normal

### Configuring Preferred Speed

1. Click the extension icon in your browser toolbar
2. Enter your desired preferred speed (0.1× to 5.0×)
3. Click "Save"

The preferred speed will be used when you press the `r` key to toggle.

## Project Structure

```
video-speed-controller/
├── manifest.json              # Extension manifest (Manifest V3)
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── content/               # Content script (runs on web pages)
    │   ├── content.js         # Video control logic
    │   └── content.css        # Overlay styles
    ├── popup/                 # Extension popup UI
    │   ├── popup.html         # Popup markup
    │   ├── popup.js           # Popup logic
    │   └── popup.css          # Popup styles
    └── background/            # Background service worker
        └── background.js      # Extension lifecycle management
```

## Technical Details

- **Manifest Version**: V3
- **Permissions**: `storage`, `scripting`
- **Host Permissions**: `*://*/*` (runs on all websites)
- **Technology Stack**: Pure JavaScript (ES6), HTML5, CSS3
- **Storage**: Chrome Storage API (`local`)

## Development

### Testing

1. Load the extension in developer mode (see Installation section)
2. Navigate to any website with HTML5 video (e.g., YouTube, Udemy, Coursera)
3. Use the keyboard shortcuts to control playback speed
4. Check the browser console for any errors (`Ctrl+Shift+J` or `Cmd+Option+J`)

### Debugging

- **Content Script**: Open the browser console on the web page
- **Popup**: Right-click the extension icon → "Inspect popup"
- **Background Worker**: Go to `chrome://extensions/` → Click "Inspect views: service worker"

## Browser Compatibility

- Chrome (Manifest V3)
- Chromium-based browsers (Edge, Brave, Opera, etc.)

## Future Enhancements

- Site-specific speed presets
- Badge text showing current speed
- Real-time speed updates from popup
- Firefox port
- Cloud sync via Chrome sync storage

## License

This project is for personal use.

## Contributing

This is a personal learning project. Feel free to fork and modify for your own use.

## Support

For issues or questions, please open an issue on the project repository.

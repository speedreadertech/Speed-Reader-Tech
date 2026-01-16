# ⚡ Speed Reader Extension by Claude

A browser extension that lets you speed read any text on the web using RSVP (Rapid Serial Visual Presentation) technique. Built entirely with Claude.

![Speed Reader Extension](https://img.shields.io/badge/version-1.2.0-D97757?style=flat-square)
![Chrome](https://img.shields.io/badge/Chrome-supported-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Brave](https://img.shields.io/badge/Brave-supported-FB542B?style=flat-square&logo=brave&logoColor=white)

## ✨ Features

### 🎯 Core Reading
- **RSVP Speed Reading** - Words displayed one at a time at your chosen pace
- **Focal Point Highlighting** - Red letter on each word for optimal recognition point
- **Adjustable Speed** - 100 to 1200+ WPM with real-time slider control
- **Pause/Resume** - Full control during reading sessions
- **Progress Tracking** - See completion %, time remaining, and words read

### 🚀 Training Mode
- **Acceleration Training** - Gradually increase speed as you read
- **Custom Start/Target WPM** - Set your own training range
- **Peak WPM Tracking** - See your fastest reading speed achieved

### 🐦 Twitter/X Integration
- **Native Tweet Button** - ⚡ button appears on every tweet
- **One-Click Reading** - Speed read any tweet instantly
- **Seamless Design** - Matches Twitter's native UI

### ⚙️ Settings & Customization
- **Persistent Settings** - Your preferences sync across devices
- **Light/Dark Mode** - Matches your system preference or manual toggle
- **Default Speed Presets** - Set your preferred starting WPM
- **Training Mode Defaults** - Configure acceleration settings
- **Toggle Features** - Enable/disable Twitter integration

## 📦 Installation

### Chrome / Brave / Edge

1. **Download the extension**
   
   **[⬇️ Download Speed_Reader_Extension](https://github.com/speedreadertech/Speed-Reader-Tech/archive/refs/heads/main.zip)**
   
   Click the link above to download the ZIP file.

2. **Extract the ZIP file**
   - Unzip the downloaded file
   - You'll get a folder called `Speed-Reader-Tech-main` (this IS the extension)

3. **Open your browser's Extensions page**
   - Chrome: Type `chrome://extensions` in the address bar
   - Brave: Type `brave://extensions` in the address bar
   - Edge: Type `edge://extensions` in the address bar

4. **Enable Developer Mode**
   - Look for the **"Developer mode"** toggle in the top-right corner
   - Turn it **ON**

5. **Load the extension**
   - Click the **"Load unpacked"** button
   - Navigate to the extracted `Speed-Reader-Tech-main` folder
   - Select the **entire folder** and click "Select Folder"
   
   ⚠️ **Important:** Select the whole `Speed-Reader-Tech-main` folder, not individual files!

6. **Pin the extension** (recommended)
   - Click the puzzle piece 🧩 icon in your browser toolbar
   - Find "Speed Reader by Claude"
   - Click the pin 📌 icon to keep it visible

## 🎮 How to Use

### Method 1: Floating Button (Easiest!)
1. Highlight any text on a webpage (3+ words)
2. A **⚡ Speed Read** button slides up in the bottom-left corner
3. Click it to start reading instantly

### Method 2: Keyboard Shortcut
1. Highlight any text on a webpage
2. Press **Alt+S** (Windows/Linux) or **⌥S** (Mac)
3. Speed reader opens with your selection

### Method 3: Right-Click Menu
1. Highlight any text on a webpage
2. Right-click → "Speed Read Selection"
3. Speed reader opens with your selection

### Method 4: Twitter/X
1. Browse Twitter/X as normal
2. Look for the ⚡ button in the tweet action bar
3. Click it to speed read that tweet

### Method 5: Settings
1. Click the extension icon in your toolbar
2. Adjust your default settings
3. Toggle light/dark mode
4. Enable/disable features

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Alt+S` / `⌥S` | Open speed reader with selection |
| `Space` | Start / Pause / Resume |
| `↑` | Increase speed (+50 WPM) |
| `↓` | Decrease speed (-50 WPM) |
| `→` | Skip ahead (10 words) |
| `Esc` | Close reader |

## ⚙️ Settings

Access settings by clicking the extension icon:

| Setting | Description | Default |
|---------|-------------|---------|
| Reading Speed | Default WPM for new sessions | 350 |
| Training Start | Initial WPM in training mode | 200 |
| Training Target | Goal WPM in training mode | 600 |
| Training Mode | Enable acceleration by default | Off |
| Twitter Button | Show ⚡ on tweets | On |
| Theme | Light / Dark mode | Auto |

## 🧠 The Science

**RSVP (Rapid Serial Visual Presentation)** eliminates the time your eyes spend moving across text. By presenting words at a fixed focal point:

- 👁️ No eye movement needed
- 🎯 Consistent focal point with highlighted letter
- ⚡ 2-3x faster reading potential
- 🧘 Improved focus and flow state

**Optimal Recognition Point (ORP)**: Each word has a letter (usually 1/3 from the start) that your brain uses to recognize the word. We highlight this in red for faster processing.

## 🛠️ Technical Details

- **Manifest Version**: V3
- **Shadow DOM**: Complete style isolation from host pages
- **Storage**: Chrome Sync API for cross-device settings
- **No External Dependencies**: Pure vanilla JavaScript
- **CSP Compatible**: Works on strict sites like Twitter

## 🔒 Privacy

This extension:
- ✅ Works entirely locally
- ✅ No data sent to external servers
- ✅ No tracking or analytics
- ✅ No account required
- ✅ Open source

## 🐛 Known Issues

- Some heavily dynamic sites may require a page refresh for the context menu to work
- Very long texts (10,000+ words) may have slight performance impact

## 📝 Changelog

### v1.2.0
- Added settings popup with customizable defaults
- Added light/dark mode toggle
- Added Twitter/X native integration
- Added Training Mode with acceleration
- Improved text filtering for Wikipedia-style references
- Shadow DOM for bulletproof style isolation

### v1.1.0
- Initial release with RSVP reading
- Context menu integration
- Basic speed controls

## 🤝 Contributing

This project was built entirely with Claude (Anthropic). Feel free to:
- Report bugs via GitHub Issues
- Suggest features
- Submit PRs

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🔗 Links

- **Web App**: [speedreader.tech](https://speedreader.tech)
- **Extension Download**: [github.com/speedreadertech/Speed-Reader-Tech](https://github.com/speedreadertech/Speed-Reader-Tech)
- **Built with**: [Claude by Anthropic](https://anthropic.com)

---

<p align="center">
  <strong>⚡ Speed Reader</strong><br>
  <em>Built entirely with Claude</em>
</p>

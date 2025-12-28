# TreeListy Mobile (Capacitor)

Native iOS/Android wrapper for TreeListy using Capacitor.

## Architecture

```
treeplexity.html (web app)
        │
        ▼
   Build Script
   (injects Capacitor bridge)
        │
        ▼
    www/index.html
        │
        ▼
   ┌─────────────┐
   │  Capacitor  │
   │   Native    │
   │    Shell    │
   └─────────────┘
        │
   ┌────┴────┐
   ▼         ▼
  iOS     Android
```

## Prerequisites

- **Node.js** 18+
- **macOS** (required for iOS builds)
- **Xcode** 15+ (from Mac App Store)
- **Apple Developer Account** ($99/year for App Store, free for personal device testing)
- **CocoaPods** (`sudo gem install cocoapods`)

## Quick Start

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Add iOS platform
npx cap add ios

# 4. Build and sync
npm run sync

# 5. Open in Xcode
npm run ios
```

Then in Xcode:
- Select your target device (simulator or real device)
- Press the Play button (▶)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Copy treeplexity.html → www/index.html with Capacitor bridge |
| `npm run sync` | Build + sync native projects |
| `npm run ios` | Build, sync, and open Xcode |
| `npm run ios:run` | Build, sync, and run on connected device/simulator |
| `npm run android` | Build, sync, and open Android Studio |
| `npm run clean` | Remove all generated files |

## Development Workflow

### Making Changes to TreeListy

1. Edit `../treeplexity.html` as usual
2. Run `npm run sync` to update mobile app
3. Run in simulator to test

### Testing on Real Device

1. Connect iPhone via USB
2. In Xcode: Select your device from the dropdown
3. First time: Trust the developer certificate on your iPhone
   - Settings → General → Device Management → Trust
4. Press Play in Xcode

### Debugging

- **Safari Web Inspector**: Develop → [Your Device] → index.html
- **Console logs**: Visible in Xcode console and Safari Web Inspector
- **Capacitor logs**: Prefixed with `[Capacitor]`

## Project Structure

```
mobile/
├── package.json          # Dependencies and scripts
├── capacitor.config.ts   # Capacitor configuration
├── scripts/
│   └── build.js          # Build script (copies + injects bridge)
├── www/                  # Built web assets (gitignored)
│   └── index.html        # treeplexity.html with Capacitor bridge
├── ios/                  # Xcode project (generated)
│   └── App/
│       ├── App/
│       │   ├── Info.plist
│       │   └── AppDelegate.swift
│       └── App.xcworkspace
└── android/              # Android Studio project (optional)
```

## Capacitor Plugins Included

| Plugin | Purpose |
|--------|---------|
| `@capacitor/haptics` | Vibration feedback |
| `@capacitor/keyboard` | Keyboard show/hide events |
| `@capacitor/preferences` | Key-value storage (better than localStorage) |
| `@capacitor/splash-screen` | Launch screen |
| `@capacitor/status-bar` | Status bar styling |
| `@capacitor/filesystem` | File read/write for voice recordings |

## Adding Native Features

### Adding a New Plugin

```bash
# Install plugin
npm install @capacitor/[plugin-name]

# Sync with native projects
npx cap sync

# Open Xcode to rebuild
npx cap open ios
```

### Available Plugins

See: https://capacitorjs.com/docs/plugins

Common ones for TreeListy:
- `@capacitor/camera` - Photo capture
- `@capacitor/share` - Share sheet
- `@capacitor-community/media` - Audio/video recording
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/local-notifications` - Local reminders

## App Store Submission

### Prerequisites
1. Apple Developer account enrolled ($99/year)
2. App Store Connect app created
3. App icons and screenshots prepared

### Build for Release

```bash
# 1. Update version in capacitor.config.ts and ios/App/App/Info.plist

# 2. Build
npm run sync

# 3. In Xcode:
#    - Select "Any iOS Device" as target
#    - Product → Archive
#    - Distribute App → App Store Connect
```

## Troubleshooting

### "No bundle identifier" error
- Open `ios/App/App.xcworkspace` in Xcode
- Select the App target
- Set Bundle Identifier to `com.prairie2cloud.treelisty`

### "Signing" errors
- In Xcode: App target → Signing & Capabilities
- Select your Team
- Enable "Automatically manage signing"

### Changes not appearing
```bash
# Full clean rebuild
npm run clean
npm install
npx cap add ios
npm run sync
npm run ios
```

### Capacitor version mismatch
```bash
# Update all Capacitor packages together
npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/ios@latest
npx cap sync
```

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

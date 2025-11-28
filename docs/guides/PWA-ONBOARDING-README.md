# TreeListy PWA - Share & Onboard New Users

Complete guide to onboarding new TreeListy users with one-click file association setup.

---

## 🎯 The Perfect Onboarding Flow

Your goal: **Send someone a shared tree URL → They click it → TreeListy loads → They install it → Now they can double-click `.treelisty` files!**

### User Journey:

```
1. YOU: Create tree → Click Share → Copy URL → Send to colleague
2. THEM: Click URL → Tree loads instantly in browser
3. THEM: See welcome modal → Click "Install TreeListy"
4. THEM: Done! Now .treelisty files open with a double-click
```

---

## 📋 How to Onboard Someone (Step-by-Step)

### Step 1: Create Your Onboarding Tree

Build a sample tree to showcase TreeListy:

**Recommended Structure:**
- **Phase 1: Welcome** - Brief intro to TreeListy
- **Phase 2: Key Features** - Show what TreeListy can do
- **Phase 3: Example Project** - Real-world use case
- **Phase 4: Next Steps** - How to create their own tree

**Tips:**
- Keep it concise (50-100 nodes max for fast loading)
- Use rich descriptions and notes
- Pre-expand important sections
- Include visual emojis in names

### Step 2: Generate Share URL

1. Click the **📤 Share** button
2. Copy the generated URL
3. Send via email, Slack, Teams, etc.

**Example URL:**
```
https://treelisty.netlify.app?p=N4IgdghgtgpiBcIDCATA...
```

### Step 3: They Click & Experience

When your colleague clicks the URL:

1. **TreeListy loads** with your tree pre-loaded
2. **Welcome modal appears** (only for first-time users)
3. **Two options shown:**
   - ✅ **Install TreeListy** (Chrome/Edge) - Sets up file association
   - ⚠️ **Maybe Later** - Skip installation (can install later)

### Step 4: They Install (Chrome/Edge Only)

If they click **"Install TreeListy"**:

1. Browser shows install prompt
2. They click "Install"
3. TreeListy is now installed as a PWA
4. **`.treelisty` files now open with a double-click!**

---

## 🔧 Technical Details

### What Gets Installed?

- **PWA App**: TreeListy appears in app menu/launcher
- **File Association**: `.treelisty` extension → opens in TreeListy
- **Offline Support**: Works without internet after first load
- **Desktop Icon**: Optional shortcut on desktop

### Browser Support

| Browser | PWA Install | File Handling |
|---------|-------------|---------------|
| Chrome  | ✅ Yes      | ✅ Yes        |
| Edge    | ✅ Yes      | ✅ Yes        |
| Firefox | ⚠️ Partial  | ❌ No         |
| Safari  | ⚠️ iOS only | ❌ No         |

**Note:** File association (`.treelisty` double-click) only works in Chrome and Edge.

### Files Created

When users save projects, files are now named:
```
treelisty-project-2025-11-17_143522.treelisty
```

The `.treelisty` extension enables:
- OS file association (after PWA install)
- Visual distinction from generic `.json` files
- Better file organization

---

## ✨ Features for Onboarded Users

### After Installation:

**1. Double-Click to Open**
- Click any `.treelisty` file → Opens in TreeListy automatically
- No need to use "Load" button anymore

**2. Offline Access**
- TreeListy works without internet
- All features available offline
- Data stays on device (privacy!)

**3. App Integration**
- Appears in Start Menu / Dock / App Drawer
- Can pin to taskbar/desktop
- Runs in its own window (no browser tabs)

**4. Faster Performance**
- Cached for instant loading
- No network latency
- Optimized startup

---

## 🎓 Best Practices for Onboarding

### 1. Create an Effective Welcome Tree

**Do:**
- ✅ Show real value immediately (sample project)
- ✅ Keep it concise (< 100 nodes)
- ✅ Include clear next steps
- ✅ Pre-expand key sections

**Don't:**
- ❌ Overload with 1000+ nodes (slow URL)
- ❌ Use jargon or complex terminology
- ❌ Skip the "why" (explain benefits first)

### 2. Set Context in Your Message

When sending the Share URL, include:

```
Hey! Check out this project breakdown I made in TreeListy:
[URL]

If you like it, click "Install TreeListy" when it loads to open .treelisty files directly!
Works best in Chrome or Edge.
```

### 3. Follow Up

After they install:
- Share additional example trees
- Answer questions about patterns
- Encourage them to create their first tree

---

## 🚀 Advanced: Custom Onboarding

### Detecting First-Time Users

The onboarding modal only shows if:
```javascript
localStorage.getItem('treelisty-onboarding-seen') === null
```

After installation or "Skip", this flag is set to `'true'`.

### Resetting Onboarding (for testing)

Open browser console and run:
```javascript
localStorage.removeItem('treelisty-onboarding-seen');
location.reload();
```

### Manual Installation Trigger

Users can always install later from:
- Browser menu → "Install TreeListy"
- Address bar → Install icon
- Help menu → (future feature)

---

## 🐛 Troubleshooting

### "Install button doesn't appear"

**Cause:** Not using Chrome/Edge, or PWA already installed

**Solutions:**
- Switch to Chrome or Edge browser
- Check if TreeListy is already in app menu
- Refresh page to trigger install prompt

### "File association doesn't work"

**Cause:** File Handling API not supported or not enabled

**Check:**
1. Using Chrome/Edge? (required)
2. PWA installed? (required)
3. File has `.treelisty` extension? (required)

**Workaround:**
- Right-click `.treelisty` file → "Open with" → Select TreeListy

### "Shared URL doesn't load"

**Cause:** URL too long (>2000 chars) or corrupted

**Solutions:**
- Create smaller tree for onboarding
- Use fewer nodes / shorter descriptions
- Test URL before sending

---

## 📊 Metrics & Feedback

### Track Onboarding Success

You won't get analytics from the PWA, but you can:
- Ask: "Did you install TreeListy?"
- Check: "Can you double-click .treelisty files now?"
- Measure: How many questions about "How do I open files?"

### Improve Your Onboarding Tree

Test with colleagues:
- How long did it take to understand TreeListy?
- Was the installation process clear?
- What confused them?
- What made them excited to use it?

---

## 💡 Pro Tips

1. **Create a "TreeListy Starter Kit"**
   - Welcome tree (share URL)
   - 3-5 example trees (.treelisty files)
   - Quick start guide (PDF or markdown)

2. **Make Installation Optional**
   - Don't force PWA install
   - Show value first (shared tree)
   - Let them decide if they want file association

3. **Browser-Specific Instructions**
   - Detect browser in modal
   - Show "Works best in Chrome/Edge" for Firefox/Safari users
   - Provide fallback instructions for non-Chromium browsers

4. **Team Rollout Strategy**
   - Start with early adopters
   - Gather feedback
   - Refine onboarding tree
   - Roll out to entire team

---

## 📂 File Structure

Your PWA setup includes:

```
treeplexity/
├── manifest.json           # PWA configuration & file handlers
├── service-worker.js       # Offline support & caching
├── treeplexity.html       # Main app (includes PWA logic)
└── PWA-ONBOARDING-README.md  # This file
```

---

## 🔗 Quick Links

- **TreeListy App**: https://treelisty.netlify.app
- **PWA Documentation**: https://web.dev/progressive-web-apps/
- **File Handling API**: https://developer.chrome.com/articles/file-handling/

---

## ❓ FAQ

**Q: Can I use TreeListy without installing the PWA?**
A: Yes! TreeListy works perfectly in the browser. PWA install is optional and only adds file association.

**Q: Will my files be uploaded to the cloud?**
A: No. All files stay on your device. The PWA runs entirely locally.

**Q: Can I uninstall the PWA later?**
A: Yes. Chrome/Edge Settings → Apps → TreeListy → Uninstall

**Q: Do I need the PWA to use Share URLs?**
A: No. Share URLs work for everyone, installed or not.

**Q: What if someone doesn't use Chrome/Edge?**
A: They can still use TreeListy in the browser via Share URLs. They just won't get file association.

---

**Questions or Issues?** Open an issue at: https://github.com/anthropics/claude-code/issues

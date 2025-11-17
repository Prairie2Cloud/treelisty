# TreeListy - One-Click Google Drive Refresh

This feature allows you to refresh your Google Drive tree with a single button click!

## 🚀 Quick Start

### One-Time Setup

1. **Install Flask** (if not already installed):
   ```bash
   pip install flask flask-cors
   ```

2. **Start the local server** (keep it running):
   ```bash
   python treelisty_server.py
   ```

   You should see:
   ```
   🌳 TreeListy Local Server Starting...
   ============================================================
   Server running at: http://localhost:5000
   ✅ Ready! You can now use 'Refresh from Google Drive' in TreeListy
   ```

3. **Open TreeListy** in your browser:
   - Open `treeplexity.html`

### Daily Usage

1. **Keep the server running** in a terminal window
2. **Click the "☁️ Refresh Google Drive" button** in TreeListy
3. **Wait 10-30 seconds** while it:
   - Runs the export script
   - Scans your Google Drive
   - Automatically loads the latest data
4. **Done!** Your tree is refreshed

## 📋 What Happens When You Click Refresh

1. **Button shows**: `⏳ Refreshing...`
2. **Server runs**: `python export_google_drive_to_treelisty.py 10`
3. **Script scans**: Your Google Drive (up to 10 levels deep)
4. **Creates file**: `google-drive-YYYYMMDD_HHMMSS.json`
5. **Auto-imports**: Latest data into TreeListy
6. **Success message**: Shows filename, size, and pattern

## 🔧 Troubleshooting

### "Cannot connect to local server!"

**Problem**: Server is not running

**Solution**:
1. Open a terminal
2. Navigate to: `D:\OneDrive\Desktop\Production-Versions\treeplexity`
3. Run: `python treelisty_server.py`
4. Keep the terminal open
5. Try clicking the button again

### "Export script failed"

**Problem**: Google Drive authentication or API issue

**Solution**:
1. Check `credentials.json` exists
2. Delete `token.json` to re-authenticate
3. Ensure Google Drive API is enabled
4. Check terminal for error messages

### Slow refresh (>1 minute)

**Normal**: Large Google Drives (1000+ files) take time
**Tip**: You can reduce max depth in `treelisty_server.py` (line 52)

## 🛠️ Advanced Configuration

### Change Max Scan Depth

Edit `treelisty_server.py`, line 52:
```python
# Change from 10 to your desired depth
result = subprocess.run(
    ['python', 'export_google_drive_to_treelisty.py', '5'],  # 5 levels deep
    ...
)
```

### Change Server Port

Edit `treelisty_server.py`, line 118:
```python
app.run(host='localhost', port=8080, debug=False)  # Use port 8080 instead
```

Also update `treeplexity.html`, line 17914:
```javascript
const response = await fetch('http://localhost:8080/refresh-google-drive', {
```

## 📁 Files

- **`treelisty_server.py`** - Local Flask server
- **`export_google_drive_to_treelisty.py`** - Google Drive export script
- **`treeplexity.html`** - TreeListy app (with refresh button)
- **`credentials.json`** - Google API credentials (keep private!)
- **`token.json`** - Auth token (auto-generated)
- **`google-drive-*.json`** - Exported data files

## 🎯 Tips

1. **Keep server running** - Start it once, leave it running all day
2. **Refresh anytime** - Click the button whenever you update files in Drive
3. **Check terminal** - Server logs show what's happening
4. **Multiple refreshes** - Old JSON files stay in folder (safe to delete old ones)

## 🔒 Security

- Server runs **only on localhost** (not accessible from internet)
- Google credentials stay **on your computer**
- No data sent to external servers
- Safe to use on local network

---

**Need Help?** Check the terminal window running `treelisty_server.py` for detailed logs.

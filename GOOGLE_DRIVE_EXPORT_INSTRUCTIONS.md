# Export Google Drive to TreeListy

This script exports your Google Drive file structure to a TreeListy-compatible JSON file, showing your folder hierarchy, files, and all metadata.

## Quick Setup (5 minutes)

### 1. Install Python Dependencies

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 2. Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
4. Search for "Google Drive API" and click **Enable**

### 3. Create OAuth Credentials

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: "TreeListy Drive Exporter" (or any name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through the rest
4. Back to Create OAuth client ID:
   - Application type: **Desktop app**
   - Name: "TreeListy Exporter"
   - Click **Create**
5. Click **DOWNLOAD JSON** and save as `credentials.json` in this directory

### 4. Run the Script

```bash
python export_google_drive_to_treelisty.py
```

**First time:** A browser window will open asking you to authorize the app.
- Click your Google account
- Click **Advanced** → **Go to TreeListy Drive Exporter (unsafe)**
- Click **Allow**

The script will create a file like `google-drive-treelisty-20251116_143522.json`

### 5. Load in TreeListy

1. Open `treeplexity.html` in your browser
2. Click the **📂 Load** button
3. Select the generated `google-drive-treelisty-*.json` file
4. View your entire Google Drive structure!

## What Gets Exported

For each file/folder, TreeListy will show:

- **Name & Icon** - File/folder name with type-specific emoji
- **Type** - Google Doc, PDF, Folder, Image, etc.
- **Size** - Human-readable file size (e.g., "2.4 MB")
- **Modified Date** - Last modified timestamp
- **Created Date** - When the file was created
- **Owner** - Who owns the file
- **Shared Status** - Whether the file is shared
- **Drive Link** - Direct link to open in Google Drive
- **Hierarchy** - Up to 3 levels deep (configurable)

## Features

✅ **Full Hierarchy** - Folders, subfolders, and files up to 3 levels deep
✅ **All File Types** - Docs, Sheets, Slides, PDFs, images, videos, etc.
✅ **Rich Metadata** - Size, dates, owner, sharing status
✅ **Direct Links** - Click to open files in Google Drive
✅ **Smart Icons** - Different emoji for each file type
✅ **Secure** - Credentials stored locally, readonly access only

## Customization

Edit the script to change:

- **Max depth**: Change `max_depth=3` to go deeper/shallower
- **Items per folder**: Change `[:50]` to show more/fewer files
- **File filters**: Modify the `q="trashed=false"` query

## Troubleshooting

**"credentials.json not found"**
→ Make sure you downloaded the OAuth credentials as `credentials.json` in this folder

**"The file token.json cannot be found"**
→ This is normal on first run. The browser will open for authorization.

**"Access blocked: This app's request is invalid"**
→ Make sure you enabled Google Drive API in Google Cloud Console

**"Too many files"**
→ The script limits to reasonable numbers to avoid overwhelming TreeListy. Edit the `[:50]` and `[:10]` limits in the script.

## Privacy & Security

- **Readonly Access**: The script only reads file metadata, never modifies or accesses file contents
- **Local Storage**: All credentials are stored locally on your computer
- **No Cloud**: Nothing is sent to any server except Google's own API

## Example Output

```json
{
  "id": "root",
  "name": "My Google Drive",
  "description": "Google Drive export with 347 total files",
  "icon": "☁️",
  "children": [
    {
      "id": "p0",
      "name": "Work Projects",
      "icon": "📁",
      "items": [
        {
          "name": "Q4 Budget.xlsx",
          "description": "Type: Google Sheet\\nSize: 1.2 MB\\nModified: 2025-11-14...",
          "icon": "📊",
          "itemType": "Google Sheet",
          "fileSize": "1.2 MB",
          "modifiedDate": "2025-11-14 10:30",
          "shared": "Yes",
          "driveLink": "https://docs.google.com/spreadsheets/d/..."
        }
      ]
    }
  ]
}
```

---

**Need Help?** Check the script comments or modify `export_google_drive_to_treelisty.py` to suit your needs!

# Refresh Dashboard

Run all dashboard export scripts (Gmail, GDrive, Calendar) and report status.

## Instructions

Run these export scripts in sequence from the treeplexity directory:

```bash
cd D:/OneDrive/Desktop/Production-Versions/treeplexity

# Gmail (100 threads, 30 days)
python export_gmail_to_treelisty.py 100 30

# Drive (My Drive root, default depth)
python export_gdrive_content_to_treelisty.py

# Calendar (7 days back, 30 days forward)
python export_gcalendar_to_treelisty.py 7 30
```

After each script completes:
1. Note the output filename
2. Report any errors

At the end, provide a summary:
- List all output files created
- Note any scripts that failed
- Remind user to import via Dashboard modal in TreeListy:
  1. Open TreeListy (https://treelisty.netlify.app)
  2. Click Dashboard button (top right)
  3. Click "Import" on each card
  4. Select the corresponding JSON file

## First-Time Setup

If Calendar API is not enabled:
1. Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
2. Ensure correct project is selected (same as Gmail/Drive)
3. Click "Enable"
4. No new credentials needed - uses existing `credentials.json`

If authentication fails for any script:
- Gmail: Run `python export_gmail_to_treelisty.py --reauth`
- Drive: Delete `token-drive.json` and re-run
- Calendar: Run `python export_gcalendar_to_treelisty.py --reauth`

## Arguments

All scripts accept `--check` to verify auth status without exporting:
```bash
python export_gmail_to_treelisty.py --check
python export_gcalendar_to_treelisty.py --check
```

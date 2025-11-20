Run the Gmail export script to fetch email threads from garnet@prairie2cloud.com.

Steps:
1. Execute the Python script: `python export_gmail_to_treelisty.py`
2. Wait for the script to complete (may take 1-2 minutes for 100 threads)
3. Look for the newly created JSON file (format: `gmail-threads-YYYYMMDD_HHMMSS.json`)
4. Report the filename and statistics to the user
5. Confirm the file is ready to import into TreeListy

The user can then manually import the JSON file using TreeListy's Import button and select the "📧 Email Workflow" pattern.

Once imported, the user can:
- View email threads as a tree structure
- Right-click any thread → "✨ AI Suggest" for rhetoric analysis
- Generate context-aware responses based on full conversation history
- Analyze communication patterns and sentiment

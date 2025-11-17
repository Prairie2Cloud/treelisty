"""
TreeListy Local Server - One-Click Google Drive Refresh

This server enables TreeListy to refresh Google Drive data with one button click.

Setup:
1. Install Flask: pip install flask flask-cors
2. Run this server: python treelisty_server.py
3. Keep it running in the background
4. Click "Refresh from Google Drive" button in TreeListy

The server will:
- Run the Google Drive export script
- Return the latest JSON data
- TreeListy auto-imports it
"""

import os
import sys
import json
import subprocess
import glob
from datetime import datetime
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

app = Flask(__name__)
CORS(app)  # Allow TreeListy to call this server

@app.route('/refresh-google-drive', methods=['POST'])
def refresh_google_drive():
    """
    Triggers Google Drive export and returns the latest JSON
    Accepts optional source metadata for targeted refresh
    """
    try:
        print("🔄 Refresh request received from TreeListy...")

        # Get source metadata from request (if provided)
        request_data = request.get_json() or {}
        source_metadata = request_data.get('source', {})

        # Determine scan depth from metadata or use default
        sync_depth = source_metadata.get('syncDepth', 10)
        folder_id = source_metadata.get('folderId', 'root')
        folder_name = source_metadata.get('folderName', 'My Drive')

        if source_metadata:
            print(f"📋 Using source metadata:")
            print(f"   Folder: {folder_name} (ID: {folder_id})")
            print(f"   Depth: {sync_depth}")
        else:
            print(f"📋 No source metadata - scanning entire Drive (depth: {sync_depth})")

        # Run the export script with specified depth
        print("📥 Running Google Drive export script...")
        result = subprocess.run(
            ['python', 'export_google_drive_to_treelisty.py', str(sync_depth)],
            capture_output=True,
            text=True,
            encoding='utf-8',  # Force UTF-8 encoding for emoji support
            errors='replace',   # Replace undecodable bytes
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            print(f"❌ Export failed: {result.stderr}")
            return jsonify({
                'success': False,
                'error': f"Export script failed: {result.stderr}"
            }), 500

        print(f"✅ Export completed:\n{result.stdout}")

        # Find the newest google-drive-*.json file
        json_files = glob.glob('google-drive-*.json')
        if not json_files:
            return jsonify({
                'success': False,
                'error': 'No Google Drive JSON files found'
            }), 404

        # Sort by modification time, newest first
        latest_file = max(json_files, key=os.path.getmtime)
        print(f"📂 Loading latest file: {latest_file}")

        # Read and return the JSON data
        with open(latest_file, 'r', encoding='utf-8') as f:
            tree_data = json.load(f)

        # Get file stats for info
        file_stats = os.stat(latest_file)
        file_size = file_stats.st_size
        modified_time = datetime.fromtimestamp(file_stats.st_mtime).isoformat()

        print(f"✅ Sending {file_size} bytes to TreeListy")

        return jsonify({
            'success': True,
            'filename': latest_file,
            'fileSize': file_size,
            'modified': modified_time,
            'data': tree_data
        })

    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Export script timed out (>5 minutes)'
        }), 500
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/status', methods=['GET'])
def status():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'TreeListy server is ready'
    })

if __name__ == '__main__':
    print("🌳 TreeListy Local Server Starting...")
    print("=" * 60)
    print("Server running at: http://localhost:5000")
    print("Status: http://localhost:5000/status")
    print("=" * 60)
    print("\n✅ Ready! You can now use 'Refresh from Google Drive' in TreeListy")
    print("Keep this window open while using TreeListy\n")

    # Run server
    app.run(host='localhost', port=5000, debug=False)

"""
TreeListy Google Drive Exporter - Filesystem Pattern
Scans your Google Drive and creates a TreeListy-compatible JSON file using the filesystem pattern.

Setup:
1. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Enable API: https://console.cloud.google.com/apis/library/drive.googleapis.com
3. Create credentials: https://console.cloud.google.com/apis/credentials (Desktop app OAuth 2.0)
4. Download credentials.json to this folder
5. Run: python export_google_drive_to_treelisty.py

First run opens browser for authentication. Token saved for future runs.
"""

import os
import sys
import json
from datetime import datetime

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Google Drive API scope (read-only)
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
TOKEN_FILE = 'token-drive.json'  # Separate from Gmail token

def authenticate():
    """Authenticate with Google Drive API"""
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("❌ ERROR: credentials.json not found!")
                print("\n📋 Setup Instructions:")
                print("1. Go to: https://console.cloud.google.com/apis/library/drive.googleapis.com")
                print("2. Click 'Enable'")
                print("3. Go to: https://console.cloud.google.com/apis/credentials")
                print("4. Click 'Create Credentials' → 'OAuth 2.0 Client ID'")
                print("5. Application type: 'Desktop app'")
                print("6. Download JSON and save as 'credentials.json' in this folder")
                exit(1)

            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    return build('drive', 'v3', credentials=creds)

def get_file_icon(mime_type, name):
    """Get emoji icon based on file type"""
    # Folders
    if mime_type == 'application/vnd.google-apps.folder':
        name_lower = name.lower()
        if 'download' in name_lower:
            return '📥'
        elif 'document' in name_lower or 'docs' in name_lower:
            return '📄'
        elif 'picture' in name_lower or 'photo' in name_lower or 'image' in name_lower:
            return '🖼️'
        elif 'video' in name_lower or 'movie' in name_lower:
            return '🎬'
        elif 'music' in name_lower or 'audio' in name_lower:
            return '🎵'
        return '📁'

    # Google Workspace files
    workspace_icons = {
        'application/vnd.google-apps.document': '📘',
        'application/vnd.google-apps.spreadsheet': '📗',
        'application/vnd.google-apps.presentation': '📙',
        'application/vnd.google-apps.form': '📋',
    }
    if mime_type in workspace_icons:
        return workspace_icons[mime_type]

    # Regular files by extension
    ext = os.path.splitext(name)[1].lower()
    ext_icons = {
        '.pdf': '📕',
        '.doc': '📘', '.docx': '📘',
        '.xls': '📗', '.xlsx': '📗', '.csv': '📊',
        '.ppt': '📙', '.pptx': '📙',
        '.txt': '📝', '.md': '📝',
        '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🎨',
        '.mp4': '🎬', '.avi': '🎬', '.mov': '🎬',
        '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵',
        '.zip': '🗜️', '.rar': '📦', '.7z': '📦',
        '.html': '🌐', '.css': '🎨', '.js': '⚡', '.py': '🐍',
    }
    return ext_icons.get(ext, '📄')

def scan_folder(service, folder_id='root', folder_name='My Drive', depth=0, max_depth=10):
    """
    Recursively scan Google Drive folder

    Returns:
        list: Children nodes in TreeListy filesystem format
    """
    if depth > max_depth:
        print(f"⚠️  Max depth {max_depth} reached at: {folder_name}")
        return []

    indent = '  ' * depth
    print(f"{indent}📂 {folder_name}")

    try:
        # Query all files in this folder
        query = f"'{folder_id}' in parents and trashed=false"
        results = service.files().list(
            q=query,
            pageSize=1000,
            fields="files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, owners)"
        ).execute()

        items = results.get('files', [])
        children = []

        for item in items:
            is_folder = item['mimeType'] == 'application/vnd.google-apps.folder'
            icon = get_file_icon(item['mimeType'], item['name'])

            # Build node
            node = {
                'id': item['id'],
                'name': item['name'],
                'type': 'item',
                'icon': icon,
                'isFolder': is_folder,
                'fileExtension': os.path.splitext(item['name'])[1] if not is_folder else '',
                'fileSize': int(item.get('size', 0)) if 'size' in item else 0,
                'dateModified': item.get('modifiedTime', ''),
                'dateCreated': item.get('createdTime', ''),
                'fileUrl': item.get('webViewLink', ''),
                'fileOwner': item.get('owners', [{}])[0].get('displayName', ''),
                'mimeType': item['mimeType']
            }

            # Recursively scan subfolders
            if is_folder:
                subchildren = scan_folder(service, item['id'], item['name'], depth + 1, max_depth)
                if subchildren:
                    node['children'] = subchildren
                node['expanded'] = False  # Collapsed by default

            children.append(node)

        print(f"{indent}  ✓ {len(children)} items")
        return children

    except Exception as e:
        print(f"{indent}  ❌ Error: {e}")
        return []

def export_google_drive(max_depth=10):
    """Main export function"""
    print("\n🌳 TreeListy Google Drive Exporter")
    print("=" * 60)
    print(f"Max scan depth: {max_depth} levels\n")

    # Authenticate
    print("🔐 Authenticating...")
    service = authenticate()
    print("✅ Authenticated\n")

    # Scan drive
    print("📥 Scanning Google Drive...\n")
    children = scan_folder(service, 'root', 'My Drive', 0, max_depth)

    # Create TreeListy structure (filesystem pattern) with source metadata
    tree = {
        'id': 'root-gdrive',
        'name': '💻 My Computer',
        'type': 'root',
        'icon': '💻',
        'expanded': True,
        'source': {
            'type': 'google-drive',
            'folderId': 'root',
            'folderName': 'My Drive',
            'lastSync': datetime.now().isoformat(),
            'syncDepth': max_depth
        },
        'children': [
            {
                'id': 'gdrive-main',
                'name': '☁️ Google Drive',
                'type': 'phase',
                'icon': '☁️',
                'expanded': True,
                'children': children
            }
        ],
        'pattern': {
            'key': 'filesystem',
            'labels': None
        }
    }

    # Save to file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'google-drive-{timestamp}.json'

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tree, f, indent=2, ensure_ascii=False)

    # Summary
    total_items = count_items(children)
    print("\n" + "=" * 60)
    print(f"✅ SUCCESS! Exported to: {output_file}")
    print(f"\n📊 Statistics:")
    print(f"   Total items: {total_items}")
    print(f"   Top-level items: {len(children)}")
    print(f"\n📋 Next Steps:")
    print(f"   1. Open TreeListy in browser")
    print(f"   2. Click '📂 Import' → Select '{output_file}'")
    print(f"   3. Select pattern: '💾 File System'")
    print(f"   4. Your Google Drive appears as a tree!")
    print("=" * 60)

def count_items(children):
    """Count total items recursively"""
    if not children:
        return 0
    count = len(children)
    for child in children:
        if 'children' in child:
            count += count_items(child['children'])
    return count

if __name__ == '__main__':
    print("🚀 Starting...")

    # Get max depth from command line or use default
    max_depth = 10
    if len(sys.argv) > 1:
        try:
            max_depth = int(sys.argv[1])
            print(f"Using max depth from command line: {max_depth}")
        except ValueError:
            print(f"Invalid depth argument, using default: {max_depth}")
    else:
        # Try to get from stdin if available
        try:
            user_input = input("Max folder depth (default 10, press Enter to use default): ").strip()
            max_depth = int(user_input) if user_input else 10
        except (EOFError, ValueError):
            print(f"Using default max depth: {max_depth}")

    export_google_drive(max_depth)

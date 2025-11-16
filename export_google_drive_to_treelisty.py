"""
Export Google Drive structure to TreeListy JSON format

This script uses the Google Drive API to fetch your Drive file structure
and converts it to a TreeListy-compatible JSON file.

Setup:
1. Install dependencies: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Enable Google Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com
3. Create OAuth credentials: https://console.cloud.google.com/apis/credentials
4. Download credentials.json to this directory
5. Run: python export_google_drive_to_treelisty.py

The first time you run it, you'll be asked to authorize the app in your browser.
"""

import os
import json
from datetime import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']

def get_drive_service():
    """Authenticate and return Google Drive API service"""
    creds = None
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('drive', 'v3', credentials=creds)

def format_size(size_bytes):
    """Convert bytes to human-readable format"""
    if not size_bytes:
        return "Unknown"

    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"

def get_file_icon(mime_type):
    """Return emoji icon based on MIME type"""
    mime_map = {
        'application/vnd.google-apps.folder': '📁',
        'application/vnd.google-apps.document': '📄',
        'application/vnd.google-apps.spreadsheet': '📊',
        'application/vnd.google-apps.presentation': '📽️',
        'application/vnd.google-apps.form': '📝',
        'application/pdf': '📕',
        'image/': '🖼️',
        'video/': '🎬',
        'audio/': '🎵',
        'text/': '📃',
        'application/zip': '📦',
        'application/x-zip': '📦',
    }

    for key, icon in mime_map.items():
        if mime_type.startswith(key):
            return icon
    return '📄'

def get_file_type_label(mime_type):
    """Return user-friendly type label"""
    type_map = {
        'application/vnd.google-apps.folder': 'Folder',
        'application/vnd.google-apps.document': 'Google Doc',
        'application/vnd.google-apps.spreadsheet': 'Google Sheet',
        'application/vnd.google-apps.presentation': 'Google Slides',
        'application/vnd.google-apps.form': 'Google Form',
        'application/pdf': 'PDF',
        'image/jpeg': 'JPEG Image',
        'image/png': 'PNG Image',
        'video/mp4': 'MP4 Video',
        'audio/mpeg': 'MP3 Audio',
        'text/plain': 'Text File',
        'application/zip': 'ZIP Archive',
    }

    return type_map.get(mime_type, mime_type.split('/')[-1].upper())

def fetch_drive_files(service, max_depth=3):
    """Fetch all files from Google Drive with hierarchy"""
    print("📥 Fetching files from Google Drive...")

    # Fetch all files
    all_files = []
    page_token = None

    while True:
        try:
            results = service.files().list(
                pageSize=1000,
                fields="nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, owners, shared, webViewLink, parents, trashed)",
                pageToken=page_token,
                q="trashed=false"  # Exclude trashed files
            ).execute()

            files = results.get('files', [])
            all_files.extend(files)
            page_token = results.get('nextPageToken', None)

            print(f"  Fetched {len(all_files)} files so far...")

            if page_token is None:
                break

        except HttpError as error:
            print(f'❌ An error occurred: {error}')
            return []

    print(f"✅ Total files fetched: {len(all_files)}")
    return all_files

def build_hierarchy(files, max_depth=3):
    """Build hierarchical tree structure from flat file list"""
    print("🌳 Building hierarchy...")

    # Create lookup dictionaries
    file_map = {f['id']: f for f in files}
    children_map = {}

    # Build parent-child relationships
    for file in files:
        parents = file.get('parents', [])
        if parents:
            parent_id = parents[0]  # Google Drive files have at most one parent
            if parent_id not in children_map:
                children_map[parent_id] = []
            children_map[parent_id].append(file['id'])

    # Find root folders (files without parents or with "My Drive" as parent)
    root_files = []
    for file in files:
        parents = file.get('parents', [])
        if not parents:
            root_files.append(file)
        # Note: We can't easily identify "My Drive" root without additional API call

    print(f"  Found {len(root_files)} root-level items")
    return file_map, children_map, root_files

def file_to_treelisty_node(file, file_map, children_map, depth=0, max_depth=3, phase_idx=0, item_idx=0):
    """Convert Google Drive file to TreeListy node format"""

    file_id = file['id']
    is_folder = file['mimeType'] == 'application/vnd.google-apps.folder'

    # Get file metadata
    size = int(file.get('size', 0)) if file.get('size') else 0
    modified = file.get('modifiedTime', '')
    created = file.get('createdTime', '')
    owner = file.get('owners', [{}])[0].get('displayName', 'Unknown')
    shared = file.get('shared', False)
    web_link = file.get('webViewLink', '')

    # Format dates
    try:
        modified_date = datetime.fromisoformat(modified.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
    except:
        modified_date = modified

    try:
        created_date = datetime.fromisoformat(created.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
    except:
        created_date = created

    # Create description with file info
    description = f"Type: {get_file_type_label(file['mimeType'])}\n"
    if size > 0:
        description += f"Size: {format_size(size)}\n"
    description += f"Modified: {modified_date}\nCreated: {created_date}\nOwner: {owner}"
    if shared:
        description += "\nShared: Yes"

    # Build node
    node = {
        'id': f'p{phase_idx}-{item_idx}',
        'name': file['name'],
        'description': description,
        'icon': get_file_icon(file['mimeType']),
        'itemType': get_file_type_label(file['mimeType']),
        'notes': f"Google Drive ID: {file_id}\nLink: {web_link}" if web_link else f"Google Drive ID: {file_id}",
        'fileSize': format_size(size),
        'modifiedDate': modified_date,
        'createdDate': created_date,
        'owner': owner,
        'shared': 'Yes' if shared else 'No',
        'driveLink': web_link
    }

    # If it's a folder and we haven't reached max depth, add children as subtasks
    if is_folder and depth < max_depth:
        child_ids = children_map.get(file_id, [])
        if child_ids:
            subtasks = []
            for idx, child_id in enumerate(child_ids[:20]):  # Limit to 20 children per folder
                if child_id in file_map:
                    child_file = file_map[child_id]
                    child_node = file_to_treelisty_node(
                        child_file, file_map, children_map,
                        depth + 1, max_depth, phase_idx, idx
                    )
                    child_node['id'] = f'p{phase_idx}-{item_idx}-{idx}'
                    child_node['type'] = 'subtask'
                    subtasks.append(child_node)

            if subtasks:
                node['subtasks'] = subtasks

    return node

def convert_to_treelisty(files, max_depth=3):
    """Convert Google Drive files to TreeListy JSON format"""

    file_map, children_map, root_files = build_hierarchy(files, max_depth)

    # Group root files into folders and non-folders
    folders = [f for f in root_files if f['mimeType'] == 'application/vnd.google-apps.folder']
    other_files = [f for f in root_files if f['mimeType'] != 'application/vnd.google-apps.folder']

    # Create phases from top-level folders
    phases = []

    for idx, folder in enumerate(folders[:10]):  # Limit to 10 top-level folders
        # Get items in this folder
        child_ids = children_map.get(folder['id'], [])
        items = []

        for item_idx, child_id in enumerate(child_ids[:50]):  # Limit to 50 items per phase
            if child_id in file_map:
                child_file = file_map[child_id]
                item_node = file_to_treelisty_node(
                    child_file, file_map, children_map,
                    depth=1, max_depth=max_depth, phase_idx=idx, item_idx=item_idx
                )
                items.append(item_node)

        phase = {
            'id': f'p{idx}',
            'name': folder['name'],
            'icon': '📁',
            'phase': idx,
            'subtitle': f"{len(child_ids)} items",
            'items': items
        }
        phases.append(phase)

    # If there are files not in folders, create a phase for them
    if other_files:
        items = []
        phase_idx = len(phases)
        for item_idx, file in enumerate(other_files[:50]):
            item_node = file_to_treelisty_node(
                file, file_map, children_map,
                depth=0, max_depth=max_depth, phase_idx=phase_idx, item_idx=item_idx
            )
            items.append(item_node)

        phases.append({
            'id': f'p{phase_idx}',
            'name': 'Root Files',
            'icon': '📄',
            'phase': phase_idx,
            'subtitle': f"{len(other_files)} items",
            'items': items
        })

    # Create TreeListy root structure
    treelisty_data = {
        'id': 'root',
        'name': 'My Google Drive',
        'description': f'Google Drive export with {len(files)} total files',
        'icon': '☁️',
        'pattern': {
            'key': 'generic',
            'labels': {
                'root': 'Drive',
                'phase': 'Folder',
                'item': 'File',
                'subtask': 'Subfile'
            }
        },
        'children': phases
    }

    return treelisty_data

def main():
    """Main execution"""
    print("🚀 Google Drive to TreeListy Exporter\n")

    try:
        # Get Drive service
        service = get_drive_service()

        # Fetch files
        files = fetch_drive_files(service)

        if not files:
            print("❌ No files found in Google Drive")
            return

        # Convert to TreeListy format
        treelisty_data = convert_to_treelisty(files, max_depth=3)

        # Save to JSON file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f'google-drive-treelisty-{timestamp}.json'

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(treelisty_data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Success! TreeListy JSON saved to: {output_file}")
        print(f"\n📊 Summary:")
        print(f"  Total files: {len(files)}")
        print(f"  Top-level folders: {len(treelisty_data['children'])}")
        print(f"\n💡 To use in TreeListy:")
        print(f"  1. Open TreeListy (treeplexity.html)")
        print(f"  2. Click 'Load' button")
        print(f"  3. Select '{output_file}'")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()

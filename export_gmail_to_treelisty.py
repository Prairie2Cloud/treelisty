"""
TreeListy Gmail Exporter - Email Workflow Pattern (v2.0)
Fetches Gmail threads and creates a TreeListy-compatible JSON file using the gmail pattern.

Setup:
1. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Enable API: https://console.cloud.google.com/apis/library/gmail.googleapis.com
3. Use existing credentials.json (or create new OAuth 2.0 Desktop app credentials)
4. Run: python export_gmail_to_treelisty.py

First run opens browser for authentication. Token saved for future runs.

v2.0 Changes (2025-12-22):
- Fixed emoji encoding (UTF-8 with replacement)
- Increased body length to 5000 chars
- Added attachment metadata extraction
- Added HTML body capture
- Improved error handling
"""

import os
import sys
import json
import base64
import re
from datetime import datetime
from email.utils import parsedate_to_datetime

# Configuration
MAX_BODY_LENGTH = 5000       # Main email body
MAX_PREVIEW_LENGTH = 300     # Preview in tree view
MAX_FULL_BODY_LENGTH = 10000 # Full body storage per message

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Gmail API scopes
# - readonly: Fetch and read emails (required)
# - modify: Archive, trash, star, mark read (Build 550 - bidirectional sync)
# - compose: Create drafts (Build 551)
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose'
]

def check_token_scopes(token_path='token.json'):
    """Check if existing token has required scopes for bidirectional sync"""
    if not os.path.exists(token_path):
        return None, []

    try:
        with open(token_path, 'r') as f:
            token_data = json.load(f)
        token_scopes = token_data.get('scope', '').split()
        return token_data, token_scopes
    except:
        return None, []

def authenticate(force_reauth=False):
    """Authenticate with Gmail API

    Args:
        force_reauth: If True, delete existing token and re-authenticate

    Returns:
        Gmail API service object
    """
    creds = None
    token_path = 'token.json'

    # Check for existing token and its scopes
    token_data, existing_scopes = check_token_scopes(token_path)

    # Check if we need to upgrade scopes (Build 550 - explicit re-auth)
    if token_data and not force_reauth:
        has_modify = any('gmail.modify' in s for s in existing_scopes)
        has_compose = any('gmail.compose' in s for s in existing_scopes)

        if not has_modify or not has_compose:
            print("\n" + "=" * 60)
            print("SCOPE UPGRADE REQUIRED")
            print("=" * 60)
            print("\nYour current token only has read-only access.")
            print("To enable Gmail sync features (archive, trash, star, drafts),")
            print("you need to re-authorize with expanded permissions.\n")
            print("Current scopes:")
            for scope in existing_scopes:
                print(f"  ✓ {scope.split('/')[-1]}")
            print("\nRequired additional scopes:")
            if not has_modify:
                print("  ✗ gmail.modify (archive, trash, star, mark read)")
            if not has_compose:
                print("  ✗ gmail.compose (create drafts)")
            print("\n" + "-" * 60)
            response = input("Re-authorize now? [y/N]: ").strip().lower()
            if response == 'y':
                print("\nDeleting old token and starting re-authorization...")
                os.remove(token_path)
                token_data = None
            else:
                print("\nContinuing with read-only access.")
                print("Run with --reauth flag to upgrade later.\n")

    # Load existing token if available
    if os.path.exists(token_path) and not force_reauth:
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # Refresh or create new credentials
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Token refresh failed: {e}")
                print("Re-authenticating...")
                creds = None

        if not creds:
            if not os.path.exists('credentials.json'):
                print("ERROR: credentials.json not found!")
                print("\nSetup Instructions:")
                print("1. Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com")
                print("2. Click 'Enable'")
                print("3. Go to: https://console.cloud.google.com/apis/credentials")
                print("4. Click 'Create Credentials' -> 'OAuth 2.0 Client ID'")
                print("5. Application type: 'Desktop app'")
                print("6. Download JSON and save as 'credentials.json' in this folder")
                exit(1)

            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Save credentials for future runs
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)

def get_thread_icon(labels):
    """Get emoji icon based on Gmail labels"""
    label_icons = {
        'INBOX': '📥',
        'SENT': '📤',
        'DRAFT': '📝',
        'IMPORTANT': '⭐',
        'STARRED': '⭐',
        'SPAM': '🚫',
        'TRASH': '🗑️',
        'CATEGORY_SOCIAL': '👥',
        'CATEGORY_PROMOTIONS': '🎁',
        'CATEGORY_UPDATES': '🔔',
        'CATEGORY_FORUMS': '💬',
    }

    # Return first matching icon
    for label in labels:
        if label in label_icons:
            return label_icons[label]

    return '📧'

def safe_decode_base64(data):
    """Safely decode base64 with proper UTF-8 handling"""
    try:
        decoded = base64.urlsafe_b64decode(data)
        # Try UTF-8 first, fall back to latin-1
        try:
            return decoded.decode('utf-8')
        except UnicodeDecodeError:
            return decoded.decode('latin-1', errors='replace')
    except Exception as e:
        return f"[Decode error: {e}]"

def decode_body(payload, prefer_html=False):
    """Decode email body from base64, optionally preferring HTML"""
    plain_text = ""
    html_text = ""

    def extract_from_parts(parts):
        nonlocal plain_text, html_text
        for part in parts:
            mime_type = part.get('mimeType', '')

            # Recurse into nested multipart
            if 'parts' in part:
                extract_from_parts(part['parts'])

            # Extract text content
            if 'data' in part.get('body', {}):
                content = safe_decode_base64(part['body']['data'])
                if mime_type == 'text/plain' and not plain_text:
                    plain_text = content
                elif mime_type == 'text/html' and not html_text:
                    html_text = content

    if 'parts' in payload:
        extract_from_parts(payload['parts'])
    elif 'data' in payload.get('body', {}):
        content = safe_decode_base64(payload['body']['data'])
        mime_type = payload.get('mimeType', 'text/plain')
        if mime_type == 'text/html':
            html_text = content
        else:
            plain_text = content

    if prefer_html and html_text:
        return html_text, 'html'
    elif plain_text:
        return plain_text, 'plain'
    elif html_text:
        # Strip HTML tags for plain text fallback
        clean = re.sub(r'<[^>]+>', ' ', html_text)
        clean = re.sub(r'\s+', ' ', clean).strip()
        return clean, 'plain'

    return "", 'plain'

def extract_attachments(payload):
    """Extract attachment metadata from email payload"""
    attachments = []

    def scan_parts(parts):
        for part in parts:
            # Check for nested parts
            if 'parts' in part:
                scan_parts(part['parts'])

            # Check if this part is an attachment
            filename = part.get('filename', '')
            if filename:
                body = part.get('body', {})
                attachments.append({
                    'filename': filename,
                    'mimeType': part.get('mimeType', 'application/octet-stream'),
                    'size': body.get('size', 0),
                    'attachmentId': body.get('attachmentId', '')
                })

    if 'parts' in payload:
        scan_parts(payload['parts'])

    return attachments

def get_header(headers, name):
    """Extract specific header from email headers"""
    for header in headers:
        if header['name'].lower() == name.lower():
            return header['value']
    return ""

def fetch_thread_details(service, thread_id):
    """Fetch full thread with all messages"""
    try:
        thread = service.users().threads().get(
            userId='me',
            id=thread_id,
            format='full'
        ).execute()

        return thread
    except Exception as e:
        print(f"  Error fetching thread {thread_id}: {e}")
        return None

def parse_thread(thread):
    """Convert Gmail thread to TreeListy node structure"""
    if not thread or 'messages' not in thread:
        return None

    messages = thread['messages']
    first_message = messages[0]

    # Extract headers from first message
    headers = first_message['payload']['headers']
    subject = get_header(headers, 'Subject') or '(No Subject)'
    from_email = get_header(headers, 'From')
    to_email = get_header(headers, 'To')
    date_str = get_header(headers, 'Date')

    # Parse date
    date_obj = None
    try:
        if date_str:
            date_obj = parsedate_to_datetime(date_str)
    except:
        pass

    # Get labels and icon
    labels = first_message.get('labelIds', [])
    icon = get_thread_icon(labels)

    # Determine thread type
    thread_type = 'cold-outreach'
    if 'SENT' in labels:
        thread_type = 'response'
    elif 'CATEGORY_SOCIAL' in labels:
        thread_type = 'internal'
    elif 'IMPORTANT' in labels or 'STARRED' in labels:
        thread_type = 'follow-up'

    # Get first message body and attachments
    first_body, body_type = decode_body(first_message['payload'])
    first_html, _ = decode_body(first_message['payload'], prefer_html=True)
    first_attachments = extract_attachments(first_message['payload'])

    # Collect all attachments from all messages
    all_attachments = list(first_attachments)
    for msg in messages[1:]:
        all_attachments.extend(extract_attachments(msg['payload']))

    # Build thread node
    thread_node = {
        'id': thread['id'],
        'name': subject,
        'type': 'item',
        'icon': icon,
        'itemType': thread_type,
        'recipientEmail': to_email,
        'senderEmail': from_email,
        'ccEmail': get_header(headers, 'Cc') or '',
        'subjectLine': subject,
        'emailBody': first_body[:MAX_BODY_LENGTH],
        'htmlBody': first_html[:MAX_BODY_LENGTH] if first_html != first_body else '',
        'sendDate': date_obj.strftime('%Y-%m-%d') if date_obj else '',
        'sendDateTime': date_obj.isoformat() if date_obj else '',
        'status': 'Sent' if 'SENT' in labels else 'Replied' if len(messages) > 1 else 'Draft',
        'threadId': thread['id'],
        'messageCount': len(messages),
        'labels': labels,
        'hasAttachments': len(all_attachments) > 0,
        'attachmentCount': len(all_attachments),
        'attachments': all_attachments,
        'subItems': []
    }

    # Add each message in thread as a subtask
    for idx, message in enumerate(messages):
        msg_headers = message['payload']['headers']
        msg_from = get_header(msg_headers, 'From')
        msg_to = get_header(msg_headers, 'To')
        msg_date = get_header(msg_headers, 'Date')
        msg_body, msg_body_type = decode_body(message['payload'])
        msg_html, _ = decode_body(message['payload'], prefer_html=True)
        msg_attachments = extract_attachments(message['payload'])

        # Parse message date
        msg_date_obj = None
        try:
            if msg_date:
                msg_date_obj = parsedate_to_datetime(msg_date)
        except:
            pass

        # Truncate body for preview
        body_preview = msg_body[:MAX_PREVIEW_LENGTH].replace('\n', ' ').strip() if msg_body else '(No content)'

        message_node = {
            'id': message['id'],
            'name': f"Message {idx + 1}: {msg_from}",
            'description': body_preview,
            'type': 'subtask',
            'sender': msg_from,
            'recipient': msg_to,
            'timestamp': msg_date,
            'dateTime': msg_date_obj.isoformat() if msg_date_obj else '',
            'fullBody': msg_body[:MAX_FULL_BODY_LENGTH],
            'htmlBody': msg_html[:MAX_FULL_BODY_LENGTH] if msg_html != msg_body else '',
            'hasAttachments': len(msg_attachments) > 0,
            'attachments': msg_attachments,
            'labels': message.get('labelIds', [])
        }

        thread_node['subItems'].append(message_node)

    return thread_node

def export_gmail(max_threads=100, days_back=30, force_reauth=False):
    """Main export function

    Args:
        max_threads: Maximum number of threads to fetch
        days_back: Number of days of history to fetch
        force_reauth: Force re-authorization with new scopes
    """
    print("\n" + "=" * 60)
    print("TreeListy Gmail Exporter v2.1")
    print("=" * 60)
    print(f"Max threads: {max_threads}")
    print(f"Time range: Last {days_back} days\n")

    # Authenticate
    print("Authenticating with Gmail...")
    service = authenticate(force_reauth=force_reauth)
    print("Authenticated successfully\n")

    # Fetch thread list
    print(f"Fetching last {max_threads} threads...\n")

    try:
        # Calculate date filter (Gmail query format)
        from datetime import timedelta
        date_filter = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')
        query = f'after:{date_filter}'

        results = service.users().threads().list(
            userId='me',
            maxResults=max_threads,
            q=query
        ).execute()

        thread_list = results.get('threads', [])
        print(f"Found {len(thread_list)} threads\n")

    except Exception as e:
        print(f"Error fetching threads: {e}")
        return

    # Organize threads by label (Inbox, Sent, Important, etc.)
    phases = {
        'inbox': {'name': '📥 Inbox', 'items': []},
        'sent': {'name': '📤 Sent', 'items': []},
        'important': {'name': '⭐ Important', 'items': []},
        'other': {'name': '📧 Other', 'items': []}
    }

    # Track statistics
    total_attachments = 0

    # Process each thread
    for idx, thread_info in enumerate(thread_list, 1):
        print(f"Processing thread {idx}/{len(thread_list)}...", end='\r')

        # Fetch full thread details
        thread = fetch_thread_details(service, thread_info['id'])
        if not thread:
            continue

        # Parse thread
        thread_node = parse_thread(thread)
        if not thread_node:
            continue

        # Track attachments
        total_attachments += thread_node.get('attachmentCount', 0)

        # Categorize by labels
        labels = thread_node.get('labels', [])
        if 'SENT' in labels:
            phases['sent']['items'].append(thread_node)
        elif 'IMPORTANT' in labels or 'STARRED' in labels:
            phases['important']['items'].append(thread_node)
        elif 'INBOX' in labels:
            phases['inbox']['items'].append(thread_node)
        else:
            phases['other']['items'].append(thread_node)

    print(f"\nProcessed {len(thread_list)} threads\n")

    # Build TreeListy structure
    children = []
    for phase_key, phase_data in phases.items():
        if phase_data['items']:  # Only include phases with items
            children.append({
                'id': f'phase-{phase_key}',
                'name': phase_data['name'],
                'type': 'phase',
                'icon': phase_data['name'].split()[0],  # Extract emoji
                'expanded': True,
                'items': phase_data['items']
            })

    tree = {
        'id': 'root-gmail',
        'name': '📧 Gmail - garnet@prairie2cloud.com',
        'type': 'root',
        'icon': '📧',
        'description': f'Gmail threads from last {days_back} days',
        'expanded': True,
        'source': {
            'type': 'gmail',
            'email': 'garnet@prairie2cloud.com',
            'lastSync': datetime.now().isoformat(),
            'threadCount': len(thread_list),
            'daysBack': days_back,
            'exporterVersion': '2.0'
        },
        'children': children,
        'pattern': {
            'key': 'gmail',
            'labels': None
        }
    }

    # Save to file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'gmail-threads-{timestamp}.json'

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tree, f, indent=2, ensure_ascii=False)

    # Summary
    total_messages = sum(item['messageCount'] for phase in children for item in phase['items'])

    print("=" * 60)
    print(f"SUCCESS! Exported to: {output_file}")
    print(f"\nStatistics:")
    print(f"   Total threads: {len(thread_list)}")
    print(f"   Total messages: {total_messages}")
    print(f"   Total attachments: {total_attachments}")
    print(f"   Inbox: {len(phases['inbox']['items'])}")
    print(f"   Sent: {len(phases['sent']['items'])}")
    print(f"   Important: {len(phases['important']['items'])}")
    print(f"   Other: {len(phases['other']['items'])}")
    print(f"\nNext Steps:")
    print(f"   1. Open TreeListy in browser")
    print(f"   2. Click 'Import' -> Select '{output_file}'")
    print(f"   3. Select pattern: 'Email Workflow'")
    print(f"   4. Your Gmail threads appear as a tree!")
    print("=" * 60)

    return output_file

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(
        description='Export Gmail threads to TreeListy JSON format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python export_gmail_to_treelisty.py              # Default: 100 threads, 30 days
  python export_gmail_to_treelisty.py 50 7         # 50 threads, 7 days
  python export_gmail_to_treelisty.py --reauth     # Force re-authorization
  python export_gmail_to_treelisty.py --check      # Check current auth status
"""
    )
    parser.add_argument('max_threads', nargs='?', type=int, default=100,
                        help='Maximum threads to fetch (default: 100)')
    parser.add_argument('days_back', nargs='?', type=int, default=30,
                        help='Days of history to fetch (default: 30)')
    parser.add_argument('--reauth', action='store_true',
                        help='Force re-authorization with new scopes')
    parser.add_argument('--check', action='store_true',
                        help='Check current auth status and scopes')

    args = parser.parse_args()

    # Check auth status only
    if args.check:
        token_data, scopes = check_token_scopes()
        print("\n" + "=" * 60)
        print("Gmail Authentication Status")
        print("=" * 60)
        if token_data:
            print("\n✓ Token exists")
            print("\nScopes granted:")
            for scope in scopes:
                scope_name = scope.split('/')[-1]
                print(f"  • {scope_name}")

            has_modify = any('gmail.modify' in s for s in scopes)
            has_compose = any('gmail.compose' in s for s in scopes)

            print("\nSync capabilities:")
            print(f"  {'✓' if has_modify else '✗'} Archive/Trash/Star/Mark Read (gmail.modify)")
            print(f"  {'✓' if has_compose else '✗'} Create Drafts (gmail.compose)")

            if not has_modify or not has_compose:
                print("\n⚠ Run with --reauth to enable full sync")
        else:
            print("\n✗ Not authenticated")
            print("  Run without --check to authenticate")
        print("=" * 60 + "\n")
        exit(0)

    print("Starting Gmail export...")
    print(f"Max threads: {args.max_threads}")
    print(f"Days back: {args.days_back}")
    if args.reauth:
        print("Force re-auth: Yes")

    export_gmail(args.max_threads, args.days_back, force_reauth=args.reauth)

"""
TreeListy Gmail Exporter - Email Workflow Pattern
Fetches Gmail threads and creates a TreeListy-compatible JSON file using the gmail pattern.

Setup:
1. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Enable API: https://console.cloud.google.com/apis/library/gmail.googleapis.com
3. Use existing credentials.json (or create new OAuth 2.0 Desktop app credentials)
4. Run: python export_gmail_to_treelisty.py

First run opens browser for authentication. Token saved for future runs.
"""

import os
import sys
import json
import base64
from datetime import datetime
from email.utils import parsedate_to_datetime

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Gmail API scopes (read-only)
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def authenticate():
    """Authenticate with Gmail API"""
    creds = None

    # Check for existing token
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # Refresh or create new credentials
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("❌ ERROR: credentials.json not found!")
                print("\n📋 Setup Instructions:")
                print("1. Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com")
                print("2. Click 'Enable'")
                print("3. Go to: https://console.cloud.google.com/apis/credentials")
                print("4. Click 'Create Credentials' → 'OAuth 2.0 Client ID'")
                print("5. Application type: 'Desktop app'")
                print("6. Download JSON and save as 'credentials.json' in this folder")
                exit(1)

            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Save credentials for future runs
        with open('token.json', 'w') as token:
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

def decode_body(payload):
    """Decode email body from base64"""
    if 'parts' in payload:
        # Multipart message - find text/plain part
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain' and 'data' in part['body']:
                return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')

    # Simple message
    if 'data' in payload.get('body', {}):
        return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')

    return ""

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
        print(f"  ❌ Error fetching thread {thread_id}: {e}")
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

    # Build thread node
    thread_node = {
        'id': thread['id'],
        'name': subject,
        'type': 'item',
        'icon': icon,
        'itemType': thread_type,
        'recipientEmail': to_email,
        'ccEmail': get_header(headers, 'Cc') or '',
        'subjectLine': subject,
        'emailBody': '',  # Will populate with first message body
        'sendDate': date_obj.strftime('%Y-%m-%d') if date_obj else '',
        'status': 'Sent' if 'SENT' in labels else 'Replied' if len(messages) > 1 else 'Draft',
        'threadId': thread['id'],
        'messageCount': len(messages),
        'labels': labels,
        'subItems': []
    }

    # Add each message in thread as a subtask
    for idx, message in enumerate(messages):
        msg_headers = message['payload']['headers']
        msg_from = get_header(msg_headers, 'From')
        msg_date = get_header(msg_headers, 'Date')
        msg_body = decode_body(message['payload'])

        # Truncate body for preview
        body_preview = msg_body[:200].replace('\n', ' ').strip() if msg_body else '(No content)'

        # Use first message body as main emailBody
        if idx == 0:
            thread_node['emailBody'] = msg_body[:1000]  # Truncate to 1000 chars

        message_node = {
            'id': message['id'],
            'name': f"Message {idx + 1}: {msg_from}",
            'description': body_preview,
            'type': 'subtask',
            'sender': msg_from,
            'timestamp': msg_date,
            'fullBody': msg_body[:500]  # Store more for analysis
        }

        thread_node['subItems'].append(message_node)

    return thread_node

def export_gmail(max_threads=100, days_back=30):
    """Main export function"""
    print("\n📧 TreeListy Gmail Exporter")
    print("=" * 60)
    print(f"Max threads: {max_threads}")
    print(f"Time range: Last {days_back} days\n")

    # Authenticate
    print("🔐 Authenticating with garnet@prairie2cloud.com...")
    service = authenticate()
    print("✅ Authenticated\n")

    # Fetch thread list
    print(f"📥 Fetching last {max_threads} threads...\n")

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
        print(f"❌ Error fetching threads: {e}")
        return

    # Organize threads by label (Inbox, Sent, Important, etc.)
    phases = {
        'inbox': {'name': '📥 Inbox', 'items': []},
        'sent': {'name': '📤 Sent', 'items': []},
        'important': {'name': '⭐ Important', 'items': []},
        'other': {'name': '📧 Other', 'items': []}
    }

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

    print(f"\n✅ Processed {len(thread_list)} threads\n")

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
            'daysBack': days_back
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
    print(f"✅ SUCCESS! Exported to: {output_file}")
    print(f"\n📊 Statistics:")
    print(f"   Total threads: {len(thread_list)}")
    print(f"   Total messages: {total_messages}")
    print(f"   Inbox: {len(phases['inbox']['items'])}")
    print(f"   Sent: {len(phases['sent']['items'])}")
    print(f"   Important: {len(phases['important']['items'])}")
    print(f"   Other: {len(phases['other']['items'])}")
    print(f"\n📋 Next Steps:")
    print(f"   1. Open TreeListy in browser")
    print(f"   2. Click '📂 Import' → Select '{output_file}'")
    print(f"   3. Select pattern: '📧 Email Workflow'")
    print(f"   4. Your Gmail threads appear as a tree!")
    print(f"\n💡 Features you can now use:")
    print(f"   - Right-click any thread → '✨ AI Suggest' for rhetoric analysis")
    print(f"   - Select thread → Generate context-aware response")
    print(f"   - View conversation flow in tree structure")
    print("=" * 60)

if __name__ == '__main__':
    print("🚀 Starting Gmail export...")

    # Get parameters from command line or use defaults
    max_threads = 100
    days_back = 30

    if len(sys.argv) > 1:
        try:
            max_threads = int(sys.argv[1])
            print(f"Max threads from command line: {max_threads}")
        except ValueError:
            print(f"Invalid max_threads argument, using default: {max_threads}")

    if len(sys.argv) > 2:
        try:
            days_back = int(sys.argv[2])
            print(f"Days back from command line: {days_back}")
        except ValueError:
            print(f"Invalid days_back argument, using default: {days_back}")

    export_gmail(max_threads, days_back)

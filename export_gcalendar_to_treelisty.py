"""
TreeListy Google Calendar Exporter - Calendar Pattern
Fetches Google Calendar events and creates a TreeListy-compatible JSON file.

Setup:
1. Install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
2. Enable API: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
3. Use existing credentials.json (or create new OAuth 2.0 Desktop app credentials)
4. Run: python export_gcalendar_to_treelisty.py

First run opens browser for authentication. Token saved for future runs.

Usage:
  python export_gcalendar_to_treelisty.py              # Default: 7 days back, 30 days forward
  python export_gcalendar_to_treelisty.py 14 60        # 14 days back, 60 days forward
  python export_gcalendar_to_treelisty.py --reauth     # Force re-authorization
  python export_gcalendar_to_treelisty.py --check      # Check auth status
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta, timezone

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Google Calendar API scope (read-only)
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
TOKEN_FILE = 'token-calendar.json'  # Separate from Gmail/Drive tokens


def check_token_scopes(token_path=TOKEN_FILE):
    """Check if existing token exists and has required scopes"""
    if not os.path.exists(token_path):
        return None, []

    try:
        with open(token_path, 'r') as f:
            token_data = json.load(f)
        # Handle both 'scopes' (array) and 'scope' (space-separated string) formats
        if 'scopes' in token_data and isinstance(token_data['scopes'], list):
            token_scopes = token_data['scopes']
        else:
            token_scopes = token_data.get('scope', '').split()
        return token_data, token_scopes
    except:
        return None, []


def authenticate(force_reauth=False):
    """Authenticate with Google Calendar API

    Args:
        force_reauth: If True, delete existing token and re-authenticate

    Returns:
        Calendar API service object
    """
    creds = None

    # Delete token if forcing re-auth
    if force_reauth and os.path.exists(TOKEN_FILE):
        print("Deleting existing token for re-authorization...")
        os.remove(TOKEN_FILE)

    # Load existing token if available
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

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
                print("1. Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com")
                print("2. Click 'Enable'")
                print("3. Go to: https://console.cloud.google.com/apis/credentials")
                print("4. Use existing OAuth 2.0 Client ID (Desktop app) or create new one")
                print("5. Download JSON and save as 'credentials.json' in this folder")
                sys.exit(1)

            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Save credentials for future runs
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())

    return build('calendar', 'v3', credentials=creds)


def get_event_icon(event):
    """Get emoji icon based on event properties"""
    # Check for specific event types
    if event.get('recurringEventId'):
        return '🔄'  # Recurring
    if 'meet.google.com' in event.get('hangoutLink', '') or 'meet.google.com' in event.get('location', ''):
        return '📹'  # Video call
    if event.get('attendees') and len(event.get('attendees', [])) > 1:
        return '👥'  # Meeting with others
    if event.get('start', {}).get('date'):  # All-day event
        return '📌'  # All-day
    return '📅'  # Default calendar event


def parse_event(event):
    """Convert Google Calendar event to TreeListy node structure"""
    # Handle start/end times (can be date or dateTime)
    start = event.get('start', {})
    end = event.get('end', {})

    is_all_day = 'date' in start

    if is_all_day:
        start_date = start.get('date', '')
        start_datetime = start_date + 'T00:00:00'
        end_date = end.get('date', '')
        end_datetime = end_date + 'T23:59:59'
    else:
        start_datetime = start.get('dateTime', '')
        end_datetime = end.get('dateTime', '')
        # Extract just the date part
        start_date = start_datetime[:10] if start_datetime else ''
        end_date = end_datetime[:10] if end_datetime else ''

    # Parse attendees
    attendees = []
    for attendee in event.get('attendees', []):
        attendees.append({
            'email': attendee.get('email', ''),
            'name': attendee.get('displayName', attendee.get('email', '')),
            'status': attendee.get('responseStatus', 'needsAction'),
            'self': attendee.get('self', False)
        })

    # Get recurrence info
    recurrence = event.get('recurrence', None)
    if recurrence:
        recurrence = recurrence[0] if len(recurrence) == 1 else recurrence

    # Build the node
    node = {
        'id': f"evt_{event['id'][:8]}",
        'name': event.get('summary', '(No title)'),
        'type': 'item',
        'icon': get_event_icon(event),

        # External ID for Dashboard Trees merge
        'eventId': event['id'],
        'calendarId': event.get('organizer', {}).get('email', 'primary'),

        # Date fields (for Calendar view)
        'startDateTime': start_datetime,
        'endDateTime': end_datetime,
        'startDate': start_date,
        'endDate': end_date,

        # Event metadata
        'location': event.get('location', ''),
        'description': event.get('description', ''),
        'attendees': attendees,
        'isAllDay': is_all_day,
        'status': event.get('status', 'confirmed'),
        'recurrence': recurrence,
        'htmlLink': event.get('htmlLink', ''),
        'hangoutLink': event.get('hangoutLink', ''),

        # Creator info
        'creator': {
            'email': event.get('creator', {}).get('email', ''),
            'self': event.get('creator', {}).get('self', False)
        }
    }

    return node


def categorize_event(event_node, today):
    """Determine which time-based group an event belongs to"""
    start_date_str = event_node.get('startDate', '')
    if not start_date_str:
        return 'other'

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    except ValueError:
        return 'other'

    # Calculate boundaries
    tomorrow = today + timedelta(days=1)
    end_of_week = today + timedelta(days=(6 - today.weekday()))  # Sunday of current week
    start_of_next_week = end_of_week + timedelta(days=1)
    end_of_next_week = start_of_next_week + timedelta(days=6)

    if start_date < today:
        return 'past'
    elif start_date == today:
        return 'today'
    elif start_date == tomorrow:
        return 'tomorrow'
    elif start_date <= end_of_week:
        return 'this_week'
    elif start_date <= end_of_next_week:
        return 'next_week'
    else:
        return 'later'


def export_calendar(days_back=7, days_forward=30, force_reauth=False):
    """Main export function

    Args:
        days_back: Number of days in the past to fetch
        days_forward: Number of days in the future to fetch
        force_reauth: Force re-authorization
    """
    print("\n" + "=" * 60)
    print("TreeListy Google Calendar Exporter v1.0")
    print("=" * 60)
    print(f"Time range: {days_back} days back, {days_forward} days forward\n")

    # Authenticate
    print("Authenticating with Google Calendar...")
    service = authenticate(force_reauth=force_reauth)
    print("Authenticated successfully\n")

    # Calculate time range
    now = datetime.now(timezone.utc)
    today = now.date()
    time_min = (now - timedelta(days=days_back)).strftime('%Y-%m-%dT%H:%M:%SZ')
    time_max = (now + timedelta(days=days_forward)).strftime('%Y-%m-%dT%H:%M:%SZ')

    # Fetch events
    print(f"Fetching events from {time_min[:10]} to {time_max[:10]}...\n")

    try:
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,  # Expand recurring events
            orderBy='startTime',
            maxResults=500
        ).execute()

        events = events_result.get('items', [])
        print(f"Found {len(events)} events\n")

    except Exception as e:
        print(f"Error fetching events: {e}")
        return

    # Get user info for tree name
    try:
        calendar = service.calendars().get(calendarId='primary').execute()
        user_email = calendar.get('summary', 'Unknown')
    except:
        user_email = 'Unknown'

    # Organize events by time period
    phases = {
        'today': {'name': '📌 Today', 'items': [], 'icon': '📌'},
        'tomorrow': {'name': '📆 Tomorrow', 'items': [], 'icon': '📆'},
        'this_week': {'name': '🗓️ This Week', 'items': [], 'icon': '🗓️'},
        'next_week': {'name': '📋 Next Week', 'items': [], 'icon': '📋'},
        'later': {'name': '🔮 Later', 'items': [], 'icon': '🔮'},
        'past': {'name': '📜 Past Events', 'items': [], 'icon': '📜'}
    }

    # Process each event
    for event in events:
        print(f"Processing: {event.get('summary', '(No title)')[:40]}...", end='\r')

        event_node = parse_event(event)
        category = categorize_event(event_node, today)

        if category in phases:
            phases[category]['items'].append(event_node)

    print(f"\nProcessed {len(events)} events\n")

    # Build TreeListy structure
    children = []
    for phase_key in ['today', 'tomorrow', 'this_week', 'next_week', 'later', 'past']:
        phase_data = phases[phase_key]
        if phase_data['items']:  # Only include phases with items
            children.append({
                'id': f'phase-{phase_key}',
                'name': phase_data['name'],
                'type': 'phase',
                'icon': phase_data['icon'],
                'expanded': phase_key in ['today', 'tomorrow', 'this_week'],
                'items': phase_data['items']
            })

    tree = {
        'id': 'root-calendar',
        'name': f'📅 Calendar - {user_email}',
        'type': 'root',
        'icon': '📅',
        'description': f'Calendar events from {days_back} days back to {days_forward} days forward',
        'expanded': True,
        'source': {
            'type': 'gcal',
            'email': user_email,
            'lastSync': datetime.now().isoformat(),
            'calendarId': 'primary',
            'daysBack': days_back,
            'daysForward': days_forward,
            'exporterVersion': '1.0'
        },
        'pattern': {
            'key': 'calendar',
            'labels': None
        },
        'children': children
    }

    # Save to file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'gcalendar-events-{timestamp}.json'

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tree, f, indent=2, ensure_ascii=False)

    # Summary
    print("=" * 60)
    print(f"SUCCESS! Exported to: {output_file}")
    print(f"\nStatistics:")
    print(f"   Total events: {len(events)}")
    print(f"   Today: {len(phases['today']['items'])}")
    print(f"   Tomorrow: {len(phases['tomorrow']['items'])}")
    print(f"   This Week: {len(phases['this_week']['items'])}")
    print(f"   Next Week: {len(phases['next_week']['items'])}")
    print(f"   Later: {len(phases['later']['items'])}")
    print(f"   Past: {len(phases['past']['items'])}")
    print(f"\nNext Steps:")
    print(f"   1. Open TreeListy in browser")
    print(f"   2. Click 'Import' -> Select '{output_file}'")
    print(f"   3. Select pattern: 'Calendar'")
    print(f"   4. Your events appear in Calendar view!")
    print("=" * 60)

    return output_file


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Export Google Calendar events to TreeListy JSON format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python export_gcalendar_to_treelisty.py              # Default: 7 days back, 30 days forward
  python export_gcalendar_to_treelisty.py 14 60        # 14 days back, 60 days forward
  python export_gcalendar_to_treelisty.py --reauth     # Force re-authorization
  python export_gcalendar_to_treelisty.py --check      # Check current auth status
"""
    )
    parser.add_argument('days_back', nargs='?', type=int, default=7,
                        help='Days of past events to fetch (default: 7)')
    parser.add_argument('days_forward', nargs='?', type=int, default=30,
                        help='Days of future events to fetch (default: 30)')
    parser.add_argument('--reauth', action='store_true',
                        help='Force re-authorization')
    parser.add_argument('--check', action='store_true',
                        help='Check current auth status')

    args = parser.parse_args()

    # Check auth status only
    if args.check:
        token_data, scopes = check_token_scopes()
        print("\n" + "=" * 60)
        print("Google Calendar Authentication Status")
        print("=" * 60)
        if token_data:
            print("\n✓ Token exists")
            print("\nScopes granted:")
            for scope in scopes:
                scope_name = scope.split('/')[-1]
                print(f"  • {scope_name}")
        else:
            print("\n✗ Not authenticated")
            print("  Run without --check to authenticate")
        print("=" * 60 + "\n")
        sys.exit(0)

    print("Starting Calendar export...")
    print(f"Days back: {args.days_back}")
    print(f"Days forward: {args.days_forward}")
    if args.reauth:
        print("Force re-auth: Yes")

    export_calendar(args.days_back, args.days_forward, force_reauth=args.reauth)

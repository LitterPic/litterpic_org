# ------------------- Imports ---------------------
import os
from datetime import datetime

import firebase_admin
import googlemaps
import pytz
import requests
from dotenv import load_dotenv
from googleapiclient.discovery import build
from pytz import utc
import html
from firebase_admin import credentials, firestore
import re

# ------------------- Initialization --------------
load_dotenv()
gmaps = googlemaps.Client(key=os.getenv('GOOGLE_API'))
cred = credentials.Certificate('litterpic-fa0bb-firebase-adminsdk-j26hg-339d443f1f.json')
firebase_admin.initialize_app(cred)
db = firestore.client()


# ------------------- Utility Functions ------------
def normalize_description(raw_description):
    unescaped_description = html.unescape(raw_description)
    clean_description = re.sub(r'<.*?>', '', unescaped_description)
    return clean_description


# ------------------- Time Conversion Functions -----
def to_firebase_date_only(date_time_str, event_timezone='US/Eastern'):
    date_part = date_time_str.split('T')[0]
    naive_date_time_obj = datetime.strptime(date_part, '%Y-%m-%d')
    local_tz = pytz.timezone(event_timezone)  # Specify pytz.timezone
    aware_date_time_obj = local_tz.localize(naive_date_time_obj)
    return aware_date_time_obj


def to_milliseconds(date_time_obj):
    epoch = datetime(1970, 1, 1, tzinfo=utc)
    diff = date_time_obj - epoch
    milliseconds = int(diff.total_seconds() * 1000)
    return milliseconds


# ------------------- Google Maps Function ----------
def address_to_geopoint(address):
    geocode_result = gmaps.geocode(address)

    if geocode_result and 'geometry' in geocode_result[0]:
        location = geocode_result[0]['geometry']['location']
        return {'latitude': location['lat'], 'longitude': location['lng']}


# ------------------- Event Data Extraction ----------
def extract_event_data(event):
    description = event.get('description')
    if description:
        description = normalize_description(description)

        first_period_index = description.find(".")
        if first_period_index != -1:
            description = description[:first_period_index + 1]

        description += ' For more information please RSVP with blueoceansociety.org using the RSVP link.'
    else:
        description = f'Join us for a cleanup at {event.get("location", "")}'

    return {
        "id": event['id'],
        "start": event['start'].get('dateTime', event['start'].get('date')),
        "end": event['end'].get('dateTime', event['end'].get('date')),
        "location": event.get('location', ''),
        "summary": event.get('summary', ''),
        "description": description
    }


# ------------------- Main Function -----------------
def fetch_events(calendar_id):
    developer_key = os.getenv('GOOGLE_API')
    service = build('calendar', 'v3', developerKey=developer_key)
    now = datetime.utcnow().isoformat() + 'Z'

    try:
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=now,
            maxResults=20,  # Change for number of events to fetch
            singleEvents=True,
            orderBy='startTime'
        ).execute()
    except Exception as e:
        print(f"An error occurred: {e}")
        return

    events = events_result.get('items', [])
    if not events:
        print('No upcoming events found.')

    for event in events:
        event_data = extract_event_data(event)
        lat_lng = address_to_geopoint(event_data['location'])

        # Skip events with "Private Beach Cleanup" in the title
        if "Private Beach Cleanup" in event_data['summary']:
            print("Skipping event with 'Private Beach Cleanup' in the title.")
            continue

        start_time = to_milliseconds(datetime.fromisoformat(event_data['start'].replace('Z', '+00:00')))
        end_time = to_milliseconds(datetime.fromisoformat(event_data['end'].replace('Z', '+00:00')))
        date_time = to_milliseconds(to_firebase_date_only(event_data['start'], 'US/Eastern'))

        litterpic_event_data = {
            'id': event['id'],
            'date': date_time,
            'description': event_data['description'],
            'eventEndTime': end_time,
            'eventStartTime': start_time,
            'event_title': event_data['summary'],
            'location': event_data['location'],
            'latitude': lat_lng['latitude'] if lat_lng else None,
            'longitude': lat_lng['longitude'] if lat_lng else None,
        }

        firebase_function_url = ' https://us-central1-litterpic-fa0bb.cloudfunctions.net/createEvent'
        response = requests.post(firebase_function_url, json=litterpic_event_data)

        if response.status_code == 200:
            print(f"Successfully created event on LitterPic.org: {response.json()}")
        else:
            print(f"Failed to create event: {response.text}")


# ------------------- Script Entry Point ------------
if __name__ == '__main__':
    blue_ocean_society_calendar_id = os.getenv('BLUE_OCEAN_GOOGLE_CALENDAR')
    fetch_events(blue_ocean_society_calendar_id)

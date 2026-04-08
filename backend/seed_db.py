import os
import sys
from datetime import datetime, timedelta
import random

# Add project root to sys.path so app modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import Trip, Alert, EmergencyService

def seed_database():
    # Make sure all tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing data to reset the dashboard cleanly
        print("Clearing existing authentic driving history & emergency services...")
        db.query(Alert).delete()
        db.query(Trip).delete()
        db.query(EmergencyService).delete()
        
        # We need data stretching 7 days back for WeeklyTrend graph
        now = datetime.utcnow()
        trip_id = 1
        alert_id = 1
        
        print("Seeding past 7 days of realistic Indian road data...")
        
        # Iterate backwards from today (day 0) to 7 days ago
        # For realistic graphs, we inject 1 to 3 trips a day.
        for day in range(6, -1, -1):
            date_of_trip = now - timedelta(days=day)
            
            # 1 to 3 trips per day
            num_trips_today = random.randint(1, 3)
            daily_risk_avg = random.randint(35, 65) # Base risk parameter for the day
            
            for t_idx in range(num_trips_today):
                # Calculate realistic distance (15km to 90km)
                dist = round(random.uniform(15.0, 90.0), 1)
                
                # Risk score variance around the daily average
                r_score = max(10, min(100, daily_risk_avg + random.randint(-15, 15)))
                
                # Num alerts roughly correlated to distance and risk score
                num_alerts = int((dist / 10) * (r_score / 40))
                
                # Slightly stagger the time within the day
                trip_time = date_of_trip - timedelta(hours=random.randint(1, 10))
                
                new_trip = Trip(
                    id=trip_id,
                    date=trip_time,
                    distance=dist,
                    risk_score=r_score,
                    alert_count=num_alerts
                )
                db.add(new_trip)
                
                # Now generate realistic alerts associated with this trip
                alert_types = ['pothole', 'pothole', 'pothole', 'drowsiness', 'speeding', 'speeding', 'lane_departure']
                severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                
                for a_idx in range(num_alerts):
                    a_type = random.choice(alert_types)
                    if a_type == 'pothole':
                        sev = random.choice(['LOW', 'MEDIUM', 'HIGH'])
                    elif a_type == 'drowsiness':
                        sev = random.choice(['HIGH', 'CRITICAL'])
                    else:
                        sev = random.choice(severities)
                        
                    # Space out alert timestamps realistically inside the trip window
                    a_time = trip_time + timedelta(minutes=random.randint(5, 120))
                    
                    new_alert = Alert(
                        id=alert_id,
                        trip_id=trip_id,
                        type=a_type,
                        severity=sev,
                        timestamp=a_time
                    )
                    db.add(new_alert)
                    alert_id += 1
                
                trip_id += 1
        
        db.commit()
        
        print("Seeding Emergency Services...")
        services_data = [
            {"name": "AIIMS New Delhi", "type": "hospital", "lat": 28.5661, "lng": 77.2061, "contact": "011-26588500"},
            {"name": "Safdarjung Hospital", "type": "hospital", "lat": 28.5684, "lng": 77.2057, "contact": "011-26165060"},
            {"name": "Delhi Police HQ", "type": "police", "lat": 28.6295, "lng": 77.2345, "contact": "112"},
            {"name": "Apollo Hosptals Navi Mumbai", "type": "hospital", "lat": 19.0185, "lng": 73.0186, "contact": "022-33503350"},
            {"name": "Mumbai Traffic Police HQ", "type": "police", "lat": 19.0163, "lng": 72.8184, "contact": "100"},
            {"name": "Manipal Hospital Bangalore", "type": "hospital", "lat": 12.9592, "lng": 77.6483, "contact": "080-25023222"},
            {"name": "Chennai Apollo Main", "type": "hospital", "lat": 13.0610, "lng": 80.2505, "contact": "044-28293333"},
        ]
        
        for service in services_data:
            new_service = EmergencyService(**service)
            db.add(new_service)
        
        db.commit()
        print(f"Database successfully seeded with {trip_id - 1} trips, {alert_id - 1} alerts, and Emergency Services!")
    
    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

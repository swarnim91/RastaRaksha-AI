from app.database import SessionLocal, Base, engine
from app.models import Pothole, Blackspot, DriverBehavior, RoadUsage
from datetime import datetime

# Initialize Db tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# clear existing mock data for these tables
db.query(Pothole).delete()
db.query(Blackspot).delete()
db.query(DriverBehavior).delete()
db.query(RoadUsage).delete()

# Mock Potholes
p1 = Pothole(lat=28.7041, lng=77.1025, severity="HIGH", depth_cm=15.5, detection_count=12)
p2 = Pothole(lat=28.5355, lng=77.3910, severity="MEDIUM", depth_cm=8.2, detection_count=5)
# Mock Blackspots
b1 = Blackspot(segment_name="Delhi-Meerut Expressway", lat=28.7041, lng=77.1025, risk_score=85.5, accident_probability=0.75, time_based_risk="Night Risk: High")
# Mock DriverBehavior
d1 = DriverBehavior(driver_hash="ae74b89f3x", speed_violations=3, drowsiness_frequency=1, avg_reaction_time_ms=750.5, unsafe_driving_zones="Delhi-Meerut Expressway")
# Mock RoadUsage
r1 = RoadUsage(segment_name="Ring Road Delhi", lat=28.5355, lng=77.3910, traffic_density=0.88, congestion_level="HIGH", peak_hour=18)

db.add_all([p1, p2, b1, d1, r1])
db.commit()

print("Intelligence Models Seeded Successfully!")
print("Checking Potholes in DB:", db.query(Pothole).count())
print("Checking Blackspots in DB:", db.query(Blackspot).count())
print("Checking DriverBehavior in DB:", db.query(DriverBehavior).count())
print("Checking RoadUsage in DB:", db.query(RoadUsage).count())
db.close()

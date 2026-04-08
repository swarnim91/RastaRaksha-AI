import logging

logger = logging.getLogger(__name__)

class RiskEngine:
    def __init__(self):
        self.road_risk = 10
        self.driver_risk = 0
        self.speed_risk = 0

    def update_road_risk(self, severity: str):
        # severity: HIGH, MEDIUM, LOW
        if severity == "HIGH":
            self.road_risk = min(40, self.road_risk + 15)
        elif severity == "MEDIUM":
            self.road_risk = min(40, self.road_risk + 5)
        else:
            self.road_risk = max(0, self.road_risk - 2)

    def update_driver_risk(self, state: str):
        if state == "DROWSY":
            self.driver_risk = min(40, self.driver_risk + 20)
        elif state == "YAWNING" or state == "DISTRACTED":
            self.driver_risk = min(40, self.driver_risk + 10)
        else:
            self.driver_risk = max(0, self.driver_risk - 5)

    def update_speed_risk(self, speed_compliant: bool):
        if not speed_compliant:
            self.speed_risk = min(20, self.speed_risk + 10)
        else:
            self.speed_risk = max(0, self.speed_risk - 5)

    def get_composite_score(self):
        total_score = self.road_risk + self.driver_risk + self.speed_risk
        total_score = max(0, min(100, total_score))

        if total_score > 60:
            risk_level = "HIGH"
            status_hindi = "ड्राइविंग जोखिम भरी है"
            recommendation = "Please take a break and rest for 15 minutes"
        elif total_score > 30:
            risk_level = "MEDIUM"
            status_hindi = "मध्यम जोखिम"
            recommendation = "Drive carefully, pay attention to the road"
        else:
            risk_level = "LOW"
            status_hindi = "सुरक्षित ड्राइविंग"
            recommendation = "Driving conditions are optimal"

        return {
            "total_score": total_score,
            "road_risk": self.road_risk,
            "driver_risk": self.driver_risk,
            "speed_risk": self.speed_risk,
            "risk_level": risk_level,
            "status_hindi": status_hindi,
            "recommendation": recommendation
        }

risk_engine = RiskEngine()

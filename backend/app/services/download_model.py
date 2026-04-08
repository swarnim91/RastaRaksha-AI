from roboflow import Roboflow

rf = Roboflow(api_key="YOUR_ROBOFLOW_KEY")
project = rf.workspace("pothole-detection-r6wvb").project("pothole-detection-xlnbe")
version = project.version(1)
dataset = version.model

print("Model ready!")
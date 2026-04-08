import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Test")

try:
    logger.info("Importing FastAPI...")
    from fastapi import FastAPI
    logger.info("Importing uvicorn...")
    import uvicorn
    logger.info("Importing cv2...")
    import cv2
    logger.info("Importing mediapipe...")
    import mediapipe as mp
    logger.info("Importing ultralytics...")
    from ultralytics import YOLO
    logger.info("Importing anthropic...")
    import anthropic
    logger.info("Importing app routes...")
    from app.routes import detection, drowsiness, chatbot, reports
    logger.info("Importing app database...")
    from app.database import engine, Base
    logger.info("All imports successful!")
except Exception as e:
    logger.error(f"Import failed: {e}")
    import traceback
    traceback.print_exc()

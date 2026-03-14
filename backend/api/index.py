"""
Vercel serverless function entrypoint.
Vercel looks natively for `api/index.py` depending on configuration.
Here we just import the Flask app from our main `app.py`.
"""
import sys
import os

# Add the parent directory to the Python path so it can find app.py and config.py
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app

# Vercel needs a variable named 'app' (which we imported above).

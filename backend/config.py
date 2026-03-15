"""Supabase configuration for the voting system."""
import os

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

def validate_supabase_config():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise Exception(
            "Supabase credentials not found. Ensure SUPABASE_URL and SUPABASE_KEY environment variables are set. "
            "For local development, you can set them in your terminal before running Python."
        )


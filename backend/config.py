"""Firebase configuration for the voting system."""
import os
import json
import base64

# For Vercel deployment: We set a FIREBASE_SERVICE_ACCOUNT_B64 environment variable 
# containing the base64 encoded text of the serviceAccountKey.json
# For local dev: We fallback to the local serviceAccountKey.json file.

def get_firebase_credentials():
    b64_cred = os.environ.get("FIREBASE_SERVICE_ACCOUNT_B64")
    if b64_cred:
        try:
            # Decode base64 to dict
            cred_json = base64.b64decode(b64_cred).decode('utf-8')
            return json.loads(cred_json)
        except Exception as e:
            raise Exception(f"Failed to decode FIREBASE_SERVICE_ACCOUNT_B64 environment variable: {e}. Check that it is a valid Base64 string without extra characters.")

    # Fallback to local file
    local_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
    if os.path.exists(local_path):
        return local_path
        
    raise Exception("Firebase credentials not found. Ensure FIREBASE_SERVICE_ACCOUNT_B64 env variable is set or serviceAccountKey.json exists.")

FIREBASE_CREDENTIALS = get_firebase_credentials()


"""Voting System - Flask REST API with Firebase Firestore."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import firebase_admin
from firebase_admin import credentials, firestore
from config import FIREBASE_CREDENTIALS

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Firebase initialisation
# ---------------------------------------------------------------------------

cred = credentials.Certificate(FIREBASE_CREDENTIALS)
# Prevent crash during "warm starts" on Vercel
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

POLLS_COLLECTION = "polls"
USERS_COLLECTION = "users"

# Hardcoded Admin Credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin@password123" # You can change this



# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def poll_to_dict(doc):
    """Convert a Firestore document snapshot to a JSON-friendly dict."""
    data = doc.to_dict()
    data["id"] = doc.id
    options = data.get("options", [])
    data["total_votes"] = sum(opt.get("vote_count", 0) for opt in options)
    # Firestore Timestamps → ISO strings
    if data.get("created_at"):
        data["created_at"] = data["created_at"].isoformat()
    return data


# ---------------------------------------------------------------------------
# Authentication Routes
# ---------------------------------------------------------------------------

@app.route("/api/auth/register", methods=["POST"])
def register():
    """Register a new user."""
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Ensure username is unique
    existing_users = db.collection(USERS_COLLECTION).where("username", "==", username).limit(1).get()
    if existing_users:
        return jsonify({"error": "Username already exists"}), 400

    # For security, all new registrations are strictly members.
    role = "member"

    hashed_pw = generate_password_hash(password)
    doc_ref = db.collection(USERS_COLLECTION).document()
    doc_ref.set({
        "username": username,
        "password": hashed_pw,
        "role": role,
        "created_at": firestore.SERVER_TIMESTAMP,
    })

    return jsonify({"message": "User registered successfully", "id": doc_ref.id, "role": role}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Authenticate a user."""
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # 1. Check if it's the hardcoded admin
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        return jsonify({
            "message": "Admin login successful",
            "id": "admin_default",
            "username": ADMIN_USERNAME,
            "role": "admin"
        }), 200

    # 2. Check Firestore for regular members
    users = db.collection(USERS_COLLECTION).where("username", "==", username).limit(1).get()
    if not users:
        return jsonify({"error": "Invalid username or password"}), 401

    user_doc = users[0]
    user_data = user_doc.to_dict()

    if not check_password_hash(user_data["password"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({
        "message": "Login successful",
        "id": user_doc.id,
        "username": user_data["username"],
        "role": user_data.get("role", "member")
    }), 200

@app.route("/api/users", methods=["GET"])
def get_users():
    """Admin only: list all members."""
    # In a real app we'd secure this with a JWT token check for the admin role. 
    # For MVP, we simply return all users for the frontend dashboard.
    docs = db.collection(USERS_COLLECTION).order_by("created_at", direction=firestore.Query.DESCENDING).stream()
    users = []
    for doc in docs:
        data = doc.to_dict()
        # Do not return hashed passwords
        user_info = {
            "id": doc.id,
            "username": data.get("username"),
            "role": data.get("role", "member"),
            "created_at": data.get("created_at").isoformat() if data.get("created_at") else None
        }
        users.append(user_info)
    return jsonify(users)

# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.route("/api/polls", methods=["GET"])
def get_polls():
    """List all polls (newest first)."""
    docs = (
        db.collection(POLLS_COLLECTION)
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .stream()
    )
    polls = []
    for doc in docs:
        d = poll_to_dict(doc)
        polls.append(d)
    return jsonify(polls)


@app.route("/api/polls", methods=["POST"])
def create_poll():
    """Create a new poll with options."""
    data = request.get_json()
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    raw_options = data.get("options", [])

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if len(raw_options) < 2:
        return jsonify({"error": "At least 2 options are required"}), 400

    options = []
    for idx, opt in enumerate(raw_options):
        text = opt.strip() if isinstance(opt, str) else str(opt).strip()
        if text:
            options.append({
                "id": idx,
                "option_text": text,
                "vote_count": 0,
            })

    doc_ref = db.collection(POLLS_COLLECTION).document()
    doc_ref.set({
        "title": title,
        "description": description,
        "options": options,
        "created_at": firestore.SERVER_TIMESTAMP,
    })
    return jsonify({"id": doc_ref.id, "message": "Poll created successfully"}), 201


@app.route("/api/polls/<poll_id>", methods=["GET"])
def get_poll(poll_id):
    """Get a single poll with its options."""
    doc = db.collection(POLLS_COLLECTION).document(poll_id).get()
    if not doc.exists:
        return jsonify({"error": "Poll not found"}), 404
    return jsonify(poll_to_dict(doc))


@app.route("/api/polls/<poll_id>/vote", methods=["POST"])
def vote(poll_id):
    """Cast a vote for an option."""
    data = request.get_json()
    option_id = data.get("option_id")
    if option_id is None:
        return jsonify({"error": "option_id is required"}), 400

    doc_ref = db.collection(POLLS_COLLECTION).document(poll_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "Poll not found"}), 404

    poll_data = doc.to_dict()
    options = poll_data.get("options", [])

    found = False
    for opt in options:
        if opt["id"] == option_id:
            opt["vote_count"] = opt.get("vote_count", 0) + 1
            found = True
            break

    if not found:
        return jsonify({"error": "Invalid option"}), 404

    doc_ref.update({"options": options})
    return jsonify({"message": "Vote recorded successfully"})


@app.route("/api/polls/<poll_id>", methods=["DELETE"])
def delete_poll(poll_id):
    """Delete a poll."""
    doc_ref = db.collection(POLLS_COLLECTION).document(poll_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "Poll not found"}), 404
    doc_ref.delete()
    return jsonify({"message": "Poll deleted successfully"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Database: Firebase Firestore")
    print("Server running on http://localhost:5000")
    app.run(debug=True, port=5000)

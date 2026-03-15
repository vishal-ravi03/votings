"""Voting System - Flask REST API with Supabase PostgreSQL."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY, validate_supabase_config

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Supabase initialisation
# ---------------------------------------------------------------------------

validate_supabase_config()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hardcoded Admin Credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin@password123" # You can change this

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
    existing = supabase.table("users").select("*").eq("username", username).execute()
    if existing.data:
        return jsonify({"error": "Username already exists"}), 400

    role = "member"
    hashed_pw = generate_password_hash(password)
    
    response = supabase.table("users").insert({
        "username": username,
        "password": hashed_pw,
        "role": role
    }).execute()
    
    if not response.data:
        return jsonify({"error": "Failed to create user"}), 500

    new_user = response.data[0]
    return jsonify({"message": "User registered successfully", "id": new_user["id"], "role": role}), 201


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

    # 2. Check Supabase for regular members
    users = supabase.table("users").select("*").eq("username", username).execute()
    if not users.data:
        return jsonify({"error": "Invalid username or password"}), 401

    user_data = users.data[0]
    if not check_password_hash(user_data["password"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({
        "message": "Login successful",
        "id": user_data["id"],
        "username": user_data["username"],
        "role": user_data.get("role", "member")
    }), 200

@app.route("/api/users", methods=["GET"])
def get_users():
    """Admin only: list all members."""
    users_resp = supabase.table("users").select("id, username, role, created_at").order("created_at", desc=True).execute()
    return jsonify(users_resp.data)

# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.route("/api/polls", methods=["GET"])
def get_polls():
    """List all polls with their options (newest first)."""
    # Supabase allows fetching relational data using foreign keys
    polls_resp = supabase.table("polls").select("*, options(*)").order("created_at", desc=True).execute()
    polls = polls_resp.data
    
    # Format the data to match frontend expectations
    formatted_polls = []
    for poll in polls:
        total_votes = sum(opt.get("vote_count", 0) for opt in poll.get("options", []))
        formatted_polls.append({
            "id": poll["id"],
            "title": poll["title"],
            "description": poll.get("description", ""),
            "created_at": poll.get("created_at"),
            "options": poll.get("options", []),
            "total_votes": total_votes
        })
        
    return jsonify(formatted_polls)


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

    # Insert poll
    poll_resp = supabase.table("polls").insert({
        "title": title,
        "description": description
    }).execute()
    
    if not poll_resp.data:
        return jsonify({"error": "Failed to create poll"}), 500
        
    poll_id = poll_resp.data[0]["id"]
    
    # Insert options
    options_data = []
    for opt in raw_options:
        text = opt.strip() if isinstance(opt, str) else str(opt).strip()
        if text:
            options_data.append({
                "poll_id": poll_id,
                "option_text": text,
                "vote_count": 0
            })
            
    if options_data:
        supabase.table("options").insert(options_data).execute()

    return jsonify({"id": poll_id, "message": "Poll created successfully"}), 201


@app.route("/api/polls/<poll_id>", methods=["GET"])
def get_poll(poll_id):
    """Get a single poll with its options."""
    poll_resp = supabase.table("polls").select("*, options(*)").eq("id", poll_id).execute()
    
    if not poll_resp.data:
        return jsonify({"error": "Poll not found"}), 404
        
    poll = poll_resp.data[0]
    total_votes = sum(opt.get("vote_count", 0) for opt in poll.get("options", []))
    
    formatted_poll = {
        "id": poll["id"],
        "title": poll["title"],
        "description": poll.get("description", ""),
        "created_at": poll.get("created_at"),
        "options": poll.get("options", []),
        "total_votes": total_votes
    }
    
    return jsonify(formatted_poll)


@app.route("/api/polls/<poll_id>/vote", methods=["POST"])
def vote(poll_id):
    """Cast a vote for an option."""
    data = request.get_json()
    option_id = data.get("option_id")
    if option_id is None:
        return jsonify({"error": "option_id is required"}), 400

    # Fetch the option to ensure it exists and belongs to the poll
    opt_resp = supabase.table("options").select("*").eq("id", option_id).eq("poll_id", poll_id).execute()
    if not opt_resp.data:
        return jsonify({"error": "Invalid option"}), 404
        
    current_votes = opt_resp.data[0].get("vote_count", 0)
    
    # Update the vote count
    supabase.table("options").update({"vote_count": current_votes + 1}).eq("id", option_id).execute()

    return jsonify({"message": "Vote recorded successfully"})


@app.route("/api/polls/<poll_id>", methods=["DELETE"])
def delete_poll(poll_id):
    """Delete a poll."""
    # Supabase foreign key ON DELETE CASCADE will automatically delete options
    resp = supabase.table("polls").delete().eq("id", poll_id).execute()
    
    if not resp.data:
        # Check if the poll actually existed or we just returned empty. 
        # Actually with supabase-py, .delete() returns the deleted rows. If none deleted, 404.
        return jsonify({"error": "Poll not found"}), 404
        
    return jsonify({"message": "Poll deleted successfully"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Database: Supabase PostgreSQL")
    print("Server running on http://localhost:5000")
    app.run(debug=True, port=5000)

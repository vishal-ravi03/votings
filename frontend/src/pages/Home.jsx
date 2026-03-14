import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import PollCard from "../components/PollCard";

export default function Home() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/polls")
            .then((res) => setPolls(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1>Active Polls</h1>
                <p>Browse open polls and cast your vote. Your voice matters!</p>
            </div>

            {loading ? (
                <div className="spinner-container">
                    <div className="spinner" />
                </div>
            ) : polls.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📭</div>
                    <h3>No polls yet</h3>
                    <p>Be the first to create a poll and gather opinions.</p>
                    <Link to="/create" className="btn-primary" style={{ width: "auto", display: "inline-flex" }}>
                        + Create your first poll
                    </Link>
                </div>
            ) : (
                <div className="poll-grid">
                    {polls.map((poll) => (
                        <PollCard key={poll.id} poll={poll} />
                    ))}
                </div>
            )}
        </div>
    );
}

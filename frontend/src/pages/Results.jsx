import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Results() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [poll, setPoll] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        API.get(`/polls/${id}`)
            .then((res) => setPoll(res.data))
            .catch(() => setPoll(undefined));
    }, [id]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this poll?")) return;
        try {
            await API.delete(`/polls/${id}`);
            showToast("Poll deleted!");
            setTimeout(() => navigate("/"), 800);
        } catch {
            showToast("Failed to delete poll", "error");
        }
    };

    if (poll === undefined) {
        return (
            <div className="empty-state">
                <div className="icon">😕</div>
                <h3>Poll not found</h3>
                <Link to="/" className="btn-secondary">← Back to Polls</Link>
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="spinner-container">
                <div className="spinner" />
            </div>
        );
    }

    const maxVotes = Math.max(...poll.options.map((o) => o.vote_count), 1);

    return (
        <div>
            <div className="page-header">
                <h1>{poll.title}</h1>
                {poll.description && <p>{poll.description}</p>}
            </div>

            <div className="glass-card" style={{ cursor: "default" }}>
                <div className="total-votes-badge">
                    <div className="count">{poll.total_votes}</div>
                    <div className="label">Total Votes</div>
                </div>

                <div className="results-list">
                    {poll.options.map((opt) => {
                        const pct =
                            poll.total_votes > 0
                                ? ((opt.vote_count / poll.total_votes) * 100).toFixed(1)
                                : 0;
                        const isWinner = opt.vote_count === maxVotes && opt.vote_count > 0;
                        return (
                            <div className="result-item" key={opt.id}>
                                <div className="result-header">
                                    <span className="result-label">
                                        {isWinner && "🏆 "}
                                        {opt.option_text}
                                    </span>
                                    <span className="result-votes">
                                        {opt.vote_count} vote{opt.vote_count !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="result-bar-track">
                                    <div
                                        className={`result-bar-fill ${isWinner ? "winner" : ""}`}
                                        style={{ width: `${pct}%` }}
                                    >
                                        {pct > 8 && (
                                            <span className="result-percent">{pct}%</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="actions-row" style={{ marginTop: "20px" }}>
                <Link to="/" className="btn-secondary">← Back to Polls</Link>
                <Link to={`/poll/${id}`} className="btn-secondary">🗳️ Vote</Link>
                <button className="btn-danger" onClick={handleDelete}>🗑️ Delete Poll</button>
            </div>

            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
        </div>
    );
}

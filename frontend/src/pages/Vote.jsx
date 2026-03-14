import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Vote() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [poll, setPoll] = useState(null);
    const [selected, setSelected] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        API.get(`/polls/${id}`)
            .then((res) => {
                setPoll(res.data);
                // Check localStorage for prior vote
                const voted = JSON.parse(localStorage.getItem("voted_polls") || "{}");
                if (voted[id]) setHasVoted(true);
            })
            .catch(() => setPoll(undefined));
    }, [id]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleVote = async () => {
        if (!selected) return showToast("Please select an option", "error");
        setSubmitting(true);
        try {
            await API.post(`/polls/${id}/vote`, { option_id: selected });
            // Mark as voted in localStorage
            const voted = JSON.parse(localStorage.getItem("voted_polls") || "{}");
            voted[id] = true;
            localStorage.setItem("voted_polls", JSON.stringify(voted));
            showToast("Vote recorded! 🎉");
            setTimeout(() => navigate(`/results/${id}`), 800);
        } catch {
            showToast("Failed to vote", "error");
        } finally {
            setSubmitting(false);
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

    return (
        <div>
            <div className="page-header">
                <h1>{poll.title}</h1>
                {poll.description && <p>{poll.description}</p>}
            </div>

            <div className="glass-card" style={{ cursor: "default" }}>
                {hasVoted ? (
                    <>
                        <div className="empty-state" style={{ padding: "20px 0" }}>
                            <div className="icon">✅</div>
                            <h3>You have already voted!</h3>
                            <p>You can view the results below.</p>
                        </div>
                        <div className="actions-row">
                            <Link to={`/results/${id}`} className="btn-primary" style={{ width: "auto" }}>
                                📊 View Results
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="vote-options">
                            {poll.options.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={`vote-option ${selected === opt.id ? "selected" : ""}`}
                                    onClick={() => setSelected(opt.id)}
                                >
                                    <div className="vote-radio">
                                        <div className="vote-radio-inner" />
                                    </div>
                                    <span className="vote-option-text">{opt.option_text}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleVote}
                            disabled={submitting || !selected}
                        >
                            {submitting ? "Submitting..." : "🗳️ Cast Vote"}
                        </button>
                    </>
                )}
            </div>

            <div className="actions-row" style={{ marginTop: "20px" }}>
                <Link to="/" className="btn-secondary">← Back to Polls</Link>
                {!hasVoted && (
                    <Link to={`/results/${id}`} className="btn-secondary">📊 View Results</Link>
                )}
            </div>

            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
        </div>
    );
}

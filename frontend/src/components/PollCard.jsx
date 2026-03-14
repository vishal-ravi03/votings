import { Link } from "react-router-dom";

export default function PollCard({ poll }) {
    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <Link to={`/poll/${poll.id}`} className="glass-card poll-card">
            <div className="poll-card-header">
                <h3>{poll.title}</h3>
                <span className="badge">🕓 {timeAgo(poll.created_at)}</span>
            </div>
            {poll.description && (
                <p className="description">{poll.description}</p>
            )}
            <div className="poll-card-footer">
                <span>{poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""}</span>
                <span className="vote-link">Vote now →</span>
            </div>
        </Link>
    );
}

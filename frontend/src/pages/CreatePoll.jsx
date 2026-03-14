import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function CreatePoll() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const addOption = () => setOptions([...options, ""]);
    const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i));
    const updateOption = (i, val) => {
        const copy = [...options];
        copy[i] = val;
        setOptions(copy);
    };

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
        if (!title.trim()) return showToast("Title is required", "error");
        if (cleanOptions.length < 2) return showToast("At least 2 options are required", "error");

        setSubmitting(true);
        try {
            const res = await API.post("/polls", {
                title: title.trim(),
                description: description.trim(),
                options: cleanOptions,
            });
            showToast("Poll created!");
            setTimeout(() => navigate(`/poll/${res.data.id}`), 600);
        } catch {
            showToast("Failed to create poll", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Create a Poll</h1>
                <p>Ask a question and let the community decide.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card" style={{ cursor: "default" }}>
                <div className="form-group">
                    <label htmlFor="poll-title">Poll Title</label>
                    <input
                        id="poll-title"
                        className="form-input"
                        type="text"
                        placeholder="e.g. What's the best programming language?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="poll-desc">Description (optional)</label>
                    <textarea
                        id="poll-desc"
                        className="form-textarea"
                        placeholder="Add some context to your poll..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Options</label>
                    <div className="options-list">
                        {options.map((opt, i) => (
                            <div className="option-row" key={i}>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => removeOption(i)}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="btn-add-option"
                            onClick={addOption}
                        >
                            + Add another option
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Creating..." : "🚀 Create Poll"}
                </button>
            </form>

            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
        </div>
    );
}

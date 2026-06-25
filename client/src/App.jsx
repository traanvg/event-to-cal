import { useState } from "react";

const API_URL = "https://event-to-cal.onrender.com/api/parse";

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "Date TBD";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleParse() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadICS() {
    if (!result?.ics) return;
    const blob = new Blob([result.ics], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${result.event.title || "event"}.ics`;
    link.click();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#f0ede8",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(139, 92, 246, 0.15)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "100px",
            padding: "6px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#a78bfa",
            letterSpacing: "0.05em",
          }}
        >
          <CalendarIcon /> EVENT → CALENDAR
        </div>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: "800",
            margin: "0 0 12px",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          Paste a link.
          <br />
          <span style={{ color: "#8b5cf6" }}>Skip the typing.</span>
        </h1>
        <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>
          Turn any event post into an iPhone Calendar invite — instantly.
        </p>
      </div>

      {/* Input card */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "#13131a",
          border: "1px solid #1f1f2e",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "8px",
            letterSpacing: "0.05em",
          }}
        >
          EVENT URL
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#4b5563",
              }}
            >
              <LinkIcon />
            </div>
            <input
              type="url"
              placeholder="Paste Luma, Eventbrite, Facebook link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleParse()}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                background: "#0a0a0f",
                border: "1px solid #1f1f2e",
                borderRadius: "10px",
                color: "#f0ede8",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={handleParse}
            disabled={loading || !url.trim()}
            style={{
              padding: "12px 20px",
              background: loading ? "#4c1d95" : "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Parsing..." : "Parse Event"}
          </button>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#374151" }}>
          Works with: Luma · Eventbrite · Facebook Events · Partiful · most
          event pages
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "16px",
            color: "#f87171",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            background: "#13131a",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "16px",
            padding: "24px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "20px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "11px",
                  color: "#6b7280",
                  letterSpacing: "0.08em",
                }}
              >
                EVENT FOUND
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: "700",
                  letterSpacing: "-0.02em",
                }}
              >
                {result.event.title || "Untitled Event"}
              </h2>
            </div>
            <div
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "12px",
                color: "#a78bfa",
                fontWeight: "600",
              }}
            >
              ✓ Parsed
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
            <Row icon="📅" label="Date" value={formatDate(result.event.date)} />
            <Row
              icon="🕐"
              label="Time"
              value={
                formatTime(result.event.startTime)
                  ? `${formatTime(result.event.startTime)}${result.event.endTime ? ` – ${formatTime(result.event.endTime)}` : ""}`
                  : "Time TBD"
              }
            />
            <Row
              icon="📍"
              label="Location"
              value={result.event.location || "Location TBD"}
            />
            {result.event.description && (
              <Row icon="📝" label="About" value={result.event.description} />
            )}
          </div>

          <button
            onClick={downloadICS}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "16px",
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            📲 Add to iPhone Calendar
          </button>
          <p
            style={{
              textAlign: "center",
              margin: "10px 0 0",
              fontSize: "12px",
              color: "#4b5563",
            }}
          >
            Downloads a .ics file — tap it to instantly add to Calendar
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #374151; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px",
        background: "#0a0a0f",
        borderRadius: "8px",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "16px", marginTop: "1px" }}>{icon}</span>
      <div>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: "11px",
            color: "#4b5563",
            letterSpacing: "0.06em",
          }}
        >
          {label.toUpperCase()}
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#d1d5db" }}>{value}</p>
      </div>
    </div>
  );
}

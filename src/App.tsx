import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, User, BookOpen, Hash, Lock, School, X, Copy, Check, QrCode } from "lucide-react";
import QRCodeCanvas from "qrcode";
import { students, TEST_URL, type Student } from "./lib/studentData";
import "./index.css";

function normalise(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Pre-build normalised name index ONCE at module load.
// With ~63k students, calling normalise() on every keypress is O(n*m).
// Pre-indexing makes each search O(n) over already-normalised strings.
const normalisedNames: string[] = students.map((s) => normalise(s.name));


function matchesAll(name: string, tokens: string[]) {
  return tokens.every((token) => name.includes(token));
}

function levelShort(level: string) {
  if (level.includes("Scratch")) return "Level 1 – Scratch";
  if (level.includes("2")) return "Level 2";
  if (level.includes("3")) return "Level 3";
  return level;
}

/* ── 3-D Cube background ── */
function CubeScene() {
  const faces = ["front","back","left","right","top","bottom"] as const;
  const minis = [
    { size: 60, top: "8%",  left: "6%",  dur: "12s" },
    { size: 45, top: "75%", left: "4%",  dur: "16s" },
    { size: 55, top: "15%", left: "88%", dur: "14s" },
    { size: 40, top: "70%", left: "85%", dur: "10s" },
    { size: 30, top: "50%", left: "92%", dur: "20s" },
    { size: 35, top: "42%", left: "2%",  dur: "22s" },
  ];
  return (
    <>
      <div className="mesh-bg" />
      <div className="cube-scene">
        <div className="cube-wrap">
          {faces.map(f => <div key={f} className={`cube-face face-${f}`} />)}
        </div>
      </div>
      {minis.map(({ size, top, left, dur }, i) => (
        <div key={i} className="mini-cube" style={{ width: size, height: size, top, left, perspective: 400, animationDuration: dur }}>
          {faces.map(f => (
            <div key={f} className={`cube-face face-${f}`} style={{
              width: size, height: size,
              transform: ({
                front:  `translateZ(${size/2}px)`,
                back:   `rotateY(180deg) translateZ(${size/2}px)`,
                left:   `rotateY(-90deg) translateZ(${size/2}px)`,
                right:  `rotateY(90deg) translateZ(${size/2}px)`,
                top:    `rotateX(90deg) translateZ(${size/2}px)`,
                bottom: `rotateX(-90deg) translateZ(${size/2}px)`,
              } as Record<string,string>)[f],
            }} />
          ))}
        </div>
      ))}
    </>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "0.69rem",
        color: "#475569",
        background: "rgba(99,102,241,0.07)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 5,
        padding: "2px 7px",
        fontWeight: 500,
      }}
    >
      <span style={{ color: "#6366f1" }}>{icon}</span>
      <span style={{ color: "#94a3b8" }}>{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function CredBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: "0.75rem",
        fontFamily: "monospace",
        fontWeight: 700,
        color: copied ? "#059669" : "#4f46e5",
        background: copied ? "rgba(5,150,105,0.07)" : "rgba(99,102,241,0.08)",
        border: `1.5px solid ${copied ? "rgba(5,150,105,0.35)" : "rgba(99,102,241,0.22)"}`,
        borderRadius: 7,
        padding: "3px 6px 3px 10px",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      <span style={{ color: copied ? "#059669" : "#6366f1" }}>{icon}</span>
      <span style={{ color: "#94a3b8", fontFamily: "Inter,sans-serif", fontWeight: 400, fontSize: "0.68rem" }}>{label}:</span>
      {value}
      <button
        onClick={handleCopy}
        title={`Copy ${label}`}
        style={{
          background: copied ? "rgba(5,150,105,0.12)" : "rgba(99,102,241,0.1)",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2px 4px",
          marginLeft: 2,
          transition: "background 0.2s",
          color: copied ? "#059669" : "#6366f1",
        }}
        onMouseEnter={(e) => {
          if (!copied) (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.2)";
        }}
        onMouseLeave={(e) => {
          if (!copied) (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.1)";
        }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </span>
  );
}

/* ── QR Modal ── */
function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeCanvas.toCanvas(canvasRef.current, url, {
        width: 280,
        margin: 2,
        color: { dark: "#1e1b4b", light: "#ffffff" },
      });
    }
  }, [url]);

  return (
    <AnimatePresence>
      <motion.div
        key="qr-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15,10,40,0.72)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: 24,
            padding: "36px 40px 32px",
            boxShadow: "0 40px 100px rgba(79,70,229,0.28), 0 8px 32px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            maxWidth: 380,
            width: "90vw",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(99,102,241,0.08)",
              border: "1.5px solid rgba(99,102,241,0.18)",
              borderRadius: 8,
              cursor: "pointer",
              padding: "5px 7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6366f1",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
          >
            <X size={16} />
          </button>

          {/* Title */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(124,58,237,0.15) 100%)",
                border: "1.5px solid rgba(99,102,241,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <QrCode size={24} color="#6366f1" />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
              }}
            >
              Scan to Open Test
            </h2>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.75rem" }}>
              Point your camera at the QR code
            </p>
          </div>

          {/* QR Code */}
          <div
            style={{
              padding: 14,
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 4px 24px rgba(99,102,241,0.15), 0 0 0 1.5px rgba(99,102,241,0.12)",
              display: "inline-flex",
            }}
          >
            <canvas ref={canvasRef} style={{ borderRadius: 8, display: "block" }} />
          </div>

          {/* URL label */}
          <p
            style={{
              margin: 0,
              fontSize: "0.68rem",
              color: "#64748b",
              fontFamily: "monospace",
              wordBreak: "break-all",
              textAlign: "center",
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.12)",
              borderRadius: 8,
              padding: "6px 12px",
            }}
          >
            {url}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [showQR, setShowQR] = useState(false);
  // Debounced query: only triggers the filter after typing pauses (16ms = 1 frame)
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 60);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const results = useMemo<Student[]>(() => {
    const tokens = normalise(debouncedQuery).split(" ").filter((t) => t.length > 0);
    if (tokens.length === 0 || tokens.every((t) => t.length < 2)) return [];
    const out: Student[] = [];
    for (let i = 0; i < normalisedNames.length; i++) {
      if (matchesAll(normalisedNames[i], tokens)) {
        out.push(students[i]);
        if (out.length === 50) break;
      }
    }
    return out;
  }, [debouncedQuery]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #eef2ff 0%, #f8faff 40%, #f0f4ff 100%)",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        position: "relative",
      }}
    >
      {/* 3D background */}
      <CubeScene />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* ── Top URL banner ── */}
        <div
          className="glass-card"
          style={{
            flexShrink: 0,
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "9px 20px",
          }}
        >
          <span style={{ color: "#6366f1", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Test URL
          </span>
          <a
            href={TEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#4f46e5",
              fontSize: "0.8rem",
              fontFamily: "monospace",
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 10px",
              borderRadius: 5,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.15)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.08)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
            }}
          >
            {TEST_URL}
            <ExternalLink size={12} />
          </a>

          {/* QR code button */}
          <button
            onClick={() => setShowQR(true)}
            title="Show QR Code"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 11px",
              borderRadius: 6,
              border: "1px solid rgba(99,102,241,0.22)",
              background: "rgba(99,102,241,0.08)",
              cursor: "pointer",
              color: "#4f46e5",
              fontSize: "0.72rem",
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.03em",
              transition: "background 0.2s, border-color 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.16)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
              e.currentTarget.style.transform = "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.08)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <QrCode size={13} />
            QR Code
          </button>
        </div>

        {/* ── Heading ── */}
        <div style={{ flexShrink: 0, textAlign: "center", padding: "18px 24px 10px" }}>
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              margin: 0,
              fontSize: "1.45rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            🔍 Find Your Login Credentials
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ margin: "5px 0 0", color: "#94a3b8", fontSize: "0.78rem" }}
          >
            Type your name below — your ID and password will appear instantly
          </motion.p>
        </div>

        {/* ── Search box ── */}
        <div style={{ flexShrink: 0, padding: "8px 32px 10px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <div className="glass-card" style={{ position: "relative", borderRadius: 12 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6366f1",
                pointerEvents: "none",
              }}
            />
            <input
              ref={inputRef}
              id="student-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب اسمك / Type your name…"
              dir="auto"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 40px 12px 42px",
                borderRadius: 12,
                border: "none",
                background: "transparent",
                color: "#1e293b",
                fontSize: "1rem",
                outline: "none",
                caretColor: "#6366f1",
                fontFamily: "Inter, sans-serif",
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(99,102,241,0.1)",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 4,
                  color: "#6366f1",
                  display: "flex",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {query.length >= 2 && (
              <motion.p
                key="count"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ margin: "6px 4px 0", color: "#94a3b8", fontSize: "0.72rem" }}
              >
                {results.length === 0
                  ? "No students found — try a different spelling"
                  : `${results.length} student${results.length > 1 ? "s" : ""} found${results.length === 50 ? " (showing first 50)" : ""}`}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Results list ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 32px 20px",
            maxWidth: 860,
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {query.length < 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                paddingBottom: 40,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(99,102,241,0.08)",
                  border: "1.5px solid rgba(99,102,241,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={32} strokeWidth={1.5} color="#6366f1" />
              </div>
              <span style={{ fontSize: "0.88rem", color: "#94a3b8", fontWeight: 500 }}>
                Start typing to search among{" "}
                <strong style={{ color: "#6366f1" }}>{students.length.toLocaleString()}</strong>{" "}
                students
              </span>
            </motion.div>
          )}

          <AnimatePresence>
            {results.map((s, idx) => (
              <motion.div
                key={s.id + idx}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, delay: idx * 0.025 }}
                className="glass-card"
                style={{
                  marginBottom: 10,
                  padding: "14px 18px",
                  borderRadius: 14,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "center",
                  cursor: "default",
                  transition: "box-shadow 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "0 12px 36px rgba(99,102,241,0.14), 0 2px 8px rgba(0,0,0,0.05)";
                  el.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "";
                  el.style.transform = "";
                }}
              >
                {/* Left: name + meta */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "rgba(99,102,241,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <User size={13} color="#6366f1" />
                    </div>
                    <span dir="auto" style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>
                      {s.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <InfoChip icon={<School size={11} />} label="School" value={s.className} />
                    <InfoChip icon={<BookOpen size={11} />} label="Grade" value={`Grade ${s.grade}`} />
                    <InfoChip icon={<BookOpen size={11} />} label="Level" value={levelShort(s.level)} />
                  </div>
                </div>

                {/* Right: credentials */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-end",
                    flexShrink: 0,
                  }}
                >
                  <CredBadge icon={<Hash size={11} />} label="ID" value={s.id} />
                  <CredBadge icon={<Lock size={11} />} label="PW" value={s.pw} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && <QRModal url={TEST_URL} onClose={() => setShowQR(false)} />}
    </div>
  );
}

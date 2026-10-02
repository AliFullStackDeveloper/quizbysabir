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

      {/* Centered message */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-card"
          style={{
            maxWidth: 520,
            width: "100%",
            borderRadius: 20,
            padding: "48px 40px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 20 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.18) 100%)",
              border: "2px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={36} color="#ef4444" strokeWidth={1.8} />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.3,
            }}
          >
            Record Removed
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
              margin: 0,
              fontSize: "1.05rem",
              color: "#475569",
              fontWeight: 500,
              lineHeight: 1.7,
            }}
          >
            The Record is removed now you cannot access the record now
          </motion.p>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            style={{
              width: "60%",
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
            }}
          />

          {/* Contact line */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.01em",
            }}
          >
            Contact MR Sabir Ali
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

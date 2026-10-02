import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import "./index.css";

/* ── 3-D Cube background ── */
function CubeScene() {
  const faces = ["front", "back", "left", "right", "top", "bottom"] as const;
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
          {faces.map((f) => (
            <div key={f} className={`cube-face face-${f}`} />
          ))}
        </div>
      </div>
      {minis.map(({ size, top, left, dur }, i) => (
        <div
          key={i}
          className="mini-cube"
          style={{ width: size, height: size, top, left, perspective: 400, animationDuration: dur }}
        >
          {faces.map((f) => (
            <div
              key={f}
              className={`cube-face face-${f}`}
              style={{
                width: size,
                height: size,
                transform: ({
                  front:  `translateZ(${size / 2}px)`,
                  back:   `rotateY(180deg) translateZ(${size / 2}px)`,
                  left:   `rotateY(-90deg) translateZ(${size / 2}px)`,
                  right:  `rotateY(90deg) translateZ(${size / 2}px)`,
                  top:    `rotateX(90deg) translateZ(${size / 2}px)`,
                  bottom: `rotateX(-90deg) translateZ(${size / 2}px)`,
                } as Record<string, string>)[f],
              }}
            />
          ))}
        </div>
      ))}
    </>
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

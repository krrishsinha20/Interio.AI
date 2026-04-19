import { useState, useRef } from "react";

const BASE_URL = "https://noncollectivistic-mozell-simulant.ngrok-free.dev";

const loadingPhrases = [
  "Understanding your wanted theme...",
  "Model working for your theme...",
  "Implementing...",
  "Finishing touch baby...",
  "Almost ready...",
];

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const fileInputRef = useRef();
  const intervalRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const onGenerate = async () => {
    if (!file || !prompt) return;
    setLoading(true);
    setResult(null);
    setPhraseIdx(0);

    intervalRef.current = setInterval(() => {
      setPhraseIdx((i) => (i + 1) % loadingPhrases.length);
    }, 1800);

    try {
      const form = new FormData();
      form.append("image", file);
      form.append("prompt", prompt);

      const res = await fetch(`${BASE_URL}/redesign`, {
        method: "POST",
        body: form,
      });

      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(intervalRef.current);
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.grain} />

      <div style={s.wrap}>

        {/* Title */}
        <div style={s.titleRow}>
          <span style={s.ornament}>✦</span>
          <h1 style={s.title}>AI INTERIO</h1>
          <span style={s.ornament}>✦</span>
        </div>
        <p style={s.sub}>Interior redesign, reimagined by AI</p>

        {/* DUAL BOXES — always visible */}
        <div style={s.dualRow}>

          {/* LEFT — Original */}
          <div
            style={s.box}
            onClick={() => !loading && fileInputRef.current.click()}
            className="imgbox left-box"
          >
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <span style={s.boxLabel}>Original</span>

            {!preview ? (
              <div style={s.emptyState}>
                <span style={s.plusIcon}>⊕</span>
                <span style={s.emptyText}>Upload your room</span>
              </div>
            ) : (
              <img src={preview} style={s.img} alt="original" />
            )}
          </div>

          {/* RIGHT — Result */}
          <div style={{...s.box, cursor: "default"}} className="imgbox">
            <span style={s.boxLabel}>Result</span>

            {loading ? (
              <div style={s.loaderWrap}>
                <div style={s.dotsRow}>
                  <span className="ldot l1" />
                  <span className="ldot l2" />
                  <span className="ldot l3" />
                </div>
                <p style={s.phrase} key={phraseIdx} className="fade-in">
                  {loadingPhrases[phraseIdx]}
                </p>
              </div>
            ) : !result ? (
              <div style={s.emptyState}>
                <span style={s.resultIcon}>✦</span>
                <span style={s.emptyText}>Design will appear here</span>
              </div>
            ) : (
              <img src={result} style={s.img} alt="result" />
            )}
          </div>

        </div>

        {/* Prompt textarea */}
        <textarea
          placeholder="Describe your style... e.g. Mexican hacienda with terracotta walls and Talavera tiles"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={s.textarea}
          rows={3}
        />

        {/* Generate button */}
        <button
          style={s.btn}
          onClick={onGenerate}
          disabled={loading}
          className="gen-btn"
        >
          {loading ? "Generating..." : "✦ Generate Design"}
        </button>

        {result && !loading && (
          <button
            style={s.redoBtn}
            onClick={() => { setResult(null); setPreview(null); setFile(null); }}
          >
            ↺ Start over
          </button>
        )}

      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; min-height: 100vh; background: #f0ebe3; overflow-x: hidden; }

  .left-box { cursor: pointer; }
  .imgbox { transition: border-color 0.25s, box-shadow 0.25s; }
  .left-box:hover { border-color: rgba(160,120,70,0.55) !important; box-shadow: 0 12px 50px rgba(100,70,30,0.18) !important; }

  .ldot {
    display: inline-block;
    width: 9px; height: 9px;
    border-radius: 50%;
    background: #b8915a;
    animation: bounce 1.2s infinite ease-in-out;
  }
  .l1 { animation-delay: 0s; }
  .l2 { animation-delay: 0.2s; }
  .l3 { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
    40%            { transform: translateY(-11px); opacity: 1; }
  }

  .fade-in { animation: fadePhrase 0.5s ease; }
  @keyframes fadePhrase {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .gen-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 44px rgba(90,50,10,0.5) !important;
  }
  .gen-btn:active:not(:disabled) { transform: translateY(0); }
  .gen-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  textarea:focus {
    outline: none;
    border-color: rgba(160,120,70,0.6) !important;
    box-shadow: 0 0 0 3px rgba(180,140,80,0.1);
  }
`;

const s = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Jost', sans-serif",
    position: "relative",
    padding: "36px 24px",
  },

  grain: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
  },

  wrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    width: "100%",
    maxWidth: 1100,
    position: "relative",
    zIndex: 1,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  ornament: {
    color: "#b8915a",
    fontSize: 14,
    opacity: 0.7,
  },

  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 500,
    fontSize: "clamp(26px, 4vw, 44px)",
    letterSpacing: "0.28em",
    color: "#2c2218",
  },

  sub: {
    fontSize: 10,
    letterSpacing: "0.2em",
    color: "#9a8570",
    textTransform: "uppercase",
    marginTop: -8,
  },

  dualRow: {
    width: "100%",
    display: "flex",
    gap: 14,
    alignItems: "stretch",
  },

  box: {
    flex: 1,
    minHeight: 480,
    borderRadius: 16,
    background: "rgba(255,255,255,0.48)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(180,145,100,0.22)",
    boxShadow: "0 8px 40px rgba(100,70,30,0.09)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  boxLabel: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 2,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(8px)",
    color: "#fff",
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "5px 13px",
    borderRadius: 20,
    fontFamily: "'Jost', sans-serif",
  },

  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },

  plusIcon: {
    fontSize: 28,
    color: "#c4a47a",
  },

  resultIcon: {
    fontSize: 22,
    color: "#c4a47a",
    opacity: 0.45,
  },

  emptyText: {
    fontSize: 12,
    color: "#9a8570",
    letterSpacing: "0.1em",
  },

  loaderWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 22,
  },

  dotsRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  phrase: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 18,
    color: "#7a6040",
    letterSpacing: "0.04em",
    fontStyle: "italic",
    textAlign: "center",
    padding: "0 24px",
  },

  textarea: {
    width: "100%",
    maxWidth: 680,
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid rgba(180,145,100,0.3)",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(10px)",
    fontFamily: "'Jost', sans-serif",
    fontSize: 13,
    color: "#3a2e22",
    resize: "vertical",
    lineHeight: 1.65,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },

  btn: {
    padding: "15px 48px",
    borderRadius: 12,
    border: "none",
    fontSize: 11,
    letterSpacing: "0.22em",
    color: "#fff",
    cursor: "pointer",
    textTransform: "uppercase",
    fontFamily: "'Jost', sans-serif",
    fontWeight: 500,
    background: "linear-gradient(135deg, #e0b472 0%, #a0621a 45%, #c88a3a 75%, #7a4510 100%)",
    boxShadow: "0 6px 28px rgba(90,50,10,0.38), inset 0 1px 3px rgba(255,255,255,0.2)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  redoBtn: {
    background: "transparent",
    border: "1px solid rgba(160,120,70,0.38)",
    color: "#9a7a50",
    fontSize: 11,
    letterSpacing: "0.12em",
    padding: "10px 24px",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'Jost', sans-serif",
  },
};
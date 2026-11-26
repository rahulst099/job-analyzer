import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function App() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("history") || "[]"));
  const [dark, setDark] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);

  const skills = ["React","JavaScript","Node.js","TypeScript","AWS","MongoDB","Python","HTML","CSS","Express","Next.js","Tailwind","SQL","Java","Git"];

  // Animated Score Ring
  useEffect(() => {
    if (!result) return;
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      if (i >= result.score) { setDisplayScore(result.score); clearInterval(t); }
      else setDisplayScore(i);
    }, 20);
    return () => clearInterval(t);
  }, [result]);

  const handlePdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const c = await page.getTextContent();
      text += c.items.map(x => x.str).join(" ") + "\n";
    }
    setResume(text);
    alert("PDF se Resume nikal gaya! ✅");
  };

  const analyze = async () => {
    if (!jd || !resume) return alert("Dono box bharo boss!");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, resumeText: resume }),
      });
      const data = await res.json();
      // Fallback agar backend band ho
      let final = data;
      if (!data.score && data.score !== 0) {
        const jdLow = jd.toLowerCase(), rLow = resume.toLowerCase();
        const matched = skills.filter(s => jdLow.includes(s.toLowerCase()) && rLow.includes(s.toLowerCase()));
        const missing = skills.filter(s => jdLow.includes(s.toLowerCase()) && !rLow.includes(s.toLowerCase()));
        const score = jdLow ? Math.round((matched.length / (matched.length + missing.length || 1)) * 100) : 0;
        final = { score, matchedSkills: matched, missingSkills: missing, suggestion: `Resume me ${missing.join(", ")} add karo, score badh jayega.` };
      }
      setResult(final);
      const newHist = [{ score: final.score, date: new Date().toLocaleString("en-IN"), matched: final.matchedSkills?.length || 0 }, ...history].slice(0, 5);
      setHistory(newHist);
      localStorage.setItem("history", JSON.stringify(newHist));
    } catch (err) {
      alert("Backend band hai! Backend terminal me npm start karo.");
    }
    setLoading(false);
  };

  const radius = 55, circ = 2 * Math.PI * radius;
  const color = displayScore >= 70 ? "#22c55e" : displayScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: dark ? "linear-gradient(135deg,#0f172a,#4c1d95,#0f172a)" : "#f1f5f9", color: dark ? "white" : "#0f172a", padding: 20, fontFamily: "sans-serif", transition: "0.3s" }}>
      <div style={{ maxWidth: 900, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>💼 Job Analyzer <span style={{ fontSize: 14, color: "#a78bfa" }}>- Rahul Sharma</span></h1>
          <button onClick={() => setDark(!dark)} style={{ padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer" }}>{dark ? "☀️ Light" : "🌙 Dark"}</button>
        </div>
        <p style={{ color: "#c4b5fd" }}>Job Description vs Tera Resume Compare Karega</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
          <div>
            <label>Job Description Paste Kar:</label>
            <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Yaha Job Description paste kar..." style={{ width: "100%", height: 160, borderRadius: 12, padding: 12, marginTop: 6, background: dark ? "#1e293b" : "white", color: dark ? "white" : "black", border: "1px solid #7c3aed" }} />
          </div>
          <div>
            <label>Resume Text / PDF:</label>
            <textarea value={resume} onChange={e => setResume(e.target.value)} placeholder="Yaha apna Resume paste kar..." style={{ width: "100%", height: 160, borderRadius: 12, padding: 12, marginTop: 6, background: dark ? "#1e293b" : "white", color: dark ? "white" : "black", border: "1px solid #7c3aed" }} />
            <label style={{ display: "block", marginTop: 8, background: "#7c3aed", padding: "8px", borderRadius: 8, textAlign: "center", cursor: "pointer" }}>
              📄 PDF Resume Upload Karo <input type="file" accept=".pdf" onChange={handlePdf} hidden />
            </label>
          </div>
        </div>

        <button onClick={analyze} style={{ width: "100%", marginTop: 16, padding: 14, fontSize: 18, fontWeight: "bold", borderRadius: 12, border: "none", background: "linear-gradient(90deg,#7c3aed,#db2777)", color: "white", cursor: "pointer", boxShadow: "0 10px 25px rgba(124,58,237,0.4)" }}>
          {loading ? "Analyzing... ⏳" : "Analyze Karo 🚀"}
        </button>

        {result && (
          <div style={{ background: dark ? "rgba(255,255,255,0.1)" : "white", backdropFilter: "blur(10px)", borderRadius: 16, padding: 20, marginTop: 20, animation: "pop 0.4s ease" }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={radius} stroke={dark ? "#334155" : "#e2e8f0"} strokeWidth="12" fill="none" />
                  <circle cx="70" cy="70" r={radius} stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (circ * displayScore) / 100} style={{ transition: "0.2s", transform: "rotate(-90deg)", transformOrigin: "center" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <b style={{ fontSize: 28 }}>{displayScore}%</b><span style={{ fontSize: 11 }}>ATS SCORE 🎯</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3>✅ Matched Skills:</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{result.matchedSkills?.map((s, i) => <span key={i} style={{ background: "#22c55e", color: "white", padding: "6px 12px", borderRadius: 20, fontSize: 13, animation: `pop 0.3s ${i * 0.05}s` }}>✅ {s}</span>)}</div>
                <h3 style={{ marginTop: 12 }}>❌ Missing Skills:</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{result.missingSkills?.map((s, i) => <span key={i} style={{ background: "#ef4444", color: "white", padding: "6px 12px", borderRadius: 20, fontSize: 13 }}>❌ {s}</span>)}</div>
                <p style={{ background: "#fef3c7", color: "#92400e", padding: 10, borderRadius: 10, marginTop: 12 }}>💡 <b>AI Suggestion:</b> {result.suggestion || `Resume me ${result.missingSkills?.join(", ")} add karo.`}</p>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 20, background: dark ? "#1e293b" : "white", padding: 15, borderRadius: 12 }}>
            <h3>📊 Tera History (Last 5):</h3>
            {history.map((h, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}><span>{h.date}</span><b style={{ color: h.score >= 70 ? "#22c55e" : "#f59e0b" }}>{h.score}% - {h.matched} skills matched</b></div>)}
          </div>
        )}
      </div>
      <style>{`@keyframes pop{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
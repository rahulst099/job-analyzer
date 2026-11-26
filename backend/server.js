const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECT - Yaha apna MongoDB link daalna
// Agar abhi link nahi hai to ye line aise hi rehne de, app bina DB ke bhi chalega
const MONGO_URI = process.env.MONGO_URI || "";

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected Boss!"))
    .catch(err => console.log("MongoDB Error:", err.message));
}

// 2. HISTORY KA SCHEMA - Database me kya save hoga
const HistorySchema = new mongoose.Schema({
  score: Number,
  matchedSkills: [String],
  missingSkills: [String],
  date: { type: Date, default: Date.now }
});
const History = mongoose.model("History", HistorySchema);

// 3. ASLI SKILLS LIST - Java wala sab add kar diya
const skills = ["Java","Spring Boot","React","JavaScript","SQL","REST APIs","Spring Security","JWT","Git","PostgreSQL","MySQL","HTML","CSS","Node.js","TypeScript","AWS","MongoDB","Python","Express","Next.js","Tailwind","Maven","GitHub","Postman"];

app.get('/', (req, res) => {
  res.send('Backend Chal Raha Hai Boss!');
});

// 4. ASLI ANALYZE - Ab nakli 78 nahi aayega
app.post('/api/analyze', async (req, res) => {
  const { jobDescription, resumeText } = req.body;
  const jd = (jobDescription || "").toLowerCase();
  const resume = (resumeText || "").toLowerCase();

  const matchedSkills = [];
  const missingSkills = [];

  skills.forEach(skill => {
    const s = skill.toLowerCase();
    if (jd.includes(s)) {
      if (resume.includes(s)) matchedSkills.push(skill);
      else missingSkills.push(skill);
    }
  });

  const total = matchedSkills.length + missingSkills.length;
  const score = total === 0 ? 0 : Math.round((matchedSkills.length / total) * 100);
  const suggestion = missingSkills.length > 0 
    ? `Resume me ${missingSkills.join(", ")} add karo, score badh jayega.`
    : "Ek number Resume hai Boss! Sab skills matched hai.";

  const result = { score, matchedSkills, missingSkills, suggestion };

  // Database me save karne ki koshish karo
  if (MONGO_URI) {
    try { await new History(result).save(); } catch(e) { console.log("Save error", e.message) }
  }

  res.json(result);
});

// 5. HISTORY LANE WALA API
app.get('/api/history', async (req, res) => {
  if (!MONGO_URI) return res.json([]);
  const data = await History.find().sort({ date: -1 }).limit(5);
  res.json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
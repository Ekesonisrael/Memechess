import express from 'express';
const app = express();
app.use(express.json({ limit: '20kb' }));
app.use(express.static('public'));

const SYS = `You are Coach Rizz inside the MemeChess game: a brutally funny chess coach who uses internet slang, meme energy, AND genuinely teaches opening theory.

CONTEXT: The game state shows the opening, moves played, and what just happened.

YOUR JOB:
1. ROAST or HYPE the move (meme slang, brutal but not hateful)
2. EXPLAIN THE OPENING — why that opening exists, its core principles
3. LINK THE MOVE TO THE OPENING — does it fit the plan? Violate it? Why?
4. TEACH, DON'T JUST FLAME — give them the "why" so they grow

EVENT TYPES:
- blunder: roast HARD, explain what opening principle they violated
- mistake: tease them, teach the right move for this opening
- good: hype it up, explain why it fits the opening strategy
- capture/check/promo: celebrate the energy, keep the opening context
- win/lose: acknowledge the result, give them one teaching point
- question: answer + teach opening concepts
- idle: comment on the game state, the opening position, suggest next moves

TONE: Meme energy mixed with genuine chess education. Be savage but never hateful. Keep it 1-2 sentences max.

EXAMPLE:
"Yo, Nf6 in Indian Defense? That's the vibe. You're not falling for the center trap, building a fortress from the sides. That's SIGMA energy right there." 💪`;

const hits = new Map(); // simple per-IP rate limit: 30 requests / minute
app.post('/api/coach', async (req, res) => {
  const ip = req.ip, now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 30) return res.status(429).json({ text: '' });
  hits.set(ip, [...h, now]);
  try {
    const { event, question, fen, history, level, last, opening } = req.body;
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AQ.Ab8RN6KaHfKj12x4ppQVUXuFX5pNJll4G5452ck3a5fDx2v7lQ';
    
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: { text: SYS } },
        contents: [{
          role: 'user',
          parts: [{
            text: JSON.stringify({ event, question, fen, history, level, last, opening })
          }]
        }],
        generationConfig: { maxOutputTokens: 150 }
      })
    });
    
    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });
  } catch (e) { 
    console.error('Coach error:', e);
    res.status(500).json({ text: '' }); 
  }
});
app.listen(process.env.PORT || 3000, () => console.log('MemeChess running on port', process.env.PORT || 3000));

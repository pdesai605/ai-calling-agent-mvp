const fs = require("fs");
const path = require("path");


const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
const AUDIO_DIR = "/tmp/audio";
app.set("trust proxy", true);

app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// --------------------
// Middleware
// --------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --------------------
// In-memory audio store
// --------------------

// --------------------
// Health check
// --------------------
app.get("/", (req, res) => {
  res.send("AI Calling Agent is running");
});

// --------------------
// Serve audio for Twilio <Play>
// --------------------
app.get("/audio/:id", (req, res) => {
  const filePath = path.join(AUDIO_DIR, `${req.params.id}.mp3`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Audio not found");
  }

   res.setHeader("Content-Type", "audio/mpeg");
  res.sendFile(filePath);

  // cleanup after 30 seconds
  setTimeout(() => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }, 60000);
});

// --------------------
// TWILIO VOICE WEBHOOK
// --------------------
app.post("/voice", async (req, res) => {
  const userSpeech = req.body.SpeechResult;

  // First call: greet + listen
  if (!userSpeech) {
    res.type("text/xml");
    return res.send(`
      <Response>
        <Gather
          input="speech"
          action="/voice"
          method="POST"
          language="hi-IN"
          timeout="6">
          <Say>Namaskar. Krupa kari ne tamaro prashna bolo.</Say>
        </Gather>
      </Response>
    `);
  }

  try {
    // --------------------
    // OPENAI (AI brain)
    // --------------------
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.15,
          messages: [
            {
              role: "system",
              content: `
You are a trained Indian government helpline officer.

Rules:
- Answer ONLY Aadhaar and PAN related queries.
- Reply in the SAME language as the user (Hindi, Gujarati, or English).
- Use 1–2 short, fluent sentences.
- NEVER ask follow-up questions.
- If the question is ambiguous, assume the most common case.
- Sound confident, official, and polite.
              `
            },
            {
              role: "user",
              content: userSpeech
            }
          ]
        })
      }
    );

    const aiData = await aiResponse.json();
    const reply =
      aiData?.choices?.[0]?.message?.content ||
      "Krupa kari ne farithi prayatna karo.";

    // --------------------
    // ELEVENLABS (TTS)
    // --------------------
    const ttsResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/Wh1QG8ICTAxQWHIbW3SS",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: reply,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.65
          }
        })
      }
    );

    // ✅ THIS WAS MISSING BEFORE
    const audioBuffer = await ttsResponse.arrayBuffer();

    // --------------------
    // Store audio & respond with TwiML
    // --------------------
    const audioId = crypto.randomUUID();
const audioPath = path.join(AUDIO_DIR, `${audioId}.mp3`);

fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

res.type("text/xml");
res.send(`
  <Response>
    <Play>https://ai-calling-agent-mvp.onrender.com/audio/${audioId}</Play>
  </Response>
`);

  } catch (error) {
    console.error("Voice webhook error:", error);
    res.type("text/xml");
    res.send(`
      <Response>
        <Say>Seva thodi vaar mate uplabdh nathi.</Say>
      </Response>
    `);
  }
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

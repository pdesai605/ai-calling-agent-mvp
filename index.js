const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const audioStore = new Map(); 

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --------------------
// Health check
// --------------------
app.get("/", (req, res) => {
  res.send("AI Calling Agent is running");
});


app.get("/audio/:id", (req, res) => {
  const audio = audioStore.get(req.params.id);

  if (!audio) {
    return res.status(404).send("Audio not found");
  }

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(audio);

  // cleanup after serving once
  setTimeout(() => audioStore.delete(req.params.id), 30000);
});

// --------------------
// TWILIO VOICE WEBHOOK
// --------------------
app.post("/voice", async (req, res) => {
  const userSpeech = req.body.SpeechResult;

  // First interaction: greet + listen
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
    // OPENAI (AI BRAIN)
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
    // ELEVENLABS (HUMAN VOICE)
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

    const audioId = crypto.randomUUID();
audioStore.set(audioId, Buffer.from(audioBuffer));

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
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

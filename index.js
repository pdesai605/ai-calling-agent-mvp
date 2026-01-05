const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.send("AI Calling Agent is running");
});

/**
 * AI TEXT RESPONSE (OpenAI)
 */
app.post("/ai-response", async (req, res) => {
  const userText = req.body.input || "";

  try {
    const openaiResponse = await fetch(
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

Rules you MUST follow:
- Answer ONLY Aadhaar and PAN related questions.
- Reply in the SAME language as the user (Gujarati, Hindi, or English).
- Speak like a human officer, not like a document.
- Give ONLY ONE clear answer, not multiple options.
- Use 1–2 short, fluent sentences only.
- Do NOT list steps unless the user explicitly asks for steps.
- Do NOT say "you can also" or give alternatives.
- Sound confident, official, and polite.

Your goal is to sound like a real government call-center agent.
              `
            },
            {
              role: "user",
              content: userText
            }
          ]
        })
      }
    );

    const data = await openaiResponse.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Krupa kari ne farithi puchho.";

    res.json({ reply });

  } catch (err) {
    console.error("OpenAI error:", err);
    res.json({
      reply:
        "Seva thodi vaar mate uplabdh nathi. Krupa kari ne pachhi prayatna karo."
    });
  }
});

/**
 * ELEVENLABS TEXT → SPEECH (FIXED FINAL VOICE)
 */
app.post("/speak", async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).send("No text provided");
  }

  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.65
          }
        })
      }
    );

    const audioBuffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));

  } catch (err) {
    console.error("ElevenLabs TTS error:", err);
    res.status(500).send("Voice generation failed");
  }
});

// Render / local port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

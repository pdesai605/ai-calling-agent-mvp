const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

// --------------------
// Middleware
// --------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --------------------
// Health check
// --------------------
app.get("/", (req, res) => {
  res.send("AI Calling Agent is running");
});

// --------------------
// R2 CLIENT (PUBLIC ACCESS ENABLED)
// --------------------
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// --------------------
// TWILIO VOICE WEBHOOK
// --------------------
app.post("/voice", async (req, res) => {
  const userSpeech = req.body.SpeechResult;

  // First request: greet + listen
  if (!userSpeech) {
    res.type("text/xml");
    return res.send(`
      <Response>
        <Gather
          input="speech"
          action="https://ai-calling-agent-mvp.onrender.com/voice"
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
    // OPENAI
    // --------------------
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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
- Answer ONLY Aadhaar and PAN queries
- Reply in SAME language as user
- Use 1–2 fluent sentences
- Never ask follow-up questions
              `,
            },
            { role: "user", content: userSpeech },
          ],
        }),
      }
    );

    const aiData = await aiResponse.json();
    const reply =
      aiData?.choices?.[0]?.message?.content ||
      "Krupa kari ne farithi prayatna karo.";

    // --------------------
    // ELEVENLABS
    // --------------------
    const ttsResponse = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text: reply,
      model_id: "eleven_multilingual_v2"
    })
  }
);

// 🔴 CRITICAL CHECK
if (!ttsResponse.ok) {
  const errText = await ttsResponse.text();
  throw new Error("ElevenLabs error: " + errText);
}

    const audioBuffer = await ttsResponse.arrayBuffer();

    // --------------------
    // UPLOAD TO R2 (PUBLIC OBJECT)
    // --------------------
    const audioId = crypto.randomUUID();
    const key = `calls/${audioId}.mp3`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: Buffer.from(audioBuffer),
        ContentType: "audio/mpeg",
      })
    );

    // --------------------
    // PUBLIC R2 URL (NO WORKER NEEDED IF PUBLIC)
    // --------------------
    const audioUrl = `https://${process.env.R2_PUBLIC_HOST}/${key}`;

    // --------------------
    // TWIML RESPONSE
    // --------------------
    res.type("text/xml");
    res.send(`
      <Response>
        <Play>${audioUrl}</Play>
      </Response>
    `);

  } catch (err) {
    console.error("Voice webhook error:", err);
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

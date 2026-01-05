const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("AI Calling Agent is running");
});

app.post("/ai-response", async (req, res) => {
  const userText = req.body?.input || "";

  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/ai/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          model: "eleven_multilingual_v2",
          prompt: `You are a helpful Indian government assistant.
Answer in the same language as the user.
User question: ${userText}`
        })
      }
    );

    const data = await response.json();

    res.json({
      reply: data.text || "Please try again"
    });

  } catch (error) {
    console.error(error);
    res.json({
      reply: "Service temporarily unavailable"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.send("AI Calling Agent is running");
});

// AI response endpoint
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
          messages: [
            {
              role: "system",
              content:
                "You are an Indian government service assistant. Answer ONLY Aadhaar and PAN related queries. Reply in the same language as the user (Gujarati, Hindi, or English). Be clear and simple."
            },
            {
              role: "user",
              content: userText
            }
          ],
          temperature: 0.2
        })
      }
    );

    const data = await openaiResponse.json();

    const reply =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content
        : "Krupa kari ne farithi puchho.";

    res.json({ reply });

  } catch (error) {
    console.error("AI error:", error);
    res.json({
      reply: "Service temporary available nathi. Krupa kari ne thodi vaar pachhi prayatna karo."
    });
  }
});

// IMPORTANT: use Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

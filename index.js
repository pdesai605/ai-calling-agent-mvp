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
                "You are an Indian government service assistant. Reply in the same language as the user."
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

    console.log("OPENAI RAW RESPONSE:", JSON.stringify(data));

    if (data.error) {
      console.error("OPENAI ERROR:", data.error);
      return res.json({ reply: "OpenAI error occurred" });
    }

    if (!data.choices || !data.choices[0]) {
      return res.json({ reply: "No AI response received" });
    }

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.json({
      reply: "Server error"
    });
  }
});


// IMPORTANT: use Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

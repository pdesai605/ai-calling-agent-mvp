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

  } catch (err) {
    console.error(err);
    res.json({
      reply: "Currently service unavailable"
    });
  }
});

app.post("/ai-response", async (req, res) => {
  const userText = req.body?.input || "";

  try {
    const response = await fetch(
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
              content: "You are an Indian government service assistant. Answer in the same language as the user. Give correct Aadhaar and PAN update process. Be simple and clear."
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

    const data = await response.json();

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    res.json({
      reply: "Service temporarily unavailable"
    });
  }
});

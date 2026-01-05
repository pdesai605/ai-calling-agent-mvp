import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("AI Calling Agent is running");
});

/**
 * This endpoint will be called from call flow
 * It receives user text and returns AI response
 */
app.post("/ai-response", async (req, res) => {
  const userText =
    req.body?.input ||
    req.body?.speech ||
    "User asked about Aadhaar update";

  console.log("User said:", userText);

  // TEMP static response for MVP demo
  const aiReply =
    "Aadhaar address update ke liye aap online UIDAI website par ja sakte ho. Address proof jaise light bill ya bank statement required hota hai. Aap Aadhaar Seva Kendra par bhi visit kar sakte ho.";

  res.json({
    reply: aiReply,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

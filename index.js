const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/voice", (req, res) => {
  const userSpeech =
    req.body.SpeechResult ||
    req.body.speechResult ||
    "No input received";

  let reply = "Hu tamaro prashna samji shakti nathi.";

  if (userSpeech.toLowerCase().includes("aadhaar") || userSpeech.toLowerCase().includes("aadhar")) {
    reply =
      "Aadhaar card ma address update karva mate address proof joiye. Tame UIDAI ni official website par online update kari shako cho athva najik na Aadhaar Seva Kendra par jai shako cho.";
  }

  if (userSpeech.toLowerCase().includes("pan")) {
    reply =
      "PAN card ma sudharo karva mate NSDL athva UTI website par online form bharva pade che ane supporting documents upload karva pade che.";
  }

  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Say>${reply}</Say>
    </Response>
  `);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

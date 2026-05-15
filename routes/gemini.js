const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chat", async (req, res) => {
  try {
    const { message, locationName, locationContext } = req.body;

    if (!message || !process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        error: "Missing message or API key not configured",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are a helpful assistant for a heat relief app called CoolSpot that helps citizens of Vancouver find parks, shaded areas, and cooling centres. 
${locationName ? `The user is asking about: ${locationName}` : ""}
${locationContext ? `Additional context: ${locationContext}` : ""}
Provide helpful, concise information about heat relief, park amenities, cooling options, or general advice about staying cool during extreme heat.`;

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(message);
    const responseText =
      result.response.text() || "I couldn't generate a response.";

    res.json({ response: responseText });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
});

module.exports = router;

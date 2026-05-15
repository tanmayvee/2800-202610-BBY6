const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chat", async (req, res) => {
  try {
    const { message, history, locationName, locationContext } = req.body;

    if (!message || !process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        error: "Missing message or API key not configured",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are a helpful assistant for a heat relief app called CoolSpot that helps citizens of Vancouver find parks, shaded areas, and cooling centres.
${locationName ? `The user is asking about: ${locationName}` : ""}
${locationContext ? `Additional context: ${locationContext}` : ""}
If the user's message is ambiguous, assume where reasonable that they are referring to the park/location that the chat window was opened from. For example, if the user asks "what does the name mean?" or "what is its size?", interpret those as questions about ${locationName || "the current park"} unless the user clearly indicates another topic.
Provide helpful, concise information about heat relief, park amenities, cooling options, or general advice about staying cool during extreme heat. You are not to use markdown language in your replies.`;

    const allowedRoles = new Set(["user", "model"]);
    const contents = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              typeof item.role === "string" &&
              allowedRoles.has(item.role) &&
              typeof item.text === "string",
          )
          .map((item) => ({
            role: item.role,
            parts: [{ text: item.text }],
          }))
      : [];

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const result = await model.generateContent({
      systemInstruction: systemPrompt,
      contents,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const responseText =
      result.response.text() || "I couldn't generate a response.";

    res.json({ response: responseText });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
});

module.exports = router;

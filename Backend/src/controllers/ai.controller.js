const OpenAI = require("openai");
const siteKnowledge = require("../services/siteKnowledge.service");
const logger = require('../utils/logger');

// Check for API key - support both OpenRouter and direct OpenAI
const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

// Only instantiate OpenAI client if API key is provided
let openai = null;
if (apiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
    defaultHeaders: process.env.OPENROUTER_API_KEY ? {
      "HTTP-Referer": "https://cbc-education-systems.onrender.com",
      "X-Title": "CBE Education Systems",
    } : undefined,
  });
} else {
  logger.warn("WARNING: API key is missing. Please set either OPENROUTER_API_KEY or OPENAI_API_KEY in your .env file.");
  logger.warn("Get your API key from: https://openrouter.ai/keys or https://platform.openai.com/api-keys");
}

exports.chat = async (req, res) => {
  try {
    // Check if API key is available
    if (!openai) {
      return res.status(503).json({ 
        error: "AI service is not configured. Please add your API key to the .env file.",
        instructions: "Get your API key from https://openrouter.ai/keys or https://platform.openai.com/api-keys"
      });
    }

    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Look up the visitor's latest question against the real public website
    // copy (Frontend/src/pages/website-pages/*, pre-extracted into
    // site-knowledge.json — admin/owner pages are never included). This is a
    // local, in-memory keyword lookup, so it adds no network calls and no
    // extra AI-provider tokens, and it answers things like "what is your
    // mission?" with the actual site text instead of a guess.
    const latestUserMessage = [...messages].reverse().find((m) => m?.role === "user");
    const siteContext = latestUserMessage ? siteKnowledge.buildContextBlock(latestUserMessage.content) : "";

    const baseSystemPrompt = systemPrompt || "You are a helpful AI assistant.";
    const chatMessages = [
      { role: "system", content: baseSystemPrompt },
      ...(siteContext ? [{ role: "system", content: siteContext }] : []),
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices?.[0]?.message?.content || "No response generated.";
    return res.json({ message: reply });
  } catch (error) {
    logger.error("OpenRouter API Error:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
};

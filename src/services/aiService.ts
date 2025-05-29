import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

export async function getAIResponse(message: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "No AI API key configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your .env file"
      );
    }

    if (process.env.GEMINI_API_KEY) {
      return await getGeminiResponse(message);
    } else if (process.env.OPENAI_API_KEY) {
      // TODO: OpenAI API integration
    }

    throw new Error("No supported AI service configured");
  } catch (error) {
    logger.error("Error getting AI response:", error);
    return "Sorry, I am unable to process your request at the moment. Please try again later.";
  }
}

async function getGeminiResponse(message: string): Promise<string> {
  try {
    const personality =
      process.env.BOT_PERSONALITY ||
      "You are a helpful and friendly assistant.";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `${personality}\n\nUser message: ${message}`;
    const response = await model.generateContent([prompt]);

    return response.response.text().trim();
  } catch (error) {
    logger.error("Error calling Gemini API:", error);
    throw error;
  }
}

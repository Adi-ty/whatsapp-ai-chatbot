import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import express from "express";
import dotenv from "dotenv";
import { getAIResponse } from "./services/aiService";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("\n🔗 Scan this QR code with your phone's WhatsApp to login:\n");
  qrcode.generate(qr, { small: true });
  console.log(
    "\n📱 Open WhatsApp on your phone > Settings > Linked Devices > Link a Device\n"
  );
});

client.on("ready", () => {
  console.log("✅ WhatsApp Client is ready!");
  logger.info("WhatsApp Client is ready!");
});

client.on("authenticated", () => {
  console.log("🔐 Authentication successful!");
  logger.info("Authentication successful!");
});

client.on("message", async (message: Message) => {
  try {
    if (
      message.from.includes("@g.us") ||
      message.from.includes("status@broadcast") ||
      message.fromMe
    ) {
      return;
    }

    const messageContent = message.body;
    const sender = message.from;
    const contact = await message.getContact();
    const senderName = contact.pushname || contact.name || sender;

    logger.info(
      `📩 Received message from ${senderName} (${sender}): ${messageContent}`
    );

    if (!messageContent || messageContent.trim() === "") {
      return;
    }

    const aiResponse = await getAIResponse(messageContent);

    await message.reply(aiResponse);

    logger.info(`📤 Sent reply to ${senderName}: ${aiResponse}`);
  } catch (error) {
    logger.error("❌ Error handling message:", error);
    try {
      await message.reply(
        "Sorry, I encountered an error processing your message. Please try again."
      );
    } catch (replyError) {
      logger.error("❌ Error sending error message:", replyError);
    }
  }
});

client.on("auth_failure", (msg) => {
  console.error("❌ Authentication failed:", msg);
  logger.error("Authentication failed:", msg);
});

client.on("disconnected", (reason) => {
  console.log("⚠️ Client was logged out:", reason);
  logger.warn("Client was logged out:", reason);
});

client.on("loading_screen", (percent, message) => {
  console.log(`⏳ Loading... ${percent}% - ${message}`);
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/status", (req, res) => {
  const clientState = client.info ? "connected" : "disconnected";
  res.json({
    status: "running",
    whatsapp: clientState,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    info: client.info,
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Health server running on http://localhost:${PORT}`);
  console.log(`📊 Status endpoint: http://localhost:${PORT}/status`);
  console.log(`💓 Health endpoint: http://localhost:${PORT}/health`);
});

console.log("🚀 Starting WhatsApp AI Chatbot...");
client.initialize();

process.on("SIGINT", async () => {
  console.log("\n⏹️ Shutting down gracefully...");
  try {
    await client.destroy();
    console.log("✅ WhatsApp client destroyed");
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️ Received SIGTERM, shutting down gracefully...");
  try {
    await client.destroy();
    console.log("✅ WhatsApp client destroyed");
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
  }
  process.exit(0);
});

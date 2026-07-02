import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./src/config";
import { handleFbiReply } from "./src/features/fbiReply";
import { handleEyesReaction } from "./src/features/eyesReaction";
import { startVoiceJoinLoop } from "./src/features/voiceJoin";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once("clientReady", (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  startVoiceJoinLoop(readyClient);
});

client.on("messageCreate", (message) => {
  handleFbiReply(client, message);
  handleEyesReaction(message);
});

client.login(config.discordToken);

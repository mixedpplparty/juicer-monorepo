import type { Client as DiscordClient } from "discord.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import "dotenv/config";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export const discordClient = new Client({
	intents: [GatewayIntentBits.Guilds],
});
discordClient.once(Events.ClientReady, (readyClient: DiscordClient) => {
	console.log(`Ready! Logged in as ${readyClient.user?.tag}`);
});
// Log in to Discord with your client's token
discordClient.login(DISCORD_BOT_TOKEN);

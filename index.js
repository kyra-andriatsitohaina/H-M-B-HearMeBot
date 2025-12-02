import 'dotenv/config';
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = process.env.PREFIX;

client.on('clientReady', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});


client.on("messageCreate", (message) => {
        // Affiche le message dans la console
    console.log(`[${message.author.tag}] ${message.content}`);

    if (message.author.bot) return;

    if (message.content === `${prefix}ping`) {
        message.reply("Pong !");
    }
});

client.login(process.env.DISCORD_TOKEN);

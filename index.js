import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from "discord.js";
import fs from 'fs';
console.log("Deepgram API Key :", process.env.DEEPGRAM_API_KEY ? "OK" : "NON TROUVÉE");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

async function loadCommandsAndEvents() {
    // Charger commandes
    const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = await import(`./commands/${file}`);
        client.commands.set(command.default.name, command.default);
    }

    // Charger events
    const eventFiles = fs.readdirSync('./events').filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const event = await import(`./events/${file}`);
        if (event.default.name === "messageCreate") {
            client.on("messageCreate", (message) => event.default.execute(message, client));
        } else if (event.default.name === "ready") {
            client.on("clientReady", () => event.default.execute(client));
        }
    }
}

const prefix = process.env.PREFIX;

client.on("messageCreate", (message) => {
        // Affiche le message dans la console
    console.log(`[${message.author.tag}] ${message.content}`);

    if (message.author.bot) return;

    if (message.content === `${prefix}ping`) {
        message.reply("Pong !");
    }
});


// Charger commandes et events puis se connecter
loadCommandsAndEvents().then(() => {
    client.login(process.env.DISCORD_TOKEN);
});

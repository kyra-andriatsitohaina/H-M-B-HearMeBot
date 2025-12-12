export default {
    name: "messageCreate",
    async execute(message, client) {
        if (message.author.bot) return;

        const prefix = process.env.PREFIX || "!";
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (err) {
            console.error(err);
            message.reply("Erreur lors de l'exécution de la commande !");
        }
    }
};

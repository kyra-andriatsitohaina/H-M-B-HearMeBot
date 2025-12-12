// commands/clear.js
import { PermissionsBitField } from 'discord.js';

export default {
    name: "clear",
    description: "Supprime un certain nombre de messages",
    async execute(message, args) {
        // Vérifier les permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("Tu n'as pas la permission de gérer les messages !");
        }

        // Vérifier le nombre d'arguments
        const nombre = parseInt(args[0]);
        if (!nombre || nombre < 1 || nombre > 100) {
            return message.reply("Tu dois indiquer un nombre entre 1 et 100.");
        }

        try {
            const messages = await message.channel.messages.fetch({ limit: nombre });
            await message.channel.bulkDelete(messages, true);
            message.channel.send(`✅ ${messages.size} messages supprimés !`).then(msg => {
                setTimeout(() => msg.delete(), 5000); // supprime le message de confirmation après 5s
            });
        } catch (err) {
            console.error(err);
            message.reply("Erreur lors de la suppression des messages.");
        }
    }
};

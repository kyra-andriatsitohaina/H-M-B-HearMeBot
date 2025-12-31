import fs from "fs";
import path from "path";
import axios from "axios";
import { speechToText } from "../utils/stt.js";

export default {
    name: "transcrire",
    description: "Transcrire un message vocal en texte",
    async execute(message) {

        const repliedMessage = message.reference
            ? await message.channel.messages.fetch(message.reference.messageId)
            : null;

        if (!repliedMessage || !repliedMessage.attachments.size) {
            return message.reply("Réponds à un message vocal pour le transcrire.");
        }

        const attachment = repliedMessage.attachments.first();
        if (!attachment.contentType?.startsWith("audio")) {
            return message.reply("Ce message n'est pas un fichier audio.");
        }

        const audioPath = path.resolve(`./stt-${Date.now()}.ogg`);

        try {
            // Télécharger l'audio
            const response = await axios({
                method: "GET",
                url: attachment.url,
                responseType: "stream"
            });

            const writer = fs.createWriteStream(audioPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            // Transcription
            const texte = await speechToText(audioPath);

            message.reply(`📝 **Transcription :**\n${texte || "Aucun texte détecté."}`);

        } catch (err) {
            console.error(err);
            message.reply("Erreur lors de la transcription.");
        } finally {
            try { fs.unlinkSync(audioPath); } catch(e) {}
        }
    }
};



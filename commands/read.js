import fs from 'fs';
import path from 'path';
import axios from 'axios';
import https from 'https';
import { getAudioUrl } from 'google-tts-api';
import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus 
} from '@discordjs/voice';

const SUPPORTED_LANGS = [
  'af','sq','ar','hy','bn','bs','ca','cs','cy','da','de','el','en','eo','es','et','fi','fr','gu',
  'hi','hr','hu','id','is','it','ja','jw','km','kn','ko','la','lv','ml','mr','ms','my','ne','nl',
  'no','pl','pt','ro','ru','si','sk','sl','sr','su','sv','sw','ta','te','th','tl','tr','uk','ur','vi','zh'
];

// Fonction pour télécharger le MP3 avec retentative
async function downloadMP3(url, filePath, retries = 3) {
    const agent = new https.Agent({ family: 4 }); // force IPv4

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios({
                method: 'GET',
                url,
                responseType: 'stream',
                httpsAgent: agent,
                timeout: 20000 // 20 secondes
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            return filePath; // succès
        } catch (err) {
            console.warn(`Tentative ${attempt} échouée : ${err.message}`);
            if (attempt === retries) throw new Error("Impossible de télécharger le fichier TTS !");
            await new Promise(r => setTimeout(r, 2000)); // attendre 2s avant réessayer
        }
    }
}

// Fonction principale TTS
export async function textToSpeech(texte, lang = 'fr') {
    if (!texte) throw new Error("Le texte est vide !");
    if (!SUPPORTED_LANGS.includes(lang)) lang = 'fr';

    const url = getAudioUrl(texte, {
        lang,
        slow: false,
        host: 'https://translate.google.com'
    });

    const filePath = path.resolve(`./tts-${Date.now()}.mp3`);
    await downloadMP3(url, filePath);
    return filePath;
}

// Commande Discord
export default {
    name: "lire",
    description: "Lire un message dans un salon vocal",
    async execute(message, args) {
        if (!args.length) return message.reply("Usage: !lire [langue] <texte>");

        let lang = 'fr';  
        let texte;

        if (SUPPORTED_LANGS.includes(args[0].toLowerCase())) {
            lang = args[0].toLowerCase();
            texte = args.slice(1).join(" ");
        } else {
            texte = args.join(" ");
        }

        if (!texte) return message.reply("Le texte est vide !");

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("Tu dois être dans un salon vocal !");

        try {
            const filePath = await textToSpeech(texte, lang);

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(filePath);

            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
                fs.unlink(filePath, err => {
                    if (err) console.error("Erreur suppression fichier:", err);
                });
            });

            message.reply(`Je lis en ${lang} : ${texte}`);
        } catch (err) {
            console.error(err);
            message.reply(`Erreur lors de la lecture du message : ${err.message}`);
        }
    }
};

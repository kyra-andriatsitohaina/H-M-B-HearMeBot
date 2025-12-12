import fs from 'fs';
import path from 'path';
import { getAudioUrl } from 'google-tts-api';
import axios from 'axios';
import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus 
} from '@discordjs/voice';

// Liste des langues supportées par google-tts-api
const SUPPORTED_LANGS = [
  'af','sq','ar','hy','bn','bs','ca','cs','cy','da','de','el','en','eo','es','et','fi','fr','gu',
  'hi','hr','hu','id','is','it','ja','jw','km','kn','ko','la','lv','ml','mr','ms','my','ne','nl',
  'no','pl','pt','ro','ru','si','sk','sl','sr','su','sv','sw','ta','te','th','tl','tr','uk','ur','vi','zh'
];

async function textToSpeech(texte, lang = 'fr') {
    if (!texte) throw new Error("Le texte est vide !");

    const url = getAudioUrl(texte, {
        lang,
        slow: false,
        host: 'https://translate.google.com',
    });

    const filePath = path.resolve(`./tts-${Date.now()}.mp3`);

    const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return filePath;
}

export default {
    name: "lire",
    description: "Lire un message dans un salon vocal",
    async execute(message, args) {
        if (!args.length) return message.reply("Usage: !lire [langue] <texte>");

        let lang = 'fr';  // Langue par défaut
        let texte;

        // Si le premier argument est une langue supportée, on l'utilise
        if (SUPPORTED_LANGS.includes(args[0].toLowerCase())) {
            lang = args[0].toLowerCase();
            texte = args.slice(1).join(" ");
        } else {
            // Sinon, tout est le texte et on reste en français
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
                try { fs.unlinkSync(filePath); } catch(e) { console.error(e); }
            });

            message.reply(`Je lis en ${lang} : ${texte}`);
        } catch (err) {
            console.error(err);
            message.reply("Erreur lors de la lecture du message !");
        }
    }
};

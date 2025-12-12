import gTTS from 'google-tts-api';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

export async function textToSpeech(texte, lang = 'fr') {
    if (!texte) throw new Error("Le texte est vide !");
    
    // Crée l'URL de Google TTS
    const url = gTTS.getAudioUrl(texte, {
        lang,
        slow: false,
        host: 'https://translate.google.com',
    });

    const filePath = path.resolve(`./tts-${Date.now()}.mp3`);

    // Télécharger le fichier MP3
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

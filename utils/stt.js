import fs from "fs";
import path from "path";
import axios from "axios";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function speechToText(audioPath) {
    if (!fs.existsSync(audioPath)) throw new Error("Fichier audio introuvable");

    const ext = path.extname(audioPath).toLowerCase();
    let contentType;
    if (ext === ".mp3") contentType = "audio/mpeg";
    else if (ext === ".wav") contentType = "audio/wav";
    else if (ext === ".ogg") contentType = "audio/ogg";
    else throw new Error("Format audio non supporté");

    const audioBuffer = fs.readFileSync(audioPath);

    const response = await axios({
        method: "POST",
        url: "https://api.deepgram.com/v1/listen?language=fr",
        headers: {
            "Authorization": `Token ${DEEPGRAM_API_KEY}`,
            "Content-Type": contentType
        },
        data: audioBuffer
    });

    return response.data.results.channels[0].alternatives[0].transcript || "";
}

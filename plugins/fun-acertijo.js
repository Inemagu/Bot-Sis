import fs from 'fs';
import similarity from 'similarity';
const threshold = 0.72;

let acertijos = JSON.parse(fs.readFileSync('./src/game/acertijo.json', 'utf-8'));
let tekateki = {}; // Almacena los acertijos activos por chat

// Comando para enviar un acertijo
let handler = async (m, { conn }) => {
    let acertijo = acertijos[Math.floor(Math.random() * acertijos.length)];
    
    // Inicia un nuevo acertijo para el chat
    let mensajeEnviado = await m.reply(`⭐ Acertijo:\n\n${acertijo.question}`);
    tekateki[m.chat] = {
        id: mensajeEnviado.id,  // Almacena el ID del mensaje de acertijo
        question: acertijo.question,
        response: acertijo.response,
        points: 10, // Cambia los puntos si prefieres
        timer: setTimeout(() => {
            conn.sendMessage(m.chat, { text: '🕐 Tiempo agotado! El acertijo ha Terminado.' });
            delete tekateki[m.chat];
        }, 60000) // Tiempo límite de 1 minuto (60000 ms)
    };
};

handler.help = ['acertijo']
handler.tags = ['fun']
handler.command = ['acertijo', 'adivinanza'];

// Verificación de respuesta
handler.before = async function(m) {
    const id = m.chat;

    // Verifica si el mensaje es de un usuario (no del bot)
    if (m.fromMe) return;

    // Verifica que haya un acertijo activo y que el mensaje citado sea el acertijo enviado por el bot
    if (
        tekateki[id] &&
        m.quoted && 
        m.quoted.fromMe && // Asegura que el mensaje citado sea del bot
        m.quoted.id === tekateki[id].id // Compara con el ID almacenado del mensaje de acertijo
    ) {
        const respuestaUsuario = m.text.toLowerCase().trim();
        const respuestaCorrecta = tekateki[id].response.toLowerCase().trim();

        // Verifica si la respuesta es exacta
        if (respuestaUsuario === respuestaCorrecta) {
            global.db.data.users[m.sender].estrellas += tekateki[id].points;
            m.reply(`🌟 *Respuesta correcta!*\n+${tekateki[id].points} puntos`);
            clearTimeout(tekateki[id].timer); // Limpia el temporizador
            delete tekateki[id]; // Elimina el acertijo
        } 
        // Verifica si la respuesta es "casi correcta" usando el umbral de similitud
        else if (similarity(respuestaUsuario, respuestaCorrecta) >= threshold) {
            m.reply('*Casi lo logras!*');
        } else {
            m.reply('*_Respuesta incorrecta! ❌_*');
        }
    } else if (tekateki[id] && !m.quoted) {
        // Si hay un acertijo activo pero el mensaje no es una respuesta citada, ignora el mensaje
        return true;
    }
};

export default handler;

// ai.js - WhatsApp Bot Plugin

const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

cmd({
    pattern: 'ai',
    alias: ['ai1', 'ai2', 'gpt', 'chatgpt'],
    desc: 'Chat with AI (non-button version)',
    category: 'main',
    react: '🧠',
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, reply }) => {
    try {
        // Check if user provided a query
        if (!q) return reply('❌ Please provide a message to send to the AI.');

        // Call the external AI API
        let response = await fetchJson(`https://chatgptforprabath-md.vercel.app/api/gptv1?q=${encodeURIComponent(q)}`);

        // Send AI response back to the user
        reply('🤖 AI Response:\n\n' + response.data);

    } catch (err) {
        console.error(err);
        reply('❌ Error: ' + err.message);
    }
});

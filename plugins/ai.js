const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: 'moviesub',
    desc: 'Get movie info + subtitles',
    category: 'media',
    react: '🎬',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Check if user replied to a message
        if (!m.quoted) return reply('📌 Please reply to a message with the movie name!');

        let movieName = m.quoted.text.trim();

        // Real API endpoint example (replace with working API)
        let res = await axios.get(`https://api.sampleapis.com/movies/action`);
        // For demo, pick first matching movie
        let movie = res.data.find(v => v.title.toLowerCase().includes(movieName.toLowerCase()));

        if (!movie) return reply('❌ Movie not found!');

        let msg = `🎥 Title: ${movie.title}\n🗓 Year: ${movie.releaseDate || 'N/A'}\n🌐 Genre: ${movie.genre || 'N/A'}\n\nSubtitle: ${movie.subtitles || 'No subtitles found'}`;

        await conn.sendMessage(from, { text: msg }, { quoted: m });

    } catch (err) {
        console.error(err);
        reply('❌ Error fetching movie data!');
    }
});

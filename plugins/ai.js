const { cmd } = require('../command');
const { SinhalaSub } = require('@sl-code-lords/movie-api');
const { SinhalaSubDL } = require('sinhalasub.lk');

cmd({
    pattern: 'sinhalasub',
    desc: 'Search for a movie and get details and download options.',
    category: 'movie',
    react: '💕',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const query = q.trim();
        if (!query) return reply('Please provide a movie or TV show name to search.');

        const searchResults = await SinhalaSub.get_list.by_search(query);

        if (!searchResults.status || searchResults.results.length === 0) 
            return reply('No results found.');

        // Build search result message
        let messageText = '*🧚‍♂️SUHAS-MD Search Results:*\n\n';
        searchResults.results.forEach((item, index) => {
            messageText += `${index + 1}. ${item.title}\nType: ${item.type}\nLink: ${item.link}\n\n`;
        });

        const sentMsg = await conn.sendMessage(from, {
            image: { url: 'https://i.ibb.co/02FQtBf/20241118-143715.jpg' },
            caption: messageText,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: mek });

        // Listen for number reply
        const handleNumberReply = async (update) => {
            const msg = update.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;

            const numberText = msg.message.extendedTextMessage.text.trim();
            const selectedIndex = parseInt(numberText) - 1;

            if (selectedIndex < 0 || selectedIndex >= searchResults.results.length) {
                await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                return reply('❗ Invalid selection. Please choose a valid number from the search results.');
            }

            const selectedMovie = searchResults.results[selectedIndex];
            const movieDetails = await SinhalaSub.movie(selectedMovie.link);

            if (!movieDetails || !movieDetails.details || !movieDetails.downloads) 
                return reply('❗ Movie details not found.');

            const details = movieDetails.details;
            let detailText = `*${details.title}*\n`;
            detailText += `📅 Release Date: ${details.release_date}\n`;
            detailText += `🌎 Country: ${details.country}\n`;
            detailText += `🎰 Duration: ${details.duration}\n`;
            const genres = Array.isArray(details.genres) ? details.genres.join(', ') : details.genres;
            detailText += `🧚‍♂️ Genres: ${genres}\n`;
            detailText += `⭐ IMDb Rating: ${details.IMDb_Rating}\n`;
            detailText += `🧚‍♂️ Director: ${details.director.join(', ')}\n\n`;
            detailText += '🔢 REPLY THE NUMBER YOU WANT\n\n';
            detailText += '*1. ➠ SD 480p*\n';
            detailText += '*2. ➠ HD 720p*\n';
            detailText += '*3. ➠ HHD 1080p*\n\n';
            detailText += '> *© Powered By 🧚‍♂️SUHAS-MD V8*';

            const poster = details.images && details.images.length > 0 ? details.images[0] : null;

            const downloadMsg = await conn.sendMessage(from, {
                image: { url: poster },
                caption: detailText,
                contextInfo: { forwardingScore: 999, isForwarded: true }
            }, { quoted: mek });

            // Listen for download option reply
            const handleDownloadReply = async (update) => {
                const replyMsg = update.messages[0];
                if (!replyMsg.message || !replyMsg.message.extendedTextMessage) return;
                const selectedOption = replyMsg.message.extendedTextMessage.text.trim();

                if (replyMsg.message.contextInfo.stanzaId !== downloadMsg.key.id) return;

                let quality;
                switch (selectedOption) {
                    case '1': quality = 'SD 480p'; break;
                    case '2': quality = 'HD 720p'; break;
                    case '3': quality = 'HHD 1080p'; break;
                    default:
                        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                        return reply('❗ Invalid option. Please select from 1, 2, or 3.');
                }

                try {
                    const fileUrl = await PixaldrainDL(selectedMovie.link, quality, 'video/mp4');
                    if (fileUrl) {
                        await conn.sendMessage(from, {
                            document: { url: fileUrl, mimetype: 'video/mp4', fileName: details.title + '.mp4' },
                            caption: details.title + '\n\n> *© Powered By 🧚‍♂️SUHAS-MD V8*'
                        }, { quoted: mek });
                        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
                    } else {
                        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                        reply('❗ Download link not found. Please try another quality.');
                    }
                } catch (err) {
                    console.log('Error in PixaldrainDL function:', err);
                    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                    reply('❗ An error occurred while processing your download request.');
                }
            };

            conn.ev.on('messages.upsert', handleDownloadReply);
            setTimeout(() => conn.ev.off('messages.upsert', handleDownloadReply), 60000);
        };

        conn.ev.on('messages.upsert', handleNumberReply);
        setTimeout(() => conn.ev.off('messages.upsert', handleNumberReply), 60000);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❗ Error: ' + err.message);
    }
});

const { cmd } = require('../command');
const { baiscopelksearch } = require('baiscopelk-api');
const axios = require("axios");
const cheerio = require("cheerio");

cmd({
    pattern: 'baiscopes',
    desc: 'Search Sinhala Subtitles from Baiscopes.lk',
    category: 'movie',
    react: '🎥',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const query = (q || "").trim();
        if (!query) return reply("❗ Please provide a movie name.\n👉 Example: .baiscopes Inception");

        const res = await baiscopelksearch(query);

        if (!res.results || res.results.length === 0) {
            return reply("❗ No results found on Baiscopes.lk");
        }

        // Build result list
        let msg = `*🔎 Baiscopes.lk Search Results for:* ${query}\n\n`;
        res.results.forEach((item, i) => {
            msg += `${i + 1}. 🎬 ${item.title}\n\n`;
        });

        const sent = await conn.sendMessage(from, { text: msg + "👉 Reply with the number to download subtitles." }, { quoted: mek });

        // Wait for reply
        const handleReply = async (update) => {
            const msgObj = update.messages[0];
            if (!msgObj.message?.extendedTextMessage) return;

            const number = msgObj.message.extendedTextMessage.text.trim();
            const index = parseInt(number) - 1;

            if (isNaN(index) || index < 0 || index >= res.results.length) {
                return reply("❗ Invalid number. Please select from the list.");
            }

            const selected = res.results[index];
            reply(`⏳ Fetching subtitle for *${selected.title}* ...`);

            try {
                // Fetch page & scrape download link
                const page = await axios.get(selected.url);
                const $ = cheerio.load(page.data);

                // baiscopes download link selector (adjust if site structure changes)
                const dlLink = $("a:contains('Download')").attr("href");

                if (!dlLink) {
                    return reply("❗ Could not find download link.");
                }

                // Send subtitle file
                await conn.sendMessage(from, {
                    document: { url: dlLink },
                    mimetype: "application/zip",
                    fileName: `${selected.title}-SinhalaSubtitles.zip`
                }, { quoted: mek });

            } catch (err) {
                console.error(err);
                reply("❗ Error fetching subtitle: " + err.message);
            }
        };

        conn.ev.on("messages.upsert", handleReply);
        setTimeout(() => conn.ev.off("messages.upsert", handleReply), 60000); // auto off after 1min

    } catch (e) {
        console.error(e);
        reply("❗ Error while searching Baiscopes: " + e.message);
    }
});

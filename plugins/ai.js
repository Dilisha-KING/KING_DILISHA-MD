const axios = require("axios");
const cheerio = require("cheerio");
const { cmd } = require("../command");

let cache = {}; // temporary movie cache per user

cmd({
    pattern: "sinhalasub",
    desc: "Search SinhalaSub movies",
    category: "movie",
    react: "🎬",
    filename: __filename
}, async (bot, message, match, { from, reply }) => {
    try {
        if (!match) return reply("📌 *Usage:* .sinhalasub movie-name");

        const searchQuery = match.trim().replace(/ /g, "+");
        const url = `https://sinhalasub.net/?s=${searchQuery}`;

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let results = [];
        $(".post-title a").each((i, el) => {
            const title = $(el).text().trim();
            const link = $(el).attr("href");
            results.push({ title, link });
        });

        if (results.length === 0) return reply("❌ No movies found!");

        // Save cache for this user
        cache[from] = results.slice(0, 5);

        // Send numbered list
        let txt = `🎬 *SinhalaSub Search Results for* _${match}_\n\n`;
        cache[from].forEach((res, i) => {
            txt += `${i + 1}. ${res.title}\n`;
        });
        txt += `\n📌 Reply with a number (1-${cache[from].length}) to get details.`;

        await bot.sendMessage(from, { text: txt });

    } catch (e) {
        console.error(e);
        reply("⚠️ Error fetching from SinhalaSub!");
    }
});

// Handle number replies
cmd({
    pattern: "^\\d+$",
    dontAddCommandList: true
}, async (bot, message, match, { from, reply }) => {
    try {
        const num = parseInt(match);
        if (!cache[from] || !cache[from][num - 1]) return;

        const movie = cache[from][num - 1];

        // Fetch movie page
        const { data } = await axios.get(movie.link);
        const $ = cheerio.load(data);

        const desc = $(".entry-content p").first().text().trim();
        let downloads = [];
        $(".entry-content a").each((i, el) => {
            const btn = $(el).text().trim();
            const href = $(el).attr("href");
            if (href && href.includes("http")) {
                downloads.push({ btn, href });
            }
        });

        let txt = `🎬 *${movie.title}*\n\n📝 ${desc}\n\n📥 *Download Links:*\n`;
        downloads.forEach((d, i) => {
            txt += `${i + 1}. ${d.btn}\n🔗 ${d.href}\n\n`;
        });

        await bot.sendMessage(from, { text: txt });
        delete cache[from]; // clear cache after use

    } catch (e) {
        console.error(e);
        reply("⚠️ Error loading movie details!");
    }
});

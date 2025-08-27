const axios = require("axios");
const cheerio = require("cheerio");
const { cmd } = require("../command");

let cache = {}; // temporary movie cache per user

// SEARCH COMMAND
cmd({
    pattern: "sinhalasub",
    desc: "Search SinhalaSub movies",
    category: "movie",
    filename: __filename
}, async (bot, message, match, { from, reply }) => {
    try {
        if (!match || typeof match !== "string") 
            return reply("📌 *Usage:* .sinhalasub movie-name");

        const searchQuery = match.trim().replace(/ /g, "+");
        const url = `https://sinhalasub.net/?s=${searchQuery}`;

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let results = [];
        $(".post-title a").each((i, el) => {
            const title = $(el).text().trim();
            const link = $(el).attr("href");
            if (title && link) results.push({ title, link });
        });

        if (results.length === 0) return reply("❌ No movies found!");

        cache[from] = results.slice(0, 5);

        setTimeout(() => delete cache[from], 5 * 60 * 1000);

        let txt = `🎬 *SinhalaSub Search Results for* _${match}_\n\n`;
        cache[from].forEach((res, i) => {
            txt += `${i + 1}. ${res.title}\n`;
        });
        txt += `\n📌 Reply with a number (1-${cache[from].length}) to get details.`;

        const sentMsg = await bot.sendMessage(from, { text: txt });

        if (bot.react) await bot.react(sentMsg.key, "🎬");

    } catch (e) {
        console.error(e);
        reply("⚠️ Error fetching from SinhalaSub!");
    }
});

// HANDLE NUMBER REPLIES
cmd({
    pattern: "^\\d+$",
    dontAddCommandList: true
}, async (bot, message, match, { from, reply }) => {
    try {
        if (!match || isNaN(parseInt(match))) return;

        const num = parseInt(match);
        if (!cache[from] || !cache[from][num - 1]) return;

        const movie = cache[from][num - 1];

        const { data } = await axios.get(movie.link);
        const $ = cheerio.load(data);

        let desc = "";
        $(".entry-content p").each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 20 && !desc) desc = text;
        });

        let downloads = [];
        $(".entry-content a").each((i, el) => {
            const btn = $(el).text().trim();
            const href = $(el).attr("href");
            if (href && href.includes("http") && /download|drive|mega/i.test(btn)) {
                downloads.push({ btn, href });
            }
        });

        let txt = `🎬 *${movie.title}*\n\n📝 ${desc || "No description available."}\n\n📥 *Download Links:*\n`;
        downloads.forEach((d, i) => {
            txt += `${i + 1}. ${d.btn}\n🔗 ${d.href}\n\n`;
        });

        const sentMsg = await bot.sendMessage(from, { text: txt });

        if (bot.react) await bot.react(sentMsg.key, "🎬");

        delete cache[from];

    } catch (e) {
        console.error(e);
        reply("⚠️ Error loading movie details!");
    }
});

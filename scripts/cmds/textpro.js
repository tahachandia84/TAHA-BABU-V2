const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "textpro",
    aliases: ["logo", "maker"],
    version: "5.0.0",
    author: "Taha Khan",
    countDown: 5,
    role: 0,
    description: {
      en: "Generate TextPro Logos (Blackpink, Cartoon, Foggy, etc.)",
      ur: "Textpro logos banayein jisme Blackpink bhi shamil hai"
    },
    category: "graphics",
    guide: {
      en: "{pn} [style] [text] OR {pn} painting [text1] | [text2]",
      ur: "{pn} [style] [text] YA {pn} painting [text1] | [text2]"
    }
  },

  async onStart({ api, event, args }) {
    const { threadID, messageID } = event;

    // Yahan Blackpink API wapis add kar di gayi hai (Type 1: Single Text)
    const apiMap = {
      "blackpink": { url: "https://api.nexray.eu.cc/textpro/blackpink", type: 1 },
      "cartoon": { url: "https://api.nexray.eu.cc/textpro/cartoon-graffiti", type: 1 },
      "foggy": { url: "https://api.nexray.eu.cc/textpro/foggy-glass", type: 1 },
      "devilwings": { url: "https://api.nexray.eu.cc/textpro/devil-wings", type: 1 },
      "painting": { url: "https://api.nexray.eu.cc/textpro/painting", type: 2 }
    };

    const stylesList = Object.keys(apiMap);

    if (args.length === 0) {
      return api.sendMessage(
        `❌ **Aapne style ya text nahi likha!**\n\n` +
        `💡 *Istemaal ka tarika:*\n` +
        `• \`.textpro blackpink Taha\`\n` +
        `• \`.textpro cartoon Taha Khan\`\n` +
        `• \`.textpro painting King | Taha\`\n\n` +
        `🎨 **Mawjooda Styles (${stylesList.length}):**\n` +
        `\`${stylesList.join(", ")}\``,
        threadID,
        messageID
      );
    }

    const selectedStyle = args[0].toLowerCase();

    // Check if style exists in the active list
    if (!apiMap[selectedStyle]) {
      return api.sendMessage(
        `❌ **Yeh style majood nahi hai!**\n\n` +
        `🎨 **Working Styles:**\n\`${stylesList.join(", ")}\``,
        threadID,
        messageID
      );
    }

    const textInput = args.slice(1).join(" ");

    if (!textInput) {
      return api.sendMessage(`❌ Baraye meherbani **${selectedStyle.toUpperCase()}** ke liye text bhi likhein!`, threadID, messageID);
    }

    if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `logo_${Date.now()}.png`);

    try {
      let targetApiUrl = "";
      const apiConfig = apiMap[selectedStyle];

      // Double Text Logic (For Painting)
      if (apiConfig.type === 2) {
        let t1 = "Love"; // Pehla text by default
        let t2 = textInput; // Dusra text by default
        
        if (textInput.includes("|")) {
          const parts = textInput.split("|");
          t1 = parts[0].trim();
          t2 = parts[1].trim();
        }
        targetApiUrl = `${apiConfig.url}?text1=${encodeURIComponent(t1)}&text2=${encodeURIComponent(t2)}`;
      } 
      // Single Text Logic (For Blackpink, Cartoon, Foggy, Devilwings)
      else {
        targetApiUrl = `${apiConfig.url}?text=${encodeURIComponent(textInput)}`;
      }

      // API ko call karna
      const res = await axios.get(targetApiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 25000 
      });

      let imageUrl = null;

      // Handle Direct Image OR JSON Response
      if (res.headers['content-type'] && res.headers['content-type'].includes('image')) {
        imageUrl = targetApiUrl;
      } 
      else if (res.data && typeof res.data === "object") {
        imageUrl = res.data?.result || res.data?.url || res.data?.data || res.data?.image;
      } 
      else if (typeof res.data === "string" && res.data.startsWith("http")) {
        imageUrl = res.data;
      }

      if (!imageUrl) {
        if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ API ne image nahi di. (Server masla hai)`, threadID, messageID);
      }

      // Download Image
      const imgRes = await axios({
        method: "get",
        url: imageUrl,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      imgRes.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);

      const msg = `╭━━━〔 𝗟𝗢𝗚𝗢 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥 〕━━━╮\n` +
                  `🎨 𝗦𝘁𝘆𝗹𝗲: ${selectedStyle.toUpperCase()}\n` +
                  `📝 𝗧𝗲𝗭𝘁: ${textInput.replace("|", "-")}\n` +
                  `👑 𝗢𝗪𝗡𝗘𝗥: 𝗧𝗔𝗛𝗔 𝗞𝗛𝗔𝗡\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━━╯`;

      await api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        messageID
      );

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    } catch (err) {
      console.error("[LOGO GENERATOR ERROR]:", err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      
      let errorDetais = `❌ **${selectedStyle.toUpperCase()}** logo generate karne me error aaya!`;
      if (err.response) {
        errorDetais += `\n\n⚠️ API Status: ${err.response.status}\n(Lagta hai yeh API style down hai)`;
      } else {
        errorDetais += `\n\n⚠️ Masla: ${err.message}`;
      }
      
      return api.sendMessage(errorDetais, threadID, messageID);
    }
  }
};

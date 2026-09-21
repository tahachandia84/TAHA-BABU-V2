 const fs = require("fs-extra");
const path = require("path");
const https = require("https");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "1.7", 
    author: "𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍",
    countDown: 5,
    role: 0,
    description: "Change the bot's prefix or show current prefix.",
    category: "system",
    guide: {
      en: "{pn} <new prefix> : change prefix in this chat\n" +
          "{pn} <new prefix> -g : change global prefix (admin only)\n" +
          "{pn} reset : reset to default\n" +
          "Just type \"prefix\""
    }
  },

  langs: {
    en: {
      reset: "✨ ʏᴏᴜʀ ᴘʀᴇғɪx ʀᴇsᴇᴛ ᴛᴏ ᴅᴇғᴀᴜʟᴛ: %1",
      onlyAdmin: "❌ ᴏɴʟʏ ᴀᴅᴍɪɴ ᴄᴀɴ ᴄʜᴀɴɢᴇ ᴛʜᴇ sʏsᴛᴇᴍ ᴘʀᴇғɪx",
      confirmGlobal: "🪶 ᴘʟᴇᴀsᴇ ʀᴇᴀᴄᴛ ᴛᴏ ᴛʜɪs ᴍᴇssᴀɢᴇ ᴛᴏ ᴄᴏɴғɪʀᴍ sʏsᴛᴇᴍ ᴘʀᴇғɪx ᴄʜᴀɴɢᴇ",
      confirmThisThread: "🪶 ᴘʟᴇᴀsᴇ ʀᴇᴀᴄᴛ ᴛᴏ ᴛʜɪs ᴍᴇssᴀɢᴇ ᴛᴏ ᴄᴏɴғɪʀᴍ ᴄʜᴀɴɢᴇ ɪɴ ᴛʜɪs ᴄʜᴀᴛ",
      successGlobal: "✅ ᴄʜᴀɴɢᴇᴅ sʏsᴛᴇᴍ ᴘʀᴇғɪx ᴛᴏ: %1\n🔄 Please restart the bot to apply globally.",
      successThisThread: "✅ ᴄʜᴀɴɢᴇᴅ ᴘʀᴇғɪx ɪɴ ᴛʜɪs ᴄʜᴀᴛ ᴛᴏ: %1",
      myPrefix: "✨⋆⁺₊⋆ ────────── ୨✨\n\n" +
                "🌸𝐀𝐒𝐒𝐀𝐋𝐀𝐌𝐔𝐀𝐋𝐀𝐈𝐊𝐔𝐌🦋\n" +
                "✨𝐇𝐞𝐥𝐥𝐨  %1  I'm  %4 at your service 🫡\n" +
                " ╰┈➤ \n 📌 𝐏𝐑𝐄𝐅𝐈𝐗 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍\n" +
                " ╰┈➤🌐 Global:  %2\n" +
                " ➥ 💬 This Chat:  %3\n\n"+
                "〔 🎀 𝐎𝐰𝐧𝐞𝐫 : —͞𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 😈 〕\n\n" +
                "╰──────────────⧕"
    }
  },

  onStart: async function({ message, role, args, commandName, event, threadsData, getLang, api }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] === 'reset') {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix,
      setGlobal: args[1] === "-g"
    };

    if (formSet.setGlobal && role < 2) return message.reply(getLang("onlyAdmin"));

    return message.reply(
      formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread"),
      (err, info) => {
        if (err) return;
        global.GoatBot.onReaction.set(info.messageID, formSet);
      }
    );
  },

  onReaction: async function({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      return message.reply(getLang("successGlobal", newPrefix));
    } else {
      // কী-টি সহজ করে দেওয়া হয়েছে যাতে কোর হ্যান্ডলার দ্রুত চিনতে পারে
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  onChat: async function({ event, message, getLang, usersData }) {
    if (!event.body || event.body.toLowerCase() !== "prefix") return;

    const userName = await usersData.getName(event.senderID);
    const botName = global.GoatBot.config.nickNameBot || "Bot";
    const globalPrefix = global.GoatBot.config.prefix;
    const threadPrefix = utils.getPrefix(event.threadID) || globalPrefix;

    const mediaURLs = [
      "https://i.imgur.com/F4UeGdJ.mp4",
      "https://i.imgur.com/W06OhiM.mp4", 
    ];

    // মিডিয়া ডাউনলোডার লজিক (আপনার আগের কোডের মতোই)
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const indexFile = path.join(cacheDir, "prefix_media_index.json");
    let index = 0;
    if (fs.existsSync(indexFile)) {
      try { index = (JSON.parse(fs.readFileSync(indexFile, "utf8")).index + 1) % mediaURLs.length; } catch (e) {}
    }
    fs.writeFileSync(indexFile, JSON.stringify({ index }));

    const mediaPath = path.join(cacheDir, `prefix_media_${index}.mp4`);
    if (!fs.existsSync(mediaPath)) {
        await downloadFile(mediaURLs[index], mediaPath);
    }

    return message.reply({
      body: getLang("myPrefix", userName, globalPrefix, threadPrefix, botName),
      attachment: fs.existsSync(mediaPath) ? [fs.createReadStream(mediaPath)] : []
    });
  }
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });
      }

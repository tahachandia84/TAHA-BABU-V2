const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "1.3.1",
    author: "𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍",
    role: 0,
    shortDescription: "Owner information with image",
    category: "Information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ api, event }) {
    const ownerText = 
`╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮
│ 👤 Nᴀᴍᴇ       : 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 
│ 🧸 Nɪᴄᴋ       : 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 
│ 🎂 Aɢᴇ        : 18+
│ 💘 Rᴇʟᴀᴛɪᴏɴ : Sɪɴɢʟᴇ
│ 🎓 Pʀᴏғᴇssɪᴏɴ : Sᴛᴜᴅᴇɴᴛ
│ 📚 Eᴅᴜᴄᴀᴛɪᴏɴ : ♡❥
├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮
│ 📘 Facebook  : "https://www.facebook.com/profile.php?id=61590284352509",
│ 💬 Messenger: "https://m.me/6159092284352509",
│ 📞 WhatsApp  : wa.me/923474771404
╰────────────────╯`;

    // আপনার দেওয়া ছবির লিংক এখানে বসানো হয়েছে
    const imgLink = "https://i.imgur.com/1tUVG85.jpeg"; 

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, `owner_${Date.now()}.jpg`);

    try {
      // cache ফোল্ডার তৈরি করা (যদি আগে থেকে না থাকে)
      await fs.ensureDir(cacheDir);

      // axios দিয়ে ছবি ডাউনলোড করা
      const imgRes = await axios.get(imgLink, { responseType: "arraybuffer" });
      await fs.writeFile(imgPath, Buffer.from(imgRes.data));

      // ছবি ও মেসেজ পাঠানো
      api.sendMessage(
        {
          body: ownerText,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => {
          // মেসেজ পাঠানোর পর cache থেকে ছবি ডিলিট করে দেওয়া
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        },
        event.messageID
      );
    } catch (error) {
      console.log("Image download error: ", error);
      
      // কোনো কারণে ছবি ডাউনলোড না হলে শুধু টেক্সট মেসেজটি পাঠাবে
      api.sendMessage(ownerText, event.threadID, event.messageID);
    }
  }
};

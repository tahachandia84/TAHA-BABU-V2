const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "wish",
    version: "2.0",
    author: "Siam Ahmed Saan Cᴏɴᴠᴇʀᴛ Bʏ MOHAMMAD AKASH",
    role: 0,
    shortDescription: "Beautiful happy birthday wish",
    longDescription: "Generate a premium style birthday wish card with avatar",
    category: "birthday",
    guide: {
      en: "{pn} @tag"
    }
  },

  wrapText(ctx, text, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      const words = text.split(" ");
      const lines = [];
      let line = "";

      for (let word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth) {
          lines.push(line.trim());
          line = word + " ";
        } else line = testLine;
      }
      lines.push(line.trim());
      resolve(lines);
    });
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const bgPath = __dirname + "/cache/bgc.png";
      const avtPath = __dirname + "/cache/avt.png";

      const mentionID = Object.keys(event.mentions)[0] || event.senderID;

      const targetName = await usersData.getName(mentionID);
      const senderName = await usersData.getName(event.senderID);

      // Background
      const bgURL = "https://i.postimg.cc/k4RS69d8/20230921-195836.png";

      // Fetch avatar
      const avtData = (
        await axios.get(
          `https://graph.facebook.com/${mentionID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      fs.writeFileSync(avtPath, Buffer.from(avtData, "utf-8"));

      // Fetch bg
      const bgData = (await axios.get(bgURL, { responseType: "arraybuffer" }))
        .data;
      fs.writeFileSync(bgPath, Buffer.from(bgData, "utf-8"));

      // Canvas
      const bg = await loadImage(bgPath);
      const avt = await loadImage(avtPath);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Avatar Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(270, 470, 200, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avt, 70, 270, 400, 400);
      ctx.restore();

      // Name text
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";

      const nameLines = await this.wrapText(ctx, targetName, 900);
      ctx.fillText(nameLines.join("\n"), 550, 420);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(bgPath, imageBuffer);

      // Premium Birthday Message
      const caption =
        `🎉💐✨ *Happy Birthday, ${targetName}!* ✨💐🎉\n\n` +
        `🌟 আজকের এই দিনটা তোমার জন্য অতি বিশেষ! 🌟\n` +
        `কারণ আজ তোমার জন্মদিন — Happiness & Blessings এর দিন! 🎂💝\n\n` +
        `💖 তোমার হাসি যেন সবসময় এমনই উজ্জ্বল থাকে,\n` +
        `💖 স্বপ্নগুলো সত্যি হোক,\n` +
        `💖 জীবনটা রঙে ভরে উঠুক ✨✨\n\n` +
        `🩷 *Many Many Happy Returns Of The Day!* 🎉\n` +
        `🕊️ আল্লাহ তোমার জন্য সুন্দর পথ সহজ করে দিন!\n\n` +
        `— Best Wishes From: *${senderName}* 💙`;

      api.sendMessage(
        {
          body: caption,
          mentions: [
            {
              id: mentionID,
              tag: targetName
            }
          ],
          attachment: fs.createReadStream(bgPath)
        },
        event.threadID,
        () => {
          fs.unlinkSync(bgPath);
          fs.unlinkSync(avtPath);
        }
      );
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Eʀʀᴏʀ Pʟᴇᴀsᴇ Tʀʏ Aɢᴀɪɴ ", event.threadID);
    }
  }
};

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cb"],
    version: "1.0",
    author: "Siam Ahmed Saan",
    countDown: 5,
    role: 0,
    shortDescription: "Upload file to catbox.moe",
    category: "media",
    guide: {
      en: "Reply to an image/video"
    }
  },

  onStart: async function ({ message, event, api }) {
    if (!event.messageReply || !event.messageReply.attachments) {
      return message.reply("Reply to an image or video");
    }

    const attachment = event.messageReply.attachments[0];
    api.setMessageReaction("⏳", event.messageID);

    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir);
    const tempPath = path.join(cacheDir, `upload_${Date.now()}.tmp`);

    try {
      const dlRes = await axios({ url: attachment.url, responseType: 'stream' });
      const writer = fs.createWriteStream(tempPath);
      dlRes.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', fs.createReadStream(tempPath));

      const uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: {
          ...form.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://catbox.moe',
          'Referer': 'https://catbox.moe/'
        }
      });

      await fs.unlink(tempPath);
      api.setMessageReaction("✅", event.messageID);
      message.reply(uploadRes.data);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID);
      message.reply(`Failed: ${err.message}`);
      if (fs.existsSync(tempPath)) await fs.unlink(tempPath);
    }
  }
};

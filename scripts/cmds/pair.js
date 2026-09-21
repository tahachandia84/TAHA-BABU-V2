const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let createCanvas, loadImage;
try {
  const canvas = require("canvas");
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
} catch (e) {}

const BEST_FILE = path.join(__dirname, "cache", "best_match.json");
const CACHE_DIR = path.join(__dirname, "cache");

const TEMPLATES = [
  { url: "https://files.catbox.moe/xmsmrt.jpeg", maleSide: "left",  left: { x: 0.22, y: 0.48, size: 0.26 }, right: { x: 0.72, y: 0.48, size: 0.26 } },
  { url: "https://files.catbox.moe/dkbxze.jpeg", maleSide: "left",  left: { x: 0.28, y: 0.28, size: 0.24 }, right: { x: 0.68, y: 0.30, size: 0.24 } },
  { url: "https://files.catbox.moe/c5syq8.jpeg", maleSide: "right", left: { x: 0.25, y: 0.18, size: 0.22 }, right: { x: 0.68, y: 0.16, size: 0.22 } },
  { url: "https://files.catbox.moe/awasn6.jpeg", maleSide: "right", left: { x: 0.28, y: 0.35, size: 0.24 }, right: { x: 0.65, y: 0.38, size: 0.24 } },
  { url: "https://files.catbox.moe/voo30r.jpeg", maleSide: "right", left: { x: 0.22, y: 0.32, size: 0.22 }, right: { x: 0.68, y: 0.30, size: 0.22 } }
];

const RANDOM_GIFS = [
  "https://files.catbox.moe/i9yxez.gif",
  "https://files.catbox.moe/a3r48n.gif",
  "https://files.catbox.moe/6lnz86.gif",
  "https://files.catbox.moe/u3ip3u.gif",
  "https://files.catbox.moe/ydl2aq.gif",
  "https://files.catbox.moe/gp5ulj.gif"
];

const TITLES = [
  "💘 Perfect Match",
  "💞 Soulmates",
  "✨ Destiny Pair",
  "🌌 Cosmic Love",
  "💓 Heart Sync",
  "👑 Ultimate Couple",
  "🔒 Love Locked",
  "🌹 Made For Each Other"
];

function getBadge(p) {
  if (p >= 95) return "🏆 LEGENDARY";
  if (p >= 88) return "💯 PERFECT";
  if (p >= 78) return "🔥 GREAT";
  if (p >= 68) return "😊 GOOD";
  return "🙂 NICE";
}

function makeCaption(percent, title) {
  const list = [
    `${title}\n\n💓 𝐋𝐎𝐕𝐄 𝐂𝐔𝐏𝐋: ${percent}%`,
    `${title}\n\n💘 Love Score: ${percent}%`,
    `${title}\n\n✨ Compatibility: ${percent}%`
  ];
  return list[Math.floor(Math.random() * list.length)];
}

async function loadAvatar(uid) {
  if (!loadImage) return null;
  const urls = [
    `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
    `https://graph.facebook.com/${uid}/picture?type=large&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
    `https://graph.facebook.com/${uid}/picture?width=512&height=512`,
    `https://graph.facebook.com/${uid}/picture?type=large`
  ];
  for (const url of urls) {
    try {
      const img = await loadImage(url);
      if (img && img.width >= 80) return img;
    } catch (e) {}
  }
  return null;
}

async function downloadBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(res.data);
  } catch (e) {
    return null;
  }
}

async function createTemplatePair(senderID, targetID, senderName, targetName, senderGender, percent) {
  if (!createCanvas || !loadImage) return null;
  try {
    const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const bg = await loadImage(tpl.url);
    const W = bg.width;
    const H = bg.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, W, H);

    let leftID, rightID, leftName, rightName;
    if (tpl.maleSide === "left") {
      if (senderGender === "male") {
        leftID = senderID; leftName = senderName;
        rightID = targetID; rightName = targetName;
      } else {
        leftID = targetID; leftName = targetName;
        rightID = senderID; rightName = senderName;
      }
    } else {
      if (senderGender === "male") {
        rightID = senderID; rightName = senderName;
        leftID = targetID; leftName = targetName;
      } else {
        rightID = targetID; rightName = targetName;
        leftID = senderID; leftName = senderName;
      }
    }

    const leftImg = await loadAvatar(leftID);
    const rightImg = await loadAvatar(rightID);

    function drawCircle(img, x, y, size) {
      if (!img) return;
      const r = size / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x - r, y - r, size, size);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(4, size * 0.04);
      ctx.stroke();
    }

    const ls = tpl.left.size * Math.min(W, H);
    const rs = tpl.right.size * Math.min(W, H);
    drawCircle(leftImg, tpl.left.x * W, tpl.left.y * H, ls);
    drawCircle(rightImg, tpl.right.x * W, tpl.right.y * H, rs);

    return canvas.toBuffer("image/png");
  } catch (e) {
    console.error("createTemplatePair:", e.message);
    return null;
  }
}

/**
 * SAAN স্টাইল — getThreadInfo().userInfo থেকে এক কলেই gender
 * ছেলে → মেয়ে, মেয়ে → ছেলে
 */
async function pickOppositePartner(api, threadID, senderID, botID) {
  const thread = await api.getThreadInfo(threadID);
  const users = thread.userInfo || [];

  const me = users.find(u => String(u.id) === String(senderID));
  let myGender = (me?.gender || "").toUpperCase(); // MALE / FEMALE

  // userInfo তে gender না থাকলে fallback
  if (!myGender || (myGender !== "MALE" && myGender !== "FEMALE")) {
    try {
      const info = await api.getUserInfo(senderID);
      const g = info[senderID]?.gender;
      if (g === 1 || g === "female" || g === "FEMALE") myGender = "FEMALE";
      else if (g === 2 || g === "male" || g === "MALE") myGender = "MALE";
      else myGender = "MALE";
    } catch (e) {
      myGender = "MALE";
    }
  }

  let candidates = [];
  if (myGender === "MALE") {
    candidates = users.filter(
      u => u.gender === "FEMALE" && String(u.id) !== String(senderID) && String(u.id) !== String(botID)
    );
  } else {
    candidates = users.filter(
      u => u.gender === "MALE" && String(u.id) !== String(senderID) && String(u.id) !== String(botID)
    );
  }

  // অপর জেন্ডার না থাকলে যেকোনো মেম্বার
  if (!candidates.length) {
    candidates = users.filter(
      u => String(u.id) !== String(senderID) && String(u.id) !== String(botID)
    );
  }

  if (!candidates.length) return null;

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    targetID: selected.id,
    targetName: selected.name || "Partner",
    senderGender: myGender === "FEMALE" ? "female" : "male",
    users
  };
}

module.exports = {
  config: {
    name: "pair",
    version: "3.0.0",
    author: "JABED D KURÕ",
    countDown: 5,
    role: 0,
    description: {
      en: "Find random couple with opposite gender (boy↔girl)",
      bn: "ছেলে-মেয়ে মিলিয়ে random জুটি খোঁজো"
    },
    category: "fun",
    guide: {
      en: "{pn}\n{pn} @tag\n{pn} (reply)\n{pn} best\n{pn} gif",
      bn: "{pn}\n{pn} @ট্যাগ\n{pn} (রিপ্লাই)\n{pn} best\n{pn} gif"
    }
  },

  langs: {
    en: {
      waiting: "💘 Finding your perfect match...",
      noMembers: "❌ | No suitable match found in this group!",
      selfPair: "❌ | You cannot pair with yourself!",
      noBest: "❌ | No best match recorded today yet.",
      bestTitle: "🏆 Today's Best Match",
      error: "❌ | Something went wrong. Try again."
    },
    bn: {
      waiting: "💘 তোমার পারফেক্ট ম্যাচ খোঁজা হচ্ছে...",
      noMembers: "❌ | গ্রুপে উপযুক্ত ম্যাচ পাওয়া যায়নি!",
      selfPair: "❌ | নিজের সাথে পেয়ার করা যাবে না!",
      noBest: "❌ | আজকের বেস্ট ম্যাচ এখনো হয়নি।",
      bestTitle: "🏆 আজকের বেস্ট ম্যাচ",
      error: "❌ | কিছু সমস্যা হয়েছে। আবার চেষ্টা করো।"
    }
  },

  onStart: async function ({ api, event, args, message, usersData, getLang }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;
    const botID = api.getCurrentUserID();
    const firstArg = (args[0] || "").toLowerCase();
    const wantGif = firstArg === "gif";

    try {
      try {
        await api.setMessageReaction("😍", messageID, () => {}, true);
      } catch (e) {}

      // ===== .pair best =====
      if (firstArg === "best") {
        const best = await fs.readJson(BEST_FILE).catch(() => null);
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
        if (!best || best.date !== today) {
          return message.reply(getLang("noBest"));
        }
        return message.reply(
          getLang("bestTitle") +
          "\n\n💞 " + best.senderName + " + " + best.targetName +
          "\n⭐ Score: " + best.percent + "%\n" + best.badge
        );
      }

      let waiting = null;
      try {
        waiting = await message.reply(getLang("waiting"));
      } catch (e) {}

      let targetID = null;
      let targetName = "Partner";
      let senderGender = "male";
      let senderName = "You";

      // রিপ্লাই / ট্যাগ
      if (messageReply && messageReply.senderID) {
        targetID = messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length) {
        targetID = Object.keys(mentions)[0];
      }

      if (targetID && String(targetID) === String(senderID)) {
        if (waiting) try { await api.unsendMessage(waiting.messageID); } catch (e) {}
        return message.reply(getLang("selfPair"));
      }

      // Random opposite gender (SAAN style — ১টা getThreadInfo)
      if (!targetID) {
        const picked = await pickOppositePartner(api, threadID, senderID, botID);
        if (!picked) {
          if (waiting) try { await api.unsendMessage(waiting.messageID); } catch (e) {}
          return message.reply(getLang("noMembers"));
        }
        targetID = picked.targetID;
        targetName = picked.targetName;
        senderGender = picked.senderGender;

        const me = (picked.users || []).find(u => String(u.id) === String(senderID));
        if (me?.name) senderName = me.name;
      } else {
        // ট্যাগ/রিপ্লাই মোডে gender + নাম
        try {
          const thread = await api.getThreadInfo(threadID);
          const users = thread.userInfo || [];
          const me = users.find(u => String(u.id) === String(senderID));
          const partner = users.find(u => String(u.id) === String(targetID));

          if (me?.name) senderName = me.name;
          if (partner?.name) targetName = partner.name;

          const g = (me?.gender || "").toUpperCase();
          if (g === "FEMALE") senderGender = "female";
          else if (g === "MALE") senderGender = "male";
        } catch (e) {}
      }

      // নাম আরও নিশ্চিত করতে
      try {
        const n1 = await usersData.getName(senderID);
        if (n1) senderName = n1;
        const n2 = await usersData.getName(targetID);
        if (n2) targetName = n2;
      } catch (e) {}

      const percent = Math.floor(Math.random() * 36) + 65; // 65–100
      const badge = getBadge(percent);
      const title = TITLES[Math.floor(Math.random() * TITLES.length)];
      const caption = makeCaption(percent, title);

      // Daily best আপডেট
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      const prev = await fs.readJson(BEST_FILE).catch(() => null);
      if (!prev || prev.date !== today || percent > prev.percent) {
        await fs.ensureDir(path.dirname(BEST_FILE));
        await fs.writeJson(BEST_FILE, {
          date: today,
          senderName,
          targetName,
          percent,
          badge
        });
      }

      const body =
        caption +
        "\n\n👤 " + senderName +
        "\n💑 " + targetName +
        "\n" + badge;

      const senderIdx = body.indexOf(senderName);
      const targetIdx = body.indexOf(targetName, senderIdx + senderName.length);

      const msgMentions = [];
      if (senderIdx !== -1) {
        msgMentions.push({ tag: senderName, id: senderID, fromIndex: senderIdx });
      }
      if (targetIdx !== -1) {
        msgMentions.push({ tag: targetName, id: targetID, fromIndex: targetIdx });
      }
      if (msgMentions.length < 2) {
        msgMentions.length = 0;
        msgMentions.push({ tag: senderName, id: senderID });
        msgMentions.push({ tag: targetName, id: targetID });
      }

      if (waiting) {
        try { await api.unsendMessage(waiting.messageID); } catch (e) {}
      }

      await fs.ensureDir(CACHE_DIR);

      let buffer = null;
      let ext = "png";

      if (wantGif) {
        const gifUrl = RANDOM_GIFS[Math.floor(Math.random() * RANDOM_GIFS.length)];
        buffer = await downloadBuffer(gifUrl);
        ext = "gif";
      } else {
        buffer = await createTemplatePair(senderID, targetID, senderName, targetName, senderGender, percent);
        if (!buffer) {
          const gifUrl = RANDOM_GIFS[Math.floor(Math.random() * RANDOM_GIFS.length)];
          buffer = await downloadBuffer(gifUrl);
          ext = "gif";
        }
      }

      const msgData = {
        body,
        mentions: msgMentions
      };

      if (buffer) {
        const file = path.join(CACHE_DIR, "pair_" + Date.now() + "." + ext);
        await fs.writeFile(file, buffer);
        msgData.attachment = fs.createReadStream(file);
        try {
          await message.reply(msgData);
          try { await fs.unlink(file); } catch (e) {}
          return;
        } catch (e) {
          console.error("Upload failed:", e.message);
        }
      }

      return message.reply(msgData);

    } catch (err) {
      console.error("Pair Error:", err);
      return message.reply(getLang("error"));
    }
  }
};

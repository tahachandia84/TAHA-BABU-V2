const os = require("os");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const W = 490, H = 840;
const AVATAR1 = "https://i.imgur.com/1tUVG85.jpeg";
const FALLBACK_AVATAR = "https://i.imgur.com/1tUVG85.jpeg"; // fallback if error

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

async function drawDodecagonAvatar(ctx, url, x, y, size, ringColors) {
  const sides = 12;
  const radius = size / 2;

  for (let i = 0; i < ringColors.length; i++) {
    ctx.beginPath();
    for (let j = 0; j < sides; j++) {
      const angle = (Math.PI * 2 / sides) * j;
      const rx = x + radius + Math.cos(angle) * (radius + i * 8);
      const ry = y + radius + Math.sin(angle) * (radius + i * 8);
      if (j === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.strokeStyle = ringColors[i];
    ctx.lineWidth = 4;
    ctx.shadowColor = ringColors[i];
    ctx.shadowBlur = 20;
    ctx.stroke();
  }

  let img;
  try { img = await loadImage(url); }
  catch { img = await loadImage(FALLBACK_AVATAR); }

  ctx.save();
  ctx.beginPath();
  for (let j = 0; j < sides; j++) {
    const angle = (Math.PI * 2 / sides) * j;
    const rx = x + radius + Math.cos(angle) * radius;
    const ry = y + radius + Math.sin(angle) * radius;
    if (j === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

async function drawPage1(ctx) {
  
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#4b006e");
  gradient.addColorStop(1, "#1a001f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const particles = [
    { x: 50, y: 120, r: 3 }, { x: 120, y: 230, r: 2.5 },
    { x: 300, y: 180, r: 3.5 }, { x: 400, y: 310, r: 2 },
    { x: 180, y: 360, r: 3 }, { x: 420, y: 430, r: 2.2 },
    { x: 80, y: 500, r: 3.2 }, { x: 350, y: 520, r: 2.7 },
    { x: 220, y: 600, r: 3.8 }, { x: 430, y: 670, r: 2.6 }
  ];
  for (const p of particles) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 102, 204, 0.15)";
    ctx.shadowColor = "rgba(255, 102, 204, 0.7)";
    ctx.shadowBlur = 10;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  await drawDodecagonAvatar(ctx, AVATAR1, W / 2 - 90, 60, 180, [
    "#ff99cc", "#ff33aa", "#cc0077"
  ]);

  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff99cc";
  ctx.shadowColor = "#ff33aa";
  ctx.shadowBlur = 25;
  ctx.fillText("TAHA KHAN ", W / 2, 295); // slightly lower

  ctx.font = "italic 20px Arial";
  ctx.fillStyle = "#ff66cc";
  ctx.shadowColor = "#cc3399";
  ctx.shadowBlur = 15;
  ctx.fillText("Owner Information", W / 2, 330);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(40, 360, W - 80, 360);

  ctx.strokeStyle = "#cc3399";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#ff66cc";
  ctx.shadowBlur = 12;
  ctx.strokeRect(40, 360, W - 80, 360);

  ctx.font = "22px Arial";
  ctx.fillStyle = "#f2ccff";
  ctx.shadowColor = "#cc33aa";
  ctx.shadowBlur = 12;

  const lines = [
    "Nickname: TAHA KHAN ", "Age: 18+", "DOB: 10 Oct 2007*",
    "Gender: Male", "Religion: Islam", "Nationality: pakistan ",
    "Location: LAHOER ", "Class: Hsc candidate",
    `Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Karachi" })}`
  ];
  let y = 400;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 38;
  }

  ctx.font = "italic 18px Arial";
  ctx.fillStyle = "#e673ff";
  ctx.shadowColor = "#ff99ff";
  ctx.shadowBlur = 25;
  const obf = String.fromCharCode(169) + "TAHA KHAN";
  ctx.fillText(obf, W / 2, H - 35);
}

module.exports = {
  config: {
    name: "info",
    aliases: ["in4", "ownerinfo"],
    version: "1.0",
    author: "TAHA KHAN",
    countDown: 5,
    role: 0,
    shortDescription: "Owner info",
    category: "information"
  },

  onStart: async function ({ message }) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    await drawPage1(ctx);

    const buffer = canvas.toBuffer("image/png");
    const dir = path.join(__dirname, "cache");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const filePath = path.join(dir, `info_page.png`);
    fs.writeFileSync(filePath, buffer);
    return message.reply({ attachment: fs.createReadStream(filePath) });
  }
};

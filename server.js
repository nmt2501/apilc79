const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

/* ================== API GỐC ================== */
const API_TX  = "https://lc79md5.vercel.app/lc79/tx";
const API_MD5 = "https://lc79md5.vercel.app/lc79/md5";

/* ================== BIẾN ================== */
let historyTX = [];
let historyMD5 = [];

let lastTX = null;
let lastMD5 = null;

let lastPhienTX = null;
let lastPhienMD5 = null;

const MAX_HISTORY = 80;

/* ================== TOOL ================== */
const toTX = kq => (kq === "Tài" ? "T" : "X");

/* ================== BUILD RUN ================== */
function buildRuns(pattern) {
  if (!pattern || pattern.length === 0) return [];
  const runs = [];
  let cur = pattern[0];
  let len = 1;

  for (let i = 1; i < pattern.length; i++) {
    if (pattern[i] === cur) len++;
    else {
      runs.push({ v: cur, l: len });
      cur = pattern[i];
      len = 1;
    }
  }
  runs.push({ v: cur, l: len });
  return runs;
}

function buildCau(pattern, take = 3) {
  const runs = buildRuns(pattern);
  if (runs.length === 0) return null;
  return runs.slice(-take).map(r => r.l).join("-");
}

/* ================== THUẬT TOÁN CHUẨN ================== */
function predictAdvanced(pattern) {
  if (!pattern || pattern.length < 7) return null;

  const runs = buildRuns(pattern).slice(-7);
  const lens = runs.map(r => r.l);
  const last = runs[runs.length - 1];

  let action = null;
  let du_doan = null;
  let score = 60;

  const cau = lens.slice(-3).join("-");

  // ===== BỆT DÀI =====
  if (last.l >= 4) {
    action = "BE";
    du_doan = last.v === "T" ? "X" : "T";
    score += last.l * 5;
  }

  // ===== CẦU ĐỀU =====
  else if (
    lens[lens.length - 1] === lens[lens.length - 2] &&
    lens[lens.length - 2] === lens[lens.length - 3]
  ) {
    action = "THEO";
    du_doan = last.v;
    score += 18;
  }

  // ===== CẦU 1-1 =====
  else if (last.l === 1 && lens[lens.length - 2] === 1) {
    action = "BE";
    du_doan = last.v === "T" ? "X" : "T";
    score += 12;
  }

  // ===== CẦU 1-3-1 / 3-1-1 =====
  else if (cau === "1-3-1" || cau === "3-1-1") {
    action = "BE";
    du_doan = last.v === "T" ? "X" : "T";
    score += 20;
  }

  if (!du_doan) return null;

  score = Math.min(92, Math.max(72, score));

  return {
    du_doan: du_doan === "T" ? "Tài" : "Xỉu",
    do_tin_cay: `${score}%`,
    cau,
    chien_luoc: action === "THEO" ? "Theo cầu" : "Bẻ cầu"
  };
}

/* ================== FETCH TX ================== */
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX, { timeout: 5000 });
    if (data.phien !== lastPhienTX) {
      lastPhienTX = data.phien;
      lastTX = data;
      historyTX.push(toTX(data.ket_qua));
      if (historyTX.length > MAX_HISTORY) historyTX.shift();
      console.log("TX ▶", data.phien, data.ket_qua);
    }
  } catch {
    console.log("TX ERROR");
  }
}

/* ================== FETCH MD5 ================== */
async function fetchMD5() {
  try {
    const { data } = await axios.get(API_MD5, { timeout: 5000 });
    if (data.phien !== lastPhienMD5) {
      lastPhienMD5 = data.phien;
      lastMD5 = data;
      historyMD5.push(toTX(data.ket_qua));
      if (historyMD5.length > MAX_HISTORY) historyMD5.shift();
      console.log("MD5 ▶", data.phien, data.ket_qua);
    }
  } catch {
    console.log("MD5 ERROR");
  }
}

/* ================== START FETCH ================== */
fetchTX();
fetchMD5();
setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== API TX ================== */
app.get("/api/lc79/tx", (req, res) => {
  const pattern = historyTX.join("");
  const pred = predictAdvanced(pattern);

  res.json({
    phien: lastTX?.phien ?? null,
    xuc_xac_1: lastTX?.xuc_xac_1 ?? null,
    xuc_xac_2: lastTX?.xuc_xac_2 ?? null,
    xuc_xac_3: lastTX?.xuc_xac_3 ?? null,
    tong: lastTX?.tong ?? null,
    ket_qua: lastTX?.ket_qua ?? null,

    phien_hien_tai: lastTX ? lastTX.phien + 1 : null,

    du_doan: pred?.du_doan ?? null,
    do_tin_cay: pred?.do_tin_cay ?? null,

    pattern,
    cau: pred?.cau ?? buildCau(pattern),

    id: "BI NHOI - LC79 VIP PRO"
  });
});

/* ================== API MD5 ================== */
app.get("/api/lc79/md5", (req, res) => {
  const pattern = historyMD5.join("");
  const pred = predictAdvanced(pattern);

  res.json({
    phien: lastMD5?.phien ?? null,
    xuc_xac_1: lastMD5?.xuc_xac_1 ?? null,
    xuc_xac_2: lastMD5?.xuc_xac_2 ?? null,
    xuc_xac_3: lastMD5?.xuc_xac_3 ?? null,
    tong: lastMD5?.tong ?? null,
    ket_qua: lastMD5?.ket_qua ?? null,

    phien_hien_tai: lastMD5 ? lastMD5.phien + 1 : null,

    du_doan: pred?.du_doan ?? null,
    do_tin_cay: pred?.do_tin_cay ?? null,

    pattern,
    cau: pred?.cau ?? buildCau(pattern),

    id: "BI NHOI - LC79 VIP PRO"
  });
});

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 LC79 API RUNNING ON PORT", PORT);
});

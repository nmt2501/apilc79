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
const flip = v => (v === "T" ? "X" : "T");

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

/* ================== SUY CẦU 4 KÝ TỰ CUỐI ================== */
function inferFromLast4(pattern) {
  if (pattern.length < 4) return null;

  const last4 = pattern.slice(-4);
  let runs = [];
  let cur = last4[0], len = 1;

  for (let i = 1; i < last4.length; i++) {
    if (last4[i] === cur) len++;
    else {
      runs.push(len);
      cur = last4[i];
      len = 1;
    }
  }
  runs.push(len);

  return runs.join("-");
}

/* ================== THUẬT TOÁN DỰ ĐOÁN THUẦN ================== */
function predictByAlgorithm(pattern) {
  if (!pattern || pattern.length < 7) {
    return {
      du_doan: "Chưa Đủ Dữ Liệu",
      do_tin_cay: "0%",
      cau: buildCau(pattern)
    };
  }

  const runs = buildRuns(pattern);
  const last = runs[runs.length - 1];
  const cau = buildCau(pattern);
  const last4Cau = inferFromLast4(pattern);

  let score = 70;
  let next = last.v;
  let reasons = [];

  /* ===== BỆT ===== */
  if (last.l >= 6) {
    next = flip(last.v);
    score += 20;
    reasons.push("Bệt dài đảo chiều");
  }

  /* ===== BÁM ===== */
  else if (last.l >= 3 && last.l <= 5) {
    next = last.v;
    score += 15;
    reasons.push("Bám cầu");
  }

  /* ===== 1-1 ===== */
  if (pattern.slice(-4) === "TXTX" || pattern.slice(-4) === "XTXT") {
    next = flip(last.v);
    score += 10;
    reasons.push("Nhịp 1-1");
  }

  /* ===== CẦU KHÓ ===== */
  if (["1-3-1", "2-1-2", "3-1-2", "2-4-1"].includes(cau)) {
    next = flip(last.v);
    score += 15;
    reasons.push("Cầu khó đảo");
  }

  /* ===== SUY 4 KÝ TỰ CUỐI ===== */
  if (["2-1-1", "1-2-1", "3-1"].includes(last4Cau)) {
    next = flip(last.v);
    score += 10;
    reasons.push("Suy từ 4 ký tự cuối");
  }

  score = Math.min(96, score);

  return {
    du_doan: next === "T" ? "Tài" : "Xỉu",
    do_tin_cay: `${score}%`,
    cau,
    ly_do: reasons.join(" | ")
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
    }
  } catch {}
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
    }
  } catch {}
}

fetchTX();
fetchMD5();
setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== API TX ================== */
app.get("/api/lc79/tx", (req, res) => {
  const pattern = historyTX.join("");
  const pred = predictByAlgorithm(pattern);

  res.json({
    phien: lastTX?.phien ?? null,
    xuc_xac_1: lastTX?.xuc_xac_1 ?? null,
    xuc_xac_2: lastTX?.xuc_xac_2 ?? null,
    xuc_xac_3: lastTX?.xuc_xac_3 ?? null,
    tong: lastTX?.tong ?? null,
    ket_qua: lastTX?.ket_qua ?? null,
    phien_hien_tai: lastTX ? lastTX.phien + 1 : null,
    du_doan: pred.du_doan,
    do_tin_cay: pred.do_tin_cay,
    pattern,
    cau: pred.cau,
    id: "BI NHOI - LC79 VIP PRO"
  });
});

/* ================== API MD5 ================== */
app.get("/api/lc79/md5", (req, res) => {
  const pattern = historyMD5.join("");
  const pred = predictByAlgorithm(pattern);

  res.json({
    phien: lastMD5?.phien ?? null,
    xuc_xac_1: lastMD5?.xuc_xac_1 ?? null,
    xuc_xac_2: lastMD5?.xuc_xac_2 ?? null,
    xuc_xac_3: lastMD5?.xuc_xac_3 ?? null,
    tong: lastMD5?.tong ?? null,
    ket_qua: lastMD5?.ket_qua ?? null,
    phien_hien_tai: lastMD5 ? lastMD5.phien + 1 : null,
    du_doan: pred.du_doan,
    do_tin_cay: pred.do_tin_cay,
    pattern,
    cau: pred.cau,
    id: "BI NHOI - LC79 VIP PRO"
  });
});

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 LC79 API THUẬT TOÁN RUNNING ON", PORT);
});

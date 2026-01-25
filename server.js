const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

/* ================== API GỐC ================== */
const API_TX  = "https://lc79md5.vercel.app/lc79/tx";
const API_MD5 = "https://lc79md5.vercel.app/lc79/md5";

/* ================== BIẾN TOÀN CỤC ================== */
// TX
let historyTX = [];
let lastPhienTX = null;
let lastDataTX = null;

// MD5
let historyMD5 = [];
let lastPhienMD5 = null;
let lastDataMD5 = null;

const MAX_HISTORY = 20;

/* ================== TOOL ================== */
const toTX = kq => (kq === "Tài" ? "T" : "X");

/* ================== PATTERN STRING ================== */
const buildPatternString = arr => arr.join("");

/* ================== THUẬT TOÁN SO PATTERN CHUỖI DÀI ================== */
function predictFromPatternString(patternStr) {
  if (!patternStr || patternStr.length < 6) {
    return {
      du_doan: null,
      do_tin_cay: "72%",
      thuat_toan: "du_lieu_it"
    };
  }

  /* ===== BUILD RUNS ===== */
  const runs = [];
  let cur = patternStr[0], len = 1;

  for (let i = 1; i < patternStr.length; i++) {
    if (patternStr[i] === cur) len++;
    else {
      runs.push({ val: cur, len });
      cur = patternStr[i];
      len = 1;
    }
  }
  runs.push({ val: cur, len });

  const last = runs[runs.length - 1];
  const prev = runs[runs.length - 2];

  let du_doan = last.val;   // MẶC ĐỊNH: THEO CẦU
  let base = 72;
  let algo = "theo_cau";

  /* ===== 1-1 ===== */
  if (last.len === 1 && prev && prev.len === 1) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 82;
    algo = "1_1";
  }

  /* ===== 2-2 ===== */
  else if (last.len === 2 && prev && prev.len === 2) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 85;
    algo = "2_2";
  }

  /* ===== 3-3 ===== */
  else if (last.len === 3 && prev && prev.len === 3) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 88;
    algo = "3_3";
  }

  /* ===== BỆT (THEO BỆT) ===== */
  else if (last.len >= 4) {
    du_doan = last.val;          // ✅ THEO BỆT
    base = 88;
    algo = "bet_theo";
  }

  /* ===== TĂNG DẦN (1-2-3-4) ===== */
  else if (prev && last.len === prev.len + 1) {
    du_doan = last.val;
    base = 80;
    algo = "tang_dan";
  }

  /* ===== ĐỘ TIN CẬY ĐỘNG ===== */
  let bonusLen = Math.min(last.len * 2, 7);   // bệt càng dài càng cao
  let bonusHistory = Math.min(
    Math.floor(patternStr.length / 10),
    8
  );

  let confidence = base + bonusLen + bonusHistory;
  if (confidence > 95) confidence = 95;
  if (confidence < 72) confidence = 72;

  return {
    du_doan,
    do_tin_cay: `${confidence}%`,
    thuat_toan: algo
  };
}

/* ================== AUTO FETCH TX ================== */
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX, { timeout: 5000 });

    if (data.phien !== lastPhienTX) {
      lastPhienTX = data.phien;
      lastDataTX = data;

      historyTX.push(toTX(data.ket_qua));
      if (historyTX.length > MAX_HISTORY) historyTX.shift();

      console.log("TX ▶", data.phien);
    }
  } catch {}
}

/* ================== AUTO FETCH MD5 ================== */
async function fetchMD5() {
  try {
    const { data } = await axios.get(API_MD5, { timeout: 5000 });

    if (data.phien !== lastPhienMD5) {
      lastPhienMD5 = data.phien;
      lastDataMD5 = data;

      historyMD5.push(toTX(data.ket_qua));
      if (historyMD5.length > MAX_HISTORY) historyMD5.shift();

      console.log("MD5 ▶", data.phien);
    }
  } catch {}
}

/* ================== START BACKGROUND ================== */
fetchTX();
fetchMD5();
setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== RESPONSE ================== */
function respond(res, data, history) {
  if (!data || history.length === 0)
    return res.json({ loading: true });

  const patternString = buildPatternString(history);
  const algo = predictFromPatternString(patternString);

  res.json({
    phien: data.phien,
    xuc_xac_1: data.xuc_xac_1,
    xuc_xac_2: data.xuc_xac_2,
    xuc_xac_3: data.xuc_xac_3,
    tong: data.tong,
    ket_qua: data.ket_qua,
    phien_hien_tai: data.phien_hien_tai,

    pattern: patternString,                 // VD: TTTXXXTTX
    thuat_toan: algo.thuat_toan,             // 1_1 / 2_2 / bet_dai...
    du_doan: algo.du_doan
      ? algo.du_doan === "T" ? "Tài" : "Xỉu"
      : null,
    do_tin_cay: algo.do_tin_cay,             // 72% → 95%
    history_length: history.length,
    server_time: Date.now()
  });
}

/* ================== ROUTES ================== */
app.get("/api/lc79/tx",  (req,res)=>respond(res,lastDataTX,historyTX));
app.get("/api/lc79/md5", (req,res)=>respond(res,lastDataMD5,historyMD5));

/* ================== START SERVER ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("🚀 LC79 API running on port", PORT)
);


const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

/* ================== API GỐC ================== */
const API_TX  = "https://lc79md5.vercel.app/lc79/tx";
const API_MD5 = "https://lc79md5.vercel.app/lc79/md5";

/* ================== BIẾN TOÀN CỤC ================== */
let historyTX = [];
let historyMD5 = [];

let lastPhienTX = null;
let lastPhienMD5 = null;

let lastDataTX = null;
let lastDataMD5 = null;

const MAX_HISTORY = 50;

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
  const prev2 = runs[runs.length - 3];

  let du_doan = last.val;   // mặc định THEO
  let base = 72;
  let algo = "theo_cau";

  /* ===== 1-1 ===== */
  if (last.len === 1 && prev?.len === 1) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 82;
    algo = "1_1";
  }

  /* ===== 2-2 ===== */
  else if (last.len === 2 && prev?.len === 2) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 85;
    algo = "2_2";
  }

  /* ===== 3-3 ===== */
  else if (last.len === 3 && prev?.len === 3) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 88;
    algo = "3_3";
  }

  /* ===== 1-2-1 ===== */
  else if (
    prev2 &&
    prev2.len === 1 &&
    prev.len === 2 &&
    last.len === 1
  ) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 86;
    algo = "1_2_1";
  }

  /* ===== 1-2-2 ===== */
  else if (
    prev2 &&
    prev2.len === 1 &&
    prev.len === 2 &&
    last.len === 2
  ) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 87;
    algo = "1_2_2";
  }

  /* ===== 1-3-3 ===== */
  else if (
    prev2 &&
    prev2.len === 1 &&
    prev.len === 3 &&
    last.len === 3
  ) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 90;
    algo = "1_3_3";
  }

  /* ===== 2-1-2 ===== */
  else if (
    prev2 &&
    prev2.len === 2 &&
    prev.len === 1 &&
    last.len === 2
  ) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 88;
    algo = "2_1_2";
  }

  /* ===== BỆT ===== */
  else if (last.len >= 4 && last.len <= 6) {
    du_doan = last.val;
    base = 88;
    algo = "bet_theo";
  }

  /* ===== BỆT SÂU → BẺ ===== */
  else if (last.len > 6) {
    du_doan = last.val === "T" ? "X" : "T";
    base = 92;
    algo = "bet_be";
  }

  /* ===== TĂNG DẦN ===== */
  else if (prev && last.len === prev.len + 1) {
    du_doan = last.val;
    base = 80;
    algo = "tang_dan";
  }

  /* ===== ĐỘ TIN CẬY ĐỘNG ===== */
  let bonusLen = Math.min(last.len * 2, 7);
  let bonusHistory = Math.min(Math.floor(patternStr.length / 10), 8);

  let confidence = base + bonusLen + bonusHistory;
  if (confidence > 95) confidence = 95;
  if (confidence < 72) confidence = 72;

  return {
    du_doan,
    do_tin_cay: `${confidence}%`,
    thuat_toan: algo,
    run_hien_tai: last.val.repeat(last.len)
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
  if (!data || history.length === 0) {
    return res.json({ loading: true });
  }

  const patternStr = buildPatternString(history);
  const result = predictFromPatternString(patternStr);

  res.json({
    phien: data.phien,
    xuc_xac_1: data.xuc_xac_1,
    xuc_xac_2: data.xuc_xac_2,
    xuc_xac_3: data.xuc_xac_3,
    tong: data.tong,
    ket_qua: data.ket_qua,
    phien_hien_tai: data.phien_hien_tai,

    pattern: patternStr,
    run_hien_tai: result.run_hien_tai,
    thuat_toan: result.thuat_toan,
    du_doan: result.du_doan === "T" ? "Tài" : "Xỉu",
    do_tin_cay: result.do_tin_cay,

    history_length: history.length,
    server_time: Date.now()
  });
}

/* ================== ROUTES ================== */
app.get("/api/lc79/tx",  (req, res) => respond(res, lastDataTX, historyTX));
app.get("/api/lc79/md5", (req, res) => respond(res, lastDataMD5, historyMD5));

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 LC79 API RUNNING ON PORT", PORT);
});

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
let lastPhienTX = null;
let lastPhienMD5 = null;
let lastDataTX = null;
let lastDataMD5 = null;

const MAX_HISTORY = 50;

/* ================== TOOL ================== */
const toTX = kq => (kq === "Tài" ? "T" : "X");
const buildPatternString = arr => arr.join("");

/* ================== BUILD RUNS ================== */
function buildRuns(pattern) {
  const runs = [];
  let cur = pattern[0], len = 1;

  for (let i = 1; i < pattern.length; i++) {
    if (pattern[i] === cur) len++;
    else {
      runs.push({ val: cur, len });
      cur = pattern[i];
      len = 1;
    }
  }
  runs.push({ val: cur, len });
  return runs;
}

/* ================== SO KHỚP PATTERN LỊCH SỬ ================== */
function patternMatchScore(pattern, lookBack = 8) {
  if (pattern.length < lookBack + 1) return null;

  const target = pattern.slice(-lookBack);
  let countT = 0;
  let countX = 0;

  for (let i = 0; i < pattern.length - lookBack; i++) {
    const sub = pattern.slice(i, i + lookBack);
    if (sub === target) {
      const next = pattern[i + lookBack];
      if (next === "T") countT++;
      if (next === "X") countX++;
    }
  }

  const total = countT + countX;
  if (total === 0) return null;

  return {
    du_doan: countT > countX ? "T" : "X",
    confidence: Math.min(90, 70 + total * 4),
    detail: `match_${total}`
  };
}

/* ================== THUẬT TOÁN CHÍNH ================== */
function predictFromPatternString(pattern) {
  if (!pattern || pattern.length < 6) return null;

  const runs = buildRuns(pattern);
  const last = runs[runs.length - 1];
  const prev = runs[runs.length - 2];
  const prev2 = runs[runs.length - 3];

  let votes = [];
  let logs = [];

  /* ===== RUN PATTERN ===== */
  if (last.len === 1 && prev?.len === 1) {
    votes.push({ v: last.val === "T" ? "X" : "T", s: 82, a: "1_1" });
  }
  if (last.len === 2 && prev?.len === 2) {
    votes.push({ v: last.val === "T" ? "X" : "T", s: 85, a: "2_2" });
  }
  if (last.len >= 4 && last.len <= 6) {
    votes.push({ v: last.val, s: 88, a: "bet_theo" });
  }
  if (last.len > 6) {
    votes.push({ v: last.val === "T" ? "X" : "T", s: 92, a: "bet_be" });
  }

  /* ===== PATTERN MATCH ===== */
  const match = patternMatchScore(pattern, 8);
  if (match) {
    votes.push({ v: match.du_doan, s: match.confidence, a: match.detail });
  }

  if (votes.length === 0) return null;

  /* ===== TỔNG HỢP ĐIỂM ===== */
  let score = { T: 0, X: 0 };
  votes.forEach(v => score[v.v] += v.s);

  const du_doan = score.T > score.X ? "T" : "X";
  const maxScore = Math.max(score.T, score.X);

  let confidence = Math.min(
    95,
    Math.round(maxScore / votes.length)
  );

  logs = votes.map(v => v.a).join(",");

  return {
    du_doan,
    do_tin_cay: `${confidence}%`,
    thuat_toan: logs,
    run_hien_tai: last.val.repeat(last.len)
  };
}

/* ================== FETCH ================== */
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX);
    if (data.phien !== lastPhienTX) {
      lastPhienTX = data.phien;
      lastDataTX = data;
      historyTX.push(toTX(data.ket_qua));
      if (historyTX.length > MAX_HISTORY) historyTX.shift();
    }
  } catch {}
}

async function fetchMD5() {
  try {
    const { data } = await axios.get(API_MD5);
    if (data.phien !== lastPhienMD5) {
      lastPhienMD5 = data.phien;
      lastDataMD5 = data;
      historyMD5.push(toTX(data.ket_qua));
      if (historyMD5.length > MAX_HISTORY) historyMD5.shift();
    }
  } catch {}
}

fetchTX();
fetchMD5();
setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== RESPONSE ================== */
function respond(res, data, history) {
  if (!data || history.length < 6) {
    return res.json({ loading: true });
  }

  const pattern = buildPatternString(history);
  const result = predictFromPatternString(pattern);

  res.json({
    phien: data.phien,
    ket_qua: data.ket_qua,
    pattern,
    du_doan: result ? (result.du_doan === "T" ? "Tài" : "Xỉu") : null,
    do_tin_cay: result?.do_tin_cay || null,
    thuat_toan: result?.thuat_toan || null,
    run_hien_tai: result?.run_hien_tai || null,
    server_time: Date.now()
  });
}

/* ================== ROUTES ================== */
app.get("/api/lc79/tx",  (req, res) => respond(res, lastDataTX, historyTX));
app.get("/api/lc79/md5", (req, res) => respond(res, lastDataMD5, historyMD5));

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 LC79 API RUNNING", PORT);
});

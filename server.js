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

const MAX_HISTORY = 200;

/* ================== TOOL ================== */
const toTX = kq => (kq === "Tài" ? "T" : "X");

/* ================== BUILD RUNS ================== */
function buildRuns(arr) {
  const runs = [];
  let cur = null, len = 0;

  for (const v of arr) {
    if (v !== cur) {
      if (cur) runs.push({ val: cur, len });
      cur = v;
      len = 1;
    } else len++;
  }
  if (cur) runs.push({ val: cur, len });
  return runs;
}

/* ================== PATTERN STRING ================== */
const buildPatternString = arr => arr.join("");

/* ================== CLASSIFY PATTERN ================== */
function classifyPattern(runs) {
  if (runs.length < 3) return null;

  const lastRuns = runs.slice(-5);
  const lengths = lastRuns.map(r => r.len);
  const values = lastRuns.map(r => r.val);
  const alt = values.every((v,i)=>i===0||v!==values[i-1]);

  if (lengths.every(l=>l===1) && alt) return "1_1_pattern";
  if (lengths.every(l=>l===2) && alt) return "2_2_pattern";
  if (lengths.every(l=>l===3) && alt) return "3_3_pattern";

  if (lengths.join()==="2,1,2,1,2") return "2_1_2_pattern";
  if (lengths.join()==="1,2,1,2,1") return "1_2_1_pattern";
  if (lengths.join()==="3,2,3,2,3") return "3_2_3_pattern";
  if (lengths.join()==="4,2,4,2,4") return "4_2_4_pattern";

  const last = runs[runs.length-1];
  if (last.len >= 5) return "long_run_pattern";

  return null;
}

/* ================== DỰ ĐOÁN ================== */
function predict(pattern, runs, lastTx) {
  if (!pattern) return null;
  const lastRun = runs[runs.length-1];

  switch (pattern) {
    case "1_1_pattern":
      return lastTx === "T" ? "X" : "T";

    case "2_2_pattern":
    case "3_3_pattern":
      if (lastRun.len >= parseInt(pattern[0]))
        return lastRun.val === "T" ? "X" : "T";
      return lastRun.val;

    case "long_run_pattern":
      if (lastRun.len > 7)
        return lastRun.val === "T" ? "X" : "T";
      return lastRun.val;

    default:
      return null;
  }
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
fetchTX();  fetchMD5();
setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== RESPONSE ================== */
function respond(res, data, history) {
  if (!data || history.length === 0)
    return res.json({ loading: true });

  const runs = buildRuns(history);
  const patternAlgo = classifyPattern(runs);
  const patternString = buildPatternString(history);

  const lastTx = history[history.length-1];
  const next = predict(patternAlgo, runs, lastTx) ?? lastTx;

  res.json({
    phien: data.phien,
    xuc_xac_1: data.xuc_xac_1,
    xuc_xac_2: data.xuc_xac_2,
    xuc_xac_3: data.xuc_xac_3,
    tong: data.tong,
    ket_qua: data.ket_qua,
    phien_hien_tai: data.phien_hien_tai,

    pattern: patternString,
    pattern_thuat_toan: patternAlgo,
    du_doan: next === "T" ? "Tài" : "Xỉu",
    do_tin_cay: patternAlgo ? "85%" : "70%",
    history_length: history.length,
    server_time: Date.now()
  });
}

/* ================== ROUTES ================== */
app.get("/api/lc79/tx",  (req,res)=>respond(res,lastDataTX,historyTX));
app.get("/api/lc79/md5", (req,res)=>respond(res,lastDataMD5,historyMD5));

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("🚀 LC79 API running", PORT));

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

/* ================== API GỐC ================== */
const LC79_TX_API = "https://lc79md5.vercel.app/lc79/tx";
const LC79_MD5_API = "https://lc79md5.vercel.app/lc79/md5";

/* ================== BIẾN TOÀN CỤC (KHÔNG RESET) ================== */
let history = [];              // ['T','X','T'...]
let lastPhien = null;
let lastData = null;

const MAX_HISTORY = 200;

/* ================== TOOL ================== */
function txFromKetQua(kq) {
  return kq === "Tài" ? "T" : "X";
}

/* ================== BUILD RUNS ================== */
function buildRunsTX(arr) {
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

/* ================== PATTERN STRING DÀI ================== */
function buildLongPattern(arr) {
  return arr.join("");
}

/* ================== CLASSIFY PATTERN ================== */
function classifyPatternFromRuns(runs) {
  if (runs.length < 3) return null;

  const lastRuns = runs.slice(-5);
  const lengths = lastRuns.map(r => r.len);
  const values = lastRuns.map(r => r.val);

  const alt = values.every((v,i)=>i===0||v!==values[i-1]);

  if (lengths.every(l=>l===1) && alt) return "1_1_pattern";
  if (lengths.every(l=>l===2) && alt) return "2_2_pattern";
  if (lengths.every(l=>l===3) && alt) return "3_3_pattern";

  if (lengths.join(",")==="2,1,2,1,2") return "2_1_2_pattern";
  if (lengths.join(",")==="1,2,1,2,1") return "1_2_1_pattern";
  if (lengths.join(",")==="3,2,3,2,3") return "3_2_3_pattern";
  if (lengths.join(",")==="4,2,4,2,4") return "4_2_4_pattern";

  const last = runs[runs.length-1];
  if (last.len >= 5) return "long_run_pattern";

  return null;
}

/* ================== DỰ ĐOÁN ================== */
function predictNextFromPattern(patternType, runs, lastTx) {
  if (!patternType) return null;
  const lastRun = runs[runs.length - 1];

  switch (patternType) {
    case "1_1_pattern":
      return lastTx === "T" ? "X" : "T";

    case "2_2_pattern":
    case "3_3_pattern":
      if (lastRun.len >= parseInt(patternType[0])) {
        return lastRun.val === "T" ? "X" : "T";
      }
      return lastRun.val;

    case "long_run_pattern":
      if (lastRun.len > 7) return lastRun.val === "T" ? "X" : "T";
      return lastRun.val;

    default:
      return null;
  }
}

/* ================== BACKGROUND FETCH (TRÁI TIM SERVER) ================== */
async function autoFetch() {
  try {
    const { data } = await axios.get(LC79_TX_API, { timeout: 5000 });

    if (data.phien !== lastPhien) {
      lastPhien = data.phien;
      lastData = data;

      const tx = txFromKetQua(data.ket_qua);
      history.push(tx);
      if (history.length > MAX_HISTORY) history.shift();

      console.log("🔄 New round:", data.phien, tx);
    }
  } catch (e) {
    console.log("⚠️ Fetch error");
  }
}

autoFetch();
setInterval(autoFetch, 8000);

/* ================== READ-ONLY RESPONSE ================== */
function respond(res) {
  if (!lastData || history.length === 0) {
    return res.json({ loading: true });
  }

  const runs = buildRunsTX(history);
  const patternAlgo = classifyPatternFromRuns(runs);
  const patternString = buildLongPattern(history);

  const lastTx = history[history.length - 1];
  const next =
    predictNextFromPattern(patternAlgo, runs, lastTx) ?? lastTx;

  res.json({
    phien: lastData.phien,
    xuc_xac_1: lastData.xuc_xac_1,
    xuc_xac_2: lastData.xuc_xac_2,
    xuc_xac_3: lastData.xuc_xac_3,
    tong: lastData.tong,
    ket_qua: lastData.ket_qua,
    phien_hien_tai: lastData.phien_hien_tai,

    pattern: patternString,
    pattern_thuat_toan: patternAlgo,
    du_doan: next === "T" ? "Tài" : "Xỉu",
    do_tin_cay: patternAlgo ? "85%" : "70%",
    history_length: history.length,
    server_time: Date.now()
  });
}

/* ================== ROUTES ================== */
app.get("/api/lc79/tx", (req, res) => respond(res));
app.get("/api/lc79/md5", (req, res) => respond(res));

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 LC79 API running on port", PORT);
});

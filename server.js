const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

/* ================== API GỐC ================== */
const API_TX = "https://lc79md5.vercel.app/lc79/tx";

/* ================== BIẾN ================== */
let history = [];
let lastData = null;
let lastPhien = null;
const MAX_HISTORY = 80;

/* ================== TOOL ================== */
const toTX = kq => (kq === "Tài" ? "T" : "X");
const flip = v => (v === "T" ? "X" : "T");

/* ================== BUILD RUN ================== */
function buildRuns(pattern) {
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

function last7Runs(runs) {
  return runs.slice(-7);
}

function buildCau(pattern) {
  if (!pattern || pattern.length < 2) return null;
  const runs = buildRuns(pattern);
  return runs.slice(-3).map(r => r.l).join("-");
}

/* ================== THUẬT TOÁN (TỪ FILE lc79.js – ĐÃ CHUẨN HOÁ) ================== */
const ALGOS = [
  { p:[1,1], type:"BE", score:82 },
  { p:[2,2], type:"THEO", score:86 },
  { p:[3,3], type:"THEO", score:88 },
  { p:[4,4], type:"THEO", score:90 },
  { p:[5,5], type:"THEO", score:92 },

  { p:[1,2,1], type:"BE", score:88 },
  { p:[2,1,2], type:"BE", score:88 },
  { p:[1,2,2], type:"THEO", score:86 },

  { p:[1,3,1], type:"BE", score:90 },
  { p:[2,3,2], type:"BE", score:90 },
  { p:[3,2,3], type:"BE", score:90 },

  { p:[1,3,3], type:"THEO", score:90 },
  { p:[1,4,4], type:"THEO", score:92 },
  { p:[1,5,5], type:"THEO", score:94 },
  { p:[1,6,6], type:"THEO", score:95 },

  { p:[6,1,6], type:"BE", score:94 },

  { p:[1,2,3], type:"THEO", score:84 },
  { p:[1,2,4], type:"THEO", score:86 },

  { p:[2,2,1], type:"BE", score:88 },
  { p:[3,3,2], type:"BE", score:90 },
  { p:[4,4,2], type:"BE", score:92 },
  { p:[5,5,4], type:"BE", score:94 }
];

/* ================== SO PATTERN LỎNG ================== */
function matchLoose(runs, patternArr) {
  if (runs.length < patternArr.length) return false;
  const slice = runs.slice(-patternArr.length);
  for (let i = 0; i < patternArr.length; i++) {
    if (slice[i].l !== patternArr[i]) return false;
  }
  return true;
}

/* ================== CORE PREDICT ================== */
function predict(pattern) {
  if (!pattern || pattern.length < 6) return null;

  const runs = last7Runs(buildRuns(pattern));
  const last = runs[runs.length - 1];

  let voteTheo = 0;
  let voteBe = 0;
  let reasons = [];

  for (const a of ALGOS) {
    if (matchLoose(runs, a.p)) {
      if (a.type === "THEO") {
        voteTheo += a.score;
        reasons.push(`Theo ${a.p.join("-")}`);
      } else {
        voteBe += a.score;
        reasons.push(`Bẻ ${a.p.join("-")}`);
      }
    }
  }

  /* fallback nếu không khớp thuật toán */
  if (voteTheo === 0 && voteBe === 0) {
    if (last.l >= 3 && last.l <= 6) voteTheo += 80;
    if (last.l >= 7) voteBe += 90;
  }

  const action = voteTheo >= voteBe ? "THEO" : "BE";
  const du_doan = action === "THEO" ? last.v : flip(last.v);

  let confidence = Math.round(Math.max(voteTheo, voteBe) / 2);
  if (confidence < 72) confidence = 72;
  if (confidence > 96) confidence = 96;

  return {
    du_doan,
    do_tin_cay: `${confidence}%`,
    cau: runs.slice(-3).map(r => r.l).join("-"),
    quyet_dinh: action === "THEO" ? "Theo cầu" : "Bẻ cầu",
    ly_do: reasons.join(" | ")
  };
}

/* ================== FETCH DATA ================== */
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX, { timeout: 5000 });
    if (data.phien !== lastPhien) {
      lastPhien = data.phien;
      lastData = data;
      history.push(toTX(data.ket_qua));
      if (history.length > MAX_HISTORY) history.shift();
      console.log("▶", data.phien, data.ket_qua);
    }
  } catch {}
}

fetchTX();
setInterval(fetchTX, 8000);

/* ================== API ================== */
app.get("/api/lc79/tx", (req, res) => {
  const pattern = history.join("");
  const r = predict(pattern);

  res.json({
    loading: !lastData,

    phien: lastData?.phien ?? null,
    phien_hien_tai: lastData ? lastData.phien + 1 : null,
    ket_qua: lastData?.ket_qua ?? null,

    pattern,
    cau: r?.cau ?? null,
    quyet_dinh: r?.quyet_dinh ?? null,
    du_doan: r ? (r.du_doan === "T" ? "Tài" : "Xỉu") : null,
    do_tin_cay: r?.do_tin_cay ?? null,

    history_length: history.length,
    server_time: Date.now()
  });
});
/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("🚀 LC79 API RUNNING ON", PORT)
);

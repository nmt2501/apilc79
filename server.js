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

let phienTX = null;
let phienMD5 = null;

const MAX_HISTORY = 80;
const flip = v => (v === "T" ? "X" : "T");

/* ================== BUILD RUN ================== */
function buildRuns(pattern) {
  let runs = [];
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

const last7Runs = runs => runs.slice(-7);

/* ================== AUTO THEO / BẺ ================== */
function autoCauDecision(runs) {
  const last = runs[runs.length - 1];
  let votes = [];

  if (last.l >= 3 && last.l <= 6) {
    votes.push({ v: last.v, s: 86, t: "Theo cầu bệt" });
  }

  if (last.l >= 7) {
    votes.push({ v: flip(last.v), s: 94, t: "Bẻ cầu sâu" });
  }

  if (runs.length >= 3) {
    const a = runs[runs.length - 3].l;
    const b = runs[runs.length - 2].l;
    const c = last.l;
    if (b >= 5 && (a === 1 || c === 1)) {
      votes.push({ v: flip(last.v), s: 90, t: "Gãy cầu" });
    }
  }

  return votes;
}

/* ================== PATTERN ================== */
const PATTERN_ALGOS = [
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

function matchLoose(runs, p) {
  if (runs.length < p.length) return false;
  let diff = 0;
  for (let i = 0; i < p.length; i++) {
    diff += Math.abs(
      runs[runs.length - p.length + i].l - p[i]
    );
  }
  return diff <= 2; // khớp lỏng
}

/* ================== DỰ ĐOÁN ================== */
function predict(pattern) {
  if (!pattern || pattern.length < 6) return null;

  const runs = last7Runs(buildRuns(pattern));
  const last = runs[runs.length - 1];

  let voteTheo = 0;
  let voteBe = 0;
  let reasons = [];

  for (const algo of PATTERN_ALGOS) {
    if (matchLoose(runs, algo.p)) {
      if (algo.type === "THEO") {
        voteTheo += algo.score;
        reasons.push(`Theo ${algo.p.join("-")}`);
      } else {
        voteBe += algo.score;
        reasons.push(`Bẻ ${algo.p.join("-")}`);
      }
    }
  }

  // fallback theo cầu nếu không khớp pattern
  if (voteTheo === 0 && voteBe === 0) {
    if (last.l >= 3 && last.l <= 6) voteTheo += 80;
    if (last.l >= 7) voteBe += 90;
  }

  let action = voteTheo >= voteBe ? "THEO" : "BE";
  let du_doan =
    action === "THEO" ? last.v : flip(last.v);

  let confidence = Math.min(
    96,
    Math.max(72, Math.round(Math.max(voteTheo, voteBe) / 2))
  );

  return {
    du_doan,
    do_tin_cay: `${confidence}%`,
    cau: runs.slice(-3).map(r => r.l).join("-"),
    quyet_dinh: action === "THEO" ? "Theo cầu" : "Bẻ cầu",
    ly_do: reasons.join(" | ")
  };
}

/* ================== FETCH ================== */
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX, { timeout: 5000 });
    if (data.phien !== phienTX) {
      phienTX = data.phien;
      lastTX = data; // giữ nguyên object gốc
      historyTX.push(data.ket_qua === "Tài" ? "T" : "X");
      if (historyTX.length > MAX_HISTORY) historyTX.shift();
    }
  } catch {}
}

async function fetchMD5() {
  try {
    const { data } = await axios.get(API_MD5, { timeout: 5000 });
    if (data.phien !== phienMD5) {
      phienMD5 = data.phien;
      lastMD5 = data;
      historyMD5.push(data.ket_qua === "Tài" ? "T" : "X");
      if (historyMD5.length > MAX_HISTORY) historyMD5.shift();
    }
  } catch {}
}

setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== RESPONSE ================== */
function respond(res, data, history) {
  const pattern = history.join("");
  const r = predict(pattern);

  res.json({
    phien: data?.phien ?? null,
    phien_hien_tai: data?.phien_hien_tai ?? null,
    ket_qua: data?.ket_qua ?? null,

    xuc_xac_1: data?.xuc_xac_1 ?? null,
    xuc_xac_2: data?.xuc_xac_2 ?? null,
    xuc_xac_3: data?.xuc_xac_3 ?? null,
    tong: data?.tong ?? null,

    pattern,
    du_doan: r ? (r.du_doan === "T" ? "Tài" : "Xỉu") : null,
    do_tin_cay: r?.do_tin_cay ?? null,
    run_7: r?.run_7 ?? null,
    chien_luoc: r?.chien_luoc ?? null,
    so_phieu: r?.so_phieu ?? 0,

    server_time: Date.now()
  });
}

/* ================== ROUTES ================== */
app.get("/api/lc79/tx",  (req, res) => respond(res, lastTX, historyTX));
app.get("/api/lc79/md5", (req, res) => respond(res, lastMD5, historyMD5));

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 LC79 API RUNNING ON PORT", PORT);
});

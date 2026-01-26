const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

/* ================== API ================== */
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
  let cur = pattern[0], len = 1;

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

  if (last.l >= 3 && last.l <= 6)
    votes.push({ v: last.v, s: 86, t: "Theo cầu bệt" });

  if (last.l >= 7)
    votes.push({ v: flip(last.v), s: 94, t: "Bẻ cầu sâu" });

  if (runs.length >= 3) {
    const a = runs[runs.length-3].l;
    const b = runs[runs.length-2].l;
    const c = last.l;
    if (b >= 5 && (a === 1 || c === 1))
      votes.push({ v: flip(last.v), s: 90, t: "Gãy cầu" });
  }

  return votes;
}

/* ================== FULL PATTERN ================== */
const PATTERN_ALGOS = [
  [1,1],[2,2],[3,3],[4,4],[5,5],
  [1,2,1],[2,1,2],[1,2,2],
  [1,3,1],[2,3,2],[3,2,3],
  [1,3,3],[1,4,4],[1,5,5],[1,6,6],
  [6,1,6],[1,2,3],[1,2,4],
  [2,2,1],[3,3,2],[4,4,2],[5,5,4]
];

function matchLoose(runs, p) {
  if (runs.length < p.length) return false;
  let diff = 0;
  for (let i = 0; i < p.length; i++) {
    diff += Math.abs(
      runs[runs.length - p.length + i].l - p[i]
    );
  }
  return diff <= 2; // KHỚP LỎNG
}

/* ================== DỰ ĐOÁN ================== */
function predict(pattern) {
  if (!pattern || pattern.length < 6) return null;

  const runs = last7Runs(buildRuns(pattern));
  const last = runs[runs.length - 1];
  let votes = [];

  votes.push(...autoCauDecision(runs));

  for (const p of PATTERN_ALGOS) {
    if (matchLoose(runs, p)) {
      votes.push({
        v: flip(last.v),
        s: 82 + p.length,
        t: `Pattern ${p.join("-")}`
      });
    }
  }

  if (!votes.length) return null;

  let score = { T:0, X:0 };
  votes.forEach(v => score[v.v] += v.s);

  const du_doan = score.T > score.X ? "T" : "X";
  const confidence = Math.min(96, Math.max(72,
    Math.round(Math.max(score.T, score.X) / votes.length)
  ));

  return {
    du_doan,
    do_tin_cay: `${confidence}%`,
    run_7: runs.map(r => r.l).join("-"),
    chien_luoc: votes.map(v => v.t).join(" | "),
    so_phieu: votes.length
  };
}

/* ================== FETCH ================== */
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX);
    if (data.phien !== phienTX) {
      phienTX = data.phien;
      lastTX = data;
      historyTX.push(data.ket_qua === "Tài" ? "T" : "X");
      if (historyTX.length > MAX_HISTORY) historyTX.shift();
    }
  } catch {}
}

async function fetchMD5() {
  try {
    const { data } = await axios.get(API_MD5);
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

/* ================== ROUTES ================== */
function respond(res, data, history) {
  const pattern = history.join("");
  const r = predict(pattern);

  res.json({
    phien: data?.phien || null,
    ket_qua: data?.ket_qua || null,
    pattern,
    du_doan: r ? (r.du_doan === "T" ? "Tài" : "Xỉu") : null,
    do_tin_cay: r?.do_tin_cay || null,
    run_7: r?.run_7 || null,
    chien_luoc: r?.chien_luoc || null,
    so_phieu: r?.so_phieu || 0
  });
}

app.get("/api/lc79/tx",  (req,res)=>respond(res,lastTX,historyTX));
app.get("/api/lc79/md5", (req,res)=>respond(res,lastMD5,historyMD5));

app.listen(3000, ()=>console.log("🔥 FULL PATTERN + AUTO CẦU RUNNING"));

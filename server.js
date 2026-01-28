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

/* ================== STATE CHƠI TAY ================== */
let state = {
  mode: "THEO", // THEO | BE
  theoCount: 0,
  beCount: 0
};

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

/* ================== PHÁT HIỆN CẦU LOẠN ================== */
function isLoan(pattern) {
  if (!pattern || pattern.length < 6) return true;

  const runs = buildRuns(pattern).slice(-6);
  if (runs.length < 3) return true;

  const lens = runs.map(r => r.l);

  // Nhảy nhịp mạnh
  let jump = 0;
  for (let i = 1; i < lens.length; i++) {
    if (Math.abs(lens[i] - lens[i - 1]) >= 2) jump++;
  }
  if (jump >= 3) return true;

  // Quá nhiều run 1
  const short = lens.filter(l => l === 1).length;
  if (short >= 4) return true;

  return false;
}

/* ================== SUY CẦU TỪ 4 KÝ TỰ CUỐI ================== */
function inferCauFromLast4(pattern) {
  if (pattern.length < 4) return [];
  const last4 = pattern.slice(-4);

  const runs = [];
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

  const key = runs.join("-");
  const MAP = {
    "2-1-1": ["2-1-2","1-2-1"],
    "1-1-1-1": ["1-1"],
    "1-2-1": ["1-2-1","1-2-2"],
    "2-2": ["2-2","2-2-1"],
    "3-1": ["3-1-1","3-1-2"],
    "2-4-1": ["2-4-1"]
  };

  return MAP[key] || [key];
}

/* ================== THUẬT TOÁN CHÍNH ================== */
function predictAdvanced(pattern, type = "TX") {

  if (!pattern || pattern.length < 7) {
    return {
      du_doan: "Chưa Đủ Dữ Liệu",
      do_tin_cay: "0%",
      cau: buildCau(pattern),
      chien_luoc: "Thiếu dữ liệu",
      ly_do: "History quá ngắn"
    };
  }

  const loan = isLoan(pattern);
  const runs = buildRuns(pattern);
  const last = runs[runs.length - 1];
  const cau = buildCau(pattern);
  const possibleCau = inferCauFromLast4(pattern);

  // MD5 loạn => nghỉ
  if (loan && type === "MD5") {
    return {
      du_doan: "Chưa Đủ Dữ Liệu",
      do_tin_cay: "0%",
      cau,
      chien_luoc: "MD5 loạn – nghỉ",
      ly_do: "Hash MD5 loạn"
    };
  }

  let theoScore = 0;
  let beScore = 0;
  let reason = [];

  /* ===== CẦU BỆT ===== */
  if (last.l >= 6) {
    beScore += 40;
    reason.push("Bệt dài");
  }

  /* ===== CẦU BÁM ===== */
  if (last.l >= 3 && last.l <= 5) {
    theoScore += 30;
    reason.push("Cầu bám");
  }

  /* ===== CẦU 1-1 ===== */
  const last4 = pattern.slice(-4);
  if (last4 === "TXTX" || last4 === "XTXT") {
    theoScore += 25;
    reason.push("Cầu 1-1");
  }

  /* ===== CẦU KHÓ / ĐẢO ===== */
  if (["1-3-1","2-1-2","3-1-2","2-4-1"].includes(cau)) {
    beScore += 35;
    reason.push("Cầu khó");
  }

  /* ===== SUY TỪ 4 KÝ TỰ CUỐI ===== */
  if (possibleCau.length > 1) {
    beScore += 15;
    reason.push("Đảo nhịp");
  }

  /* ===== LOGIC THEO / BẺ THEO TAY ===== */
  let action;
  if (state.mode === "THEO") {
    action = theoScore >= beScore ? "THEO" : "BE";
    state.theoCount++;
    if (state.theoCount >= 5) {
      state.mode = "BE";
      state.theoCount = 0;
    }
  } else {
    action = beScore >= theoScore ? "BE" : "THEO";
    state.beCount++;
    if (state.beCount >= 2) {
      state.mode = "THEO";
      state.beCount = 0;
    }
  }

  const du_doan = action === "THEO" ? last.v : flip(last.v);
  let score = Math.min(96, Math.max(72, Math.max(theoScore, beScore) + 50));

  return {
    du_doan: du_doan === "T" ? "Tài" : "Xỉu",
    do_tin_cay: `${score}%`,
    cau,
    chien_luoc: action === "THEO" ? "Theo cầu" : "Bẻ cầu",
    ly_do: reason.join(" | ")
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
  const pred = predictAdvanced(pattern, "TX");

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
  const pred = predictAdvanced(pattern, "MD5");

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
  console.log("🚀 LC79 API RUNNING ON PORT", PORT);
});

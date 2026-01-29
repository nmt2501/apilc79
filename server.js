const express = require("express");
const axios = require("axios");
const app = express();

/* ================== API GỐC ================== */
const API_TX = "https://lc79md5.vercel.app/lc79/tx";
const API_MD5 = "https://lc79md5.vercel.app/lc79/md5";

/* ================== STATE ================== */
let lastTX = null;
let lastMD5 = null;
let lastPhienTX = null;
let lastPhienMD5 = null;

/* ================== HELPER ================== */
function toTX(kq) {
  return kq === "Tài" ? "T" : "X";
}

/* ================== ENGINE ================== */
class UltraDicePredictionSystem {
  constructor() {
    this.history = [];
    this.marketState = {
      volatility: 0.5,
      regime: "normal",
      trend: "neutral"
    };
  }

  addResult(r) {
    this.history.push(r);
    if (this.history.length > 50) this.history.shift();
    this.updateMarketState();
  }

  updateMarketState() {
    if (this.history.length < 10) return;

    let changes = 0;
    for (let i = 1; i < this.history.length; i++) {
      if (this.history[i] !== this.history[i - 1]) changes++;
    }

    this.marketState.volatility = +(changes / (this.history.length - 1)).toFixed(2);

    const t = this.history.filter(x => x === "T").length;
    const x = this.history.length - t;

    if (Math.abs(t - x) / this.history.length > 0.6) {
      this.marketState.trend = t > x ? "up" : "down";
      this.marketState.regime = "trending";
    } else {
      this.marketState.trend = "neutral";
      this.marketState.regime = "normal";
    }
  }

  predict() {
    let vote = { T: 0, X: 0 };

    const recent = this.history.slice(-6);
    const t = recent.filter(x => x === "T").length;
    const x = recent.length - t;

    vote.T = t * 0.32;
    vote.X = x * 0.32;

    const du_doan = vote.T >= vote.X ? "Tài" : "Xỉu";
    const do_tin_cay = Math.min(96, Math.round(Math.max(vote.T, vote.X) * 100));

    return {
      du_doan,
      do_tin_cay: do_tin_cay + "%",
      vote,
      tong_model: 1
    };
  }
}

/* ================== INIT ENGINE ================== */
const engineTX = new UltraDicePredictionSystem();
const engineMD5 = new UltraDicePredictionSystem();

/* ================== FETCH ================== */
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX, { timeout: 5000 });

    if (data.phien !== lastPhienTX) {
      lastPhienTX = data.phien;
      lastTX = data;
      engineTX.addResult(toTX(data.ket_qua));
    }
  } catch (e) {}
}

async function fetchMD5() {
  try {
    const { data } = await axios.get(API_MD5, { timeout: 5000 });

    if (data.phien !== lastPhienMD5) {
      lastPhienMD5 = data.phien;
      lastMD5 = data;
      engineMD5.addResult(toTX(data.ket_qua));
    }
  } catch (e) {}
}

setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== RESPONSE BUILDER ================== */
function buildResponse(source, last, engine) {
  if (!last) return { status: "loading" };

  const pred = engine.predict();

  return {
    status: "success",
    source,

    phien_truoc: {
      phien: last.phien,
      xuc_xac: [
        last.xuc_xac_1,
        last.xuc_xac_2,
        last.xuc_xac_3
      ],
      tong: last.tong,
      ket_qua: last.ket_qua
    },

    phien_hien_tai: {
      phien: last.phien + 1,
      du_doan: pred.du_doan,
      do_tin_cay: pred.do_tin_cay,
      tong_model: pred.tong_model,
      vote: pred.vote
    },

    pattern: {
      chuoi: engine.history.join(""),
      do_dai: engine.history.length
    },

    engine: {
      volatility: engine.marketState.volatility,
      regime: engine.marketState.regime,
      trend: engine.marketState.trend
    },

    id: "BI NHOI - LC79 ULTRA AI"
  };
}

/* ================== API ================== */
app.get("/api/lc79/tx", (req, res) => {
  res.json(buildResponse("Tài Xỉu Hũ", lastTX, engineTX));
});

app.get("/api/lc79/md5", (req, res) => {
  res.json(buildResponse("Tài Xỉu MD5", lastMD5, engineMD5));
});

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 LC79 ULTRA AI RUNNING ON", PORT);
});

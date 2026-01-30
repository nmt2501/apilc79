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
const toTX = kq => (kq === "Tài" ? "T" : "X");

/* ================== ENGINE ================== */
class UltraDicePredictionSystem {
    constructor() {
        this.history = [];
        this.models = {};

        this.sessionStats = {
            volatility: 0.5
        };

        this.marketState = {
            trend: "neutral",
            regime: "normal"
        };

        this.initModels();
    }

    /* ================== MODELS ================== */
    initModels() {
        this.models.model1 = this.modelTrend.bind(this);
        this.models.model2 = this.modelReverse.bind(this);
        this.models.model3 = this.modelStreak.bind(this);
    }

    /* ================== ADD RESULT ================== */
    addResult(result) {
        if (!["T", "X"].includes(result)) return;

        this.history.push(result);
        if (this.history.length > 30) this.history.shift();

        this.updateVolatility();
        this.updateMarket();
    }

    /* ================== VOLATILITY ================== */
    updateVolatility() {
        if (this.history.length < 10) return;

        let changes = 0;
        const r = this.history.slice(-10);

        for (let i = 1; i < r.length; i++) {
            if (r[i] !== r[i - 1]) changes++;
        }

        this.sessionStats.volatility = changes / (r.length - 1);
    }

    /* ================== MARKET ================== */
    updateMarket() {
        if (this.history.length < 15) return;

        const recent = this.history.slice(-15);
        const t = recent.filter(x => x === "T").length;
        const x = recent.filter(x => x === "X").length;

        const strength = Math.abs(t - x) / recent.length;

        if (strength > 0.6) {
            this.marketState.trend = t > x ? "up" : "down";
            this.marketState.regime = "trending";
        } else if (this.sessionStats.volatility > 0.65) {
            this.marketState.regime = "volatile";
            this.marketState.trend = "neutral";
        } else {
            this.marketState.trend = "neutral";
            this.marketState.regime = "normal";
        }
    }

    /* ================== MODEL 1: TREND ================== */
    modelTrend() {
        if (this.history.length < 5) return null;

        if (this.marketState.trend === "up")
            return { prediction: "T", confidence: 0.55 };

        if (this.marketState.trend === "down")
            return { prediction: "X", confidence: 0.55 };

        return null;
    }

    /* ================== MODEL 2: REVERSE ================== */
    modelReverse() {
        if (this.sessionStats.volatility < 0.6) return null;
        const last = this.history.at(-1);
        if (!last) return null;

        return {
            prediction: last === "T" ? "X" : "T",
            confidence: 0.5
        };
    }

    /* ================== MODEL 3: STREAK ================== */
    modelStreak() {
        if (this.history.length < 4) return null;

        const last3 = this.history.slice(-3);
        if (last3.every(x => x === "T"))
            return { prediction: "X", confidence: 0.6 };

        if (last3.every(x => x === "X"))
            return { prediction: "T", confidence: 0.6 };

        return null;
    }

    /* ================== CORE PREDICT ================== */
    predict() {
        let vote = { T: 0, X: 0 };
        let total = 0;

        for (const model of Object.values(this.models)) {
            const r = model();
            if (!r) continue;

            vote[r.prediction] += r.confidence;
            total++;
        }

        if (total === 0) {
            return {
                du_doan: "Chờ dữ liệu",
                do_tin_cay: "0%",
                tong_model: 0,
                vote
            };
        }

        const pick = vote.T >= vote.X ? "Tài" : "Xỉu";
        const confidence =
            Math.min(95, Math.round(Math.max(vote.T, vote.X) * 100)) + "%";

        return {
            du_doan: pick,
            do_tin_cay: confidence,
            tong_model: total,
            vote
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
        if (data && data.phien !== lastPhienTX) {
            lastPhienTX = data.phien;
            lastTX = data;
            engineTX.addResult(toTX(data.ket_qua));
        }
    } catch (e) {
        console.error("fetchTX:", e.message);
    }
}

async function fetchMD5() {
    try {
        const { data } = await axios.get(API_MD5, { timeout: 5000 });
        if (data && data.phien !== lastPhienMD5) {
            lastPhienMD5 = data.phien;
            lastMD5 = data;
            engineMD5.addResult(toTX(data.ket_qua));
        }
    } catch (e) {
        console.error("fetchMD5:", e.message);
    }
}

setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

/* ================== RESPONSE ================== */
function buildResponse(source, last, engine) {
    if (!last) return { status: "loading" };

    const pred = engine.predict();

    return {
        status: "success",
        source,
        phien_truoc: {
            phien: last.phien,
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
        engine: {
            volatility: engine.sessionStats.volatility,
            regime: engine.marketState.regime,
            trend: engine.marketState.trend
        },
        id: "LC79 ULTRA AI 2026"
    };
}

/* ================== API ================== */
app.get("/api/lc79/tx", (req, res) =>
    res.json(buildResponse("Tài Xỉu Hũ", lastTX, engineTX))
);

app.get("/api/lc79/md5", (req, res) =>
    res.json(buildResponse("Tài Xỉu MD5", lastMD5, engineMD5))
);

/* ================== START ================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log("🚀 LC79 ULTRA AI RUNNING ON", PORT)
);

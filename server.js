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
        this.sessionStats = { volatility: 0.5 };
        this.marketState = { trend: "neutral", regime: "normal" };
    }

    /* ================== ADD RESULT ================== */
    addResult(result) {
        if (result !== "T" && result !== "X") return;

        this.history.push(result);
        if (this.history.length > 30) this.history.shift();

        this.updateVolatility();
        this.updateMarketState();
    }

    /* ================== VOLATILITY ================== */
    updateVolatility() {
        if (this.history.length < 10) return;

        const r = this.history.slice(-10);
        let change = 0;
        for (let i = 1; i < r.length; i++) {
            if (r[i] !== r[i - 1]) change++;
        }
        this.sessionStats.volatility = change / (r.length - 1);
    }

    /* ================== MARKET ================== */
    updateMarketState() {
        if (this.history.length < 15) return;

        const r = this.history.slice(-15);
        const t = r.filter(x => x === "T").length;
        const x = r.filter(x => x === "X").length;
        const strength = Math.abs(t - x) / r.length;

        if (strength > 0.6) {
            this.marketState.trend = t > x ? "up" : "down";
            this.marketState.regime = "trending";
        } else {
            this.marketState.trend = "neutral";
            this.marketState.regime = "normal";
        }
    }

    /* ================== PATTERN ENGINE ================== */
    analyzePattern() {
        const h = this.history;
        if (h.length < 6) return null;

        const last6 = h.slice(-6).join("");
        const last3 = h.slice(-3).join("");

        // Pattern lặp
        if (last6.slice(0, 3) === last6.slice(3)) {
            return last6[2] === "T" ? "X" : "T";
        }

        // Cầu bệt
        if (/^T{3,}$/.test(last3)) return "T";
        if (/^X{3,}$/.test(last3)) return "X";

        return null;
    }

    /* ================== CORE PREDICT ================== */
    predict() {
        if (this.history.length < 6) {
            return {
                du_doan: "Chờ dữ liệu",
                do_tin_cay: "0%",
                tong_model: 0,
                vote: { T: 0, X: 0 }
            };
        }

        const recent = this.history.slice(-6);
        let voteT = recent.filter(x => x === "T").length;
        let voteX = recent.filter(x => x === "X").length;

        // Volatility cao → giảm lực
        if (this.sessionStats.volatility > 0.6) {
            voteT *= 0.8;
            voteX *= 0.8;
        }

        // ⭐ PATTERN BONUS
        const patternPick = this.analyzePattern();
        if (patternPick === "T") voteT += 1.2;
        if (patternPick === "X") voteX += 1.2;

        const du_doan = voteT >= voteX ? "Tài" : "Xỉu";
        const do_tin_cay =
            Math.min(96, Math.round(Math.max(voteT, voteX) / 7 * 100)) + "%";

        return {
            du_doan,
            do_tin_cay,
            tong_model: 2,
            vote: { T: voteT, X: voteX },
            pattern_pick: patternPick
        };
    }
}

/* ================== INIT ================== */
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
    } catch (e) {}
}

async function fetchMD5() {
    try {
        const { data } = await axios.get(API_MD5, { timeout: 5000 });
        if (data && data.phien !== lastPhienMD5) {
            lastPhienMD5 = data.phien;
            lastMD5 = data;
            engineMD5.addResult(toTX(data.ket_qua));
        }
    } catch (e) {}
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
            vote: pred.vote,
            pattern_goi_y: pred.pattern_pick
        },

        pattern: {
            chuoi: engine.history.join(""),
            do_dai: engine.history.length
        },

        engine: engine.marketState,
        id: "LC79 PATTERN AI 2026"
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
    console.log("🚀 LC79 PATTERN AI RUNNING", PORT);
});

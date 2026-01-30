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
        this.models = {};
        this.weights = {};
        this.performance = {};
        this.patternDatabase = {};
        this.advancedPatterns = {};

        this.sessionStats = {
            streaks: { T: 0, X: 0, maxT: 0, maxX: 0 },
            transitions: { TtoT: 0, TtoX: 0, XtoT: 0, XtoX: 0 },
            volatility: 0.5,
            patternConfidence: {},
            recentAccuracy: 0,
            bias: { T: 0, X: 0 }
        };

        this.marketState = {
            trend: 'neutral',
            momentum: 0,
            stability: 0.5,
            regime: 'normal'
        };

        this.adaptiveParameters = {
            volatilityThreshold: 0.7,
            trendStrengthThreshold: 0.6
        };

        this.initAllModels();
    }

    initAllModels() {
        for (let i = 1; i <= 21; i++) {
            if (typeof this[`model${i}`] === "function") {
                this.models[`model${i}`] = this[`model${i}`].bind(this);
            }
        }
    }

    addResult(result) {
        if (result !== 'T' && result !== 'X') return;

        this.history.push(result);
        if (this.history.length > 30) this.history.shift();

        this.updateVolatility();
        this.updateMarketState();
    }

    updateMarketState() {
        if (this.history.length < 15) return;

        const recent = this.history.slice(-15);
        const t = recent.filter(x => x === 'T').length;
        const x = recent.filter(x => x === 'X').length;

        const strength = Math.abs(t - x) / recent.length;
        this.marketState.trend =
            strength > this.adaptiveParameters.trendStrengthThreshold
                ? (t > x ? 'up' : 'down')
                : 'neutral';
    }

    updateVolatility() {
        if (this.history.length < 10) return;

        const r = this.history.slice(-10);
        let c = 0;
        for (let i = 1; i < r.length; i++) {
            if (r[i] !== r[i - 1]) c++;
        }
        this.sessionStats.volatility = c / (r.length - 1);
    }

    /* ================== CORE PREDICT ================== */
    predict() {
        let vote = { T: 0, X: 0 };
        let tong_model = 0;

        for (const model of Object.values(this.models)) {
            const r = model?.();
            if (!r || !['T', 'X'].includes(r.prediction)) continue;

            vote[r.prediction] += r.confidence || 0;
            tong_model++;
        }

        if (tong_model === 0) {
            return {
                du_doan: "Chờ dữ liệu",
                do_tin_cay: "0%",
                tong_model: 0,
                vote
            };
        }

        const du_doan = vote.T >= vote.X ? "Tài" : "Xỉu";
        const do_tin_cay =
            Math.min(96, Math.round(Math.max(vote.T, vote.X) * 100)) + "%";

        return { du_doan, do_tin_cay, tong_model, vote };
    }
}

module.exports = UltraDicePredictionSystem;

    /* ================== CORE PREDICT ================== */
    predict() {
        let vote = { T: 0, X: 0 };
        let tong_model = 0;

        for (const model of Object.values(this.models)) {
            if (typeof model !== "function") continue;

            const r = model();
            if (
                !r ||
                !r.prediction ||
                typeof r.confidence !== "number"
            ) continue;

            vote[r.prediction] += r.confidence;
            tong_model++;
        }

        if (tong_model === 0) {
            return {
                du_doan: "Chờ dữ liệu",
                do_tin_cay: "0%",
                tong_model: 0,
                vote
            };
        }

        const du_doan = vote.T >= vote.X ? "Tài" : "Xỉu";
        const do_tin_cay =
            Math.min(96,
                Math.round(Math.max(vote.T, vote.X) * 100)
            ) + "%";

        return {
            du_doan,
            do_tin_cay,
            tong_model,
            vote
        };
    }

} // ✅ CHỈ ĐƯỢC ĐÓNG CLASS Ở ĐÂY
/* ================== INIT ENGINE ================== */
const engineTX =
    new UltraDicePredictionSystem();

const engineMD5 =
    new UltraDicePredictionSystem();


/* ================== FETCH ================== */
async function fetchTX() {

    try {

        const { data } =
            await axios.get(
                API_TX,
                { timeout: 5000 }
            );

        if (
            data &&
            data.phien !== lastPhienTX
        ) {
            lastPhienTX = data.phien;
            lastTX = data;

            engineTX.addResult(
                toTX(data.ket_qua)
            );
        }

    } catch (e) {
        console.error(
            "fetchTX error:",
            e.message
        );
    }
}

async function fetchMD5() {

    try {

        const { data } =
            await axios.get(
                API_MD5,
                { timeout: 5000 }
            );

        if (
            data &&
            data.phien !== lastPhienMD5
        ) {
            lastPhienMD5 = data.phien;
            lastMD5 = data;

            engineMD5.addResult(
                toTX(data.ket_qua)
            );
        }

    } catch (e) {
        console.error(
            "fetchMD5 error:",
            e.message
        );
    }
}

setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);


/* ================== RESPONSE BUILDER ================== */
function buildResponse(source, last, engine) {

    if (!last) {
        return { status: "loading" };
    }

    const pred =
        engine.predict();

    if (!pred) {
        return { status: "waiting_data" };
    }

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
            chuoi:
                engine.history.join(""),
            do_dai:
                engine.history.length
        },

        engine: {
            volatility:
                engine.sessionStats.volatility,
            regime:
                engine.marketState.regime,
            trend:
                engine.marketState.trend
        },

        id: "BI NHOI - LC79 AI PHÂN TÍCH 2026"
    };
}


/* ================== API ================== */
app.get("/api/lc79/tx", (req, res) => {

    res.json(
        buildResponse(
            "Tài Xỉu Hũ",
            lastTX,
            engineTX
        )
    );
});

app.get("/api/lc79/md5", (req, res) => {

    res.json(
        buildResponse(
            "Tài Xỉu MD5",
            lastMD5,
            engineMD5
        )
    );
});


/* ================== START ================== */
const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        "🚀 LC79 ULTRA AI RUNNING ON",
        PORT
    );
});

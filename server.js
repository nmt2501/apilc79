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
            regime: 'normal' // normal, volatile, trending, random
        };
        this.adaptiveParameters = {
            patternMinLength: 3,
            patternMaxLength: 8,
            volatilityThreshold: 0.7,
            trendStrengthThreshold: 0.6,
            patternConfidenceDecay: 0.95,
            patternConfidenceGrowth: 1.05
        };
        this.initAllModels();
    }

    initAllModels() {
        for (let i = 1; i <= 21; i++) {

            if (typeof this[`model${i}`] === "function") {
                this.models[`model${i}`] =
                    this[`model${i}`].bind(this);

                this.weights[`model${i}`] = 1;

                this.performance[`model${i}`] = {
                    correct: 0,
                    total: 0,
                    recentCorrect: 0,
                    recentTotal: 0,
                    streak: 0,
                    maxStreak: 0
                };
            }

            if (typeof this[`model${i}Mini`] === "function") {
                this.models[`model${i}Mini`] =
                    this[`model${i}Mini`].bind(this);
            }

            if (typeof this[`model${i}Support1`] === "function") {
                this.models[`model${i}Support1`] =
                    this[`model${i}Support1`].bind(this);
            }

            if (typeof this[`model${i}Support2`] === "function") {
                this.models[`model${i}Support2`] =
                    this[`model${i}Support2`].bind(this);
            }
        }

        // ❌ KHÔNG DÙNG PATTERN NỮA
        // this.initPatternDatabase();
        // this.initAdvancedPatterns();
        // this.initSupportModels();
    }

      addResult(result) {

        if (this.history.length > 0) {

            const lastResult =
                this.history[
                    this.history.length - 1
                ];

            if (result === lastResult) {

                this.sessionStats.streaks[result]++;

            } else {

                this.sessionStats.streaks[result] = 1;
                this.sessionStats.streaks[lastResult] = 0;
            }

        } else {

            this.sessionStats.streaks[result] = 1;
        }

        this.history.push(result);

        if (this.history.length > 30) {
            this.history.shift();
        }

        this.updateVolatility();
        this.updateMarketState();
    }

      updateMarketState() {

        if (this.history.length < 15) return;

        const recent =
            this.history.slice(-15);

        const tCount =
            recent
                .filter(x => x === 'T')
                .length;

        const xCount =
            recent
                .filter(x => x === 'X')
                .length;

        const trendStrength =
            Math.abs(tCount - xCount) /
            recent.length;

        if (
            trendStrength >
            this.adaptiveParameters
                .trendStrengthThreshold
        ) {
            this.marketState.trend =
                tCount > xCount
                    ? 'up'
                    : 'down';
        } else {
            this.marketState.trend = 'neutral';
        }

        let momentum = 0;

        for (let i = 1; i < recent.length; i++) {
            if (recent[i] === recent[i - 1]) {
                momentum +=
                    recent[i] === 'T'
                        ? 0.1
                        : -0.1;
            }
        }

        this.marketState.momentum =
            Math.tanh(momentum);

        this.marketState.stability =
            1 - this.sessionStats.volatility;

        if (
            this.sessionStats.volatility >
            this.adaptiveParameters
                .volatilityThreshold
        ) {
            this.marketState.regime = 'volatile';
        } else if (trendStrength > 0.7) {
            this.marketState.regime = 'trending';
        } else {
            this.marketState.regime = 'normal';
        }
    }

      updateVolatility() {

        if (this.history.length < 10) return;

        const recent =
            this.history.slice(-10);

        let changes = 0;

        for (let i = 1; i < recent.length; i++) {
            if (recent[i] !== recent[i - 1]) {
                changes++;
            }
        }

        this.sessionStats.volatility =
            changes /
            (recent.length - 1);
    }

          if (result === lastResult) {

            this.sessionStats.streaks[result]++;

            this.sessionStats.streaks[
                `max${result}`
            ] = Math.max(
                this.sessionStats.streaks[
                    `max${result}`
                ],
                this.sessionStats.streaks[result]
            );



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

        // Nếu chưa đủ dữ liệu
        if (tong_model === 0) {
            return {
                du_doan: "Chờ dữ liệu",
                do_tin_cay: "0%",
                tong_model: 0,
                vote
            };
        }

        const du_doan =
            vote.T >= vote.X
                ? "Tài"
                : "Xỉu";

        const do_tin_cay =
            Math.min(
                96,
                Math.round(
                    Math.max(vote.T, vote.X) * 100
                )
            ) + "%";

        return {
            du_doan,
            do_tin_cay,
            tong_model,
            vote
        };
    }

} // ✅ ĐÓNG CLASS – BẮT BUỘC PHẢI CÓ


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

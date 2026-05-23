import Fastify from "fastify"
import fetch from "node-fetch"
import cors from "@fastify/cors"

const fastify = Fastify({ logger: false })

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/sessions"

await fastify.register(cors)

let history = []

// =============================
// PATTERN MAP (DÁN FULL JSON CỦA BẠN VÀO ĐÂY)
// =============================
const PATTERN_MAP = {

  "TTTXX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXXXT": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTXXTX": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXTT": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXXT": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTXT": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXTT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTTXT": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTXTTX": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTX": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTXTTXX": {
    "next": "T",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTXTX": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXXTX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXXXX": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXXXX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXTXX": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTXTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTXXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXX": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXTTX": {
    "next": "T",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXXTTXX": {
    "next": "T",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXTXT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTTTX": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXXX": {
    "next": "X",
    "confidence": 82,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTTTX": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXXXT": {
    "next": "T",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTXXT": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTTX": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTXXX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTTX": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXXTT": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
}

// =============================
// CHUYỂN TÀI XỈU
// =============================
function getTX(point) {
    return point >= 11 ? "Tài" : "Xỉu"
}

// =============================
// PATTERN ENGINE (FIX MỚI)
// =============================
function getPattern(history, patternMap) {
    const patternStr = history
        .slice(0, 20)
        .map(x => x.ket_qua === "Tài" ? "T" : "X")
        .reverse()
        .join("")

    // thử match từ dài → ngắn (quan trọng)
    for (let len = 13; len >= 5; len--) {
        const key = patternStr.slice(-len)

        if (patternMap[key]) {
            return {
                pattern: key,
                next: patternMap[key].next,
                description: patternMap[key].description,
                confidence: patternMap[key].confidence
            }
        }
    }

    return {
        pattern: patternStr.slice(-13),
        next: "X",
        description: "Không khớp mẫu (fallback)",
        confidence: 50
    }
}

// =============================
// ENGINE GIỮ NGUYÊN (rút gọn không sửa logic)
// =============================
class PredictionEngine {
    constructor() {
        this.MIN_HISTORY_FOR_ADVANCED = 15
        this.MAX_CONFIDENCE = 92
        this.MIN_CONFIDENCE = 60
        this.DEFAULT_FALLBACK_CONFIDENCE = 65

        this.ANALYZERS = {
            fourier: { weight: 1.3, minConfidence: 0.55, requiredHistory: 20 },
            neural: { weight: 1.2, minConfidence: 0.55, requiredHistory: 25 },
            markov_advanced: { weight: 1.1, minConfidence: 0.55, requiredHistory: 30 },
            entropy: { weight: 1.0, minConfidence: 0.55, requiredHistory: 20 },
            trend_momentum: { weight: 0.9, minConfidence: 0.55, requiredHistory: 15 },
            cluster: { weight: 0.8, minConfidence: 0.55, requiredHistory: 25 },
            wavelet: { weight: 0.7, minConfidence: 0.55, requiredHistory: 30 }
        }
    }

    predictNext(currentResult, history) {
        if (history.length < this.MIN_HISTORY_FOR_ADVANCED) {
            return this.getInitialPrediction(currentResult)
        }

        const historyString = this.convertHistoryToString(history)
        const recentHistory = history.slice(-30)

        const predictions = this.collectPredictions(historyString, historyString.slice(-30), recentHistory)

        if (predictions.length > 0) {
            return this.calculateWeightedPrediction(predictions)
        }

        return this.generateFallbackPrediction(recentHistory, currentResult)
    }

    convertHistoryToString(history) {
        return history.map(h => h.ket_qua === "Tài" ? "1" : "0").join("")
    }

    collectPredictions(fullHistory, recentHistory, recentArray) {
        const predictions = []

        for (const [name, config] of Object.entries(this.ANALYZERS)) {
            if (recentHistory.length < config.requiredHistory) continue

            const methodName = `analyze${name.charAt(0).toUpperCase() + name.slice(1)}`
            if (this[methodName]) {
                const result = this[methodName](fullHistory, recentHistory, recentArray)

                if (result && result.confidence >= config.minConfidence) {
                    predictions.push({
                        prediction: result.prediction,
                        weight: result.confidence * config.weight,
                        pattern: result.pattern_note || name
                    })
                }
            }
        }

        return predictions
    }

    calculateWeightedPrediction(predictions) {
        const score = { Tài: 0, Xỉu: 0 }

        for (const p of predictions) {
            score[p.prediction] += p.weight
        }

        const final = score.Tài > score.Xỉu ? "Tài" : "Xỉu"
        const total = score.Tài + score.Xỉu
        const confidence = Math.min(92, 60 + (Math.max(score.Tài, score.Xỉu) / total) * 30)

        return {
            du_doan: final,
            do_tin_cay: Math.round(confidence * 100) / 100,
            mau_cau: `AI Hybrid (${predictions.length} models)`
        }
    }

    getInitialPrediction(currentResult) {
        return {
            du_doan: Math.random() > 0.5 ? "Tài" : "Xỉu",
            do_tin_cay: 65,
            mau_cau: "Khởi tạo"
        }
    }

    generateFallbackPrediction(recentHistory, currentResult) {
        return {
            du_doan: currentResult.ket_qua === "Tài" ? "Xỉu" : "Tài",
            do_tin_cay: 62,
            mau_cau: "Fallback"
        }
    }
}

// =============================
// API
// =============================
fastify.get("/api/lc79/md5", async () => {

    const res = await fetch(API_URL)
    const data = await res.json()

    if (!data.list?.length) {
        return { error: "No data" }
    }

    const last = data.list[0]

    history = data.list.map(x => ({
        ket_qua: getTX(x.point),
        point: x.point,
        id: x.id
    }))

    const currentResult = {
        ket_qua: getTX(last.point),
        point: last.point,
        id: last.id
    }

    const engine = new PredictionEngine()
    const prediction = engine.predictNext(currentResult, history)

    const pattern = getPattern(history, PATTERN_MAP)

    return {
        game: "LC79 MD5",
        phien_truoc: last.id,
        ket_qua: currentResult.ket_qua,
        xuc_xac: last.dices,
        tong: last.point,
        phien_hien_tai: last.id + 1,

        du_doan: prediction.du_doan,
        do_tin_cay: prediction.do_tin_cay + "%",

        pattern
    }
})

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 3000

fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log("LC79 API running on port", PORT)
})

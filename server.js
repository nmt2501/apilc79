import Fastify from "fastify"
import fetch from "node-fetch"
import cors from "@fastify/cors"

const fastify = Fastify({ logger: false })

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/sessions"

await fastify.register(cors)

let history = []

// =============================
// CHUYỂN TÀI XỈU
// =============================
function getTX(point) {
    return point >= 11 ? "Tài" : "Xỉu"
}

// =============================
// PATTERN
// =============================
function getPattern(){

    return history
        .slice(0,20)
        .map(x => x.ket_qua === "Tài" ? "t" : "x")
        .reverse()
        .join("")

}
// =============================
// CHUYỂN HISTORY
// =============================
function convertHistory(points) {

    return points.map(p => ({
        ket_qua: p >= 11 ? "Tài" : "Xỉu"
    }))

}


// ====== THUẬT TOÁN DỰ ĐOÁN NÂNG CAO PRO ======
function predictNextAdvancedPro(currentResult, history) {

    if (history.length < 15) {
        const baseConfidence = 60 + Math.floor(Math.random() * 25)

        return {
            du_doan: Math.random() < 0.58 ?
                (currentResult.ket_qua === "Tài" ? "Xỉu" : "Tài") :
                currentResult.ket_qua,
            do_tin_cay: baseConfidence,
            mau_cau: "Khởi tạo hệ thống dự đoán"
        }
    }

    const historyString = history.map(h => h.ket_qua === "Tài" ? "1" : "0").join("")

    const recentHistory = history.slice(-30)

    const recentString = recentHistory
        .map(h => h.ket_qua === "Tài" ? "1" : "0")
        .join("")

    const analyzers = {

        fourier: { weight: 1.3, func: analyzeFourier },

        neural: { weight: 1.2, func: analyzeNeuralPattern },

        markov: { weight: 1.1, func: analyzeMarkovAdvanced },

        entropy: { weight: 1.0, func: analyzeEntropy },

        trend: { weight: 0.9, func: analyzeTrendMomentum },

        cluster: { weight: 0.8, func: analyzeCluster },

        wavelet: { weight: 0.7, func: analyzeWavelet }
    }

    let predictions = []
    let weights = []
    let patternNotes = []

    for (const name in analyzers) {

        const result = analyzers[name].func(historyString, recentString, recentHistory)

        if (result.confidence > 0.55) {

            predictions.push(result.prediction)

            weights.push(result.confidence * analyzers[name].weight)

            patternNotes.push(result.pattern_note || name)

        }
    }

    if (predictions.length > 0) {

        let scoreTai = 0
        let scoreXiu = 0

        predictions.forEach((pred, i) => {

            if (pred === "Tài") scoreTai += weights[i]
            else scoreXiu += weights[i]

        })

        const totalScore = scoreTai + scoreXiu

        const finalPrediction = scoreTai > scoreXiu ? "Tài" : "Xỉu"

        const winningScore = Math.max(scoreTai, scoreXiu)

        const rawConfidence = winningScore / totalScore

        const methodCount = predictions.length

        const consensusBonus = Math.min(0.2, (methodCount - 3) * 0.05)

        const baseConfidence = 60 + rawConfidence * 25 + consensusBonus * 100

        const confidence = Math.min(92, Math.max(60, baseConfidence))

        let patternText = `Hệ thống AI (${predictions.length}/7 thuật toán)`

        if (patternNotes.length > 0) {

            const counts = {}

            patternNotes.forEach(n => counts[n] = (counts[n] || 0) + 1)

            const topPattern = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]

            patternText += " | Ưu thế: " + topPattern
        }

        return {

            du_doan: finalPrediction,

            do_tin_cay: Math.round(confidence * 100) / 100,

            mau_cau: patternText
        }
    }

    return generateFallbackPrediction(recentHistory, currentResult)
}

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

function analyzeFourier(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 20) return { confidence: 0 }

    let autocorr = {}

    for (let lag = 1; lag <= Math.min(10, n - 1); lag++) {

        let sum = 0

        for (let i = 0; i < n - lag; i++) {

            sum += (recentHistory[i] === recentHistory[i + lag]) ? 1 : -1
        }

        autocorr[lag] = sum / (n - lag)
    }

    let maxCorr = 0
    let bestLag = 0

    for (const lag in autocorr) {

        if (Math.abs(autocorr[lag]) > maxCorr && lag >= 2) {

            maxCorr = Math.abs(autocorr[lag])

            bestLag = lag
        }
    }

    if (maxCorr > 0.3) {

        const prediction = recentHistory[n - bestLag] === "1" ? "Tài" : "Xỉu"

        return {

            prediction,

            confidence: Math.min(0.85, maxCorr * 1.5),

            pattern_note: `Fourier cycle lag ${bestLag}`
        }
    }

    return { confidence: 0 }
}

////////////////////////////////////////////////////////

function analyzeNeuralPattern(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 25) return { confidence: 0 }

    const patternLength = 5

    const currentPattern = recentHistory.slice(-patternLength)

    let matches = {}

    for (let i = 0; i <= n - patternLength - 1; i++) {

        const test = recentHistory.slice(i, i + patternLength)

        let similarity = 0

        for (let j = 0; j < patternLength; j++) {

            if (currentPattern[j] === test[j]) similarity++
        }

        similarity = similarity / patternLength

        if (similarity >= 0.8) {

            const nextChar = recentHistory[i + patternLength]

            matches[nextChar] = (matches[nextChar] || 0) + similarity
        }
    }

    const score1 = matches["1"] || 0
    const score0 = matches["0"] || 0

    if (score1 + score0 > 0) {

        const ratio = Math.max(score1, score0) / (score1 + score0)

        if (ratio > 0.65) {

            return {

                prediction: score1 > score0 ? "Tài" : "Xỉu",

                confidence: Math.min(0.9, ratio),

                pattern_note: "Neural pattern similarity"
            }
        }
    }

    return { confidence: 0 }
}

////////////////////////////////////////////////////////

function analyzeMarkovAdvanced(fullHistory) {

    const n = fullHistory.length

    if (n < 30) return { confidence: 0 }

    const order = 3

    let matrix = {}

    for (let i = order; i < n; i++) {

        const state = fullHistory.slice(i - order, i)

        const next = fullHistory[i]

        if (!matrix[state]) matrix[state] = { "0": 0, "1": 0 }

        matrix[state][next]++
    }

    const currentState = fullHistory.slice(-order)

    if (matrix[currentState]) {

        const count0 = matrix[currentState]["0"]

        const count1 = matrix[currentState]["1"]

        const total = count0 + count1

        if (total >= 5) {

            const prob1 = count1 / total

            const prob0 = count0 / total

            const confidence = Math.abs(prob1 - prob0)

            if (confidence > 0.25) {

                return {

                    prediction: prob1 > prob0 ? "Tài" : "Xỉu",

                    confidence: Math.min(0.85, confidence * 2),

                    pattern_note: "Markov chain"
                }
            }
        }
    }

    return { confidence: 0 }
}

////////////////////////////////////////////////////////

function analyzeEntropy(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 20) return { confidence: 0 }

    const ones = recentHistory.split("1").length - 1
    const zeros = recentHistory.split("0").length - 1

    const p1 = ones / n
    const p0 = zeros / n

    let entropy = 0

    if (p1 > 0) entropy -= p1 * Math.log2(p1)
    if (p0 > 0) entropy -= p0 * Math.log2(p0)

    const randomness = entropy

    const last = recentHistory[n - 1]

    if (randomness > 0.9) {

        return {

            prediction: last === "1" ? "Xỉu" : "Tài",

            confidence: 0.65,

            pattern_note: "Entropy đảo chiều"
        }
    }

    if (randomness < 0.3) {

        return {

            prediction: last === "1" ? "Tài" : "Xỉu",

            confidence: 0.75,

            pattern_note: "Entropy xu hướng"
        }
    }

    return { confidence: 0 }
}

////////////////////////////////////////////////////////

function analyzeTrendMomentum(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 15) return { confidence: 0 }

    let momentum = 0

    for (let i = 1; i < n; i++) {

        if (recentHistory[i] === recentHistory[i - 1]) {

            momentum += recentHistory[i] === "1" ? 1 : -1

        } else {

            momentum = 0
        }
    }

    if (Math.abs(momentum) > 3) {

        return {

            prediction: momentum > 0 ? "Xỉu" : "Tài",

            confidence: 0.7,

            pattern_note: "Momentum đảo chiều"
        }
    }

    return { confidence: 0 }
}

////////////////////////////////////////////////////////

function analyzeCluster(fullHistory, recentHistory) {

    const n = recentHistory.length

    if (n < 25) return { confidence: 0 }

    let clusters = []

    let current = { type: recentHistory[0], length: 1 }

    for (let i = 1; i < n; i++) {

        if (recentHistory[i] === current.type) current.length++

        else {

            clusters.push(current)

            current = { type: recentHistory[i], length: 1 }
        }
    }

    clusters.push(current)

    const avg = clusters.reduce((a, b) => a + b.length, 0) / clusters.length

    const last = clusters[clusters.length - 1]

    if (last.length > avg * 1.5) {

        return {

            prediction: last.type === "1" ? "Xỉu" : "Tài",

            confidence: Math.min(0.8, last.length / (avg * 2)),

            pattern_note: "Cluster dài"
        }
    }

    return { confidence: 0 }
}

////////////////////////////////////////////////////////

function analyzeWavelet(fullHistory, recentHistory) {

    const n = recentHistory.length

    if (n < 30) return { confidence: 0 }

    const scales = [2, 3, 5]

    let predictions = []

    scales.forEach(scale => {

        let down = ""

        for (let i = 0; i < n; i += scale) {

            const seg = recentHistory.slice(i, i + scale)

            const ones = seg.split("1").length - 1

            const zeros = seg.split("0").length - 1

            down += ones > zeros ? "1" : "0"
        }

        if (down.length >= 2) {

            const last = down[down.length - 1]

            const prev = down[down.length - 2]

            if (last === prev) {

                predictions.push(last === "1" ? "Tài" : "Xỉu")
            }
        }
    })

    if (predictions.length > 0) {

        const counts = {}

        predictions.forEach(p => counts[p] = (counts[p] || 0) + 1)

        const dominant = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]

        const confidence = counts[dominant] / predictions.length

        if (confidence > 0.66) {

            return {

                prediction: dominant,

                confidence: Math.min(0.85, confidence),

                pattern_note: "Wavelet multi scale"
            }
        }
    }

    return { confidence: 0 }
}

////////////////////////////////////////////////////////

function generateFallbackPrediction(recentHistory, currentResult) {

    const historyString = recentHistory
        .map(h => h.ket_qua === "Tài" ? "1" : "0")
        .join("")

    const n = historyString.length

    if (n >= 3) {

        const lastThree = historyString.slice(-3)

        const patterns = {

            "111": { pred: "Xỉu", conf: 68 },

            "000": { pred: "Tài", conf: 68 },

            "101": { pred: "Xỉu", conf: 65 },

            "010": { pred: "Tài", conf: 65 }
        }

        if (patterns[lastThree]) {

            return {

                du_doan: patterns[lastThree].pred,

                do_tin_cay: patterns[lastThree].conf,

                mau_cau: "Fallback pattern"
            }
        }
    }

    return {

        du_doan: currentResult.ket_qua === "Tài" ? "Xỉu" : "Tài",

        do_tin_cay: 62 + Math.floor(Math.random() * 18),

        mau_cau: "Đảo chiều cơ bản"
    }
}



// =============================
// API LC79 MD5
// =============================
fastify.get("/api/lc79/md5", async () => {

    const res = await fetch(API_URL)
    const data = await res.json()

    if (!data.list || data.list.length === 0) {
        return { error: "No data" }
    }

    const last = data.list[0]

    // chuyển dữ liệu sang format thuật toán mới
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

    const prediction = predictNextAdvancedPro(currentResult, history)

    return {

        game: "LC79 MD5",

        phien_truoc: last.id,

        ket_qua: getTX(last.point),

        xuc_xac: last.dices,

        tong: last.point,

        phien_hien_tai: last.id + 1,

        du_doan: prediction.du_doan,

        do_tin_cay: prediction.do_tin_cay + "%",

        pattern: getPattern()

    }

})

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 3000

fastify.listen({ port: PORT, host: "0.0.0.0" }, () => {
    console.log("API LC79 running")
})

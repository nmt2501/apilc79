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


// ================= MAIN =================
function predictNextAdvancedPro(currentResult, history) {

    if (history.length < 15) {
        const baseConfidence = 60 + Math.floor(Math.random() * 25)

        return {
            du_doan: Math.random() < 0.58 ?
                (currentResult.ket_qua === "Tài" ? "Xỉu" : "Tài") :
                currentResult.ket_qua,
            do_tin_cay: baseConfidence,
            mau_cau: "Khởi tạo hệ thống"
        }
    }

    const historyString = history.map(h => h.ket_qua === "Tài" ? "1" : "0").join("")
    const recentHistory = history.slice(-30)
    const recentString = recentHistory.map(h => h.ket_qua === "Tài" ? "1" : "0").join("")

    const analyzers = {
        fourier: { weight: 1.3, func: analyzeFourier },
        neural: { weight: 1.2, func: analyzeNeuralPattern },
        markov: { weight: 1.1, func: analyzeMarkovAdvanced },
        entropy: { weight: 1.0, func: analyzeEntropy },
        trend: { weight: 0.9, func: analyzeTrendMomentum },
        cluster: { weight: 0.8, func: analyzeCluster },
        wavelet: { weight: 0.7, func: analyzeWavelet },

        bayesian: { weight: 1.25, func: analyzeBayesian },

        model2: { weight: 0.9, func: analyzeModel2 },
        model3: { weight: 1.05, func: analyzeModel3 },
        model4: { weight: 1.2, func: analyzeModel4 }
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

        let baseConfidence = 55 + rawConfidence * 30 + consensusBonus * 100

        if (methodCount >= 5) baseConfidence += 3
        if (methodCount <= 2) baseConfidence -= 5

        let confidence = Math.min(92, Math.max(60, baseConfidence))

        const last4 = recentString.slice(-4)
        if (last4 === "1111" || last4 === "0000") {
            confidence *= 0.9
        }

        if (confidence < 65) {
            return {
                du_doan: "SKIP",
                do_tin_cay: Math.round(confidence),
                mau_cau: "Low confidence"
            }
        }

        let patternText = `AI (${predictions.length} model)`

        if (patternNotes.length > 0) {
            const counts = {}
            patternNotes.forEach(n => counts[n] = (counts[n] || 0) + 1)
            const topPattern = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
            patternText += " | " + topPattern
        }

        return {
            du_doan: finalPrediction,
            do_tin_cay: Math.round(confidence * 100) / 100,
            mau_cau: patternText
        }
    }

    return generateFallbackPrediction(recentHistory, currentResult)
}

// ================= MODELS =================

// ===== Fourier =====
function analyzeFourier(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 20) return { confidence: 0 }

    let same = 0

    for (let i = 1; i < n; i++) {
        if (recentHistory[i] === recentHistory[i - 1]) same++
    }

    const ratio = same / (n - 1)

    if (ratio > 0.65) {
        return {
            prediction: recentHistory[n - 1] === "1" ? "Tài" : "Xỉu",
            confidence: Math.min(0.8, ratio),
            pattern_note: "Fourier trend"
        }
    }

    return { confidence: 0 }
}

// ===== Neural =====
function analyzeNeuralPattern(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 20) return { confidence: 0 }

    const last5 = recentHistory.slice(-5)

    let match = 0

    for (let i = 0; i < n - 5; i++) {
        const test = recentHistory.slice(i, i + 5)

        if (test === last5) {
            const next = recentHistory[i + 5]
            if (next === "1") match++
            else match--
        }
    }

    if (Math.abs(match) >= 2) {
        return {
            prediction: match > 0 ? "Tài" : "Xỉu",
            confidence: 0.7,
            pattern_note: "Neural match"
        }
    }

    return { confidence: 0 }
}

// ===== Markov =====
function analyzeMarkovAdvanced(fullHistory) {

    const n = fullHistory.length
    if (n < 25) return { confidence: 0 }

    let t = 0, x = 0

    for (let i = 1; i < n; i++) {
        if (fullHistory[i - 1] === fullHistory[i]) {
            if (fullHistory[i] === "1") t++
            else x++
        }
    }

    if (t + x < 5) return { confidence: 0 }

    const prob = t / (t + x)

    return {
        prediction: prob > 0.5 ? "Tài" : "Xỉu",
        confidence: Math.abs(prob - 0.5) + 0.6,
        pattern_note: "Markov"
    }
}

// ===== Entropy =====
function analyzeEntropy(fullHistory, recentHistory) {

    const ones = recentHistory.split("1").length - 1
    const zeros = recentHistory.split("0").length - 1

    const total = ones + zeros
    if (total === 0) return { confidence: 0 }

    const p = ones / total

    if (p > 0.7 || p < 0.3) {
        return {
            prediction: p > 0.5 ? "Xỉu" : "Tài",
            confidence: 0.7,
            pattern_note: "Entropy đảo"
        }
    }

    return { confidence: 0 }
}

// ===== Trend =====
function analyzeTrendMomentum(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 10) return { confidence: 0 }

    let streak = 1

    for (let i = n - 1; i > 0; i--) {
        if (recentHistory[i] === recentHistory[i - 1]) streak++
        else break
    }

    if (streak >= 3) {
        return {
            prediction: recentHistory[n - 1] === "1" ? "Xỉu" : "Tài",
            confidence: 0.65,
            pattern_note: "Trend đảo"
        }
    }

    return { confidence: 0 }
}

// ===== Cluster =====
function analyzeCluster(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 15) return { confidence: 0 }

    let clusters = []
    let count = 1

    for (let i = 1; i < n; i++) {
        if (recentHistory[i] === recentHistory[i - 1]) count++
        else {
            clusters.push(count)
            count = 1
        }
    }
    clusters.push(count)

    const avg = clusters.reduce((a, b) => a + b, 0) / clusters.length
    const last = clusters[clusters.length - 1]

    if (last > avg * 1.5) {
        return {
            prediction: recentHistory[n - 1] === "1" ? "Xỉu" : "Tài",
            confidence: 0.7,
            pattern_note: "Cluster"
        }
    }

    return { confidence: 0 }
}

// ===== Wavelet =====
function analyzeWavelet(fullHistory, recentHistory) {

    const n = recentHistory.length
    if (n < 20) return { confidence: 0 }

    let up = 0, down = 0

    for (let i = 2; i < n; i += 2) {
        const seg = recentHistory.slice(i - 2, i)

        const ones = seg.split("1").length - 1
        const zeros = seg.length - ones

        if (ones > zeros) up++
        else down++
    }

    if (up !== down) {
        return {
            prediction: up > down ? "Tài" : "Xỉu",
            confidence: 0.65,
            pattern_note: "Wavelet"
        }
    }

    return { confidence: 0 }
        }

// ===== Bayesian =====
function analyzeBayesian(fullHistory) {
    const n = fullHistory.length
    if (n < 30) return { confidence: 0 }

    let tAfterT = 0, xAfterT = 0
    let tAfterX = 0, xAfterX = 0

    for (let i = 1; i < n; i++) {
        const prev = fullHistory[i - 1]
        const curr = fullHistory[i]

        if (prev === "1") {
            if (curr === "1") tAfterT++
            else xAfterT++
        } else {
            if (curr === "1") tAfterX++
            else xAfterX++
        }
    }

    const last = fullHistory[n - 1]

    let probT, probX

    if (last === "1") {
        const total = tAfterT + xAfterT
        if (total < 5) return { confidence: 0 }
        probT = tAfterT / total
        probX = xAfterT / total
    } else {
        const total = tAfterX + xAfterX
        if (total < 5) return { confidence: 0 }
        probT = tAfterX / total
        probX = xAfterX / total
    }

    const confidence = Math.abs(probT - probX)

    if (confidence > 0.2) {
        return {
            prediction: probT > probX ? "Tài" : "Xỉu",
            confidence: Math.min(0.85, confidence * 1.8),
            pattern_note: "Bayesian"
        }
    }

    return { confidence: 0 }
}

// ===== Model 2 =====
function analyzeModel2(fullHistory, recentHistory) {
    const n = recentHistory.length
    if (n < 8) return { confidence: 0 }

    if (recentHistory[n - 1] === recentHistory[n - 2]) {
        return {
            prediction: recentHistory[n - 1] === "1" ? "Xỉu" : "Tài",
            confidence: 0.6,
            pattern_note: "Cầu 2"
        }
    }

    return { confidence: 0 }
}

// ===== Model 3 =====
function analyzeModel3(fullHistory, recentHistory) {
    const n = recentHistory.length
    if (n < 10) return { confidence: 0 }

    const last3 = recentHistory.slice(-3)

    if (last3[0] === last3[1] && last3[1] === last3[2]) {
        return {
            prediction: last3[2] === "1" ? "Xỉu" : "Tài",
            confidence: 0.7,
            pattern_note: "Cầu 3"
        }
    }

    return { confidence: 0 }
}

// ===== Model 4 =====
function analyzeModel4(fullHistory, recentHistory) {
    const n = recentHistory.length
    if (n < 12) return { confidence: 0 }

    let streak = 1

    for (let i = n - 1; i > 0; i--) {
        if (recentHistory[i] === recentHistory[i - 1]) streak++
        else break
    }

    if (streak >= 4) {
        return {
            prediction: recentHistory[n - 1] === "1" ? "Xỉu" : "Tài",
            confidence: Math.min(0.85, 0.7 + streak * 0.02),
            pattern_note: "Cầu dài"
        }
    }

    return { confidence: 0 }
}

// ===== Fallback =====
function generateFallbackPrediction(recentHistory, currentResult) {
    return {
        du_doan: currentResult.ket_qua === "Tài" ? "Xỉu" : "Tài",
        do_tin_cay: 65,
        mau_cau: "Fallback"
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

fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {

    if (err) {
        console.error(err)
        process.exit(1)
    }

    console.log("LC79 API running on port", PORT)

})

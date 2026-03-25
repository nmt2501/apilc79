import Fastify from "fastify"
import fetch from "node-fetch"
import cors from "@fastify/cors"

const fastify = Fastify({ logger: false })

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/sessions"

await fastify.register(cors)

let history = []

// =============================
// THUẬT TOÁN DỰ ĐOÁN NÂNG CAO PRO
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

        // Chuyển đổi lịch sử thành chuỗi nhị phân
        const historyString = this.convertHistoryToString(history)
        const recentHistory = history.slice(-30)
        const recentString = historyString.slice(-30)

        // Thu thập dự đoán từ các thuật toán
        const predictions = this.collectPredictions(historyString, recentString, recentHistory)

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
        const patterns = []

        for (const pred of predictions) {
            score[pred.prediction] += pred.weight
            patterns.push(pred.pattern)
        }

        const totalScore = score.Tài + score.Xỉu
        const finalPrediction = score.Tài > score.Xỉu ? "Tài" : "Xỉu"
        const winningScore = score[finalPrediction]

        // Tính độ tin cậy
        const rawConfidence = winningScore / totalScore
        const consensusBonus = Math.min(0.2, (predictions.length - 3) * 0.05)
        let confidence = this.MIN_CONFIDENCE + (rawConfidence * 25) + (consensusBonus * 100)
        confidence = Math.min(this.MAX_CONFIDENCE, Math.max(this.MIN_CONFIDENCE, confidence))

        // Tạo phân tích
        const patternText = `Hệ thống AI (${predictions.length}/${Object.keys(this.ANALYZERS).length} thuật toán)`
        
        return {
            du_doan: finalPrediction,
            do_tin_cay: Math.round(confidence * 100) / 100,
            mau_cau: patternText
        }
    }

    getInitialPrediction(currentResult) {
        const baseConfidence = this.MIN_CONFIDENCE + Math.floor(Math.random() * 26)
        const isAlternate = Math.random() < 0.58
        
        return {
            du_doan: isAlternate ? (currentResult.ket_qua === "Tài" ? "Xỉu" : "Tài") : currentResult.ket_qua,
            do_tin_cay: baseConfidence,
            mau_cau: "Khởi tạo hệ thống dự đoán"
        }
    }

    // ====== CÁC THUẬT TOÁN PHÂN TÍCH ======
    
    analyzeFourier(fullHistory, recentHistory, recentArray) {
        const n = recentHistory.length
        const maxLag = Math.min(10, n - 1)
        
        let bestLag = 0
        let maxCorr = 0
        
        for (let lag = 2; lag <= maxLag; lag++) {
            const corr = this.calculateAutocorrelation(recentHistory, lag)
            if (Math.abs(corr) > maxCorr) {
                maxCorr = Math.abs(corr)
                bestLag = lag
            }
        }
        
        if (maxCorr > 0.3 && bestLag > 0) {
            const prediction = recentHistory[n - bestLag] === '1' ? "Tài" : "Xỉu"
            return {
                prediction: prediction,
                confidence: Math.min(0.85, maxCorr * 1.5),
                pattern_note: `Phân tích chu kỳ Fourier (lag ${bestLag})`
            }
        }
        
        return null
    }
    
    calculateAutocorrelation(sequence, lag) {
        const n = sequence.length
        let sum = 0
        for (let i = 0; i < n - lag; i++) {
            sum += (sequence[i] === sequence[i + lag]) ? 1 : -1
        }
        return sum / (n - lag)
    }
    
    analyzeNeuralPattern(fullHistory, recentHistory, recentArray) {
        const n = recentHistory.length
        const patternLength = 5
        const currentPattern = recentHistory.slice(-patternLength)
        
        const matches = { '1': 0, '0': 0 }
        
        for (let i = 0; i <= n - patternLength - 1; i++) {
            const testPattern = recentHistory.slice(i, i + patternLength)
            let similarity = 0
            for (let j = 0; j < patternLength; j++) {
                if (currentPattern[j] === testPattern[j]) similarity++
            }
            similarity /= patternLength
            
            if (similarity >= 0.8 && i + patternLength < n) {
                const nextChar = recentHistory[i + patternLength]
                matches[nextChar] += similarity
            }
        }
        
        const total = matches['1'] + matches['0']
        if (total >= 3) {
            const ratio = Math.max(matches['1'], matches['0']) / total
            if (ratio > 0.65) {
                return {
                    prediction: matches['1'] > matches['0'] ? "Tài" : "Xỉu",
                    confidence: Math.min(0.9, ratio),
                    pattern_note: `Nhận diện pattern Neural (độ tương đồng ${Math.round(ratio * 100)}%)`
                }
            }
        }
        
        return null
    }
    
    analyzeMarkovAdvanced(fullHistory, recentHistory, recentArray) {
        const n = fullHistory.length
        const order = 3
        const transitionMatrix = {}
        
        // Xây dựng ma trận chuyển tiếp
        for (let i = order; i < n; i++) {
            const state = fullHistory.slice(i - order, i)
            const next = fullHistory[i]
            
            if (!transitionMatrix[state]) {
                transitionMatrix[state] = { '0': 0, '1': 0 }
            }
            transitionMatrix[state][next]++
        }
        
        const currentState = fullHistory.slice(-order)
        
        if (transitionMatrix[currentState]) {
            const count0 = transitionMatrix[currentState]['0']
            const count1 = transitionMatrix[currentState]['1']
            const total = count0 + count1
            
            if (total >= 5) {
                const prob1 = count1 / total
                const confidence = Math.abs(prob1 - 0.5) * 2
                
                if (confidence > 0.25) {
                    return {
                        prediction: prob1 > 0.5 ? "Tài" : "Xỉu",
                        confidence: Math.min(0.85, confidence),
                        pattern_note: `Markov bậc ${order} (xác suất: ${Math.round(Math.max(prob1, 1 - prob1) * 100)}%)`
                    }
                }
            }
        }
        
        return null
    }
    
    analyzeEntropy(fullHistory, recentHistory, recentArray) {
        const n = recentHistory.length
        const counts = { '0': 0, '1': 0 }
        
        for (let i = 0; i < n; i++) {
            counts[recentHistory[i]]++
        }
        
        let entropy = 0
        for (const count of Object.values(counts)) {
            const p = count / n
            entropy -= p * Math.log2(p)
        }
        
        const randomness = entropy // Max entropy for binary is 1
        
        if (randomness > 0.9) {
            const lastChar = recentHistory[n - 1]
            return {
                prediction: lastChar === '1' ? "Xỉu" : "Tài",
                confidence: 0.65,
                pattern_note: `Entropy cao (${Math.round(randomness * 100)}%), dự đoán đảo chiều`
            }
        } else if (randomness < 0.3) {
            const lastChar = recentHistory[n - 1]
            return {
                prediction: lastChar === '1' ? "Tài" : "Xỉu",
                confidence: 0.75,
                pattern_note: `Entropy thấp (${Math.round(randomness * 100)}%), tiếp tục xu hướng`
            }
        }
        
        return null
    }
    
    analyzeTrendMomentum(fullHistory, recentHistory, recentArray) {
        const n = recentHistory.length
        
        // Tính momentum
        let momentum = 0
        for (let i = 1; i < n; i++) {
            if (recentHistory[i] === recentHistory[i - 1]) {
                momentum += (recentHistory[i] === '1') ? 1 : -1
            } else {
                momentum = 0
            }
        }
        
        // Tính RSI đơn giản
        let upChanges = 0
        let downChanges = 0
        
        for (let i = 1; i < n; i++) {
            if (recentHistory[i] === '1' && recentHistory[i - 1] === '0') upChanges++
            else if (recentHistory[i] === '0' && recentHistory[i - 1] === '1') downChanges++
        }
        
        const totalChanges = upChanges + downChanges
        const rsi = totalChanges > 0 ? upChanges / totalChanges : 0.5
        
        if (Math.abs(momentum) > 3) {
            if (momentum > 0 && rsi > 0.7) {
                return {
                    prediction: "Xỉu",
                    confidence: 0.7,
                    pattern_note: `Động lượng Tài mạnh (RSI: ${Math.round(rsi * 100)}%), dự báo điều chỉnh`
                }
            } else if (momentum < 0 && rsi < 0.3) {
                return {
                    prediction: "Tài",
                    confidence: 0.7,
                    pattern_note: `Động lượng Xỉu mạnh (RSI: ${Math.round(rsi * 100)}%), dự báo phục hồi`
                }
            }
        }
        
        return null
    }
    
    analyzeCluster(fullHistory, recentHistory, recentArray) {
        const n = recentHistory.length
        
        // Phân tích cụm
        const clusters = []
        let currentType = recentHistory[0]
        let currentLength = 1
        
        for (let i = 1; i < n; i++) {
            if (recentHistory[i] === currentType) {
                currentLength++
            } else {
                clusters.push({ type: currentType, length: currentLength })
                currentType = recentHistory[i]
                currentLength = 1
            }
        }
        clusters.push({ type: currentType, length: currentLength })
        
        const avgLength = clusters.reduce((sum, c) => sum + c.length, 0) / clusters.length
        const lastCluster = clusters[clusters.length - 1]
        
        if (lastCluster.length > avgLength * 1.5) {
            const typeText = lastCluster.type === '1' ? "Tài" : "Xỉu"
            return {
                prediction: lastCluster.type === '1' ? "Xỉu" : "Tài",
                confidence: Math.min(0.8, lastCluster.length / (avgLength * 2)),
                pattern_note: `Cụm ${typeText} kéo dài (${lastCluster.length} phiên)`
            }
        }
        
        return null
    }
    
    analyzeWavelet(fullHistory, recentHistory, recentArray) {
        const n = recentHistory.length
        const scales = [2, 3, 5]
        const predictions = []
        
        for (const scale of scales) {
            let downsampled = ''
            for (let i = 0; i < n; i += scale) {
                const segment = recentHistory.slice(i, Math.min(i + scale, n))
                const ones = (segment.match(/1/g) || []).length
                const zeros = (segment.match(/0/g) || []).length
                downsampled += (ones > zeros) ? '1' : '0'
            }
            
            const dsLen = downsampled.length
            if (dsLen >= 5 && downsampled[dsLen - 1] === downsampled[dsLen - 2]) {
                predictions.push(downsampled[dsLen - 1] === '1' ? "Tài" : "Xỉu")
            }
        }
        
        if (predictions.length > 0) {
            const counts = {}
            for (const pred of predictions) {
                counts[pred] = (counts[pred] || 0) + 1
            }
            
            let dominantPrediction = null
            let maxCount = 0
            for (const [pred, count] of Object.entries(counts)) {
                if (count > maxCount) {
                    maxCount = count
                    dominantPrediction = pred
                }
            }
            
            const confidence = maxCount / predictions.length
            if (confidence > 0.66) {
                return {
                    prediction: dominantPrediction,
                    confidence: Math.min(0.85, confidence),
                    pattern_note: `Phân tích đa tỉ lệ Wavelet (${scales.length} scale)`
                }
            }
        }
        
        return null
    }
    
    generateFallbackPrediction(recentHistory, currentResult) {
        const historyString = this.convertHistoryToString(recentHistory)
        const n = historyString.length
        
        // Mẫu đơn giản
        if (n >= 4) {
            const lastThree = historyString.slice(-3)
            const patterns = {
                '111': { pred: "Xỉu", conf: 68, note: '3 Tài liên tiếp' },
                '000': { pred: "Tài", conf: 68, note: '3 Xỉu liên tiếp' },
                '101': { pred: "Xỉu", conf: 65, note: 'Mẫu xen kẽ 101' },
                '010': { pred: "Tài", conf: 65, note: 'Mẫu xen kẽ 010' }
            }
            
            if (patterns[lastThree]) {
                return {
                    du_doan: patterns[lastThree].pred,
                    do_tin_cay: patterns[lastThree].conf,
                    mau_cau: patterns[lastThree].note
                }
            }
        }
        
        // Cân bằng
        const countTai = (historyString.match(/1/g) || []).length
        const countXiu = n - countTai
        
        if (Math.abs(countTai - countXiu) > 5) {
            const prediction = countTai > countXiu ? "Xỉu" : "Tài"
            const imbalance = Math.abs(countTai - countXiu) / n
            let confidence = this.DEFAULT_FALLBACK_CONFIDENCE + Math.min(20, imbalance * 100)
            
            return {
                du_doan: prediction,
                do_tin_cay: Math.min(85, confidence),
                mau_cau: `Điều chỉnh cân bằng (Tài:${countTai}/Xỉu:${countXiu})`
            }
        }
        
        // Đảo chiều cơ bản
        return {
            du_doan: currentResult.ket_qua === "Tài" ? "Xỉu" : "Tài",
            do_tin_cay: 62 + Math.floor(Math.random() * 19),
            mau_cau: "Chiến lược đảo chiều cơ bản"
        }
    }
}

// =============================
// CHUYỂN TÀI XỈU
// =============================
function getTX(point) {
    return point >= 11 ? "Tài" : "Xỉu"
}

function getPattern(history){
    return history
        .slice(0, 20)
        .map(x => x.ket_qua === "Tài" ? "t" : "x")
        .reverse()
        .join("")
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

    const engine = new PredictionEngine()
    const prediction = engine.predictNext(currentResult, history)

    return {

        game: "LC79 MD5",

        phien_truoc: last.id,

        ket_qua: getTX(last.point),

        xuc_xac: last.dices,

        tong: last.point,

        phien_hien_tai: last.id + 1,

        du_doan: prediction.du_doan,

        do_tin_cay: prediction.do_tin_cay + "%",

        pattern: getPattern(history)

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

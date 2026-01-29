
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const API_TX  = "https://lc79md5.vercel.app/lc79/tx";
const API_MD5 = "https://lc79md5.vercel.app/lc79/md5";

let lastTX = null;
let lastMD5 = null;
let lastPhienTX = null;
let lastPhienMD5 = null;

const toTX = kq => (kq === "Tài" ? "T" : "X");

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
        // Khởi tạo tất cả models (21 chính + 21 mini + 42 hỗ trợ)
        for (let i = 1; i <= 21; i++) {
            // Model chính
            this.models[`model${i}`] = this[`model${i}`].bind(this);
            // Model mini
            this.models[`model${i}Mini`] = this[`model${i}Mini`].bind(this);
            // Model hỗ trợ
            this.models[`model${i}Support1`] = this[`model${i}Support1`].bind(this);
            this.models[`model${i}Support2`] = this[`model${i}Support2`].bind(this);
            
            // Khởi tạo trọng số và hiệu suất
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
        
        // Khởi tạo cơ sở dữ liệu pattern
        this.initPatternDatabase();
        this.initAdvancedPatterns();
        this.initSupportModels();
    }

    initPatternDatabase() {
        this.patternDatabase = {
            '1-1': { pattern: ['T', 'X', 'T', 'X'], probability: 0.7, strength: 0.8 },
            '1-2-1': { pattern: ['T', 'X', 'X', 'T'], probability: 0.65, strength: 0.75 },
            '2-1-2': { pattern: ['T', 'T', 'X', 'T', 'T'], probability: 0.68, strength: 0.78 },
            '3-1': { pattern: ['T', 'T', 'T', 'X'], probability: 0.72, strength: 0.82 },
            '1-3': { pattern: ['T', 'X', 'X', 'X'], probability: 0.72, strength: 0.82 },
            '2-2': { pattern: ['T', 'T', 'X', 'X'], probability: 0.66, strength: 0.76 },
            '2-3': { pattern: ['T', 'T', 'X', 'X', 'X'], probability: 0.71, strength: 0.81 },
            '3-2': { pattern: ['T', 'T', 'T', 'X', 'X'], probability: 0.73, strength: 0.83 },
            '4-1': { pattern: ['T', 'T', 'T', 'T', 'X'], probability: 0.76, strength: 0.86 },
            '1-4': { pattern: ['T', 'X', 'X', 'X', 'X'], probability: 0.76, strength: 0.86 },
            // Thêm các pattern khác
        };
    }

    initAdvancedPatterns() {
        this.advancedPatterns = {
            // Pattern động học (adaptive patterns)
            'dynamic-1': {
                detect: (data) => {
                    if (data.length < 6) return false;
                    const last6 = data.slice(-6);
                    return last6.filter(x => x === 'T').length === 4 && 
                           last6[last6.length-1] === 'T';
                },
                predict: () => 'X',
                confidence: 0.72,
                description: "4T trong 6 phiên, cuối là T -> dự đoán X"
            },
            'dynamic-2': {
                detect: (data) => {
                    if (data.length < 8) return false;
                    const last8 = data.slice(-8);
                    const tCount = last8.filter(x => x === 'T').length;
                    return tCount >= 6 && last8[last8.length-1] === 'T';
                },
                predict: () => 'X',
                confidence: 0.78,
                description: "6+T trong 8 phiên, cuối là T -> dự đoán X mạnh"
            },
            'alternating-3': {
                detect: (data) => {
                    if (data.length < 5) return false;
                    const last5 = data.slice(-5);
                    for (let i = 1; i < last5.length; i++) {
                        if (last5[i] === last5[i-1]) return false;
                    }
                    return true;
                },
                predict: (data) => data[data.length-1] === 'T' ? 'X' : 'T',
                confidence: 0.68,
                description: "5 phiên đan xen hoàn hảo -> dự đoán đảo chiều"
            },
            // Pattern chu kỳ
            'cyclic-7': {
                detect: (data) => {
                    if (data.length < 14) return false;
                    const firstHalf = data.slice(-14, -7);
                    const secondHalf = data.slice(-7);
                    return this.arraysEqual(firstHalf, secondHalf);
                },
                predict: (data) => data[data.length-7],
                confidence: 0.75,
                description: "Chu kỳ 7 phiên lặp lại -> dự đoán theo chu kỳ"
            },
            // Pattern momentum
            'momentum-break': {
                detect: (data) => {
                    if (data.length < 9) return false;
                    const first6 = data.slice(-9, -3);
                    const last3 = data.slice(-3);
                    const firstT = first6.filter(x => x === 'T').length;
                    const firstX = first6.filter(x => x === 'X').length;
                    return Math.abs(firstT - firstX) >= 4 && 
                           new Set(last3).size === 1 &&
                           last3[0] !== (firstT > firstX ? 'T' : 'X');
                },
                predict: (data) => {
                    const first6 = data.slice(-9, -3);
                    const firstT = first6.filter(x => x === 'T').length;
                    const firstX = first6.filter(x => x === 'X').length;
                    return firstT > firstX ? 'T' : 'X';
                },
                confidence: 0.71,
                description: "Momentum mạnh bị phá vỡ -> quay lại momentum chính"
            },
            // Pattern hỗn hợp
            'hybrid-pattern': {
                detect: (data) => {
                    if (data.length < 10) return false;
                    const segment = data.slice(-10);
                    const tCount = segment.filter(x => x === 'T').length;
                    const transitions = segment.slice(1).filter((x, i) => x !== segment[i]).length;
                    return tCount >= 3 && tCount <= 7 && transitions >= 6;
                },
                predict: (data) => {
                    const last = data[data.length-1];
                    const secondLast = data[data.length-2];
                    return last === secondLast ? (last === 'T' ? 'X' : 'T') : last;
                },
                confidence: 0.65,
                description: "Pattern hỗn hợp cao -> dự đoán based on last transitions"
            }
        };
    }

    initSupportModels() {
        // Khởi tạo các model hỗ trợ bổ sung
        for (let i = 1; i <= 21; i++) {
            // Thêm các model hỗ trợ phụ
            this.models[`model${i}Support3`] = this[`model${i}Support3`].bind(this);
            this.models[`model${i}Support4`] = this[`model${i}Support4`].bind(this);
        }
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    addResult(result) {
        // Cập nhật thống kê session
        if (this.history.length > 0) {
            const lastResult = this.history[this.history.length-1];
            const transitionKey = `${lastResult}to${result}`;
            this.sessionStats.transitions[transitionKey] = (this.sessionStats.transitions[transitionKey] || 0) + 1;
            
            // Cập nhật streak
            if (result === lastResult) {
                this.sessionStats.streaks[result]++;
                this.sessionStats.streaks[`max${result}`] = Math.max(
                    this.sessionStats.streaks[`max${result}`],
                    this.sessionStats.streaks[result]
                );
            } else {
                this.sessionStats.streaks[result] = 1;
                this.sessionStats.streaks[lastResult] = 0;
            }
        } else {
            this.sessionStats.streaks[result] = 1;
        }
        
        this.history.push(result);
        if (this.history.length > 200) {
            this.history.shift();
        }
        
        // Cập nhật độ biến động
        this.updateVolatility();
        
        // Cập nhật độ tin cậy pattern
        this.updatePatternConfidence();
        
        // Cập nhật trạng thái thị trường
        this.updateMarketState();
        
        // Cập nhật cơ sở dữ liệu pattern
        this.updatePatternDatabase();
    }

    updateVolatility() {
        if (this.history.length < 10) return;
        
        const recent = this.history.slice(-10);
        let changes = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] !== recent[i-1]) changes++;
        }
        
        this.sessionStats.volatility = changes / (recent.length - 1);
    }

    updatePatternConfidence() {
        // Kiểm tra độ chính xác của các pattern đã được sử dụng
        for (const [patternName, confidence] of Object.entries(this.sessionStats.patternConfidence)) {
            if (this.history.length < 2) continue;
            
            const lastResult = this.history[this.history.length-1];
            
            // Đơn giản hóa: giảm confidence nếu pattern dự đoán sai
            if (this.advancedPatterns[patternName]) {
                const prediction = this.advancedPatterns[patternName].predict(this.history.slice(0, -1));
                if (prediction !== lastResult) {
                    this.sessionStats.patternConfidence[patternName] = Math.max(
                        0.1, 
                        confidence * this.adaptiveParameters.patternConfidenceDecay
                    );
                } else {
                    this.sessionStats.patternConfidence[patternName] = Math.min(
                        0.95, 
                        confidence * this.adaptiveParameters.patternConfidenceGrowth
                    );
                }
            }
        }
    }

    updateMarketState() {
        if (this.history.length < 15) return;
        
        const recent = this.history.slice(-15);
        const tCount = recent.filter(x => x === 'T').length;
        const xCount = recent.filter(x => x === 'X').length;
        
        // Tính trend strength
        const trendStrength = Math.abs(tCount - xCount) / recent.length;
        
        // Xác định trend
        if (trendStrength > this.adaptiveParameters.trendStrengthThreshold) {
            this.marketState.trend = tCount > xCount ? 'up' : 'down';
        } else {
            this.marketState.trend = 'neutral';
        }
        
        // Tính momentum (dựa trên thay đổi gần đây)
        let momentum = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] === recent[i-1]) {
                momentum += recent[i] === 'T' ? 0.1 : -0.1;
            }
        }
        this.marketState.momentum = Math.tanh(momentum); // Chuẩn hóa về [-1, 1]
        
        // Tính stability (ngược với volatility)
        this.marketState.stability = 1 - this.sessionStats.volatility;
        
        // Xác định regime
        if (this.sessionStats.volatility > this.adaptiveParameters.volatilityThreshold) {
            this.marketState.regime = 'volatile';
        } else if (trendStrength > 0.7) {
            this.marketState.regime = 'trending';
        } else if (trendStrength < 0.3) {
            this.marketState.regime = 'random';
        } else {
            this.marketState.regime = 'normal';
        }
    }

    updatePatternDatabase() {
        if (this.history.length < 10) return;
        
        // Phát hiện pattern mới từ lịch sử
        for (let length = this.adaptiveParameters.patternMinLength; 
             length <= this.adaptiveParameters.patternMaxLength; length++) {
            for (let i = 0; i <= this.history.length - length; i++) {
                const segment = this.history.slice(i, i + length);
                const patternKey = segment.join('-');
                
                if (!this.patternDatabase[patternKey]) {
                    // Tính probability cho pattern mới
                    let count = 0;
                    for (let j = 0; j <= this.history.length - length - 1; j++) {
                        const testSegment = this.history.slice(j, j + length);
                        if (testSegment.join('-') === patternKey) {
                            count++;
                        }
                    }
                    
                    if (count > 2) { // Chỉ thêm pattern có xuất hiện ít nhất 3 lần
                        const probability = count / (this.history.length - length);
                        const strength = Math.min(0.9, probability * 1.2);
                        
                        this.patternDatabase[patternKey] = {
                            pattern: segment,
                            probability: probability,
                            strength: strength
                        };
                    }
                }
            }
        }
    }
       // MODEL 2: Bắt trend xu hướng ngắn và dài
    model2() {
        const shortTerm = this.history.slice(-5);
        const longTerm = this.history.slice(-20);
        
        if (shortTerm.length < 3 || longTerm.length < 10) return null;
        
        const shortAnalysis = this.model2Mini(shortTerm);
        const longAnalysis = this.model2Mini(longTerm);
        
        let prediction, confidence, reason;
        
        if (shortAnalysis.trend === longAnalysis.trend) {
            prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
            confidence = (shortAnalysis.strength + longAnalysis.strength) / 2;
            reason = `Xu hướng ngắn và dài hạn cùng ${shortAnalysis.trend}`;
        } else {
            if (shortAnalysis.strength > longAnalysis.strength * 1.5) {
                prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = shortAnalysis.strength;
                reason = `Xu hướng ngắn hạn mạnh hơn dài hạn`;
            } else {
                prediction = longAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = longAnalysis.strength;
                reason = `Xu hướng dài hạn ổn định hơn`;
            }
        }
        
        // Điều chỉnh confidence dựa trên market regime
        if (this.marketState.regime === 'trending') {
            confidence *= 1.15;
        } else if (this.marketState.regime === 'volatile') {
            confidence *= 0.85;
        }
        
        return { 
            prediction, 
            confidence: Math.min(0.95, confidence * 0.9), 
            reason 
        };
    }

    model2Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        
        let trend = tCount > xCount ? 'up' : (xCount > tCount ? 'down' : 'neutral');
        let strength = Math.abs(tCount - xCount) / data.length;
        
        // Phân tích chi tiết hơn
        let changes = 0;
        for (let i = 1; i < data.length; i++) {
            if (data[i] !== data[i-1]) changes++;
        }
        
        const volatility = changes / (data.length - 1);
        strength = strength * (1 - volatility / 2); // Điều chỉnh strength based on volatility
        
        return { trend, strength, volatility };
    }

    model2Support1() {
        // Phân tích chất lượng trend
        const quality = this.analyzeTrendQuality();
        return {
            status: "Phân tích chất lượng trend",
            quality
        };
    }

    model2Support2() {
        // Xác định điểm đảo chiều tiềm năng
        const reversalPoints = this.findPotentialReversals();
        return {
            status: "Xác định điểm đảo chiều",
            points: reversalPoints
        };
    }

    analyzeTrendQuality() {
        if (this.history.length < 20) return { quality: 'unknown', score: 0 };
        
        const trends = [];
        for (let i = 5; i <= 20; i += 5) {
            if (this.history.length >= i) {
                const analysis = this.model2Mini(this.history.slice(-i));
                trends.push(analysis);
            }
        }
        
        // Tính consistency giữa các trends
        let consistent = true;
        for (let i = 1; i < trends.length; i++) {
            if (trends[i].trend !== trends[0].trend) {
                consistent = false;
                break;
            }
        }
        
        const avgStrength = trends.reduce((sum, t) => sum + t.strength, 0) / trends.length;
        const avgVolatility = trends.reduce((sum, t) => sum + t.volatility, 0) / trends.length;
        
        const qualityScore = avgStrength * (1 - avgVolatility);
        let quality;
        
        if (qualityScore > 0.7) quality = 'excellent';
        else if (qualityScore > 0.5) quality = 'good';
        else if (qualityScore > 0.3) quality = 'fair';
        else quality = 'poor';
        
        return { quality, score: qualityScore, consistent };
    }

    findPotentialReversals() {
        const points = [];
        if (this.history.length < 15) return points;
        
        // Tìm các điểm mà trend có thể đảo chiều
        for (let i = 10; i < this.history.length - 5; i++) {
            const before = this.history.slice(i - 5, i);
            const after = this.history.slice(i, i + 5);
            
            const beforeAnalysis = this.model2Mini(before);
            const afterAnalysis = this.model2Mini(after);
            
            if (beforeAnalysis.trend !== afterAnalysis.trend && 
                beforeAnalysis.strength > 0.6 && 
                afterAnalysis.strength > 0.6) {
                points.push({
                    position: i,
                    beforeTrend: beforeAnalysis.trend,
                    afterTrend: afterAnalysis.trend,
                    strength: (beforeAnalysis.strength + afterAnalysis.strength) / 2
                });
            }
        }
        
        return points;
    }

    // MODEL 3: Xem trong 12 phiên gần nhất có sự chênh lệch cao thì sẽ dự đoán bên còn lại
    model3() {
        const recent = this.history.slice(-12);
        if (recent.length < 12) return null;
        
        const analysis = this.model3Mini(recent);
        
        if (analysis.difference < 0.4) return null;
        
        // Điều chỉnh confidence dựa trên market regime
        let confidence = analysis.difference * 0.8;
        if (this.marketState.regime === 'random') {
            confidence *= 1.1;
        } else if (this.marketState.regime === 'trending') {
            confidence *= 0.9;
        }
        
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Chênh lệch cao (${Math.round(analysis.difference * 100)}%) trong 12 phiên, dự đoán cân bằng`
        };
    }

    model3Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        const total = data.length;
        const difference = Math.abs(tCount - xCount) / total;
        
        return {
            difference,
            prediction: tCount > xCount ? 'X' : 'T',
            tCount,
            xCount
        };
    }

    model3Support1() {
        // Phân tích hiệu quả của mean reversion
        const effectiveness = this.analyzeMeanReversionEffectiveness();
        return {
            status: "Phân tích hiệu quả mean reversion",
            effectiveness
        };
    }

    model3Support2() {
        // Tìm ngưỡng chênh lệch tối ưu
        const optimalThreshold = this.findOptimalDifferenceThreshold();
        return {
            status: "Tìm ngưỡng chênh lệch tối ưu",
            threshold: optimalThreshold
        };
    }

    analyzeMeanReversionEffectiveness() {
        if (this.history.length < 30) return { effectiveness: 'unknown', successRate: 0 };
        
        let successes = 0;
        let opportunities = 0;
        
        for (let i = 12; i < this.history.length; i++) {
            const segment = this.history.slice(i - 12, i);
            const tCount = segment.filter(x => x === 'T').length;
            const xCount = segment.filter(x => x === 'X').length;
            const difference = Math.abs(tCount - xCount) / segment.length;
            
            if (difference >= 0.4) {
                opportunities++;
                const prediction = tCount > xCount ? 'X' : 'T';
                if (this.history[i] === prediction) {
                    successes++;
                }
            }
        }
        
        const successRate = opportunities > 0 ? successes / opportunities : 0;
        let effectiveness;
        
        if (successRate > 0.6) effectiveness = 'high';
        else if (successRate > 0.5) effectiveness = 'medium';
        else effectiveness = 'low';
        
        return { effectiveness, successRate, opportunities };
    }

    findOptimalDifferenceThreshold() {
        if (this.history.length < 50) return 0.4;
        
        let bestThreshold = 0.4;
        let bestSuccessRate = 0;
        
        // Test các threshold khác nhau
        for (let threshold = 0.3; threshold <= 0.6; threshold += 0.05) {
            let successes = 0;
            let opportunities = 0;
            
            for (let i = 12; i < this.history.length; i++) {
                const segment = this.history.slice(i - 12, i);
                const tCount = segment.filter(x => x === 'T').length;
                const xCount = segment.filter(x => x === 'X').length;
                const difference = Math.abs(tCount - xCount) / segment.length;
                
                if (difference >= threshold) {
                    opportunities++;
                    const prediction = tCount > xCount ? 'X' : 'T';
                    if (this.history[i] === prediction) {
                        successes++;
                    }
                }
            }
            
            const successRate = opportunities > 0 ? successes / opportunities : 0;
            if (successRate > bestSuccessRate) {
                bestSuccessRate = successRate;
                bestThreshold = threshold;
            }
        }
        
        return bestThreshold;
    }

    // MODEL 4: Bắt cầu ngắn hạn
    model4() {
        const recent = this.history.slice(-6);
        if (recent.length < 4) return null;
        
        const analysis = this.model4Mini(recent);
        
        if (analysis.confidence < 0.6) return null;
        
        // Điều chỉnh confidence dựa trên market regime
        let confidence = analysis.confidence;
        if (this.marketState.regime === 'trending') {
            confidence *= 1.1;
        } else if (this.marketState.regime === 'volatile') {
            confidence *= 0.9;
        }
        
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Cầu ngắn hạn ${analysis.trend} với độ tin cậy ${analysis.confidence.toFixed(2)}`
        };
    }

    model4Mini(data) {
        // Phân tích momentum ngắn hạn
        const last3 = data.slice(-3);
        const tCount = last3.filter(x => x === 'T').length;
        const xCount = last3.filter(x => x === 'X').length;
        
        let prediction, confidence, trend;
        
        if (tCount === 3) {
            prediction = 'T';
            confidence = 0.7;
            trend = 'Tăng mạnh';
        } else if (xCount === 3) {
            prediction = 'X';
            confidence = 0.7;
            trend = 'Giảm mạnh';
        } else if (tCount === 2) {
            prediction = 'T';
            confidence = 0.65;
            trend = 'Tăng nhẹ';
        } else if (xCount === 2) {
            prediction = 'X';
            confidence = 0.65;
            trend = 'Giảm nhẹ';
        } else {
            // Phân tích pattern phức tạp hơn
            const changes = data.slice(-4).filter((val, idx, arr) => 
                idx > 0 && val !== arr[idx-1]).length;
            
            if (changes >= 3) {
                prediction = data[data.length - 1] === 'T' ? 'X' : 'T';
                confidence = 0.6;
                trend = 'Đảo chiều';
            } else {
                prediction = data[data.length - 1];
                confidence = 0.55;
                trend = 'Ổn định';
            }
        }
        
        return { prediction, confidence, trend };
    }

    model4Support1() {
        // Phân tích hiệu quả momentum ngắn hạn
        const effectiveness = this.analyzeShortTermMomentumEffectiveness();
        return {
            status: "Phân tích hiệu quả momentum ngắn hạn",
            effectiveness
        };
    }

    model4Support2() {
        // Tối ưu hóa khung thời gian cho momentum
        const optimalTimeframe = this.findOptimalMomentumTimeframe();
        return {
            status: "Tối ưu khung thời gian momentum",
            timeframe: optimalTimeframe
        };
    }

    analyzeShortTermMomentumEffectiveness() {
        if (this.history.length < 20) return { effectiveness: 'unknown', successRate: 0 };
        
        let successes = 0;
        let opportunities = 0;
        
        for (let i = 6; i < this.history.length; i++) {
            const segment = this.history.slice(i - 6, i);
            const analysis = this.model4Mini(segment);
            
            if (analysis.confidence >= 0.6) {
                opportunities++;
                if (this.history[i] === analysis.prediction) {
                    successes++;
                }
            }
        }
        
        const successRate = opportunities > 0 ? successes / opportunities : 0;
        let effectiveness;
        
        if (successRate > 0.6) effectiveness = 'high';
        else if (successRate > 0.5) effectiveness = 'medium';
        else effectiveness = 'low';
        
        return { effectiveness, successRate, opportunities };
    }

    findOptimalMomentumTimeframe() {
        if (this.history.length < 50) return 6;
        
        let bestTimeframe = 6;
        let bestSuccessRate = 0;
        

// ===== INIT ENGINE =====
const engineTX = new UltraDicePredictionSystem();
const engineMD5 = new UltraDicePredictionSystem();

// ===== FETCH =====
async function fetchTX() {
  try {
    const { data } = await axios.get(API_TX, { timeout: 5000 });
    if (data.phien !== lastPhienTX) {
      lastPhienTX = data.phien;
      lastTX = data;
      engineTX.addResult(toTX(data.ket_qua));
    }
  } catch {}
}

async function fetchMD5() {
  try {
    const { data } = await axios.get(API_MD5, { timeout: 5000 });
    if (data.phien !== lastPhienMD5) {
      lastPhienMD5 = data.phien;
      lastMD5 = data;
      engineMD5.addResult(toTX(data.ket_qua));
    }
  } catch {}
}

setInterval(fetchTX, 8000);
setInterval(fetchMD5, 8000);

// ===== PREDICT =====
function getPrediction(engine) {
  let vote = { T: 0, X: 0 };
  for (const model of Object.values(engine.models)) {
    const r = model();
    if (r) vote[r.prediction] += r.confidence;
  }
  const next = vote.T >= vote.X ? "Tài" : "Xỉu";
  const conf = Math.min(96, Math.round(Math.max(vote.T, vote.X) * 100));
  return { du_doan: next, do_tin_cay: conf + "%" };
}

// ===== API TX =====
app.get("/api/lc79/tx", (req, res) => {
  const pred = getPrediction(engineTX);
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
    pattern: engineTX.history.join(""),
    cau: null,
    id: "BI NHOI - LC79 VIP PRO"
  });
});

// ===== API MD5 =====
app.get("/api/lc79/md5", (req, res) => {
  const pred = getPrediction(engineMD5);
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
    pattern: engineMD5.history.join(""),
    cau: null,
    id: "BI NHOI - LC79 VIP PRO"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUN", PORT));

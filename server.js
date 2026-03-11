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
function predictNextAdvancedPro($currentResult, $history) {
    if (count($history) < 15) {
        $baseConfidence = 60 + mt_rand(0, 25); // 60-85
        return [
            'du_doan' => mt_rand(0, 100) < 58 ? 
                ($currentResult['ket_qua'] === "Tài" ? "Xỉu" : "Tài") : 
                $currentResult['ket_qua'],
            'do_tin_cay' => $baseConfidence,
            'mau_cau' => 'Khởi tạo hệ thống dự đoán'
        ];
    }
    
    // Chuyển lịch sử thành chuỗi nhị phân
    $historyString = implode('', array_map(function($h) {
        return $h['ket_qua'] === "Tài" ? "1" : "0";
    }, $history));
    
    $recentHistory = array_slice($history, -30);
    $recentString = implode('', array_map(function($h) {
        return $h['ket_qua'] === "Tài" ? "1" : "0";
    }, $recentHistory));
    
    // ====== HỆ THỐNG PHÂN TÍCH ĐA TẦNG ======
    $analyzers = [
        'fourier' => ['weight' => 1.3, 'function' => 'analyzeFourier'],
        'neural' => ['weight' => 1.2, 'function' => 'analyzeNeuralPattern'],
        'markov_advanced' => ['weight' => 1.1, 'function' => 'analyzeMarkovAdvanced'],
        'entropy' => ['weight' => 1.0, 'function' => 'analyzeEntropy'],
        'trend_momentum' => ['weight' => 0.9, 'function' => 'analyzeTrendMomentum'],
        'cluster' => ['weight' => 0.8, 'function' => 'analyzeCluster'],
        'wavelet' => ['weight' => 0.7, 'function' => 'analyzeWavelet']
    ];
    
    $predictions = [];
    $weights = [];
    $patternNotes = [];
    
    foreach ($analyzers as $name => $analyzer) {
        $result = call_user_func($analyzer['function'], $historyString, $recentString, $recentHistory);
        
        if ($result['confidence'] > 0.55) {
            $predictions[] = $result['prediction'];
            $weights[] = $result['confidence'] * $analyzer['weight'];
            $patternNotes[] = $result['pattern_note'] ?? $name;
        }
    }
    
    // ====== TÍNH TOÁN XÁC SUẤT TỔNG HỢP ======
    if (!empty($predictions)) {
        // Tính điểm có trọng số
        $scoreTai = 0;
        $scoreXiu = 0;
        
        foreach ($predictions as $i => $pred) {
            if ($pred === 'Tài') {
                $scoreTai += $weights[$i];
            } else {
                $scoreXiu += $weights[$i];
            }
        }
        
        $totalScore = $scoreTai + $scoreXiu;
        $finalPrediction = $scoreTai > $scoreXiu ? 'Tài' : 'Xỉu';
        $winningScore = max($scoreTai, $scoreXiu);
        
        // Tính độ tin cậy dựa trên sự chênh lệch
        $rawConfidence = ($winningScore / $totalScore);
        
        // Điều chỉnh dựa trên số lượng phương pháp đồng thuận
        $methodCount = count($predictions);
        $consensusBonus = min(0.2, ($methodCount - 3) * 0.05);
        
        // Chuyển đổi sang thang 60-92%
        $baseConfidence = 60 + ($rawConfidence * 25) + ($consensusBonus * 100);
        $confidence = min(92, max(60, $baseConfidence));
        
        // Tạo mẫu câu phân tích
        $patternText = "Hệ thống AI (" . count($predictions) . "/7 thuật toán)";
        if (!empty($patternNotes)) {
            $dominantPatterns = array_count_values($patternNotes);
            arsort($dominantPatterns);
            $topPattern = key($dominantPatterns);
            $patternText .= " | Ưu thế: " . $topPattern;
        }
        
        return [
            'du_doan' => $finalPrediction,
            'do_tin_cay' => round($confidence, 2),
            'mau_cau' => $patternText
        ];
    }
    
    // ====== FALLBACK STRATEGY ======
    return generateFallbackPrediction($recentHistory, $currentResult);
}

// ====== CÁC THUẬT TOÁN PHÂN TÍCH NÂNG CAO ======
function analyzeFourier($fullHistory, $recentHistory, $recentArray) {
    // Phân tích tần số bằng biến đổi Fourier đơn giản
    $n = strlen($recentHistory);
    if ($n < 20) return ['confidence' => 0];
    
    // Tính toán autocorrelation
    $autocorr = [];
    for ($lag = 1; $lag <= min(10, $n-1); $lag++) {
        $sum = 0;
        for ($i = 0; $i < $n - $lag; $i++) {
            $sum += ($recentHistory[$i] === $recentHistory[$i + $lag]) ? 1 : -1;
        }
        $autocorr[$lag] = $sum / ($n - $lag);
    }
    
    // Tìm chu kỳ có autocorrelation cao nhất
    $maxCorr = 0;
    $bestLag = 0;
    foreach ($autocorr as $lag => $corr) {
        if (abs($corr) > $maxCorr && $lag >= 2) {
            $maxCorr = abs($corr);
            $bestLag = $lag;
        }
    }
    
    if ($maxCorr > 0.3 && $bestLag > 0) {
        $prediction = $recentHistory[$n - $bestLag] === '1' ? 'Tài' : 'Xỉu';
        return [
            'prediction' => $prediction,
            'confidence' => min(0.85, $maxCorr * 1.5),
            'pattern_note' => 'Phân tích chu kỳ Fourier (lag ' . $bestLag . ')'
        ];
    }
    
    return ['confidence' => 0];
}

function analyzeNeuralPattern($fullHistory, $recentHistory, $recentArray) {
    // Mô phỏng mạng neural đơn giản nhận diện pattern
    $n = strlen($recentHistory);
    if ($n < 25) return ['confidence' => 0];
    
    // Tạo các pattern con để tìm kiếm
    $patternLength = 5;
    $currentPattern = substr($recentHistory, -$patternLength);
    
    // Tìm tất cả vị trí xuất hiện pattern tương tự
    $matches = [];
    for ($i = 0; $i <= $n - $patternLength - 1; $i++) {
        $testPattern = substr($recentHistory, $i, $patternLength);
        $similarity = similar_text($currentPattern, $testPattern) / $patternLength;
        
        if ($similarity >= 0.8) {
            if ($i + $patternLength < $n) {
                $nextChar = $recentHistory[$i + $patternLength];
                $matches[$nextChar] = ($matches[$nextChar] ?? 0) + $similarity;
            }
        }
    }
    
    if (count($matches) >= 3) {
        $score1 = $matches['1'] ?? 0;
        $score0 = $matches['0'] ?? 0;
        
        if (($score1 + $score0) > 0) {
            $ratio = max($score1, $score0) / ($score1 + $score0);
            
            if ($ratio > 0.65) {
                return [
                    'prediction' => $score1 > $score0 ? 'Tài' : 'Xỉu',
                    'confidence' => min(0.9, $ratio),
                    'pattern_note' => 'Nhận diện pattern Neural (độ tương đồng ' . round($ratio*100) . '%)'
                ];
            }
        }
    }
    
    return ['confidence' => 0];
}

function analyzeMarkovAdvanced($fullHistory, $recentHistory, $recentArray) {
    // Mô hình Markov bậc 3
    $n = strlen($fullHistory);
    if ($n < 30) return ['confidence' => 0];
    
    $order = 3;
    $transitionMatrix = [];
    
    // Xây dựng ma trận chuyển tiếp
    for ($i = $order; $i < $n; $i++) {
        $state = substr($fullHistory, $i - $order, $order);
        $next = $fullHistory[$i];
        
        if (!isset($transitionMatrix[$state])) {
            $transitionMatrix[$state] = ['0' => 0, '1' => 0];
        }
        $transitionMatrix[$state][$next]++;
    }
    
    // Lấy state hiện tại
    $currentState = substr($fullHistory, -$order);
    
    if (isset($transitionMatrix[$currentState])) {
        $count0 = $transitionMatrix[$currentState]['0'];
        $count1 = $transitionMatrix[$currentState]['1'];
        $total = $count0 + $count1;
        
        if ($total >= 5) {
            $prob1 = $count1 / $total;
            $prob0 = $count0 / $total;
            
            $confidence = abs($prob1 - $prob0);
            
            if ($confidence > 0.25) {
                return [
                    'prediction' => $prob1 > $prob0 ? 'Tài' : 'Xỉu',
                    'confidence' => min(0.85, $confidence * 2),
                    'pattern_note' => 'Markov bậc ' . $order . ' (xác suất: ' . round(max($prob1, $prob0)*100) . '%)'
                ];
            }
        }
    }
    
    return ['confidence' => 0];
}

function analyzeEntropy($fullHistory, $recentHistory, $recentArray) {
    // Phân tích entropy và tính ngẫu nhiên
    $n = strlen($recentHistory);
    if ($n < 20) return ['confidence' => 0];
    
    // Tính entropy của chuỗi
    $counts = count_chars($recentHistory, 1);
    $entropy = 0;
    $total = $n;
    
    foreach ($counts as $count) {
        $p = $count / $total;
        $entropy -= $p * log($p, 2);
    }
    
    $maxEntropy = 1; // Chuỗi nhị phân max entropy = 1
    $randomness = $entropy / $maxEntropy;
    
    // Nếu chuỗi quá ngẫu nhiên, dự đoán đảo chiều
    if ($randomness > 0.9) {
        $lastChar = $recentHistory[$n-1];
        return [
            'prediction' => $lastChar === '1' ? 'Xỉu' : 'Tài',
            'confidence' => 0.65,
            'pattern_note' => 'Entropy cao (' . round($randomness*100) . '%), dự đoán đảo chiều'
        ];
    }
    // Nếu chuỗi có tính deterministic cao
    elseif ($randomness < 0.3) {
        $lastChar = $recentHistory[$n-1];
        return [
            'prediction' => $lastChar === '1' ? 'Tài' : 'Xỉu',
            'confidence' => 0.75,
            'pattern_note' => 'Entropy thấp (' . round($randomness*100) . '%), tiếp tục xu hướng'
        ];
    }
    
    return ['confidence' => 0];
}

function analyzeTrendMomentum($fullHistory, $recentHistory, $recentArray) {
    // Phân tích động lượng và xu hướng
    $n = strlen($recentHistory);
    if ($n < 15) return ['confidence' => 0];
    
    // Tính động lượng (momentum)
    $momentum = 0;
    for ($i = 1; $i < $n; $i++) {
        if ($recentHistory[$i] === $recentHistory[$i-1]) {
            $momentum += ($recentHistory[$i] === '1') ? 1 : -1;
        } else {
            $momentum = 0;
        }
    }
    
    // Tính RSI đơn giản
    $upChanges = 0;
    $downChanges = 0;
    
    for ($i = 1; $i < $n; $i++) {
        if ($recentHistory[$i] === '1' && $recentHistory[$i-1] === '0') {
            $upChanges++;
        } elseif ($recentHistory[$i] === '0' && $recentHistory[$i-1] === '1') {
            $downChanges++;
        }
    }
    
    $totalChanges = $upChanges + $downChanges;
    $rsi = ($totalChanges > 0) ? ($upChanges / $totalChanges) : 0.5;
    
    // Đưa ra dự đoán dựa trên momentum và RSI
    if (abs($momentum) > 3) {
        if ($momentum > 0 && $rsi > 0.7) {
            return [
                'prediction' => 'Xỉu',
                'confidence' => 0.7,
                'pattern_note' => 'Động lượng Tài mạnh (RSI: ' . round($rsi*100) . '%), dự báo điều chỉnh'
            ];
        } elseif ($momentum < 0 && $rsi < 0.3) {
            return [
                'prediction' => 'Tài',
                'confidence' => 0.7,
                'pattern_note' => 'Động lượng Xỉu mạnh (RSI: ' . round($rsi*100) . '%), dự báo phục hồi'
            ];
        }
    }
    
    return ['confidence' => 0];
}

function analyzeCluster($fullHistory, $recentHistory, $recentArray) {
    // Phân tích cụm và phân phối
    $n = strlen($recentHistory);
    if ($n < 25) return ['confidence' => 0];
    
    // Tìm các cụm liên tiếp
    $clusters = [];
    $currentCluster = ['type' => $recentHistory[0], 'length' => 1];
    
    for ($i = 1; $i < $n; $i++) {
        if ($recentHistory[$i] === $currentCluster['type']) {
            $currentCluster['length']++;
        } else {
            $clusters[] = $currentCluster;
            $currentCluster = ['type' => $recentHistory[$i], 'length' => 1];
        }
    }
    $clusters[] = $currentCluster;
    
    // Phân tích phân phối độ dài cụm
    $clusterLengths = array_column($clusters, 'length');
    $avgLength = array_sum($clusterLengths) / count($clusterLengths);
    $lastCluster = end($clusters);
    
    // Nếu cụm cuối dài hơn trung bình đáng kể
    if ($lastCluster['length'] > $avgLength * 1.5) {
        return [
            'prediction' => $lastCluster['type'] === '1' ? 'Xỉu' : 'Tài',
            'confidence' => min(0.8, $lastCluster['length'] / ($avgLength * 2)),
            'pattern_note' => 'Cụm ' . ($lastCluster['type'] === '1' ? 'Tài' : 'Xỉu') . ' kéo dài (' . $lastCluster['length'] . ' phiên)'
        ];
    }
    
    return ['confidence' => 0];
}

function analyzeWavelet($fullHistory, $recentHistory, $recentArray) {
    // Phân tích đa tỉ lệ (wavelet-like)
    $n = strlen($recentHistory);
    if ($n < 30) return ['confidence' => 0];
    
    // Tạo các chuỗi con ở các tỉ lệ khác nhau
    $scales = [2, 3, 5];
    $predictionsAtScale = [];
    
    foreach ($scales as $scale) {
        // Tạo chuỗi downsampled
        $downsampled = '';
        for ($i = 0; $i < $n; $i += $scale) {
            $segment = substr($recentHistory, $i, min($scale, $n - $i));
            $ones = substr_count($segment, '1');
            $zeros = substr_count($segment, '0');
            $downsampled .= ($ones > $zeros) ? '1' : '0';
        }
        
        // Phân tích trend của chuỗi downsampled
        if (strlen($downsampled) >= 5) {
            $lastChar = $downsampled[strlen($downsampled)-1];
            $secondLast = $downsampled[strlen($downsampled)-2];
            
            if ($lastChar === $secondLast) {
                $predictionsAtScale[] = $lastChar === '1' ? 'Tài' : 'Xỉu';
            }
        }
    }
    
    if (!empty($predictionsAtScale)) {
        $counts = array_count_values($predictionsAtScale);
        arsort($counts);
        $dominantPrediction = key($counts);
        $confidence = current($counts) / count($predictionsAtScale);
        
        if ($confidence > 0.66) {
            return [
                'prediction' => $dominantPrediction,
                'confidence' => min(0.85, $confidence),
                'pattern_note' => 'Phân tích đa tỉ lệ Wavelet (' . count($scales) . ' scale)'
            ];
        }
    }
    
    return ['confidence' => 0];
}

function generateFallbackPrediction($recentHistory, $currentResult) {
    // Chiến lược dự phòng khi không có phương pháp nào đủ tin cậy
    $historyString = implode('', array_map(function($h) {
        return $h['ket_qua'] === "Tài" ? "1" : "0";
    }, $recentHistory));
    
    $n = strlen($historyString);
    
    // 1. Kiểm tra mẫu đơn giản
    if ($n >= 4) {
        $lastThree = substr($historyString, -3);
        $patterns = [
            '111' => ['pred' => 'Xỉu', 'conf' => 68, 'note' => '3 Tài liên tiếp'],
            '000' => ['pred' => 'Tài', 'conf' => 68, 'note' => '3 Xỉu liên tiếp'],
            '101' => ['pred' => 'Xỉu', 'conf' => 65, 'note' => 'Mẫu xen kẽ 101'],
            '010' => ['pred' => 'Tài', 'conf' => 65, 'note' => 'Mẫu xen kẽ 010']
        ];
        
        if (isset($patterns[$lastThree])) {
            return [
                'du_doan' => $patterns[$lastThree]['pred'],
                'do_tin_cay' => $patterns[$lastThree]['conf'],
                'mau_cau' => $patterns[$lastThree]['note']
            ];
        }
    }
    
    // 2. Phân tích cân bằng
    $countTai = substr_count($historyString, '1');
    $countXiu = $n - $countTai;
    
    if (abs($countTai - $countXiu) > 5) {
        $prediction = $countTai > $countXiu ? 'Xỉu' : 'Tài';
        $imbalance = abs($countTai - $countXiu) / $n;
        $confidence = 65 + min(20, $imbalance * 100);
        
        return [
            'du_doan' => $prediction,
            'do_tin_cay' => min(85, $confidence),
            'mau_cau' => 'Điều chỉnh cân bằng (Tài:' . $countTai . '/Xỉu:' . $countXiu . ')'
        ];
    }
    
    // 3. Dự đoán dựa trên phiên gần nhất
    $lastResult = $currentResult['ket_qua'];
    $alternateConfidence = 62 + mt_rand(0, 18);
    
    return [
        'du_doan' => $lastResult === "Tài" ? "Xỉu" : "Tài",
        'do_tin_cay' => $alternateConfidence,
        'mau_cau' => 'Chiến lược đảo chiều cơ bản'
    ];
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

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
  "TXTTTTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTXXTXX": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTT": {
    "next": "T",
    "confidence": 65,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTXTTT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXXXX": {
    "next": "T",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXT": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTXXT": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTTXX": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTXX": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTXX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTX": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTXXXT": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXTXT": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXT": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXXTXT": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXTXT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXTTT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXT": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTT": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTXXXTXX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXTT": {
    "next": "X",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXXXT": {
    "next": "T",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXTTTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTTXXXT": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXXXT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXX": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTXTTTXX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXTT": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXTXT": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXTT": {
    "next": "X",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTXTT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXXT": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTXXT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXT": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTXTTT": {
    "next": "X",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTX": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTTX": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTXT": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXT": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTXXX": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTTX": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTTTT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXTT": {
    "next": "X",
    "confidence": 73,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TTTTXXTT": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTX": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXTTT": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXXXTTTX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTXTT": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXXXT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXTX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXTX": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTXXT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXTTX": {
    "next": "T",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTX": {
    "next": "T",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXX": {
    "next": "T",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTXTT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTTXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTTXX": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTT": {
    "next": "X",
    "confidence": 78,
    "description": "3 Tài liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXTTTTTT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTXXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXXT": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTXX": {
    "next": "X",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXTT": {
    "next": "T",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXT": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXT": {
    "next": "T",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTXXX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTT": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXX": {
    "next": "T",
    "confidence": 80,
    "description": "5 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "TXXXTXX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXXX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTXTXXTX": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTXXT": {
    "next": "T",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXXTT": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXXXT": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXXXT": {
    "next": "T",
    "confidence": 90,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTTXX": {
    "next": "T",
    "confidence": 84,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXTTTT": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXXXX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXXXX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXTT": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTXXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTXT": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXXXT": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTTXT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXX": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTTXXX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTXT": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTTX": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXXT": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXTXX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTTT": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTTX": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTXX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXT": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXXTXTXX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXTXX": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTTT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXXTXXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTTXTTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTXT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTX": {
    "next": "T",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXXT": {
    "next": "T",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXXXXT": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXXTTXX": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXXX": {
    "next": "T",
    "confidence": 76,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXXTTXTT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTTTX": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTTXT": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTTTXX": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXXTX": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXTTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXXT": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTX": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTT": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTXT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTT": {
    "next": "X",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTXTX": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTX": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXXTXTTX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXXXX": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXTX": {
    "next": "T",
    "confidence": 90,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTTXTX": {
    "next": "T",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTX": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXTXX": {
    "next": "T",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTXT": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXXTTX": {
    "next": "T",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXTXX": {
    "next": "T",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTXX": {
    "next": "T",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXT": {
    "next": "T",
    "confidence": 82,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTTXTTX": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXTTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXXT": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXXTTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTXXX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTT": {
    "next": "X",
    "confidence": 82,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTXXTX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXTX": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTTXX": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTXT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTXXT": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTXXX": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTTTXTTT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTXX": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTTT": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXT": {
    "next": "T",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTXX": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTX": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTXT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTXTX": {
    "next": "T",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXXTT": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXTTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTXXT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTX": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTTTTXXX": {
    "next": "X",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTTT": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTXTTTT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTTT": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXTXXTT": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXXTX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTX": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXX": {
    "next": "T",
    "confidence": 72,
    "description": "3 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXTTTTXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXXXXX": {
    "next": "T",
    "confidence": 76,
    "description": "7 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "TTXXXTXX": {
    "next": "T",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTXX": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTTTXT": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTX": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTTXT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTTTT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTTXXXTX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXTX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXXTT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTT": {
    "next": "X",
    "confidence": 73,
    "description": "6 Tài liên tiếp (Bệt)",
    "source": "generated"
  },
  "XTTXXTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXXTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTXXTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTTT": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTTTT": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTTTX": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTTXXX": {
    "next": "T",
    "confidence": 83,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXXXXTXT": {
    "next": "T",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXXXT": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXTT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXXXX": {
    "next": "T",
    "confidence": 68,
    "description": "8 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXXXXTT": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXTTTXXX": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXX": {
    "next": "T",
    "confidence": 85,
    "description": "4 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "TTXTXXXX": {
    "next": "T",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXTTT": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTXXX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXXTXTXX": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTT": {
    "next": "X",
    "confidence": 90,
    "description": "4 Tài liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXXTXTT": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTTT": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXX": {
    "next": "T",
    "confidence": 82,
    "description": "6 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXTXTXTX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTTX": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXTTTTT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTXT": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTXXTXX": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTT": {
    "next": "T",
    "confidence": 65,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTXTTT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXXXX": {
    "next": "T",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXT": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTXXT": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTTXX": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTXX": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTXX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTX": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTXXXT": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXTXT": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXT": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXXTXT": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXTXT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXTTT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXT": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTT": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTXXXTXX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXTT": {
    "next": "X",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXXXT": {
    "next": "T",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXTTTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTTXXXT": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXXXT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXX": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTXTTTXX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXTT": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXTXT": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXTT": {
    "next": "X",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTXTT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXXT": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTXXT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXT": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTXTTT": {
    "next": "X",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTX": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTTX": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTXT": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXT": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTXXX": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTTX": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTTTT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXTT": {
    "next": "X",
    "confidence": 73,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TTTTXXTT": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTX": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXTTT": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXXXTTTX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTXTT": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXXXT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXTX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXX": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXTX": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTXXT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXTTX": {
    "next": "T",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTX": {
    "next": "T",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXX": {
    "next": "T",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTXTT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTTXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTTXX": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTT": {
    "next": "X",
    "confidence": 78,
    "description": "3 Tài liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXTTTTTT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTXXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXXT": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTXX": {
    "next": "X",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXTT": {
    "next": "T",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXT": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXT": {
    "next": "T",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTXXX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTT": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXTTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXX": {
    "next": "T",
    "confidence": 80,
    "description": "5 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "TXXXTXX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXXX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTXTXXTX": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTXTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTXXT": {
    "next": "T",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXXTT": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXXXT": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXXXT": {
    "next": "T",
    "confidence": 90,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTTXX": {
    "next": "T",
    "confidence": 84,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXTTTT": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXXXX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXXXX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXTT": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTXXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTXT": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXXXT": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTTXT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXX": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXTTTXXX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTXT": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTTX": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXXT": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXTXX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTXT": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTTTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTTT": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTTX": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTXX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXT": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXXTXTXX": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXTXX": {
    "next": "X",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTTT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXXTXXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTTXTTTX": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTXT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTX": {
    "next": "T",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTXTT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXXT": {
    "next": "T",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXXXXT": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXXTTXX": {
    "next": "X",
    "confidence": 83,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXXX": {
    "next": "T",
    "confidence": 76,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXXTTXTT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTTTX": {
    "next": "X",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTTXT": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTTTXX": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXXTX": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXTTT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXXT": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTX": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTT": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTXT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTT": {
    "next": "X",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTXTX": {
    "next": "T",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXTX": {
    "next": "T",
    "confidence": 88,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXXTXTTX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXXXXXX": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXTX": {
    "next": "T",
    "confidence": 90,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXTTXTX": {
    "next": "T",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTX": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXTXX": {
    "next": "T",
    "confidence": 82,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTXT": {
    "next": "T",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXXTTX": {
    "next": "T",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXXTXX": {
    "next": "T",
    "confidence": 79,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTXX": {
    "next": "T",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXT": {
    "next": "T",
    "confidence": 82,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTTXTTX": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXTTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXXT": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XTXXXTTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTXXX": {
    "next": "T",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTT": {
    "next": "X",
    "confidence": 82,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTXXTX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXTX": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTTX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXTTXX": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTTXT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTTXXT": {
    "next": "X",
    "confidence": 77,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXTX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTXXX": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTTTXTTT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTXX": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTTT": {
    "next": "X",
    "confidence": 84,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTXXT": {
    "next": "T",
    "confidence": 66,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTXX": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTX": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTX": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXTXTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXTXTXT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTXTX": {
    "next": "T",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTXTXXTT": {
    "next": "X",
    "confidence": 70,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXTTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTXXT": {
    "next": "X",
    "confidence": 87,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTX": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTTTTXXX": {
    "next": "X",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTTT": {
    "next": "T",
    "confidence": 70,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTXTTTT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXTTTT": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXTXXTT": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXXXTX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTX": {
    "next": "T",
    "confidence": 74,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXX": {
    "next": "T",
    "confidence": 72,
    "description": "3 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXTTTTXT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTX": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXXXXX": {
    "next": "T",
    "confidence": 76,
    "description": "7 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "TTXXXTXX": {
    "next": "T",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTXTXX": {
    "next": "X",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTTX": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTTTTXT": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTTTX": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTTXT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTTTTT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XTTXXXTX": {
    "next": "T",
    "confidence": 73,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXTX": {
    "next": "T",
    "confidence": 80,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXXTT": {
    "next": "X",
    "confidence": 72,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTT": {
    "next": "X",
    "confidence": 73,
    "description": "6 Tài liên tiếp (Bệt)",
    "source": "generated"
  },
  "XTTXXTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXXTX": {
    "next": "T",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXTXTX": {
    "next": "T",
    "confidence": 69,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTXXTT": {
    "next": "X",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTTTT": {
    "next": "X",
    "confidence": 85,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXXXTTTT": {
    "next": "X",
    "confidence": 88,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTXXXT": {
    "next": "X",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTXX": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTT": {
    "next": "X",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTTTTTX": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "XXXTTXXX": {
    "next": "T",
    "confidence": 83,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXXXXTXT": {
    "next": "T",
    "confidence": 75,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXTXXXT": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXT": {
    "next": "X",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTTXXTT": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXXXX": {
    "next": "T",
    "confidence": 68,
    "description": "8 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXXXXTT": {
    "next": "T",
    "confidence": 72,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TXTTTXXX": {
    "next": "X",
    "confidence": 71,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTXXTTT": {
    "next": "X",
    "confidence": 68,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXX": {
    "next": "T",
    "confidence": 85,
    "description": "4 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "TTXTXXXX": {
    "next": "T",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXTTXTTT": {
    "next": "X",
    "confidence": 81,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTXXX": {
    "next": "T",
    "confidence": 89,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXXTXT": {
    "next": "X",
    "confidence": 78,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "XXXTXTXX": {
    "next": "T",
    "confidence": 86,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TTTT": {
    "next": "X",
    "confidence": 90,
    "description": "4 Tài liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXXTXTT": {
    "next": "T",
    "confidence": 67,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTTTTTT": {
    "next": "X",
    "confidence": 90,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "TXTXTT": {
    "next": "X",
    "confidence": 65,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXX": {
    "next": "T",
    "confidence": 82,
    "description": "6 Xỉu liên tiếp (Bệt)",
    "source": "generated"
  },
  "XXTXTXTX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XTTXTTX": {
    "next": "X",
    "confidence": 79,
    "description": "Cầu đối xứng",
    "source": "generated"
  },
  "TXX": {
    "next": "T",
    "confidence": 78,
    "description": "Cầu bệt nhẹ",
    "source": "generated"
  },
  "TTXTTTTT": {
    "next": "X",
    "confidence": 76,
    "description": "Cầu đan xen phức",
    "source": "generated"
  },
  "XXXXXTXT": {
    "next": "T",
    "confidence": 89,
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

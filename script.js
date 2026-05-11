c
nst DIFFICULTIES = {
  easy:   { speed: 3000, interval: 1200, perfectWindow: 120, goodWindow: 220 },
  normal: { speed: 2200, interval: 900,  perfectWindow: 80,  goodWindow: 160 },
  hard:   { speed: 1600, interval: 650,  perfectWindow: 50,  goodWindow: 110 },
};

const DIFF_DESCS = {
  easy:   "bigger timing window, slower bubbles",
  normal: "standard speed and timing",
  hard:   "fast bubbles, tight windows",
};


const PATTERN = [
  800, 1600, 2400, 3000, 3600,
  4600, 5200, 5800, 6600,
  7400, 8000, 8600, 9200, 9800,
  10800, 11400, 12200,
  13000, 13600, 14200, 14800,
  15800, 16400, 17000, 17600,
  18400, 19000, 19800,
  20600, 21200, 21800, 22600,
  23400, 24000, 24800,
  25600, 26200, 27000, 27600, 28200, 29000,
];
 
const GAME_DURATION = 30000; // ms
const HIT_ZONE_Y_PCT = 0.75;
const BUBBLE_EMOJIS = ["🫧", "✦", "◎", "∘"];

function freshState() {
  return {
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    goods: 0,
    misses: 0,
    totalJudged: 0,
    running: false,
    startTime: null,
    activeBubbles: [], // { el, targetTime }
  };
}

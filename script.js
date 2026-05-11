const DIFFICULTIES = {
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
 
const GAME_DURATION = 30000;
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
    activeBubbles: [], 
  };
}

const screens = {
  start:   document.getElementById("screen-start"),
  game:    document.getElementById("screen-game"),
  results: document.getElementById("screen-results"),
};
 
const scoreEl     = document.getElementById("score");
const comboEl     = document.getElementById("combo");
const accuracyEl  = document.getElementById("accuracy");
const timerEl     = document.getElementById("timer");
const feedbackEl  = document.getElementById("feedback");
const hitZoneEl   = document.getElementById("hit-zone");
const trackEl     = document.getElementById("track");
 
const resultScoreEl    = document.getElementById("result-score");
const resultAccuracyEl = document.getElementById("result-accuracy");
const resultGradeEl    = document.getElementById("result-grade");
const resultPerfectsEl = document.getElementById("result-perfects");
const resultGoodsEl    = document.getElementById("result-goods");
const resultMissesEl   = document.getElementById("result-misses");
const resultMaxComboEl = document.getElementById("result-maxcombo");
 

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

document.querySelectorAll(".diff-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDiff = btn.dataset.diff;
    document.getElementById("diff-desc").textContent = DIFF_DESCS[currentDiff];
  });
});

document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-retry").addEventListener("click", startGame);
document.getElementById("btn-menu").addEventListener("click", () => showScreen("start"));
 
function startGame() {
  state = freshState();
  trackEl.querySelectorAll(".bubble").forEach(b => b.remove());
  timers.forEach(clearTimeout);
  timers = [];
 
  showScreen("game");
  updateHUD();
 
  const diff = DIFFICULTIES[currentDiff];
  state.running = true;
  state.startTime = performance.now();

  PATTERN.forEach(offset => {
    const t = setTimeout(() => {
      if (state.running) spawnBubble(diff);
    }, offset);
    timers.push(t);
  });
 
 
  const timerInterval = setInterval(() => {
    if (!state.running) { clearInterval(timerInterval); return; }
    const elapsed = performance.now() - state.startTime;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    const secs = Math.ceil(remaining / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    if (secs <= 5) timerEl.classList.add("urgent");
 
    if (remaining <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 100);
  timers.push(timerInterval);
}
 

function spawnBubble(diff) {
  const trackRect = trackEl.getBoundingClientRect();
  const hitY = trackRect.height * HIT_ZONE_Y_PCT;
 
  const el = document.createElement("div");
  el.className = "bubble";
  el.textContent = BUBBLE_EMOJIS[Math.floor(Math.random() * BUBBLE_EMOJIS.length)];
 
  
  el.style.top = "-60px";
  trackEl.appendChild(el);
 
  const targetTime = performance.now() + diff.speed;
 
  state.activeBubbles.push({ el, targetTime });
 
  
  function animate() {
    if (!state.running) { el.remove(); return; }
    const now = performance.now();
    const progress = 1 - (targetTime - now) / diff.speed;
    const yPos = progress * (hitY + 30) - 30;
    el.style.top = `${yPos}px`;
 
    if (progress < 1.15) {
      requestAnimationFrame(animate);
    } else {
      
      const idx = state.activeBubbles.findIndex(b => b.el === el);
      if (idx !== -1) {
        state.activeBubbles.splice(idx, 1);
        registerMiss(el);
      }
    }
  }
  requestAnimationFrame(animate);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.repeat) {
    e.preventDefault();
    handleInput();
  }
});
 
document.getElementById("screen-game").addEventListener("pointerdown", () => {
  handleInput();
});
 
function handleInput() {
  if (!state.running) return;
 
  flashHitZone();
 
  const diff = DIFFICULTIES[currentDiff];
  const now = performance.now();
 
 
  let closest = null;
  let closestDelta = Infinity;
 
  state.activeBubbles.forEach(b => {
    const delta = Math.abs(b.targetTime - now);
    if (delta < closestDelta) {
      closestDelta = delta;
      closest = b;
    }
  });
 
  if (!closest || closestDelta > diff.goodWindow) {
    breakCombo();
    return;
  }
 
  const idx = state.activeBubbles.indexOf(closest);
  state.activeBubbles.splice(idx, 1);
 
  if (closestDelta <= diff.perfectWindow) {
    registerPerfect(closest.el);
  } else {
    registerGood(closest.el);
  }
}

function registerPerfect(el) {
  state.perfects++;
  state.totalJudged++;
  state.combo++;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.score += 100 * comboMultiplier();
  hitBubble(el);
  showFeedback("perfect ✦", "perfect");
  updateHUD();
}
 
function registerGood(el) {
  state.goods++;
  state.totalJudged++;
  state.combo++;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.score += 50 * comboMultiplier();
  hitBubble(el);
  showFeedback("good", "good");
  updateHUD();
}
 
function registerMiss(el) {
  state.misses++;
  state.totalJudged++;
  missBubble(el);
  showFeedback("miss", "miss");
  breakCombo();
}
 
function breakCombo() {
  if (state.combo > 0) {
    state.combo = 0;
    comboEl.classList.remove("shake");
    void comboEl.offsetWidth;
    comboEl.classList.add("shake");
    setTimeout(() => comboEl.classList.remove("shake"), 300);
  }
  updateHUD();
}
 
function comboMultiplier() {
  if (state.combo >= 20) return 4;
  if (state.combo >= 10) return 3;
  if (state.combo >= 5)  return 2;
  return 1;
}
 

function hitBubble(el) {
  el.classList.add("hit");
  setTimeout(() => el.remove(), 250);
}
 
function missBubble(el) {
  el.classList.add("miss-bubble");
  setTimeout(() => el.remove(), 250);
}
 
function flashHitZone() {
  hitZoneEl.classList.remove("flash");
  void hitZoneEl.offsetWidth;
  hitZoneEl.classList.add("flash");
  setTimeout(() => hitZoneEl.classList.remove("flash"), 120);
}

let feedbackTimer = null;
function showFeedback(text, type) {
  feedbackEl.textContent = text;
  feedbackEl.className = "";
  void feedbackEl.offsetWidth;
  feedbackEl.classList.add("show", type);
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedbackEl.className = "";
  }, 500);
}

function updateHUD() {
  scoreEl.textContent = Math.floor(state.score).toLocaleString();
  comboEl.textContent = `x${state.combo > 0 ? comboMultiplier() : 1}`;
 
  if (state.totalJudged > 0) {
    const acc = ((state.perfects + state.goods * 0.5) / state.totalJudged) * 100;
    accuracyEl.textContent = `${acc.toFixed(1)}%`;
  } else {
    accuracyEl.textContent = "-";
  }
}
function endGame() {
  state.running = false;
  timers.forEach(clearTimeout);
  timers = [];
  trackEl.querySelectorAll(".bubble").forEach(b => b.remove());
 
  const acc = state.totalJudged > 0
    ? ((state.perfects + state.goods * 0.5) / state.totalJudged) * 100
    : 0;
 
  const grade = getGrade(acc);
 
  resultScoreEl.textContent = Math.floor(state.score).toLocaleString();
  resultAccuracyEl.textContent = `${acc.toFixed(1)}%`;
  resultGradeEl.textContent = grade;
  resultGradeEl.className = "";
  resultGradeEl.classList.add(`grade-${grade.toLowerCase()}`);
  resultPerfectsEl.textContent = state.perfects;
  resultGoodsEl.textContent = state.goods;
  resultMissesEl.textContent = state.misses;
  resultMaxComboEl.textContent = state.maxCombo;
 
  showScreen("results");
}
 
function getGrade(acc) {
  if (acc >= 95) return "S";
  if (acc >= 80) return "A";
  if (acc >= 65) return "B";
  if (acc >= 50) return "C";
  return "F";
}

showScreen("start");
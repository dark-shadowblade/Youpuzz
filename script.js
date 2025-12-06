// ================== TIME SETTINGS ==================
const QUESTION_TIME = 180; // 3 minutes to think
const GAP_TIME = 15;      // 2 minutes gap before next question

const PHASE_QUESTION = "question";
const PHASE_GAP = "gap";

let remainingSeconds = QUESTION_TIME;
let phase = PHASE_QUESTION;
let countdownInterval = null;
let currentPuzzle = null;

// ================== DOM ELEMENTS ==================
const puzzleLinesEl = document.getElementById("puzzleLines");
const timerLabelEl = document.getElementById("timerLabel");
const timeDisplayEl = document.getElementById("timeDisplay");
const answerTextEl = document.getElementById("answerText");

// Audio elements (accg.mp3 and alert.mp3 in index.html)
const bgSound = document.getElementById("bgSound");
const alertSound = document.getElementById("alertSound");

// ================== AUDIO START (REQUIRED TAP) ==================
document.body.addEventListener(
  "click",
  () => {
    if (bgSound) {
      bgSound.volume = 0.18;
      bgSound.currentTime = 0;
      bgSound.play().catch(() => {});
    }
    if (alertSound) {
      alertSound.load(); // warm up for instant play
    }
  },
  { once: true }
);

// ================== HELPERS ==================
function formatTime(seconds) {
  seconds = Math.max(0, seconds);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function updateTimerDisplay() {
  if (!timeDisplayEl) return;
  timeDisplayEl.textContent = formatTime(remainingSeconds);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ================== LOGIC PATTERNS (50 SHORT LOGICS) ==================
const patterns = [
  { id: 1,  short: "(a + b) * 2",              compute: (a, b) => (a + b) * 2 },
  { id: 2,  short: "(a + b) * 3",              compute: (a, b) => (a + b) * 3 },
  { id: 3,  short: "(a + b) * 4",              compute: (a, b) => (a + b) * 4 },
  { id: 4,  short: "(a + b) + a*b",            compute: (a, b) => (a + b) + a * b },
  { id: 5,  short: "a*b + 5",                  compute: (a, b) => a * b + 5 },
  { id: 6,  short: "a*b - (a + b)",            compute: (a, b) => a * b - (a + b) },
  { id: 7,  short: "a^2 + b",                  compute: (a, b) => a * a + b },
  { id: 8,  short: "b^2 + a",                  compute: (a, b) => b * b + a },
  { id: 9,  short: "a^2 + b^2",                compute: (a, b) => a * a + b * b },
  { id: 10, short: "(a + b)^2",                compute: (a, b) => (a + b) * (a + b) },

  { id: 11, short: "2 * |a - b|",              compute: (a, b) => 2 * Math.abs(a - b) },
  { id: 12, short: "3 * |a - b|",              compute: (a, b) => 3 * Math.abs(a - b) },
  { id: 13, short: "10*a + b",                 compute: (a, b) => a * 10 + b },
  { id: 14, short: "10*b + a",                 compute: (a, b) => b * 10 + a },
  { id: 15, short: "5*a + 3*b",                compute: (a, b) => 5 * a + 3 * b },
  { id: 16, short: "3*a + 5*b",                compute: (a, b) => 3 * a + 5 * b },
  { id: 17, short: "(a + 1)*(b + 1)",          compute: (a, b) => (a + 1) * (b + 1) },
  { id: 18, short: "(a + 2)*b",                compute: (a, b) => (a + 2) * b },
  { id: 19, short: "a*b + (a - b)",            compute: (a, b) => a * b + (a - b) },
  { id: 20, short: "a*b - (a - b)",            compute: (a, b) => a * b - (a - b) },

  { id: 21, short: "a*b + 2*(a + b)",          compute: (a, b) => a * b + 2 * (a + b) },
  { id: 22, short: "a*b - 2*(a + b)",          compute: (a, b) => a * b - 2 * (a + b) },
  { id: 23, short: "a*b + a",                  compute: (a, b) => a * b + a },
  { id: 24, short: "a*b + b",                  compute: (a, b) => a * b + b },
  { id: 25, short: "a^2 * b",                  compute: (a, b) => a * a * b },
  { id: 26, short: "a * b^2",                  compute: (a, b) => a * b * b },
  { id: 27, short: "(a + b)*a",                compute: (a, b) => (a + b) * a },
  { id: 28, short: "(a + b)*b",                compute: (a, b) => (a + b) * b },
  { id: 29, short: "digits ab",                compute: (a, b) => Number("" + a + b) },
  { id: 30, short: "digits ba",                compute: (a, b) => Number("" + b + a) },

  { id: 31, short: "ab + (a + b)",             compute: (a, b) => Number("" + a + b) + (a + b) },
  { id: 32, short: "ab - (a + b)",             compute: (a, b) => Number("" + a + b) - (a + b) },
  { id: 33, short: "(a + b) then a*b",         compute: (a, b) => Number("" + (a + b) + a * b) },
  { id: 34, short: "a*b then (a + b)",         compute: (a, b) => Number("" + a * b + (a + b)) },
  { id: 35, short: "10*max + min",             compute: (a, b) => 10 * Math.max(a, b) + Math.min(a, b) },
  {
    id: 36,
    short: "max^2 + min",
    compute: (a, b) => {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      return max * max + min;
    },
  },
  { id: 37, short: "2*(max + min)",            compute: (a, b) => 2 * (Math.max(a, b) + Math.min(a, b)) },
  { id: 38, short: "5*(max - min)",            compute: (a, b) => 5 * (Math.max(a, b) - Math.min(a, b)) },
  { id: 39, short: "(a + b) + |a - b|",        compute: (a, b) => (a + b) + Math.abs(a - b) },
  { id: 40, short: "(a + b) + a*b",            compute: (a, b) => (a + b) + a * b },

  { id: 41, short: "2*a*b - (a + b)",          compute: (a, b) => 2 * a * b - (a + b) },
  { id: 42, short: "2*(a + b) + a*b",          compute: (a, b) => 2 * (a + b) + a * b },
  { id: 43, short: "a^3 + b",                  compute: (a, b) => a * a * a + b },
  { id: 44, short: "b^3 + a",                  compute: (a, b) => b * b * b + a },
  { id: 45, short: "(a + b)*|a - b|",          compute: (a, b) => (a + b) * Math.abs(a - b) },
  {
    id: 46,
    short: "max^2 - min^2",
    compute: (a, b) => {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      return max * max - min * min;
    },
  },
  { id: 47, short: "floor(a*b / 2)",           compute: (a, b) => Math.floor((a * b) / 2) },
  { id: 48, short: "3*min + 2*max",            compute: (a, b) => 3 * Math.min(a, b) + 2 * Math.max(a, b) },
  {
    id: 49,
    short: "(a + b) + min^2",
    compute: (a, b) => {
      const min = Math.min(a, b);
      return (a + b) + min * min;
    },
  },
  {
    id: 50,
    short: "a*b + max^2",
    compute: (a, b) => {
      const max = Math.max(a, b);
      return a * b + max * max;
    },
  },
];

// ================== PUZZLE GENERATION ==================
// 3 example lines + 1 question line
function generatePuzzle() {
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  const examples = [];
  for (let i = 0; i < 3; i++) {
    const a = randomInt(1, 9);
    const b = randomInt(1, 9);
    const result = pattern.compute(a, b);
    examples.push({ a, b, result, text: `${a} + ${b} = ${result}` });
  }

  // Question pair (unknown to viewer)
  const qa = randomInt(1, 9);
  const qb = randomInt(1, 9);
  const qResult = pattern.compute(qa, qb);

  const questionLine = `${qa} + ${qb} = ?`;
  const answerLine = `${qa} + ${qb} = ${qResult}`;

  return {
    example1: examples[0].text,
    example2: examples[1].text,
    example3: examples[2].text,
    questionLine,
    answerLine,
    answer: qResult,
    logicShort: pattern.short,
  };
}

// ================== RENDER HELPERS ==================
function renderQuestionView() {
  if (!puzzleLinesEl || !currentPuzzle) return;

  // Show 3 examples + 1 question with "?" and pulse
  puzzleLinesEl.innerHTML =
    `<span class="line1">${currentPuzzle.example1}</span><br>` +
    `<span class="line2">${currentPuzzle.example2}</span><br>` +
    `<span class="line3">${currentPuzzle.example3}</span><br>` +
    `<span class="line4 pulse-question">${currentPuzzle.questionLine}</span>`;
}

function renderAnswerView() {
  if (!puzzleLinesEl || !currentPuzzle) return;

  // Replace question "?" line with answer (no pulse)
  puzzleLinesEl.innerHTML =
    `<span class="line1">${currentPuzzle.example1}</span><br>` +
    `<span class="line2">${currentPuzzle.example2}</span><br>` +
    `<span class="line3">${currentPuzzle.example3}</span><br>` +
    `<span class="line4">${currentPuzzle.answerLine}</span>`;
}

// ================== QUIZ FLOW ==================
function showNewPuzzle() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  currentPuzzle = generatePuzzle();
  renderQuestionView();

  phase = PHASE_QUESTION;
  remainingSeconds = QUESTION_TIME;

  if (timerLabelEl) timerLabelEl.textContent = "Time left to think:";
  if (answerTextEl) {
    answerTextEl.textContent = "";
    answerTextEl.style.opacity = "0";
  }

  updateTimerDisplay();
  startCountdown();
}

function revealAnswer() {
  if (!currentPuzzle) return;

  // Update main puzzle block
  renderAnswerView();

  // Show short answer + logic below
  if (answerTextEl) {
    answerTextEl.textContent =
      "Answer: " + currentPuzzle.answer + "\n" +
      "Logic: " + currentPuzzle.logicShort;
    answerTextEl.style.opacity = "1";
  }

  phase = PHASE_GAP;
  remainingSeconds = GAP_TIME;

  if (timerLabelEl) timerLabelEl.textContent = "Next question in:";
  updateTimerDisplay();
  startCountdown();
}

function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    // Alert sound when 5 seconds left in thinking phase
    if (phase === PHASE_QUESTION && remainingSeconds === 5 && alertSound) {
      alertSound.currentTime = 0;
      alertSound.play().catch(() => {});
    }

    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;

      if (phase === PHASE_QUESTION) {
        revealAnswer();
      } else if (phase === PHASE_GAP) {
        showNewPuzzle();
      }
    }
  }, 1000);
}

// ================== START ON LOAD ==================
window.addEventListener("load", showNewPuzzle);

// Time (in seconds)
const QUESTION_TIME = 3 * 60; // 3 minutes
const GAP_TIME = 2 * 60;      // 2 minutes

const PHASE_QUESTION = "question";
const PHASE_GAP = "gap";

let remainingSeconds = QUESTION_TIME;
let phase = PHASE_QUESTION;
let countdownInterval = null;
let currentPuzzle = null;

const givenEquationEl = document.getElementById("givenEquation");
const questionEquationEl = document.getElementById("questionEquation");
const timerLabelEl = document.getElementById("timerLabel");
const timeDisplayEl = document.getElementById("timeDisplay");
const answerBoxEl = document.getElementById("answerBox");
const answerTextEl = document.getElementById("answerText");

const bgSound = document.getElementById("bgSound");
const alertSound = document.getElementById("alertSound");

// Start background sound after first click (needed on mobile browsers)
document.body.addEventListener(
  "click",
  () => {
    bgSound.volume = 0.15;
    bgSound.play().catch(() => {});
  },
  { once: true }
);

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timeDisplayEl.textContent = formatTime(remainingSeconds);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --------- LOGIC PATTERNS (many different logics) ---------

const patterns = [
  {
    id: 1,
    description: "Multiply the sum by 2.",
    formula: "Result = (a + b) × 2",
    compute: (a, b) => (a + b) * 2
  },
  {
    id: 2,
    description: "Multiply the sum by 3.",
    formula: "Result = (a + b) × 3",
    compute: (a, b) => (a + b) * 3
  },
  {
    id: 3,
    description: "Multiply the sum by 4.",
    formula: "Result = (a + b) × 4",
    compute: (a, b) => (a + b) * 4
  },
  {
    id: 4,
    description: "Add the sum and the product.",
    formula: "Result = (a + b) + (a × b)",
    compute: (a, b) => (a + b) + (a * b)
  },
  {
    id: 5,
    description: "Multiply the numbers then add 5.",
    formula: "Result = (a × b) + 5",
    compute: (a, b) => (a * b) + 5
  },
  {
    id: 6,
    description: "Multiply and then subtract the sum.",
    formula: "Result = (a × b) − (a + b)",
    compute: (a, b) => (a * b) - (a + b)
  },
  {
    id: 7,
    description: "Square the first number and add the second.",
    formula: "Result = a² + b",
    compute: (a, b) => a * a + b
  },
  {
    id: 8,
    description: "Square the second number and add the first.",
    formula: "Result = b² + a",
    compute: (a, b) => b * b + a
  },
  {
    id: 9,
    description: "Square both numbers and add.",
    formula: "Result = a² + b²",
    compute: (a, b) => a * a + b * b
  },
  {
    id: 10,
    description: "Square the sum.",
    formula: "Result = (a + b)²",
    compute: (a, b) => (a + b) * (a + b)
  },
  {
    id: 11,
    description: "Take the absolute difference and multiply by 2.",
    formula: "Result = |a − b| × 2",
    compute: (a, b) => Math.abs(a - b) * 2
  },
  {
    id: 12,
    description: "Take the absolute difference and multiply by 3.",
    formula: "Result = |a − b| × 3",
    compute: (a, b) => Math.abs(a - b) * 3
  },
  {
    id: 13,
    description: "Create a two-digit number with a as tens and b as units.",
    formula: "Result = 10a + b",
    compute: (a, b) => a * 10 + b
  },
  {
    id: 14,
    description: "Create a two-digit number with b as tens and a as units.",
    formula: "Result = 10b + a",
    compute: (a, b) => b * 10 + a
  },
  {
    id: 15,
    description: "Weighted sum: 5×a + 3×b.",
    formula: "Result = 5a + 3b",
    compute: (a, b) => 5 * a + 3 * b
  },
  {
    id: 16,
    description: "Weighted sum: 3×a + 5×b.",
    formula: "Result = 3a + 5b",
    compute: (a, b) => 3 * a + 5 * b
  },
  {
    id: 17,
    description: "Increase both by 1 and multiply.",
    formula: "Result = (a + 1) × (b + 1)",
    compute: (a, b) => (a + 1) * (b + 1)
  },
  {
    id: 18,
    description: "Increase first by 2 and multiply.",
    formula: "Result = (a + 2) × b",
    compute: (a, b) => (a + 2) * b
  },
  {
    id: 19,
    description: "Multiply then add the difference.",
    formula: "Result = (a × b) + (a − b)",
    compute: (a, b) => (a * b) + (a - b)
  },
  {
    id: 20,
    description: "Multiply then subtract the difference.",
    formula: "Result = (a × b) − (a − b)",
    compute: (a, b) => (a * b) - (a - b)
  },
  {
    id: 21,
    description: "Multiply then add twice the sum.",
    formula: "Result = (a × b) + 2(a + b)",
    compute: (a, b) => (a * b) + 2 * (a + b)
  },
  {
    id: 22,
    description: "Multiply then subtract twice the sum.",
    formula: "Result = (a × b) − 2(a + b)",
    compute: (a, b) => (a * b) - 2 * (a + b)
  },
  {
    id: 23,
    description: "Multiply and then add the first number again.",
    formula: "Result = (a × b) + a",
    compute: (a, b) => (a * b) + a
  },
  {
    id: 24,
    description: "Multiply and then add the second number again.",
    formula: "Result = (a × b) + b",
    compute: (a, b) => (a * b) + b
  },
  {
    id: 25,
    description: "First squared, times the second.",
    formula: "Result = a² × b",
    compute: (a, b) => a * a * b
  },
  {
    id: 26,
    description: "Second squared, times the first.",
    formula: "Result = a × b²",
    compute: (a, b) => a * b * b
  },
  {
    id: 27,
    description: "Sum multiplied by the first number.",
    formula: "Result = (a + b) × a",
    compute: (a, b) => (a + b) * a
  },
  {
    id: 28,
    description: "Sum multiplied by the second number.",
    formula: "Result = (a + b) × b",
    compute: (a, b) => (a + b) * b
  },
  {
    id: 29,
    description: "Concatenate a and b as digits.",
    formula: "Result = concat(a, b)",
    compute: (a, b) => Number(`${a}${b}`)
  },
  {
    id: 30,
    description: "Concatenate b and a as digits.",
    formula: "Result = concat(b, a)",
    compute: (a, b) => Number(`${b}${a}`)
  },
  {
    id: 31,
    description: "Concatenate a and b, then add their sum.",
    formula: "Result = concat(a, b) + (a + b)",
    compute: (a, b) => Number(`${a}${b}`) + (a + b)
  },
  {
    id: 32,
    description: "Concatenate a and b, then subtract their sum.",
    formula: "Result = concat(a, b) − (a + b)",
    compute: (a, b) => Number(`${a}${b}`) - (a + b)
  },
  {
    id: 33,
    description: "Concatenate sum and product.",
    formula: "Result = concat(a + b, a × b)",
    compute: (a, b) => Number(`${a + b}${a * b}`)
  },
  {
    id: 34,
    description: "Concatenate product and sum.",
    formula: "Result = concat(a × b, a + b)",
    compute: (a, b) => Number(`${a * b}${a + b}`)
  },
  {
    id: 35,
    description: "Use the larger number as tens, smaller as units.",
    formula: "Result = 10 × max(a, b) + min(a, b)",
    compute: (a, b) => {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      return 10 * max + min;
    }
  },
  {
    id: 36,
    description: "Square the larger and add the smaller.",
    formula: "Result = max(a, b)² + min(a, b)",
    compute: (a, b) => {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      return max * max + min;
    }
  },
  {
    id: 37,
    description: "Double the sum of larger and smaller.",
    formula: "Result = 2 × (max(a, b) + min(a, b))",
    compute: (a, b) => 2 * (Math.max(a, b) + Math.min(a, b))
  },
  {
    id: 38,
    description: "Five times the difference between larger and smaller.",
    formula: "Result = 5 × (max(a, b) − min(a, b))",
    compute: (a, b) => 5 * (Math.max(a, b) - Math.min(a, b))
  },
  {
    id: 39,
    description: "Sum plus absolute difference.",
    formula: "Result = (a + b) + |a − b|",
    compute: (a, b) => (a + b) + Math.abs(a - b)
  },
  {
    id: 40,
    description: "Sum plus product.",
    formula: "Result = (a + b) + (a × b)",
    compute: (a, b) => (a + b) + (a * b)
  },
  {
    id: 41,
    description: "Twice the product minus the sum.",
    formula: "Result = 2(a × b) − (a + b)",
    compute: (a, b) => 2 * a * b - (a + b)
  },
  {
    id: 42,
    description: "Twice the sum plus the product.",
    formula: "Result = 2(a + b) + (a × b)",
    compute: (a, b) => 2 * (a + b) + a * b
  },
  {
    id: 43,
    description: "Cube the first and add the second.",
    formula: "Result = a³ + b",
    compute: (a, b) => a * a * a + b
  },
  {
    id: 44,
    description: "Cube the second and add the first.",
    formula: "Result = b³ + a",
    compute: (a, b) => b * b * b + a
  },
  {
    id: 45,
    description: "Sum multiplied by absolute difference.",
    formula: "Result = (a + b) × |a − b|",
    compute: (a, b) => (a + b) * Math.abs(a - b)
  },
  {
    id: 46,
    description: "Square the larger minus square of the smaller.",
    formula: "Result = max(a, b)² − min(a, b)²",
    compute: (a, b) => {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      return max * max - min * min;
    }
  },
  {
    id: 47,
    description: "Half of the product (rounded down).",
    formula: "Result = floor((a × b) ÷ 2)",
    compute: (a, b) => Math.floor((a * b) / 2)
  },
  {
    id: 48,
    description: "Triple of the smaller plus double of the larger.",
    formula: "Result = 3 × min(a, b) + 2 × max(a, b)",
    compute: (a, b) => 3 * Math.min(a, b) + 2 * Math.max(a, b)
  },
  {
    id: 49,
    description: "Sum, then square the smaller and add.",
    formula: "Result = (a + b) + min(a, b)²",
    compute: (a, b) => (a + b) + Math.min(a, b) ** 2
  },
  {
    id: 50,
    description: "Product plus square of the larger.",
    formula: "Result = (a × b) + max(a, b)²",
    compute: (a, b) => (a * b) + Math.max(a, b) ** 2
  }
];

// Create one puzzle: pick random pattern + random numbers
function generatePuzzle() {
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  const a = randomInt(1, 9);
  const b = randomInt(1, 9);
  const c = randomInt(1, 9);
  const d = randomInt(1, 9);

  const firstResult = pattern.compute(a, b);
  const secondResult = pattern.compute(c, d);

  const given = `${a} + ${b} = ${firstResult}`;
  const question = `${c} + ${d} = ?`;

  const logicText =
    `Logic #${pattern.id}: ${pattern.description}\n` +
    `Formula: ${pattern.formula}\n\n` +
    `Example (first line):\n` +
    `  For a = ${a}, b = ${b} → ${firstResult}\n\n` +
    `For the question:\n` +
    `  For a = ${c}, b = ${d} → ${secondResult}`;

  return {
    given,
    question,
    answer: secondResult,
    logicText
  };
}

// --------- QUIZ FLOW ---------

function showNewPuzzle() {
  if (countdownInterval) clearInterval(countdownInterval);

  currentPuzzle = generatePuzzle();
  givenEquationEl.textContent = currentPuzzle.given;
  questionEquationEl.textContent = currentPuzzle.question;

  phase = PHASE_QUESTION;
  remainingSeconds = QUESTION_TIME;
  timerLabelEl.textContent = "Time left to think:";
  answerTextEl.textContent = "Will be revealed after the timer.";
  answerBoxEl.style.opacity = "0.7";

  updateTimerDisplay();
  startCountdown();
}

function revealAnswer() {
  answerTextEl.textContent =
    `Answer: ${currentPuzzle.answer}\n\n` +
    currentPuzzle.logicText;

  answerBoxEl.style.opacity = "1";
  phase = PHASE_GAP;
  remainingSeconds = GAP_TIME;
  timerLabelEl.textContent = "Next question in:";
  updateTimerDisplay();
  startCountdown();
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();

    // Alert sound when 5 seconds left before answer reveal
    if (phase === PHASE_QUESTION && remainingSeconds === 5) {
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

// Start the first puzzle when page loads
window.addEventListener("load", showNewPuzzle);

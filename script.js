const BOARD_SIZE = 15;

// IMPORTANT: Replace with your Render URL after deployment
// Example: https://your-backend.onrender.com
const BACKEND_URL = "http://127.0.0.1:5000"; // switch to Render URL for GitHub Pages

let board = null;
let locked = false;
let gameOver = false;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("statusText");
const newGameBtn = document.getElementById("newGameBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

function setLocked(v) {
  locked = v;
  newGameBtn.disabled = v;
}

function isGameOverStatus(status) {
  return status === "player_win" || status === "ai_win" || status === "draw";
}

function render() {
  boardEl.innerHTML = "";
  boardEl.classList.toggle("game-over", gameOver);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.tabIndex = gameOver ? -1 : 0;

      cell.dataset.row = String(r);
      cell.dataset.col = String(c);

      const val = board[r][c];
      if (val === 1 || val === 2) {
        cell.classList.add("occupied");
        const stone = document.createElement("div");
        stone.className = "stone " + (val === 1 ? "black" : "white");
        cell.appendChild(stone);
        cell.style.cursor = "default";
      }

      cell.addEventListener("click", onCellClick);
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") onCellClick(e);
      });

      boardEl.appendChild(cell);
    }
  }
}

async function apiPost(path, payload) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function newGame() {
  try {
    setLocked(true);
    gameOver = false;
    setStatus("Starting game…");
    const data = await apiPost("/start", {});
    board = data.board;
    gameOver = isGameOverStatus(data.status);
    render();
    setStatus(data.message || "Your turn.");
  } catch (e) {
    setStatus(`Error: ${e.message}`);
  } finally {
    setLocked(false);
  }
}

async function onCellClick(e) {
  if (locked) return;
  if (gameOver) return;
  if (!board) return;

  const cell = e.currentTarget;
  const r = Number(cell.dataset.row);
  const c = Number(cell.dataset.col);

  if (board[r][c] !== 0) return;

  try {
    setLocked(true);
    setStatus("AI thinking…");

    const data = await apiPost("/move", { board, row: r, col: c });
    board = data.board;
    gameOver = isGameOverStatus(data.status);
    render();

    if (data.status === "ongoing") {
      setStatus(data.message || "Your turn.");
    } else if (data.status === "player_win") {
      setStatus("You win! Click New Game to play again.");
    } else if (data.status === "ai_win") {
      setStatus("AI wins. Click New Game to try again.");
    } else if (data.status === "draw") {
      setStatus("Draw. Click New Game to play again.");
    } else {
      setStatus(data.message || "Done.");
    }

  } catch (e2) {
    setStatus(`Error: ${e2.message}`);
  } finally {
    setLocked(false);
  }
}

newGameBtn.addEventListener("click", newGame);

// auto-start
newGame();

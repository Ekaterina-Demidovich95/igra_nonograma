const EMPTY = 0, FILLED = 1, CROSS = 2;
const STORAGE_THEME = 'nonogram-theme';
const STORAGE_LEVEL = 'nonogram-level-';

let size = 5;
let subStars = 1;
let levelIndex = 0;
let currentLevel = null;
let solution = [];
let colorMap = [];
let player = [];
let rowClues = [];
let colClues = [];
let errors = 0;
let timerInterval = null;
let seconds = 0;
let gameStarted = false;
let won = false;
let paintMode = 'fill';
let isDragging = false;
let dragAction = null;
let isTouchDevice = false;

const board = document.getElementById('board');
const timerEl = document.getElementById('timer');
const errorsEl = document.getElementById('errors');
const winOverlay = document.getElementById('winOverlay');
const levelNameEl = document.querySelector('#levelName');
const levelEmojiEl = document.getElementById('levelEmoji');
const levelCounterEl = document.getElementById('levelCounter');
const levelProgressEl = document.getElementById('levelProgress');
const levelStarsEl = document.getElementById('levelStars');
const tierBadgeEl = document.getElementById('tierBadge');
const themeToggle = document.getElementById('themeToggle');
const winPreview = document.getElementById('winPreview');
const winTitle = document.getElementById('winTitle');
const winSubtitle = document.getElementById('winSubtitle');
const mobileToolbar = document.getElementById('mobileToolbar');
const hintDesktop = document.getElementById('hintDesktop');
const hintMobile = document.getElementById('hintMobile');
const gameWrapper = document.getElementById('gameWrapper');

function calcClues(line) {
  const clues = [];
  let count = 0;
  for (const cell of line) {
    if (cell === FILLED || cell === 1) count++;
    else if (count > 0) { clues.push(count); count = 0; }
  }
  if (count > 0) clues.push(count);
  return clues.length ? clues : [0];
}

function storageKey() {
  return `${STORAGE_LEVEL}${size}-${subStars}`;
}

function loadProgress() {
  const saved = localStorage.getItem(storageKey());
  levelIndex = saved !== null ? parseInt(saved, 10) : 0;
}

function saveProgress() {
  localStorage.setItem(storageKey(), String(levelIndex));
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_THEME);
  const theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_THEME, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
}

function detectTouch() {
  isTouchDevice = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  document.body.classList.toggle('is-touch', isTouchDevice);
}

function setPaintMode(mode) {
  paintMode = mode;
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function updateLevelUI() {
  if (!currentLevel) return;
  levelEmojiEl.textContent = currentLevel.emoji;
  levelNameEl.textContent = currentLevel.name;
  levelCounterEl.textContent = `${currentLevel.index + 1} / ${currentLevel.total}`;
  levelStarsEl.textContent = currentLevel.starsText;
  tierBadgeEl.textContent = `${currentLevel.tier.label} · ${currentLevel.subTier.label}`;
  tierBadgeEl.className = `tier-badge sub-${currentLevel.subTier.color}`;
  const pct = ((currentLevel.index + 1) / currentLevel.total) * 100;
  levelProgressEl.style.width = pct + '%';
  updateDifficultyButtons();
}

function updateDifficultyButtons() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    const active = +btn.dataset.size === size && +btn.dataset.stars === subStars;
    btn.classList.toggle('active', active);
  });
}

function fitBoardToScreen() {
  const maxRowClueLen = Math.max(...rowClues.map(c => c.length));
  const maxColClueLen = Math.max(...colClues.map(c => c.length));
  const clueW = maxRowClueLen * 11 + 24;
  const clueH = maxColClueLen * 14 + 16;
  const pad = isTouchDevice ? 16 : 32;
  const headerH = isTouchDevice ? 360 : 400;
  const toolbarH = isTouchDevice ? 72 : 0;
  const availW = window.innerWidth - pad;
  const availH = window.innerHeight - headerH - toolbarH;

  const cellW = Math.floor((availW - clueW) / size);
  const cellH = Math.floor((availH - clueH) / size);
  const cell = Math.max(isTouchDevice ? 28 : 24, Math.min(isTouchDevice ? 46 : 48, cellW, cellH));

  document.documentElement.style.setProperty('--cell-size', cell + 'px');
}

function initGame(keepLevel = true) {
  if (!keepLevel) levelIndex = 0;
  else loadProgress();

  stopTimer();
  seconds = 0;
  errors = 0;
  gameStarted = false;
  won = false;
  isDragging = false;
  timerEl.textContent = '00:00';
  errorsEl.textContent = '0';
  winOverlay.classList.remove('show');
  board.classList.remove('won');

  currentLevel = getLevel(size, subStars, levelIndex);
  solution = currentLevel.grid.map(r => [...r]);
  colorMap = currentLevel.colors.map(r => [...r]);
  rowClues = currentLevel.rowClues;
  colClues = currentLevel.colClues;
  player = Array.from({ length: size }, () => Array(size).fill(EMPTY));

  updateLevelUI();
  fitBoardToScreen();
  render();
}

function getClueFontSize() {
  const cell = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
  if (cell <= 30) return '0.55rem';
  if (size <= 5) return '0.82rem';
  if (size <= 10) return '0.65rem';
  return '0.52rem';
}

function render() {
  const clueFont = getClueFontSize();
  const maxRowClueLen = Math.max(...rowClues.map(c => c.length));
  const maxColClueLen = Math.max(...colClues.map(c => c.length));

  board.style.gridTemplateColumns =
    `minmax(${maxRowClueLen * 11 + 16}px, auto) repeat(${size}, var(--cell-size))`;
  board.style.gridTemplateRows =
    `minmax(${maxColClueLen * 14 + 10}px, auto) repeat(${size}, var(--cell-size))`;

  board.innerHTML = '';

  const corner = document.createElement('div');
  corner.className = 'corner';
  board.appendChild(corner);

  for (let c = 0; c < size; c++) {
    const clueEl = document.createElement('div');
    clueEl.className = 'clue-col';
    clueEl.style.fontSize = clueFont;
    clueEl.dataset.index = c;
    colClues[c].forEach(n => {
      const span = document.createElement('span');
      span.textContent = n === 0 ? '' : n;
      clueEl.appendChild(span);
    });
    board.appendChild(clueEl);
  }

  for (let r = 0; r < size; r++) {
    const clueEl = document.createElement('div');
    clueEl.className = 'clue-row';
    clueEl.style.fontSize = clueFont;
    clueEl.dataset.index = r;
    rowClues[r].forEach(n => {
      const span = document.createElement('span');
      span.textContent = n === 0 ? '' : n;
      clueEl.appendChild(span);
    });
    board.appendChild(clueEl);

    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      applyCellState(cell, r, c);
      bindCellEvents(cell, r, c);
      board.appendChild(cell);
    }
  }

  updateClueHighlights();
}

function bindCellEvents(cell, r, c) {
  cell.addEventListener('contextmenu', e => {
    e.preventDefault();
    applyAction(r, c, 'cross');
  });

  cell.addEventListener('mousedown', e => {
    if (e.button === 2) return;
    e.preventDefault();
    isDragging = true;
    dragAction = isTouchDevice ? paintMode : 'fill';
    applyAction(r, c, dragAction);
  });

  cell.addEventListener('mouseenter', () => {
    if (isDragging && !isTouchDevice) applyAction(r, c, dragAction, true);
  });

  cell.addEventListener('touchstart', e => {
    e.preventDefault();
    isDragging = true;
    applyAction(r, c, paintMode);
  }, { passive: false });

  cell.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('cell')) {
      applyAction(+target.dataset.row, +target.dataset.col, paintMode, true);
    }
  }, { passive: true });

  cell.addEventListener('touchend', () => {
    isDragging = false;
  });
}

function applyAction(r, c, action, fromDrag = false) {
  if (won) return;
  if (!gameStarted) startTimer();

  const prev = player[r][c];
  let next;

  if (action === 'fill') {
    if (fromDrag) {
      if (prev === FILLED) return;
      next = FILLED;
    } else {
      next = prev === FILLED ? EMPTY : FILLED;
    }
  } else {
    if (fromDrag) {
      if (prev === CROSS) return;
      next = CROSS;
    } else {
      next = prev === CROSS ? EMPTY : CROSS;
    }
  }

  if (prev === next) return;

  const wasCorrect = checkCellCorrectness(r, c, prev);
  player[r][c] = next;
  const isCorrect = checkCellCorrectness(r, c, next);

  if (prev !== EMPTY && wasCorrect && !isCorrect) errors++;
  if (prev === EMPTY && !isCorrect) errors++;

  errorsEl.textContent = errors;

  const cell = board.querySelector(`[data-row="${r}"][data-col="${c}"]`);
  applyCellState(cell, r, c);
  if (!isCorrect) cell.classList.add('error-flash');

  updateClueHighlights();
  checkCompletion();
}

function applyCellState(cell, r, c) {
  const state = player[r][c];
  cell.classList.remove('filled', 'cross', 'error-flash', 'revealed');
  cell.style.background = '';

  if (state === FILLED) {
    cell.classList.add('filled');
    if (won && colorMap[r][c]) {
      cell.classList.add('revealed');
      cell.style.background = colorMap[r][c];
    }
  }
  if (state === CROSS) cell.classList.add('cross');
}

function checkCellCorrectness(r, c, state) {
  const sol = solution[r][c];
  if (state === EMPTY) return true;
  if (state === FILLED) return sol === 1;
  if (state === CROSS) return sol === 0;
  return true;
}

function getPlayerLineClues(isRow, index) {
  const line = isRow
    ? player[index].map(v => v === FILLED ? 1 : 0)
    : player.map(row => row[index] === FILLED ? 1 : 0);
  return calcClues(line);
}

function cluesMatch(playerClues, solutionClues) {
  const p = playerClues.filter(n => n !== 0);
  const s = solutionClues.filter(n => n !== 0);
  if (p.length !== s.length) return false;
  return p.every((n, i) => n === s[i]);
}

function updateClueHighlights() {
  document.querySelectorAll('.clue-row').forEach(el => {
    const idx = +el.dataset.index;
    el.classList.toggle('done', cluesMatch(getPlayerLineClues(true, idx), rowClues[idx]));
  });
  document.querySelectorAll('.clue-col').forEach(el => {
    const idx = +el.dataset.index;
    el.classList.toggle('done', cluesMatch(getPlayerLineClues(false, idx), colClues[idx]));
  });
}

function checkCompletion() {
  const totalToFill = solution.flat().filter(v => v === 1).length;
  const playerFilled = player.flat().filter(v => v === FILLED).length;
  if (playerFilled < totalToFill) return;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const p = player[r][c];
      const s = solution[r][c];
      if (s === 1 && p !== FILLED) return;
      if (s === 0 && p === FILLED) return;
    }
  }

  win();
}

function startTimer() {
  gameStarted = true;
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function revealColors() {
  board.classList.add('won');
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (player[r][c] === FILLED) {
        const cell = board.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell && colorMap[r][c]) {
          cell.classList.add('revealed');
          cell.style.background = colorMap[r][c];
          cell.style.transition = `background 0.4s ease ${(r + c) * 25}ms`;
        }
      }
    }
  }
}

function buildWinPreview() {
  winPreview.innerHTML = '';
  const cellPx = Math.max(6, Math.floor(140 / size));
  winPreview.style.gridTemplateColumns = `repeat(${size}, ${cellPx}px)`;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = 'win-preview-cell';
      cell.style.width = cellPx + 'px';
      cell.style.height = cellPx + 'px';
      cell.style.background = solution[r][c]
        ? (colorMap[r][c] || 'var(--fill)')
        : 'var(--bg)';
      winPreview.appendChild(cell);
    }
  }
}

function win() {
  won = true;
  stopTimer();

  const isLast = levelIndex >= currentLevel.total - 1;
  document.getElementById('winTime').textContent = formatTime(seconds);
  document.getElementById('winErrors').textContent = errors;
  winTitle.textContent = `${currentLevel.emoji} ${currentLevel.name}!`;
  winSubtitle.textContent = isLast
    ? `Все ${currentLevel.total} уровней (${currentLevel.tier.label}, ${currentLevel.subTier.label}) пройдены!`
    : `${currentLevel.tier.label} · ${currentLevel.subTier.label} · ${currentLevel.starsText} · ${currentLevel.index + 1}/${currentLevel.total}`;

  const nextBtn = document.getElementById('nextLevel');
  nextBtn.textContent = isLast ? 'Сначала' : 'Следующий уровень';
  nextBtn.dataset.isLast = isLast ? '1' : '0';

  buildWinPreview();
  revealColors();
  winOverlay.classList.add('show');
  spawnConfetti();
}

function nextLevel() {
  const nextBtn = document.getElementById('nextLevel');
  if (nextBtn.dataset.isLast === '1') {
    levelIndex = 0;
  } else {
    levelIndex = Math.min(levelIndex + 1, currentLevel.total - 1);
  }
  saveProgress();
  initGame(true);
}

function spawnConfetti() {
  const colors = ['#6366f1', '#ec4899', '#10b981', '#facc15', '#3b82f6', '#f97316'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDuration = (2 + Math.random() * 2) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, i * 25);
  }
}

document.getElementById('newGame').addEventListener('click', () => initGame(true));
document.getElementById('playAgain').addEventListener('click', () => initGame(true));
document.getElementById('nextLevel').addEventListener('click', nextLevel);
themeToggle.addEventListener('click', toggleTheme);

document.getElementById('difficultyPanel').addEventListener('click', e => {
  const btn = e.target.closest('.diff-btn');
  if (!btn) return;
  size = +btn.dataset.size;
  subStars = +btn.dataset.stars;
  initGame(true);
});

mobileToolbar.addEventListener('click', e => {
  const btn = e.target.closest('.tool-btn');
  if (btn) setPaintMode(btn.dataset.mode);
});

document.addEventListener('mouseup', () => { isDragging = false; });
document.addEventListener('mouseleave', () => { isDragging = false; });

document.addEventListener('contextmenu', e => {
  if (e.target.closest('.cell')) e.preventDefault();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    detectTouch();
    if (currentLevel) {
      fitBoardToScreen();
      render();
    }
  }, 150);
});

board.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target && target.classList.contains('cell')) {
    applyAction(+target.dataset.row, +target.dataset.col, paintMode, true);
  }
}, { passive: true });

document.addEventListener('touchend', () => { isDragging = false; });

detectTouch();
initTheme();
initGame(true);

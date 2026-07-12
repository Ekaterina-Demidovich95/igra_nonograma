const EMPTY = 0, FILLED = 1, CROSS = 2;
const STORAGE_THEME = 'nonogram-theme';
const STORAGE_GLOBAL = 'nonogram-level-';
const STORAGE_SIZE = 'nonogram-selected-size';
const WIN_DELAY_MS = 2800;

let globalLevelIndex = 0;
let size = 5;
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
let advanceTimer = null;

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
const appHeader = document.getElementById('appHeader');
const boardArea = document.getElementById('boardArea');
const gameViewport = document.getElementById('gameViewport');
const gameScaler = document.getElementById('gameScaler');
const zoomLabel = document.getElementById('zoomLabel');
const welcomeOverlay = document.getElementById('welcomeOverlay');
const welcomeStart = document.getElementById('welcomeStart');
const welcomeTheme = document.getElementById('welcomeTheme');
const helpToggle = document.getElementById('helpToggle');
const guideHelpLink = document.getElementById('guideHelpLink');
const appEl = document.getElementById('app');

let boardZoom = 1;
let baseCellSize = 20;
let gameReady = false;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panScrollLeft = 0;
let panScrollTop = 0;
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;

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
  return `${STORAGE_GLOBAL}${size}`;
}

function loadLevelIndexForCurrentSize() {
  const chainLen = getLevelChain(size).length;
  const saved = localStorage.getItem(storageKey());
  globalLevelIndex = saved !== null ? parseInt(saved, 10) : 0;
  if (Number.isNaN(globalLevelIndex) || globalLevelIndex < 0) globalLevelIndex = 0;
  if (globalLevelIndex >= chainLen) globalLevelIndex = 0;
}

function loadProgress() {
  const savedSize = localStorage.getItem(STORAGE_SIZE);
  if (savedSize) size = +savedSize;
  loadLevelIndexForCurrentSize();
}

function saveProgress() {
  localStorage.setItem(storageKey(), String(globalLevelIndex));
  localStorage.setItem(STORAGE_SIZE, String(size));
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
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  themeToggle.textContent = icon;
  themeToggle.title = title;
  if (welcomeTheme) {
    welcomeTheme.textContent = icon;
    welcomeTheme.title = title;
  }
}

function detectTouch() {
  isTouchDevice = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  document.body.classList.toggle('is-touch', isTouchDevice);
}

function setPaintMode(mode) {
  if (mode === 'pan' && boardZoom <= 1.001) return;
  paintMode = mode;
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  updatePanModeUI();
}

function updatePanModeUI() {
  const isPan = paintMode === 'pan' && boardZoom > 1.001;
  gameViewport.classList.toggle('pan-mode', isPan);
  document.querySelectorAll('.tool-btn[data-mode="pan"]').forEach(btn => {
    btn.disabled = boardZoom <= 1.001;
  });
}

function showWelcome(fromGame = false) {
  document.body.classList.add('welcome-open');
  welcomeOverlay.classList.add('show');
  welcomeStart.textContent = fromGame ? 'Продолжить игру' : 'Начать игру';
}

function hideWelcome() {
  document.body.classList.remove('welcome-open');
  welcomeOverlay.classList.remove('show');
}

function enterGame() {
  hideWelcome();
  appEl.classList.remove('app-hidden');

  if (!gameReady) {
    gameReady = true;
    initGame(true);
  }
}

function updateLevelUI() {
  if (!currentLevel) return;
  levelEmojiEl.textContent = currentLevel.emoji;
  levelNameEl.textContent = currentLevel.name;
  levelCounterEl.textContent = `${currentLevel.globalIndex + 1} / ${currentLevel.globalTotal}`;
  levelStarsEl.textContent = currentLevel.starsText;
  tierBadgeEl.textContent = `${currentLevel.tier.label} · ${currentLevel.subTier.label}`;
  tierBadgeEl.className = `tier-badge sub-${currentLevel.subTier.color}`;
  const pct = ((currentLevel.globalIndex + 1) / currentLevel.globalTotal) * 100;
  levelProgressEl.style.width = pct + '%';
  updateSizeButtons();
}

function updateSizeButtons() {
  document.querySelectorAll('#sizeSelect button').forEach(btn => {
    btn.classList.toggle('active', +btn.dataset.size === size);
  });
}

function getBottomChromeHeight() {
  if (!mobileToolbar) return 0;
  const style = getComputedStyle(mobileToolbar);
  return style.display !== 'none' ? mobileToolbar.getBoundingClientRect().height : 0;
}

function getAvailableBoardSize() {
  const pad = 12;
  const headerH = appHeader ? appHeader.getBoundingClientRect().height : 0;
  const bottomH = getBottomChromeHeight();
  let hintH = 0;
  const guide = document.getElementById('gameGuide');
  if (guide) hintH = guide.offsetHeight + 4;

  return {
    width: window.innerWidth - pad * 2,
    height: window.innerHeight - headerH - bottomH - hintH - pad,
  };
}

function applyZoom() {
  const cell = Math.max(8, Math.round(baseCellSize * boardZoom));
  document.documentElement.style.setProperty('--cell-size', cell + 'px');
  gameViewport.classList.toggle('zoomed', boardZoom > 1.001);
  if (zoomLabel) zoomLabel.textContent = Math.round(boardZoom * 100) + '%';
  document.getElementById('zoomOut').disabled = boardZoom <= ZOOM_MIN;
  document.getElementById('zoomIn').disabled = boardZoom >= ZOOM_MAX;

  if (boardZoom <= 1.001 && paintMode === 'pan') {
    setPaintMode('fill');
  } else if (isTouchDevice && boardZoom > 1.001 && paintMode !== 'pan') {
    setPaintMode('pan');
  }

  updatePanModeUI();
}

function setZoom(value) {
  boardZoom = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value)) * 100) / 100;
  applyZoom();
}

function resetZoom() {
  boardZoom = 1;
  applyZoom();
  gameViewport.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
}

function fitBoardToScreen() {
  if (!rowClues.length) return;

  const maxRowClueLen = Math.max(...rowClues.map(c => c.length));
  const maxColClueLen = Math.max(...colClues.map(c => c.length));
  const clueColW = maxRowClueLen * 9 + 18;
  const clueRowH = maxColClueLen * 11 + 10;

  const { width: availW, height: availH } = getAvailableBoardSize();
  const safeH = Math.max(80, availH);
  const safeW = Math.max(80, availW);

  const cellW = (safeW - clueColW) / size;
  const cellH = (safeH - clueRowH) / size;
  const cell = Math.max(8, Math.floor(Math.min(cellW, cellH)));
  baseCellSize = cell;
  applyZoom();
}

function initGame(fromStorage = true) {
  clearTimeout(advanceTimer);
  if (fromStorage) loadProgress();

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
  resetZoom();

  currentLevel = getLevelByGlobalIndex(size, globalLevelIndex);
  size = currentLevel.size;
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
  requestAnimationFrame(() => fitBoardToScreen());
}

function bindCellEvents(cell, r, c) {
  cell.addEventListener('contextmenu', e => {
    e.preventDefault();
    applyAction(r, c, 'cross');
  });

  cell.addEventListener('mousedown', e => {
    if (paintMode === 'pan' || e.button === 2) return;
    e.preventDefault();
    isDragging = true;
    dragAction = isTouchDevice ? paintMode : 'fill';
    applyAction(r, c, dragAction);
  });

  cell.addEventListener('mouseenter', () => {
    if (paintMode === 'pan') return;
    if (isDragging && !isTouchDevice) applyAction(r, c, dragAction, true);
  });

  cell.addEventListener('touchstart', e => {
    if (paintMode === 'pan') return;
    e.preventDefault();
    isDragging = true;
    applyAction(r, c, paintMode);
  }, { passive: false });

  cell.addEventListener('touchmove', e => {
    if (paintMode === 'pan' || !isDragging) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('cell')) {
      applyAction(+target.dataset.row, +target.dataset.col, paintMode, true);
    }
  }, { passive: true });

  cell.addEventListener('touchend', () => {
    if (paintMode !== 'pan') isDragging = false;
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

function getFilledLine(isRow, index) {
  return isRow
    ? player[index].map(v => v === FILLED ? 1 : 0)
    : player.map(row => row[index] === FILLED ? 1 : 0);
}

function getSolutionLine(isRow, index) {
  return isRow ? solution[index] : solution.map(row => row[index]);
}

function computeClueStates(filledLine, solutionLine, solutionClues) {
  for (let i = 0; i < filledLine.length; i++) {
    if (filledLine[i] && !solutionLine[i]) {
      return solutionClues.map(() => false);
    }
  }

  if (solutionClues.length === 1 && solutionClues[0] === 0) {
    return [filledLine.every(c => !c)];
  }

  const groups = solutionClues.filter(x => x > 0);
  const solGroups = [];
  let pos = 0;

  for (const len of groups) {
    while (pos < solutionLine.length && !solutionLine[pos]) pos++;
    solGroups.push({ start: pos, len });
    pos += len;
  }

  const result = [];
  let gi = 0;
  for (const clue of solutionClues) {
    if (clue === 0) {
      result.push(filledLine.every(c => !c));
      continue;
    }
    const { start, len } = solGroups[gi++];
    result.push(filledLine.slice(start, start + len).every(c => c === 1));
  }
  return result;
}

function updateClueHighlights() {
  document.querySelectorAll('.clue-row').forEach(el => {
    const idx = +el.dataset.index;
    const states = computeClueStates(
      getFilledLine(true, idx),
      getSolutionLine(true, idx),
      rowClues[idx]
    );
    el.querySelectorAll('span').forEach((span, i) => {
      span.classList.toggle('done', !!states[i]);
    });
  });

  document.querySelectorAll('.clue-col').forEach(el => {
    const idx = +el.dataset.index;
    const states = computeClueStates(
      getFilledLine(false, idx),
      getSolutionLine(false, idx),
      colClues[idx]
    );
    el.querySelectorAll('span').forEach((span, i) => {
      span.classList.toggle('done', !!states[i]);
    });
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

function advanceToNextLevel() {
  winOverlay.classList.remove('show');

  const chainLen = getLevelChain(size).length;
  const isLast = globalLevelIndex >= chainLen - 1;
  if (isLast) {
    globalLevelIndex = 0;
  } else {
    globalLevelIndex++;
  }
  saveProgress();
  initGame(false);
}

function win() {
  won = true;
  stopTimer();

  const isLast = globalLevelIndex >= currentLevel.globalTotal - 1;
  document.getElementById('winTime').textContent = formatTime(seconds);
  document.getElementById('winErrors').textContent = errors;
  winTitle.textContent = `${currentLevel.emoji} ${currentLevel.name}!`;
  winSubtitle.textContent = isLast
    ? 'Все уровни пройдены! Начинаем сначала…'
    : `Следующий уровень через несколько секунд… (${currentLevel.globalIndex + 2} / ${currentLevel.globalTotal})`;

  buildWinPreview();
  revealColors();
  winOverlay.classList.add('show');
  spawnConfetti();

  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(advanceToNextLevel, WIN_DELAY_MS);
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

themeToggle.addEventListener('click', toggleTheme);
welcomeTheme.addEventListener('click', toggleTheme);
welcomeStart.addEventListener('click', enterGame);
helpToggle.addEventListener('click', () => showWelcome(true));
guideHelpLink.addEventListener('click', () => showWelcome(true));

document.getElementById('zoomIn').addEventListener('click', () => setZoom(boardZoom + ZOOM_STEP));
document.getElementById('zoomOut').addEventListener('click', () => setZoom(boardZoom - ZOOM_STEP));
document.getElementById('zoomReset').addEventListener('click', resetZoom);

function handleViewportWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    setZoom(boardZoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    return;
  }

  if (boardZoom > 1.001) {
    gameViewport.scrollTop += e.deltaY;
    gameViewport.scrollLeft += e.deltaX;
    e.preventDefault();
    return;
  }

  e.preventDefault();
  setZoom(boardZoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
}

gameViewport.addEventListener('wheel', handleViewportWheel, { passive: false });
boardArea.addEventListener('wheel', handleViewportWheel, { passive: false });

document.getElementById('sizeSelect').addEventListener('click', e => {
  const btn = e.target.closest('button[data-size]');
  if (!btn || +btn.dataset.size === size) return;
  size = +btn.dataset.size;
  localStorage.setItem(STORAGE_SIZE, String(size));
  loadLevelIndexForCurrentSize();
  initGame(false);
});

mobileToolbar.addEventListener('click', e => {
  const btn = e.target.closest('.tool-btn');
  if (btn && !btn.disabled) setPaintMode(btn.dataset.mode);
});

document.addEventListener('mouseleave', () => {
  endPan();
  isDragging = false;
});

document.addEventListener('contextmenu', e => {
  if (e.target.closest('.cell')) e.preventDefault();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    detectTouch();
    if (currentLevel) fitBoardToScreen();
  }, 100);
});

board.addEventListener('touchmove', e => {
  if (paintMode === 'pan' || !isDragging) return;
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target && target.classList.contains('cell')) {
    applyAction(+target.dataset.row, +target.dataset.col, paintMode, true);
  }
}, { passive: true });

document.addEventListener('touchend', () => {
  if (!isPanning) isDragging = false;
});

function startPan(clientX, clientY) {
  isPanning = true;
  isDragging = false;
  panStartX = clientX;
  panStartY = clientY;
  panScrollLeft = gameViewport.scrollLeft;
  panScrollTop = gameViewport.scrollTop;
  gameViewport.classList.add('is-panning');
}

function movePan(clientX, clientY) {
  if (!isPanning) return;
  gameViewport.scrollLeft = panScrollLeft - (clientX - panStartX);
  gameViewport.scrollTop = panScrollTop - (clientY - panStartY);
}

function endPan() {
  if (!isPanning) return;
  isPanning = false;
  gameViewport.classList.remove('is-panning');
}

gameViewport.addEventListener('mousedown', e => {
  if (paintMode !== 'pan' || e.button !== 0) return;
  e.preventDefault();
  startPan(e.clientX, e.clientY);
});

document.addEventListener('mousemove', e => {
  if (!isPanning) return;
  e.preventDefault();
  movePan(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => {
  endPan();
  isDragging = false;
});

gameViewport.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    pinchStartDist = touchDistance(e.touches);
    pinchStartZoom = boardZoom;
    endPan();
    return;
  }
  if (paintMode === 'pan' && e.touches.length === 1) {
    e.preventDefault();
    startPan(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: false });

gameViewport.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && pinchStartDist > 0) {
    e.preventDefault();
    setZoom(pinchStartZoom * (touchDistance(e.touches) / pinchStartDist));
    return;
  }
  if (isPanning && e.touches.length === 1) {
    e.preventDefault();
    movePan(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: false });

gameViewport.addEventListener('touchend', endPan);
gameViewport.addEventListener('touchcancel', endPan);

function touchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

let pinchStartDist = 0;
let pinchStartZoom = 1;

detectTouch();
initTheme();
showWelcome(false);

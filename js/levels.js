/* Палитра: . = пусто, остальные символы = закрашенная клетка с цветом */
const PALETTE = {
  r: '#ef4444', o: '#f97316', y: '#facc15', g: '#22c55e',
  b: '#3b82f6', p: '#ec4899', w: '#f1f5f9', k: '#334155',
  n: '#92400e', l: '#a3e635', u: '#06b6d4', m: '#a855f7',
  d: '#64748b', s: '#fda4af', t: '#78716c', h: '#fcd34d',
};

/* stars: 1 = лёгкий, 2 = средний, 3 = сложный (внутри категории) */
const LEVELS = {
  5: [
    { name: 'Стрелка', emoji: '⬆️', stars: 1, rows: ['..y..','.yyy.','yyyyy','..y..','..y..'] },
    { name: 'Яблоко', emoji: '🍎', stars: 1, rows: ['..r..','.rrr.','rrrrr','.rrr.','..r..'] },
    { name: 'Капля', emoji: '💧', stars: 1, rows: ['..b..','.bbb.','.bbb.','.bbb.','..b..'] },
    { name: 'Ромб', emoji: '💎', stars: 1, rows: ['..y..','.yyy.','yyyyy','.yyy.','..y..'] },
    { name: 'Ёлка', emoji: '🌲', stars: 1, rows: ['..g..','.ggg.','ggggg','..g..','..g..'] },
    { name: 'Сердце', emoji: '❤️', stars: 2, rows: ['.r.r.','rrrrr','rrrrr','.rrr.','..r..'] },
    { name: 'Звезда', emoji: '⭐', stars: 2, rows: ['..y..','yyyyy','.yyy.','.y.y.','.....'] },
    { name: 'Солнце', emoji: '☀️', stars: 2, rows: ['.y.y.','yyyyy','yyyyy','.y.y.','..y..'] },
    { name: 'Дом', emoji: '🏠', stars: 2, rows: ['..r..','.rrr.','r.r.r','nnnnn','n.n.n'] },
    { name: 'Рыбка', emoji: '🐟', stars: 2, rows: ['.....','.bbb.','bbbbb','.bbb.','..b..'] },
    { name: 'Кошка', emoji: '🐱', stars: 3, rows: ['.ooo.','ok.ko','o...o','.ooo.','..o..'] },
    { name: 'Бабочка', emoji: '🦋', stars: 3, rows: ['p.p.p','ppppp','.p.p.','ppppp','p.p.p'] },
    { name: 'Сова', emoji: '🦉', stars: 3, rows: ['.ooo.','ok.ko','ok.ko','.ooo.','..o..'] },
    { name: 'Лиса', emoji: '🦊', stars: 3, rows: ['.ooo.','ooooo','o.o.o','.ooo.','..o..'] },
  ],

  10: [
    { name: 'Гриб', emoji: '🍄', stars: 1, rows: [
      '....rr....','...rrrr...','..rrrrrr..','..rrrrrr..','...rrrr...',
      '....rr....','....nn....','...nnnn...','....nn....','..........',
    ]},
    { name: 'Вишня', emoji: '🍒', stars: 1, rows: [
      '....gg....','...gggg...','..ggppgg..','..ggppgg..','...gggg...',
      '....gg....','....nn....','....nn....','..........','..........',
    ]},
    { name: 'Снежинка', emoji: '❄️', stars: 1, rows: [
      '....y.....','...yyy....','....y.....','y.yyyy.y.y','....y.....',
      '...yyy....','....y.....','...y.y....','....y.....','..........',
    ]},
    { name: 'Луна', emoji: '🌙', stars: 1, rows: [
      '..........','....yy....','...yyyy...','...yyyy...','....yy....',
      '..........','..........','..........','..........','..........',
    ]},
    { name: 'Облако', emoji: '☁️', stars: 1, rows: [
      '..........','..........','...wwww...','..wwwwww..','.wwwwwwww.',
      '..wwwwww..','...wwww...','..........','..........','..........',
    ]},
    { name: 'Цветок', emoji: '🌸', stars: 2, rows: [
      '....gg....','...gggg...','..ggppgg..','.ggpggpgg.','.ggpggpgg.',
      '..ggppgg..','...gggg...','....gg....','....nn....','....nn....',
    ]},
    { name: 'Рыба', emoji: '🐟', stars: 2, rows: [
      '....bb....','...bbbb...','..bbbbbb..','.bbbbbbbb.','bbbbbbbbb.',
      '.bbbpppbb.','..bbppp...','...bbpb...','....bbb...','.....b....',
    ]},
    { name: 'Домик', emoji: '🏡', stars: 2, rows: [
      '....rr....','...rrrr...','..rrrrrr..','.rrrrrrrr.','nnnnnnnnnn',
      'n..w..w..n','n..w..w..n','n....d...n','n........n','nnnnnnnnnn',
    ]},
    { name: 'Бабочка', emoji: '🦋', stars: 2, rows: [
      '..........','..pp..pp..','.pppppppp.','pppppppppp','.pppppppp.',
      '..pppppp..','...pppp...','....pp....','....nn....','..........',
    ]},
    { name: 'Сердце', emoji: '❤️', stars: 2, rows: [
      '..rr..rr..','.rrrrrrrr.','rrrrrrrrrr','rrrrrrrrrr','.rrrrrrrr.',
      '..rrrrrr..','...rrrr...','....rr....','.....r....','..........',
    ]},
    { name: 'Кошка', emoji: '🐱', stars: 3, rows: [
      '....yy....','..ykkkky..','.ykkkkkky.','ykkkookkky','ykkkookkky',
      'ykkkkkkkky','.ykppppky.','..yk..ky..','...yyyy...','..........',
    ]},
    { name: 'Птица', emoji: '🐦', stars: 3, rows: [
      '..........','....bb....','...bbbb...','..bbppbb..','.bbbbbbbb.',
      '..bbbbbb..','...bbpb...','....bbb...','.....b....','..........',
    ]},
    { name: 'Авто', emoji: '🚗', stars: 3, rows: [
      '..........','..........','..bbbbbb..','.bbyyyybb.','.bbyyyybb.',
      '.bbyyyybb.','.bbbyydbb.','..bdddb...','...ddd....','..........',
    ]},
    { name: 'Замок', emoji: '🏰', stars: 3, rows: [
      '....rr....','...rrrr...','..rrrrrr..','..r.r.r.r.','..rrrrrr..',
      '.nnnnnnnn.','.n.w..w.n.','.n.n..n.n.','.nnnnnnnn.','..........',
    ]},
  ],

  15: [
    { name: 'Сердце', emoji: '❤️', stars: 1, rows: [
      '......r........','.....rrr.......','....rrrrr......','...rrrrrrr.....',
      '..rrrrrrrrr....','.rrrrrrrrrrr...','..rrrrrrrrr....','...rrrrrrr.....',
      '....rrrrr......','.....rrr.......','......r........','...............',
      '...............','...............','...............',
    ]},
    { name: 'Цветок', emoji: '🌻', stars: 1, rows: [
      '.......y.......','......yyy......','.....yyyyy.....','....yylllyy....',
      '...yyllyllyy...','..yyllyllyllyy.','...yyllyllyy...','....yylllyy....',
      '.....yyyyy.....','......yyy......','.......y.......','.......n.......',
      '......nnn......','.......n.......','...............',
    ]},
    { name: 'Облако', emoji: '☁️', stars: 1, rows: [
      '...............','......www......','.....wwwww.....','....wwwwwww....',
      '...wwwwwwwww...','....wwwwwww....','.....wwwww.....','......www......',
      '...............','...............','...............','...............',
      '...............','...............','...............',
    ]},
    { name: 'Дерево', emoji: '🌳', stars: 1, rows: [
      '.......g.......','......ggg......','.....ggggg.....','....ggggggg....',
      '.....ggggg.....','......ggg......','.......g.......','.......g.......',
      '.......g.......','......nnn......','......nnn......','...............',
      '...............','...............','...............',
    ]},
    { name: 'Кошка', emoji: '🐱', stars: 2, rows: [
      '.....ooooo.....','....okkkko.....','...okkkkkko....','..okkkkkkkko...',
      '.okkkkkkkkkko..','.okkkkooookkko.','.okkkkooookkko.','.okkkkkkkkkkko.',
      '..okkkkkkkko...','...okppppko....','....ok..ko.....','.....oooo......',
      '......o........','...............','...............',
    ]},
    { name: 'Собака', emoji: '🐶', stars: 2, rows: [
      '.....ttttt.....','....twwwwt.....','...twwwwwwt....','..twwwwwwwt....',
      '.twwwnnnwwt....','.twwwnnnwwt....','.twwwwwwwwt....','..twwppwwt.....',
      '...twwwwt......','....ttttt......','.....tttt......','.....tttt......',
      '....tt..tt.....','....tt..tt.....','...............',
    ]},
    { name: 'Бабочка', emoji: '🦋', stars: 2, rows: [
      '......m........','....mpppm......','...mpppppm.....','..mpppppppm....',
      '.mpppppppppm...','mpppppppppppm..','.mpppppppppm...','..mpppppppm....',
      '...mpppppm.....','....mpppm......','.....mpm.......','......m........',
      '......k........','.....k.k.......','...............',
    ]},
    { name: 'Роза', emoji: '🌹', stars: 2, rows: [
      '......r........','.....rrr.......','....rrrrr......','...rrrrrrr.....',
      '..rrrrrrrrr....','.rrrrrrrrrrr...','..rrrrrrrrr....','...rrrrrrr.....',
      '....ggggg......','.....ggg.......','......g........','......g........',
      '.....ggg.......','.....ggg.......','...............',
    ]},
    { name: 'Пейзаж', emoji: '🏞️', stars: 2, rows: [
      '......y........','.....yyy.......','....yyyyy......','...yyyyyyy.....',
      '..yyyyyyyyy....','ggggggggggggggg','ggggggggggggggg','ggggnnngggggggg',
      'gggnnnnnggggggg','gggnnnnnngggggg','ggggnnngggggggg','bbbbbbbbbbbbbbb',
      'bbbbbbbbbbbbbbb','bbbbbbbbbbbbbbb','...............',
    ]},
    { name: 'Корабль', emoji: '⛵', stars: 3, rows: [
      '.......b.......','......bbb......','.....bbbbb.....','....bbbbbbb....',
      '...bbbbbbbbb...','..bbbbbbbbbbb..','.......r.......','.......r.......',
      '......rrr......','.....rrrrr.....','....rrrrrrr....','...nnnnnnnnn...',
      '..nnnnnnnnnnn..','.nnnnnnnnnnnnn.','...............',
    ]},
    { name: 'Сова', emoji: '🦉', stars: 3, rows: [
      '......ttt......','.....twwwt.....','....twwwwwt....','...twwwnwwt....',
      '..twwwnnnwwt...','.twwwnnnnnwwt..','.twwwnnnnnwwt..','..twwppppwwt...',
      '...twwwwwwt....','....ttttttt....','.....ttttt.....','......ttt......',
      '.....t...t.....','.....t...t.....','...............',
    ]},
    { name: 'Замок', emoji: '🏰', stars: 3, rows: [
      '....r...r...r..','...rrr.rrr.rrr.','..rrrrrrrrrrrr.','..r.r.r.r.r.r..',
      '..rrrrrrrrrrrr.','.nnnnnnnnnnnnn.','.n.w....w....n.','.n.n....n....n.',
      '.n.n....n....n.','.nnnnnnnnnnnnn.','.n...........n.','.n...........n.',
      '.nnnnnnnnnnnnn.','...............','...............',
    ]},
    { name: 'Дракон', emoji: '🐉', stars: 3, rows: [
      '......g........','.....ggg.......','....ggggg......','...ggggggg.....',
      '..ggggggggg....','.ggggggggggg...','..ggggggggg....','...ggggggg.....',
      '....ggggg......','.....ggg.......','......g........','......rrr......',
      '.....rrrrr.....','....rrrrrrr....','...............',
    ]},
  ],
};

const TIER_INFO = {
  5:  { label: '5×5', desc: 'Компактная сетка' },
  10: { label: '10×10', desc: 'Средняя сетка' },
  15: { label: '15×15', desc: 'Большая сетка' },
};

const SUB_TIER = {
  1: { label: 'Лёгкий', color: 'easy' },
  2: { label: 'Средний', color: 'medium' },
  3: { label: 'Сложный', color: 'hard' },
};

function getLevelList(size, stars) {
  const list = LEVELS[size] || [];
  return list.filter(l => l.stars === stars);
}

function getLevel(size, stars, index) {
  const list = getLevelList(size, stars);
  if (!list.length) return null;
  const idx = Math.min(Math.max(0, index), list.length - 1);
  const level = list[idx];
  const { grid, colors } = parseLevel(level);
  const { rowClues, colClues } = calcCluesFromGrid(grid);
  const subTier = SUB_TIER[stars] || SUB_TIER[2];
  return {
    ...level,
    index: idx,
    total: list.length,
    grid,
    colors,
    rowClues,
    colClues,
    tier: TIER_INFO[size],
    subTier,
    difficultyScore: getDifficultyScore(grid, rowClues, colClues),
    starsText: starsToText(level.stars || 2),
  };
}

function parseLevel(level) {
  const size = level.rows.length;
  const grid = [];
  const colors = [];

  for (let r = 0; r < size; r++) {
    grid[r] = [];
    colors[r] = [];
    const row = level.rows[r].padEnd(size, '.').slice(0, size);
    for (let c = 0; c < size; c++) {
      const ch = row[c] || '.';
      const filled = ch !== '.';
      grid[r][c] = filled ? 1 : 0;
      colors[r][c] = filled ? (PALETTE[ch] || '#6c8cff') : null;
    }
  }

  return { grid, colors, size };
}

function calcCluesFromGrid(grid) {
  const calcLine = (line) => {
    const clues = [];
    let count = 0;
    for (const cell of line) {
      if (cell === 1) count++;
      else if (count > 0) { clues.push(count); count = 0; }
    }
    if (count > 0) clues.push(count);
    return clues.length ? clues : [0];
  };

  const size = grid.length;
  return {
    rowClues: grid.map(calcLine),
    colClues: Array.from({ length: size }, (_, c) => calcLine(grid.map(r => r[c]))),
  };
}

function getDifficultyScore(grid, rowClues, colClues) {
  const size = grid.length;
  const filled = grid.flat().filter(v => v === 1).length;
  const density = filled / (size * size);
  const allClues = [...rowClues, ...colClues];
  const groups = allClues.reduce((s, c) => s + c.filter(n => n > 0).length, 0);
  const maxGroups = size * 2;
  const groupScore = groups / maxGroups;
  const sizeScore = size / 15;
  return Math.round((density * 0.3 + groupScore * 0.45 + sizeScore * 0.25) * 100);
}

function starsToText(stars) {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

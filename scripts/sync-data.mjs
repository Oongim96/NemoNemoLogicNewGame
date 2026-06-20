/**
 * content-source/cards/*.csv → src/modules/card/infrastructure/data/*.json
 * content-source/puzzles/*.json → src/modules/puzzle/infrastructure/data/*.json
 * 기획 원본 수정 후 `npm run sync-data` 로 게임 런타임 데이터를 갱신합니다.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        values.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    values.push(current);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}

function coerceCard(row) {
  const num = (v) => (v === '' || v === undefined ? undefined : Number(v));
  return {
    cardId: row.card_id,
    name: row.name,
    conceptPrimary: row.concept_primary,
    conceptSecondary: row.concept_secondary || undefined,
    grade: row.grade,
    battleType: row.battle_type,
    battleCooldown: num(row.battle_cooldown) ?? 0,
    battleValue: num(row.battle_value),
    battleValueMax: num(row.battle_value_max),
    battleEffectKey: row.battle_effect_key,
    battleEffectParam: row.battle_effect_param || undefined,
    puzzleTrigger: row.puzzle_trigger,
    puzzleEffectKey: row.puzzle_effect_key,
    puzzleEffectParam: row.puzzle_effect_param || undefined,
    description: row.description,
    draftWeight: num(row.draft_weight) ?? 0,
    maxPerDeck: num(row.max_per_deck) ?? 1,
    enabled: row.enabled === '1',
  };
}

function coerceThreshold(row) {
  const num = (v) => (v === '' || v === undefined ? undefined : Number(v));
  return {
    concept: row.concept,
    thresholdType: row.threshold_type,
    thresholdCount: num(row.threshold_count),
    effectKey: row.effect_key,
    effectDesc: row.effect_desc,
  };
}

const outDir = join(root, 'src', 'modules', 'card', 'infrastructure', 'data');
mkdirSync(outDir, { recursive: true });

const cardsCsv = readFileSync(join(root, 'content-source', 'cards', 'ink_cards_master.csv'), 'utf8');
const cards = parseCsv(cardsCsv).map(coerceCard);
writeFileSync(join(outDir, 'ink-cards.json'), JSON.stringify(cards, null, 2), 'utf8');

const thresholdsCsv = readFileSync(join(root, 'content-source', 'cards', 'concept_thresholds.csv'), 'utf8');
const thresholds = parseCsv(thresholdsCsv).map(coerceThreshold);
writeFileSync(join(outDir, 'concept-thresholds.json'), JSON.stringify(thresholds, null, 2), 'utf8');

function extractPiece(master, mapRow, mapCol, pieceSize) {
  const piece = [];
  for (let y = 0; y < pieceSize; y++) {
    const row = [];
    for (let x = 0; x < pieceSize; x++) {
      row.push(master[mapRow * pieceSize + y][mapCol * pieceSize + x]);
    }
    piece.push(row);
  }
  return piece;
}

function generateSlimeBlobMaster(size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  const cx = size / 2;
  const cy = size * 0.6;
  const rx = size * 0.4;
  const ry = size * 0.36;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        grid[y][x] = 1;
      }
    }
  }

  const carveDisc = (ex, ey, r) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r + 0.5) {
          const py = ey + dy;
          const px = ex + dx;
          if (py >= 0 && py < size && px >= 0 && px < size) {
            grid[py][px] = 0;
          }
        }
      }
    }
  };

  carveDisc(Math.round(size * 0.36), Math.round(size * 0.48), Math.round(size * 0.04));
  carveDisc(Math.round(size * 0.64), Math.round(size * 0.48), Math.round(size * 0.04));

  for (let x = Math.round(size * 0.36); x <= Math.round(size * 0.64); x++) {
    const u = (x - cx) / (size * 0.14);
    const my = Math.round(size * 0.76 + u * u * (size * 0.08));
    if (my >= 0 && my < size && grid[my][x] === 1) {
      grid[my][x] = 0;
    }
  }

  return grid;
}

const SLIME_PIECE_COLORS = [
  0x4a9a6a, 0x52a572, 0x5aad7a, 0x62b582, 0x6bc08a,
  0x3d8a5a, 0x459262, 0x4d9a6a, 0x55a272, 0x5daa7a,
  0x488a62, 0x50926a, 0x589a72, 0x60a27a, 0x68aa82,
  0x42805a, 0x4a8862, 0x52906a, 0x5a9872, 0x62a07a,
  0x3c7852, 0x44805a, 0x4c8862, 0x54906a, 0x5c9872,
];

function syncPuzzleSet(sourcePath, outPath) {
  const raw = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const { id, puzzleSize, mapSize, sections: sectionMeta = [] } = raw;
  let { masterGrid } = raw;

  if (!masterGrid && raw.generateMaster === 'slime_blob') {
    const pictureSize = mapSize * puzzleSize;
    masterGrid = generateSlimeBlobMaster(pictureSize);
  }

  if (!masterGrid) {
    throw new Error(`puzzle ${id}: masterGrid 또는 generateMaster 필요`);
  }

  const pictureSize = mapSize * puzzleSize;
  if (masterGrid.length !== pictureSize || masterGrid[0]?.length !== pictureSize) {
    throw new Error(
      `puzzle ${id}: masterGrid는 ${pictureSize}×${pictureSize}이어야 합니다 (mapSize×puzzleSize)`,
    );
  }

  const sections = [];
  for (let row = 0; row < mapSize; row++) {
    for (let col = 0; col < mapSize; col++) {
      const sectionIndex = row * mapSize + col;
      const meta = sectionMeta[sectionIndex] ?? {};
      sections.push({
        sectionIndex,
        label: meta.label ?? `${row + 1}행 ${col + 1}열`,
        solution: extractPiece(masterGrid, row, col, puzzleSize),
        pieceColor: meta.pieceColor ?? SLIME_PIECE_COLORS[sectionIndex] ?? 0x4a9a6a,
      });
    }
  }

  const out = { id, pictureSize, puzzleSize, mapSize, masterGrid, sections };
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  return sections.length;
}

const puzzleOutDir = join(root, 'src', 'modules', 'puzzle', 'infrastructure', 'data');
const slimeSections = syncPuzzleSet(
  join(root, 'content-source', 'puzzles', 'ink-slime-50x50.json'),
  join(puzzleOutDir, 'ink-slime-50x50.json'),
);

console.log(
  `sync-data: ${cards.length} cards, ${thresholds.length} thresholds → src/modules/card/infrastructure/data/`,
);
console.log(`sync-data: ${slimeSections} puzzle sections → src/modules/puzzle/infrastructure/data/ink-slime-50x50.json`);

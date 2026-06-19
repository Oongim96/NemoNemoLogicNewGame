/**
 * data/cards/*.csv → src/data/*.json
 * 기획 CSV를 수정한 뒤 `npm run sync-data` 로 게임 런타임 데이터를 갱신합니다.
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

const outDir = join(root, 'src', 'data');
mkdirSync(outDir, { recursive: true });

const cardsCsv = readFileSync(join(root, 'data', 'cards', 'ink_cards_master.csv'), 'utf8');
const cards = parseCsv(cardsCsv).map(coerceCard);
writeFileSync(join(outDir, 'ink-cards.json'), JSON.stringify(cards, null, 2), 'utf8');

const thresholdsCsv = readFileSync(join(root, 'data', 'cards', 'concept_thresholds.csv'), 'utf8');
const thresholds = parseCsv(thresholdsCsv).map(coerceThreshold);
writeFileSync(join(outDir, 'concept-thresholds.json'), JSON.stringify(thresholds, null, 2), 'utf8');

console.log(`sync-data: ${cards.length} cards, ${thresholds.length} thresholds → src/data/`);

import Phaser from 'phaser';

/** 카드 앞면·배치용 미니 태그 칩 */
export function addMiniCardChips(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  labels: string[],
  bottomY: number,
  accentColor: number,
  maxWidth: number,
  scale = 1,
): void {
  if (labels.length === 0) return;

  const gap = Math.max(3, Math.round(4 * scale));
  const chipH = Math.max(12, Math.round(14 * scale));
  const fontSize = Math.max(7, Math.round(8 * scale));
  const padX = Math.max(4, Math.round(5 * scale));
  const chipWidths = labels.map((l) =>
    Math.min(maxWidth, Math.max(28, l.length * (fontSize + 1) + padX * 2)),
  );
  let totalW = chipWidths.reduce((s, cw) => s + cw, 0) + gap * (labels.length - 1);

  if (totalW > maxWidth) {
    const shrink = maxWidth / totalW;
    for (let i = 0; i < chipWidths.length; i++) {
      chipWidths[i] = Math.floor(chipWidths[i]! * shrink);
    }
    totalW = maxWidth;
  }

  let x = -totalW / 2;
  const cy = bottomY - chipH / 2;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]!;
    const chipW = chipWidths[i]!;
    const cx = x + chipW / 2;

    const chip = scene.add
      .rectangle(cx, cy, chipW, chipH, 0x14141f, 1)
      .setStrokeStyle(1, accentColor, 0.75);

    const text = scene.add
      .text(cx, cy, label, {
        fontFamily: 'sans-serif',
        fontSize: `${fontSize}px`,
        color: '#f0f0f5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    parent.add([chip, text]);
    x += chipW + gap;
  }
}

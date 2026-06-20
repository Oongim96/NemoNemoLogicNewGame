/** 캐릭터 상세 설명 — content-source/characters 와 동기 */
export interface CharacterDetailText {
  puzzle?: string;
  battle?: string;
  ult?: string;
}

export const CHARACTER_DETAIL_TEXT: Record<string, CharacterDetailText> = {
  char_luna: {
    puzzle: '선택한 가로/세로 줄 1개 숫자 자동 분석 (구역당 2회)',
    battle: '달빛 태그 카드 30% 재발동',
    ult: '3×3 영역 정답 표시 (구역 1회)',
  },
  char_brix: {
    puzzle: '실수 HP 피해 -50%',
    battle: '철벽 실드 합산 +20%',
    ult: '틀린 칸 1개 수정 (구역 1회)',
  },
  char_mio: {
    puzzle: '드래프트 1회 재굴림/런 (무료)',
    battle: '행운 크리 +15% · 승리 골드 +10%',
    ult: '현재 드래프트 3장 전부 재굴림 (런 1회)',
  },
  char_sera: {
    puzzle: '구역 완성률 90%+ 시 HP +8 회복',
    battle: '잉크 스택 1당 파티 회복 +3',
    ult: '실수 횟수 초기화 (구역 1회)',
  },
  char_vega: {
    battle: '잉크 카드 쿨다운 -1',
    ult: '잉크 버스트 채색 (구역 1회)',
  },
  char_ignis: {
    puzzle: '콤보 달성 시 추가 피해 준비',
    battle: '불꽃 연쇄 폭발',
    ult: '전장 전체 화염 (구역 1회)',
  },
  char_diana: {
    puzzle: '약점 줄 자동 분석',
    battle: '달빛 독 스택 강화',
    ult: '한 줄 완전 해석 (구역 1회)',
  },
  char_magnar: {
    puzzle: '실수 1회 무시/구역',
    battle: '철벽 밀어내기',
    ult: '방벽 전개 (구역 1회)',
  },
  char_fortune: {
    puzzle: '드래프트 희귀 슬롯 +1',
    battle: '행운 4택1 확률 상향',
    ult: '보물 폭발 (구역 1회)',
  },
  char_oracle: {
    puzzle: '숫자 힌트 자동 해석',
    battle: '힌트 태그 강화',
    ult: '퍼즐 대량 공개 (구역 1회)',
  },
  char_grid: {
    puzzle: '줄 완성 연쇄 보너스',
    battle: '격자 패턴 데미지',
    ult: '격자 전체 스캔 (구역 1회)',
  },
  char_moirai: {
    puzzle: '함정 칸을 파워로 전환',
    battle: '저주 스택 폭발',
    ult: '운명 뒤집기 (구역 1회)',
  },
};

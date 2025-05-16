export function checkYachtDice(dice: number[]): string | null {
  // 주사위 눈금 빈도 계산
  const countMap = new Map<number, number>();
  dice.forEach(num => {
    countMap.set(num, (countMap.get(num) || 0) + 1);
  });

  const counts = Array.from(countMap.values());

  // 야츠
  if (counts.includes(5)) {
    return "turkey";
  }

  // 포커
  if (counts.includes(4)) {
    return "poker";
  }

  // 풀하우스 (3개 + 2개)
  if (counts.includes(3) && counts.includes(2)) {
    return "fh";
  }

  // 정렬된 중복 제거 배열
  const uniqueSorted = Array.from(new Set(dice)).sort((a, b) => a - b).join("");

  // 라지 스트레이트: 12345 or 23456
  if (uniqueSorted === "12345" || uniqueSorted === "23456") {
    return "ls";
  }

  // 스몰 스트레이트: 1234, 2345, 3456
  if (
    uniqueSorted.includes("1234") ||
    uniqueSorted.includes("2345") ||
    uniqueSorted.includes("3456")
  ) {
    return "ss";
  }

  // 해당 없음
  return null;
}

export function calcYachtDice(dice: number[]): Record<string, number> {
  const result: Record<string, number> = {
    ace: 0,
    dual: 0,
    triple: 0,
    quad: 0,
    penta: 0,
    hexa: 0,
    bonus_available: 0,
    chance: 0,
    poker: 0,
    full_house: 0,
    small_straight: 0,
    large_straight: 0,
    turkey: 0,
  };

  const countMap = new Map<number, number>();
  dice.forEach(num => {
    countMap.set(num, (countMap.get(num) || 0) + 1);
  });

  const counts = Array.from(countMap.values());
  const uniqueSorted = Array.from(new Set(dice)).sort((a, b) => a - b).join("");

  // 1~6 점수 계산
  for (let i = 1; i <= 6; i++) {
    const key = ["ace", "dual", "triple", "quad", "penta", "hexa"][i - 1];
    result[key] = dice.filter(d => d === i).reduce((a, b) => a + b, 0);
  }

  // Chance 
  result.chance = dice.reduce((a, b) => a + b, 0);

  // Turkey
  if (counts.includes(5)) {
    result.turkey = 50;
  }

  // Poker
  if (counts.some(c => c >= 4)) {
    result.poker = result.chance;
  }

  // Full House
  if (counts.includes(3) && counts.includes(2)) {
    result.full_house = 25;
  }

  // Small Straight
  if (
    uniqueSorted.includes("1234") ||
    uniqueSorted.includes("2345") ||
    uniqueSorted.includes("3456")
  ) {
    result.small_straight = 30;
  }

  // Large Straight (5개 연속)
  if (uniqueSorted === "12345" || uniqueSorted === "23456") {
    result.large_straight = 40;
  }

  // Bonus Available은 일단 0으로 유지 (추후 조건 필요 시 반영)
  result.bonus_available = 0;

  return result;
}

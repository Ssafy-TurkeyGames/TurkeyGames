import random
from typing import List, Dict, Any, Optional, Tuple

# 주사위 관련 상수
DICE_COUNT = 5
MAX_ROLL_PER_TURN = 3

# 게임 상태를 저장하는 인메모리 저장소
game_states = {}

class DiceGame:
    """주사위 게임 로직을 처리하는 클래스"""

    @staticmethod
    def create_game(setting_id: int, player_ids: List[int]) -> str:
        """새로운 게임 생성 (간단한 숫자 ID 사용)"""
        # 현재 활성화된 모든 게임 ID 가져오기
        current_games = list(game_states.keys())

        # 숫자로 된 ID들만 필터링하고 최대값 찾기
        numeric_ids = [int(game_id) for game_id in current_games if game_id.isdigit()]
        next_id = 1
        if numeric_ids:
            next_id = max(numeric_ids) + 1

        # 문자열로 변환된 간단한 ID 사용
        game_id = str(next_id)

        game_state = {
            "id": game_id,
            "setting_id": setting_id,
            "players": player_ids,
            "current_player_idx": 0,
            "dice_values": [0, 0, 0, 0, 0],
            "rolls_left": MAX_ROLL_PER_TURN,
            "status": "waiting",
            "turn_counts" : {pid: 0 for pid in player_ids},  # 각 플레이어별 턴 수
        }

        # 인메모리 저장소에 게임 상태 저장
        game_states[game_id] = game_state

        return game_id

    @staticmethod
    def get_game(game_id: str) -> Optional[Dict[str, Any]]:
        """게임 상태 조회"""
        return game_states.get(game_id)

    @staticmethod
    def roll_dice(game_id: str, keep_indices: List[int]) -> Optional[Tuple[List[int], int]]:
        """주사위 굴리기

        Args:
            game_id: 게임 ID
            keep_indices: 유지할 주사위 인덱스 리스트 (0-4)

        Returns:
            (주사위 값 리스트, 남은 굴림 횟수) 또는 None (에러 시)
        """
        game = game_states.get(game_id)

        if not game:
            return None

        if game["rolls_left"] <= 0:
            return None  # 더 이상 주사위를 굴릴 수 없음

        if game["status"] == "waiting":
            game["status"] = "in_progress"

        # 주사위 굴리기
        for i in range(DICE_COUNT):
            if i not in keep_indices:
                # game["dice_values"][i] = random.randint(1, 6)
                game["dice_values"][i] = 5

        # 남은 굴림 횟수 감소
        game["rolls_left"] -= 1

        # 게임 상태 업데이트
        game_states[game_id] = game

        return game["dice_values"], game["rolls_left"]

    @staticmethod
    def calculate_score(dice_values: List[int], category: str) -> int:
        """주사위 값에 따른 점수 계산

        Args:
            dice_values: 주사위 값 리스트
            category: 점수 카테고리

        Returns:
            계산된 점수
        """
        # 1-6까지 각 주사위 값의 개수 카운트
        dice_counts = [0] * 7  # 0번 인덱스는 사용하지 않음
        for value in dice_values:
            dice_counts[value] += 1

        # 카테고리별 점수 계산
        if category == "ace":
            return dice_counts[1] * 1  # 1의 합
        elif category == "dual":
            return dice_counts[2] * 2  # 2의 합
        elif category == "triple":
            return dice_counts[3] * 3  # 3의 합
        elif category == "quad":
            return dice_counts[4] * 4  # 4의 합
        elif category == "penta":
            return dice_counts[5] * 5  # 5의 합
        elif category == "hexa":
            return dice_counts[6] * 6  # 6의 합 (poker 대신 hexa)
        elif category == "chance":
            return sum(dice_values)  # 모든 주사위의 합
        elif category == "poker":
            # 4 of a kind: 동일한 값이 4개 이상인 경우 모든 주사위 합
            if max(dice_counts) >= 4:
                return sum(dice_values)
            return 0
        elif category == "full_house":
            # Full House: 같은 숫자 3개와 다른 같은 숫자 2개
            has_three = False
            has_two = False
            for count in dice_counts:
                if count == 3:
                    has_three = True
                elif count == 2:
                    has_two = True
            return 25 if (has_three and has_two) else 0
        elif category == "small_straight":
            # Small Straight: 1-2-3-4 또는 2-3-4-5 또는 3-4-5-6 연속된 4개
            if (dice_counts[1] >= 1 and dice_counts[2] >= 1 and
                dice_counts[3] >= 1 and dice_counts[4] >= 1) or \
                    (dice_counts[2] >= 1 and dice_counts[3] >= 1 and
                     dice_counts[4] >= 1 and dice_counts[5] >= 1) or \
                    (dice_counts[3] >= 1 and dice_counts[4] >= 1 and
                     dice_counts[5] >= 1 and dice_counts[6] >= 1):
                return 30
            return 0
        elif category == "large_straight":
            # Large Straight: 1-2-3-4-5 또는 2-3-4-5-6 연속된 5개
            if (dice_counts[1] == 1 and dice_counts[2] == 1 and
                dice_counts[3] == 1 and dice_counts[4] == 1 and
                dice_counts[5] == 1) or \
                    (dice_counts[2] == 1 and dice_counts[3] == 1 and
                     dice_counts[4] == 1 and dice_counts[5] == 1 and
                     dice_counts[6] == 1):
                return 40
            return 0
        elif category == "turkey":
            # 5개 주사위가 모두 같은 숫자 (Yahtzee)
            if max(dice_counts) == 5:
                return 50
            return 0
        else:
            return 0  # 알 수 없는 카테고리

    @staticmethod
    def next_turn(game_id: str) -> Optional[int]:
        """다음 플레이어 턴으로 이동

        Returns:
            다음 플레이어 인덱스 또는 None (에러 시)
        """
        game = game_states.get(game_id)

        if not game:
            return None

        # 다음 플레이어로 턴 변경
        next_player_idx = (game["current_player_idx"] + 1) % len(game["players"])
        game["current_player_idx"] = next_player_idx

        # 주사위 및 굴림 횟수 초기화
        game["dice_values"] = [0, 0, 0, 0, 0]
        game["rolls_left"] = MAX_ROLL_PER_TURN

        # 게임 상태 업데이트
        game_states[game_id] = game

        return next_player_idx

    @staticmethod
    def end_game(game_id: str) -> bool:
        """게임 종료 및 상태 정리"""
        game = game_states.get(game_id)

        if not game:
            return False

        # 게임 상태를 종료로 변경
        game["status"] = "finished"
        game_states[game_id] = game

        return True

    @staticmethod
    def delete_game(game_id: str) -> bool:
        """게임 데이터 삭제"""
        if game_id in game_states:
            del game_states[game_id]
            return True
        return False
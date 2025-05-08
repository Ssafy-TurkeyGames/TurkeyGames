# app/video/yacht_highlight_detector.py
from typing import List, Dict
import asyncio
from datetime import datetime


class YachtHighlightDetector:
    def __init__(self, video_service):
        self.video_service = video_service
        self.player_highlights = {}  # 플레이어별 하이라이트 추적 (player_key: set_of_trigger_types)

    async def process_game_state(self, game_id: str, player_id: int,
                                 dice_values: List[int], scores: Dict,
                                 remaining_turns: int):
        """주사위 값과 게임 상태를 기반으로 하이라이트 트리거 확인"""
        player_key = f"{game_id}_{player_id}"
        if player_key not in self.player_highlights:
            self.player_highlights[player_key] = set()

        achieved_triggers = self.player_highlights[player_key]

        # 1순위: 야추(5개 동일)
        if "yacht" not in achieved_triggers and self._is_yacht(dice_values):
            await self._create_highlight(game_id, player_id, "yacht")
            # 한 번의 game_state 업데이트에서 여러 조건이 동시에 만족될 수 있으나,
            # 우선순위가 가장 높은 하나만 선택하여 하이라이트를 생성하고 반환합니다.
            # 만약 한 번의 주사위 굴림으로 여러 하이라이트 조건(예: 야추와 동시에 보너스 달성)을
            # 모두 기록하고 싶다면, 아래 return 문들을 제거하고 각 조건마다 create_highlight를 호출하도록 수정
            # 현재 로직은 "가장 중요한" 하이라이트 하나만 그 시점에 기록합니다.
            return

        # 2순위: 보너스 35점 획득
        if "bonus_achieved" not in achieved_triggers and self._is_bonus_achieved(scores, player_id):
            await self._create_highlight(game_id, player_id, "bonus_achieved")
            return

        # 3순위: 승리 확정 (남은 턴 4 이하)
        if "victory_confirmed" not in achieved_triggers and \
           remaining_turns <= 4 and remaining_turns > 0 and \
           self._is_victory_confirmed(scores, player_id, remaining_turns):
            await self._create_highlight(game_id, player_id, "victory_confirmed")
            return

    def _is_yacht(self, dice_values: List[int]) -> bool:
        """야추 확인 (5개 주사위 모두 같은 값)"""
        return len(set(dice_values)) == 1 and 0 not in dice_values

    def _is_victory_confirmed(self, scores: Dict, current_player_id: int, num_remaining_turns: int) -> bool:
        """승리 확정 여부 확인 (주어진 남은 턴 수 기준)"""
        current_player_score_data = scores.get(str(current_player_id), {})
        current_player_total_score = current_player_score_data.get("total_score", 0)

        # 카테고리별 최대 점수 정의 (Yacht/Turkey는 동일하게 50점으로 처리)
        MAX_CATEGORY_SCORES = {
            "ace": 5, "dual": 10, "triple": 15, "quad": 20, "penta": 25, "hexa": 30,
            "chance": 30,  # (5*6)
            "poker": 30,  
            "full_house": 25, 
            "small_straight": 30,
            "large_straight": 40,
            "turkey": 50  # Yacht
        }
        UPPER_SECTION_CATEGORIES = ["ace", "dual", "triple", "quad", "penta", "hexa"]
        UPPER_SECTION_BONUS_THRESHOLD = 63 # 통상적인 야추 규칙
        BONUS_POINTS = 35

        max_projected_opponent_final_score = 0

        for opponent_pid_str, opponent_score_data in scores.items():
            if opponent_pid_str == str(current_player_id):
                continue

            opponent_current_total_score = opponent_score_data.get("total_score", 0)
            opponent_scorecard = opponent_score_data.get("scorecard", {})
            
            potential_scores_for_opponent = []

            # 1. 사용 가능한 카테고리에서 얻을 수 있는 최대 점수 추가
            for category, max_score in MAX_CATEGORY_SCORES.items():
                # 카테고리가 아직 채워지지 않았거나 (값이 None), 키 자체가 없다면 사용 가능으로 간주합니다.
                # 만약 점수판에 0점으로 기록되었다면 (값이 0), 해당 카테고리는 이미 사용된 것.
                if opponent_scorecard.get(category) is None:
                    potential_scores_for_opponent.append(max_score)
            
            # 2. 상단 보너스 가능성 추가
            # 'bonus_available' 필드가 0이면 아직 보너스를 받지 않은 것으로 간주 (yacht_router.py에서 35점으로 설정됨)
            if opponent_scorecard.get("bonus_available", 0) == 0: # 아직 보너스를 받지 않았다면
                current_upper_sum = sum(opponent_scorecard.get(cat, 0) for cat in UPPER_SECTION_CATEGORIES)
                
                potential_additional_upper_sum = 0
                # 아직 점수를 내지 않은 상단 카테고리에서 얻을 수 있는 최대 점수 합산
                for cat in UPPER_SECTION_CATEGORIES:
                    if opponent_scorecard.get(cat, 0) == 0: # 미사용 상단 카테고리
                        potential_additional_upper_sum += MAX_CATEGORY_SCORES[cat]
                
                if (current_upper_sum + potential_additional_upper_sum) >= UPPER_SECTION_BONUS_THRESHOLD:
                    potential_scores_for_opponent.append(BONUS_POINTS)

            # 3. 얻을 수 있는 상위 N개 점수 합산 (N = num_remaining_turns)
            potential_scores_for_opponent.sort(reverse=True)
            max_gain_for_opponent = sum(potential_scores_for_opponent[:num_remaining_turns])
            
            projected_opponent_score = opponent_current_total_score + max_gain_for_opponent
            
            if projected_opponent_score > max_projected_opponent_final_score:
                max_projected_opponent_final_score = projected_opponent_score

        return current_player_total_score > max_projected_opponent_final_score

    def _is_bonus_achieved(self, scores: Dict, player_id: int) -> bool:
        """35점 보너스 달성 확인"""
        return scores.get(str(player_id), {}).get("scorecard", {}).get("bonus_available", 0) == 35

    async def _create_highlight(self, game_id: str, player_id: int, trigger_type: str):
        """하이라이트 생성"""
        player_key = f"{game_id}_{player_id}"
        
        # player_key가 사전에 없으면 set을 새로 할당 (process_game_state에서 이미 처리하지만 안전장치)
        if player_key not in self.player_highlights:
            self.player_highlights[player_key] = set()
            
        self.player_highlights[player_key].add(trigger_type)

        metadata = {
            "game_id": game_id,
            "player_id": player_id,
            "trigger_type": trigger_type,
            "timestamp": datetime.now().isoformat()
        }

        # 비디오 서비스 호출하여 하이라이트 생성
        await self.video_service.on_trigger(metadata)

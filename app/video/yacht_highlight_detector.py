# app/video/yacht_highlight_detector.py
from typing import List, Dict
import asyncio
from datetime import datetime


class YachtHighlightDetector:
    def __init__(self, video_service):
        self.video_service = video_service
        self.player_highlights = {}  # 플레이어별 하이라이트 추적

    async def process_game_state(self, game_id: str, player_id: int,
                                 dice_values: List[int], scores: Dict,
                                 remaining_turns: int):
        """주사위 값과 게임 상태를 기반으로 하이라이트 트리거 확인"""
        # 이미 하이라이트가 있는 플레이어는 건너뜀
        player_key = f"{game_id}_{player_id}"
        if player_key in self.player_highlights:
            return

        # 1순위: 야추(5개 동일)
        if self._is_yacht(dice_values):
            await self._create_highlight(game_id, player_id, "yacht")
            return

        # 2순위: 4턴 남았을 때 승리 확정
        if remaining_turns == 4 and self._is_victory_confirmed(scores, player_id):
            await self._create_highlight(game_id, player_id, "victory_confirmed")
            return

        # 3순위: 보너스 35점 획득
        if self._is_bonus_achieved(scores, player_id):
            await self._create_highlight(game_id, player_id, "bonus_achieved")
            return

    def _is_yacht(self, dice_values: List[int]) -> bool:
        """야추 확인 (5개 주사위 모두 같은 값)"""
        return len(set(dice_values)) == 1 and 0 not in dice_values

    def _is_victory_confirmed(self, scores: Dict, player_id: int) -> bool:
        """승리 확정 여부 확인"""
        current_score = scores.get(str(player_id), {}).get("total_score", 0)
        max_opponent_score = 0

        for pid, score_data in scores.items():
            if pid != str(player_id):
                max_opponent_score = max(max_opponent_score,
                                         score_data.get("total_score", 0))

        # 남은 턴에서 얻을 수 있는 최대 점수 (약 30점/턴 × 4턴 = 120점)
        max_remaining_points = 4 * 30

        return current_score > (max_opponent_score + max_remaining_points)

    def _is_bonus_achieved(self, scores: Dict, player_id: int) -> bool:
        """35점 보너스 달성 확인"""
        return scores.get(str(player_id), {}).get("scorecard", {}).get("bonus_available", 0) == 35

    async def _create_highlight(self, game_id: str, player_id: int, trigger_type: str):
        """하이라이트 생성"""
        player_key = f"{game_id}_{player_id}"
        self.player_highlights[player_key] = trigger_type

        metadata = {
            "game_id": game_id,
            "player_id": player_id,
            "trigger_type": trigger_type,
            "timestamp": datetime.now().isoformat()
        }

        # 비디오 서비스 호출하여 하이라이트 생성
        await self.video_service.on_trigger(metadata)

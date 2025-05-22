from typing import List, Dict, Optional


class FiveSecGame:
    """5초준다 게임 상태 관리 클래스"""
    _games = {}  # 게임 ID를 키로 하는 게임 상태 저장소

    @classmethod
    def create_game(cls, setting_id: int, player_ids: List[int]) -> str:
        """새 게임 생성"""
        game_id = str(setting_id)

        cls._games[game_id] = {
            "id": game_id,
            "setting_id": setting_id,
            "players": player_ids,
            "scores": {str(player_id): 0 for player_id in player_ids},
            "current_player_idx": 0,
            "round": 1,
            "max_rounds": 10,
            "status": "playing"
        }

        return game_id

    @classmethod
    def get_game(cls, game_id: str) -> Optional[Dict]:
        """게임 정보 조회"""
        return cls._games.get(game_id)

    @classmethod
    def next_turn(cls, game_id: str) -> Optional[int]:
        """다음 플레이어 턴으로 변경"""
        game = cls._games.get(game_id)
        if not game:
            return None

        game["current_player_idx"] = (game["current_player_idx"] + 1) % len(game["players"])

        # 모든 플레이어가 한 번씩 질문에 답했으면 다음 라운드로 진행
        if game["current_player_idx"] == 0:
            game["round"] += 1

            # 최대 라운드에 도달하면 게임 종료
            if game["round"] > game["max_rounds"]:
                game["status"] = "finished"

        return game["current_player_idx"]

    @classmethod
    def update_score(cls, game_id: str, player_id: int, score: int) -> bool:
        """플레이어 점수 업데이트"""
        game = cls._games.get(game_id)
        if not game:
            return False

        game["scores"][str(player_id)] = score
        return True

    @classmethod
    def set_max_rounds(cls, game_id: str, max_rounds: int) -> bool:
        """최대 라운드 설정"""
        game = cls._games.get(game_id)
        if not game:
            return False

        game["max_rounds"] = max_rounds
        return True

    @classmethod
    def end_game(cls, game_id: str) -> bool:
        """게임 종료 처리"""
        game = cls._games.get(game_id)
        if not game:
            return False

        game["status"] = "finished"
        return True

    @classmethod
    def delete_game(cls, game_id: str) -> bool:
        """게임 삭제"""
        if game_id in cls._games:
            del cls._games[game_id]
            return True
        return False

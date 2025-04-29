package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameListEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GameListMapper {
    public List<GameListEntity> getGameList();
    public GameListEntity findGameListByGameId(@Param("gameId") int gameId);
    public List<Integer> findGameIdByTitle(@Param("title") String title);
}

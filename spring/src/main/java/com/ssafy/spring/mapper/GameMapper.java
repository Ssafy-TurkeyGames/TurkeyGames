package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GameMapper {
    public List<GameEntity> getGameListTest();

    public List<GameEntity> getFilteredGameList(
            @Param("people") int[] people,
            @Param("level") int[] level
    );
    public GameEntity getGameDetailRule(
            @Param("gameId") int gameId
    );

    public List<GameEntity> getSearchedGameList(
            @Param("title") String title
    );
}

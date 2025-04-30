package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameDetailEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GameDetailMapper {
    public List<GameDetailEntity> getGameDetailList();
    public GameDetailEntity findGameDetailByGameId(@Param("gameId") int gameId);
    public List<Integer> findGameIdByFilteredPeopleAndLevel(
            @Param("people") List<Integer> people,
            @Param("level") List<Integer> level
    );
}

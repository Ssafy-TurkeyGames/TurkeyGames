package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameDashbTestEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GameDashbTestMapper {
    public List<GameDashbTestEntity> getGameListTest();
    public List<GameDashbTestEntity> getFilteredGameList(
        @Param("people") List<Integer> people,
        @Param("level") List<Integer> level
    );
}

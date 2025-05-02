package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameDashbOneTableTestEntity;
import com.ssafy.spring.entity.GameDashbTestEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GameDashbOneTableTestMapper {
    public List<GameDashbOneTableTestEntity> getGameListTest();
    public List<GameDashbOneTableTestEntity> getFilteredGameList(
            @Param("people") List<Integer> people,
            @Param("level") List<Integer> level
    );
}

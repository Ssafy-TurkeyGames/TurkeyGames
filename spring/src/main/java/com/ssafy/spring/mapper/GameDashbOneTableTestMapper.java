package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameDashbOneTableTestEntity;
import com.ssafy.spring.entity.GameDashbTestEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GameDashbOneTableTestMapper {
    public List<GameDashbOneTableTestEntity> getGameListTest();
//    public List<GameDashbOneTableTestEntity> getFilteredGameList(
//            @Param("people") List<Integer> people,
//            @Param("level") List<Integer> level
//    );
    public List<GameDashbOneTableTestEntity> getFilteredGameList(
            @Param("people") int[] people,
            @Param("level") int[] level
    );
    public GameDashbOneTableTestEntity getGameDetailRule(
            @Param("gameId") int gameId
    );

    public List<GameDashbOneTableTestEntity> getSearchedGameList(
            @Param("title") String title
    );
}

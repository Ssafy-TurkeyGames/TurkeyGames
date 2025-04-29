package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameProfileEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GameProfileMapper {
    public List<GameProfileEntity> getGameProfileList();
    public GameProfileEntity findGameProfileByGameId(@Param("gameId") int gameId);
}

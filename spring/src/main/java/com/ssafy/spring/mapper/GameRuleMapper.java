package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameRuleEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GameRuleMapper {
    public GameRuleEntity findGameRuleByGameId(@Param("gameId") int gameId);
}

package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameDashbTestEntity;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface GameDashbTestMapper {
    public List<GameDashbTestEntity> getGameListTest();
}

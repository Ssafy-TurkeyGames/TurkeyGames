package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameListEntity;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface GameListMapper {
    List<GameListEntity> getGameList();
}

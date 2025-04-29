package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameDetailEntity;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface GameDetailMapper {
    public List<GameDetailEntity> getGameDetailList();
}

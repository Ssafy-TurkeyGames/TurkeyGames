package com.ssafy.spring.mapper;

import com.ssafy.spring.entity.GameProfileEntity;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface GameProfileMapper {
    public List<GameProfileEntity> getGameProfileList();
}

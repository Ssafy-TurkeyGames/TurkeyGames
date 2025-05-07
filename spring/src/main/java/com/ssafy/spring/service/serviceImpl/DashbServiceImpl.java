package com.ssafy.spring.service.serviceImpl;

import com.ssafy.spring.common.response.ResponseDto;
import com.ssafy.spring.dto.dashb.response.GetFilteredGameListResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameDetailRuleResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameListResponseDto;
import com.ssafy.spring.dto.dashb.response.GetSearchedGameListResponseDto;
import com.ssafy.spring.entity.*;
import com.ssafy.spring.mapper.*;
import com.ssafy.spring.service.DashbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashbServiceImpl implements DashbService {

    private final GameMapper gameMapper;

    @Override
    public ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> getGameList() {
        try {
            List<GameEntity> gameEntities = gameMapper.getGameList();
            List<GetGameListResponseDto> response = gameEntities.stream()
                    .map(entity -> GetGameListResponseDto.builder()
                            .gameId(entity.getGameId())
                            .title(entity.getTitle())
                            .description(entity.getShortDescription())
                            .gameProfilePath(entity.getGameProfilePath())
                            .people(entity.getPeople())
                            .level(entity.getLevel())
                            .build()
                    ).collect(Collectors.toList());

            if(response.isEmpty()) {
                return ResponseDto.successNoData();
            }
            return ResponseDto.success(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseDto.fail();
        }
    }

    @Override
    public ResponseEntity<? super ResponseDto<List<GetFilteredGameListResponseDto>>> getFilteredGameList(List<Integer> people, List<Integer> level) {
        try {
            int[] peopleArray = people.stream().mapToInt(Integer::intValue).toArray();
            int[] levelArray = level.stream().mapToInt(Integer::intValue).toArray();
            List<GameEntity> gameEntities = gameMapper.getFilteredGameList(peopleArray, levelArray);
            List<GetFilteredGameListResponseDto> response = gameEntities.stream()
                    .map(entity -> GetFilteredGameListResponseDto.builder()
                            .gameId(entity.getGameId())
                            .title(entity.getTitle())
                            .description(entity.getShortDescription())
                            .gameProfilePath(entity.getGameProfilePath())
                            .people(entity.getPeople())
                            .level(entity.getLevel())
                            .build()
                    ).collect(Collectors.toList());

            if(response.isEmpty()) {
                return ResponseDto.successNoData();
            }
            return ResponseDto.success(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseDto.fail();
        }
    }

    @Override
    public ResponseEntity<? super ResponseDto<GetGameDetailRuleResponseDto>> getGameDetailRule(int gameId) {
        try {
            GameEntity gameEntity = gameMapper.getGameDetailRule(gameId);
            GetGameDetailRuleResponseDto response = GetGameDetailRuleResponseDto.builder()
                    .gameId(gameEntity.getGameId())
                    .gameProfilePath(gameEntity.getGameProfilePath())
                    .description(gameEntity.getLongDescription())
                    .imagePath(gameEntity.getImagePath())
                    .descriptionVideoPath(gameEntity.getDescriptionVideoPath())
                    .build();

            return ResponseDto.success(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseDto.fail();
        }
    }

    @Override
    public ResponseEntity<? super ResponseDto<List<GetSearchedGameListResponseDto>>> getSearchedGameList(String title) {
        try {
            List<GameEntity> gameEntities = gameMapper.getSearchedGameList(title);
                List<GetSearchedGameListResponseDto> response = gameEntities.stream()
                    .map(entity -> GetSearchedGameListResponseDto.builder()
                        .gameId(entity.getGameId())
                        .title(entity.getTitle())
                        .description(entity.getShortDescription())
                        .gameProfilePath(entity.getGameProfilePath())
                        .people(entity.getPeople())
                        .level(entity.getLevel())
                        .build()
                    ).collect(Collectors.toList());

            if(response.isEmpty()) {
                return ResponseDto.successNoData();
            }
            return ResponseDto.success(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseDto.fail();
        }
    }
}

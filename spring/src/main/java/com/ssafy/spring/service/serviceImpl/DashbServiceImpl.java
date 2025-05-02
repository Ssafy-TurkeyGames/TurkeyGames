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

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashbServiceImpl implements DashbService {

    private final GameListMapper gameListMapper;
    private final GameRuleMapper gameRuleMapper;
    private final GameProfileMapper gameProfileMapper;
    private final GameDetailMapper gameDetailMapper;

    private final GameDashbTestMapper gameDashbTestMapper;
    private final GameDashbOneTableTestMapper gameDashbOneTableTestMapper;

    @Override
    public ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> getGameList() {
        try {
//            List<GameListEntity> gameListEntities = gameListMapper.getGameList();
//            List<GameProfileEntity> gameProfileEntities = gameProfileMapper.getGameProfileList();
//            List<GameDetailEntity> gameDetailEntities = gameDetailMapper.getGameDetailList();



//            List<GetGameListResponseDto> response = new ArrayList<>();
//            for(int i = 0; i < gameListEntities.size(); i++) {
//                response.add(new GetGameListResponseDto(
//                        gameListEntities.get(i).getGameId(),
//                        gameListEntities.get(i).getTitle(),
//                        gameListEntities.get(i).getDescription(),
//                        gameProfileEntities.get(i).getGameProfilePath(),
//                        gameDetailEntities.get(i).getPeople(),
//                        gameDetailEntities.get(i).getLevel())
//                );
//            }

            // join test
//            List<GameDashbTestEntity> gameListEntities = gameDashbTestMapper.getGameListTest();
//
//            List<GetGameListResponseDto> response = gameListEntities.stream()
//                    .map(entity -> GetGameListResponseDto.builder()
//                            .gameId(entity.getGameId())
//                            .title(entity.getTitle())
//                            .description(entity.getDescription())
//                            .gameProfilePath(entity.getGameProfilePath())
//                            .people(entity.getPeople())
//                            .level(entity.getLevel())
//                            .build()
//                    ).collect(Collectors.toList());

            // one table test
            List<GameDashbOneTableTestEntity> gameDashbOneTableTestEntities = gameDashbOneTableTestMapper.getGameListTest();
            List<GetGameListResponseDto> response = gameDashbOneTableTestEntities.stream()
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
//            List<Integer> filteredGameIds = gameDetailMapper.findGameIdByFilteredPeopleAndLevel(people, level);
//
//            List<GetFilteredGameListResponseDto> response = new ArrayList<>();
//            for(int i = 0; i < filteredGameIds.size(); i++) {
//                GameListEntity gameListEntity = gameListMapper.findGameListByGameId(filteredGameIds.get(i));
//                GameProfileEntity gameProfileEntity = gameProfileMapper.findGameProfileByGameId(filteredGameIds.get(i));
//                GameDetailEntity gameDetailEntity = gameDetailMapper.findGameDetailByGameId(filteredGameIds.get(i));
//                response.add(new GetFilteredGameListResponseDto(
//                        gameListEntity.getGameId(),
//                        gameListEntity.getTitle(),
//                        gameListEntity.getDescription(),
//                        gameProfileEntity.getGameProfilePath(),
//                        gameDetailEntity.getPeople(),
//                        gameDetailEntity.getLevel()
//                ));
//            }

            // join test
//            List<GameDashbTestEntity> gameListEntities = gameDashbTestMapper.getFilteredGameList(people, level);
//            List<GetFilteredGameListResponseDto> response = gameListEntities.stream()
//                    .map(entity -> GetFilteredGameListResponseDto.builder()
//                            .gameId(entity.getGameId())
//                            .title(entity.getTitle())
//                            .description(entity.getDescription())
//                            .gameProfilePath(entity.getGameProfilePath())
//                            .people(entity.getPeople())
//                            .level(entity.getLevel())
//                            .build()
//                    ).collect(Collectors.toList());

            // one table test
            List<GameDashbOneTableTestEntity> gameDashbOneTableTestEntities = gameDashbOneTableTestMapper.getFilteredGameList(people, level);
            List<GetFilteredGameListResponseDto> response = gameDashbOneTableTestEntities.stream()
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
//            GameProfileEntity gameProfileEntity = gameProfileMapper.findGameProfileByGameId(gameId);
//            GameRuleEntity gameRuleEntity = gameRuleMapper.findGameRuleByGameId(gameId);
//            GetGameDetailRuleResponseDto response = new GetGameDetailRuleResponseDto(
//                    gameProfileEntity.getGameId(),
//                    gameProfileEntity.getGameProfilePath(),
//                    gameRuleEntity.getDescription(),
//                    gameRuleEntity.getImagePath(),
//                    gameRuleEntity.getDescriptionVideoPath()
//            );

            // join test
//            GameDashbDetailTestEntity gameDashbDetailTestEntity = gameDashbTestMapper.getGameDetailRule(gameId);
//            GetGameDetailRuleResponseDto response = new GetGameDetailRuleResponseDto(
//                    gameDashbDetailTestEntity.getGameId(),
//                    gameDashbDetailTestEntity.getGameProfilePath(),
//                    gameDashbDetailTestEntity.getDescription(),
//                    gameDashbDetailTestEntity.getImagePath(),
//                    gameDashbDetailTestEntity.getDescriptionVideoPath()
//            );

            // one table test
            GameDashbOneTableTestEntity gameDashbOneTableTestEntity = gameDashbOneTableTestMapper.getGameDetailRule(gameId);
            GetGameDetailRuleResponseDto response = GetGameDetailRuleResponseDto.builder()
                    .gameId(gameDashbOneTableTestEntity.getGameId())
                    .gameProfilePath(gameDashbOneTableTestEntity.getGameProfilePath())
                    .description(gameDashbOneTableTestEntity.getLongDescription())
                    .imagePath(gameDashbOneTableTestEntity.getImagePath())
                    .descriptionVideoPath(gameDashbOneTableTestEntity.getDescriptionVideoPath())
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
//            List<Integer> searchedGameIds = gameListMapper.findGameIdByTitle(title);
//            List<GetSearchedGameListResponseDto> response = new ArrayList<>();
//            for(int i = 0; i < searchedGameIds.size(); i++) {
//                GameListEntity gameListEntity = gameListMapper.findGameListByGameId(searchedGameIds.get(i));
//                GameProfileEntity gameProfileEntity = gameProfileMapper.findGameProfileByGameId(searchedGameIds.get(i));
//                GameDetailEntity gameDetailEntity = gameDetailMapper.findGameDetailByGameId(searchedGameIds.get(i));
//                response.add(new GetSearchedGameListResponseDto(
//                        gameListEntity.getGameId(),
//                        gameListEntity.getTitle(),
//                        gameListEntity.getDescription(),
//                        gameProfileEntity.getGameProfilePath(),
//                        gameDetailEntity.getPeople(),
//                        gameDetailEntity.getLevel()
//                ));
//            }
            List<GameDashbTestEntity> gameListEntities = gameDashbTestMapper.getSearchedGameList(title);

            List<GetSearchedGameListResponseDto> response = gameListEntities.stream()
                    .map(entity -> GetSearchedGameListResponseDto.builder()
                            .gameId(entity.getGameId())
                            .title(entity.getTitle())
                            .description(entity.getDescription())
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

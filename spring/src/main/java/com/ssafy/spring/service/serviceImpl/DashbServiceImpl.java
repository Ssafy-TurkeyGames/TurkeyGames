package com.ssafy.spring.service.serviceImpl;

import com.ssafy.spring.common.response.ResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameListResponseDto;
import com.ssafy.spring.entity.GameDetailEntity;
import com.ssafy.spring.entity.GameListEntity;
import com.ssafy.spring.entity.GameProfileEntity;
import com.ssafy.spring.mapper.GameDetailMapper;
import com.ssafy.spring.mapper.GameListMapper;
import com.ssafy.spring.mapper.GameProfileMapper;
import com.ssafy.spring.mapper.GameRuleMapper;
import com.ssafy.spring.service.DashbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashbServiceImpl implements DashbService {

    private final GameListMapper gameListMapper;
    private final GameRuleMapper gameRuleMapper;
    private final GameProfileMapper gameProfileMapper;
    private final GameDetailMapper gameDetailMapper;

    @Override
    public ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> getGameList() {
        try {
            List<GameListEntity> gameListEntities = gameListMapper.getGameList();
            List<GameProfileEntity> gameProfileEntities = gameProfileMapper.getGameProfileList();
            List<GameDetailEntity> gameDetailEntities = gameDetailMapper.getGameDetailList();

            List<GetGameListResponseDto> response = new ArrayList<>();
            for(int i = 0; i < gameListEntities.size(); i++) {
                response.add(new GetGameListResponseDto(
                        gameListEntities.get(i).getGameId(),
                        gameListEntities.get(i).getTitle(),
                        gameListEntities.get(i).getDescription(),
                        gameProfileEntities.get(i).getGameProfilePath(),
                        gameDetailEntities.get(i).getPeople(),
                        gameDetailEntities.get(i).getLevel())
                );
            }
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

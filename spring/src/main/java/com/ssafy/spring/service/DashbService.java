package com.ssafy.spring.service;

import com.ssafy.spring.common.response.ResponseDto;
import com.ssafy.spring.dto.dashb.response.GetFilteredGameListResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameListResponseDto;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface DashbService {
    ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> getGameList();
    ResponseEntity<? super ResponseDto<List<GetFilteredGameListResponseDto>>> getFilteredGameList(List<Integer> people, List<Integer> level);
}

package com.ssafy.spring.controller;

import com.ssafy.spring.common.response.ResponseDto;
import com.ssafy.spring.dto.dashb.response.GetFilteredGameListResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameDetailRuleResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameListResponseDto;
import com.ssafy.spring.dto.dashb.response.GetSearchedGameListResponseDto;
import com.ssafy.spring.service.DashbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashb")
@RequiredArgsConstructor
public class DashbController {

    private final DashbService dashbService;

    @GetMapping("")
    public ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> getGameList() {
        ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> response = dashbService.getGameList();
        return response;
    }

    @GetMapping("/filter")
    public ResponseEntity<? super ResponseDto<List<GetFilteredGameListResponseDto>>> getFilteredGameList(
            @RequestParam(name = "people", required = false) List<Integer> people,
            @RequestParam(name = "level", required = false) List<Integer> level
    ) {
        ResponseEntity<? super ResponseDto<List<GetFilteredGameListResponseDto>>> response = dashbService.getFilteredGameList(people, level);
        return response;
    }

    @GetMapping("/detail/{gameId}")
    public ResponseEntity<? super ResponseDto<GetGameDetailRuleResponseDto>> getGameDetailRule(
            @PathVariable(name = "gameId") int gameId
    ) {
        ResponseEntity<? super ResponseDto<GetGameDetailRuleResponseDto>> response = dashbService.getGameDetailRule(gameId);
        return response;
    }

    @GetMapping("/search")
    public ResponseEntity<? super ResponseDto<List<GetSearchedGameListResponseDto>>> getSearchedGameList(
            @RequestParam(name = "title") String title
    ) {
        ResponseEntity<? super ResponseDto<List<GetSearchedGameListResponseDto>>> response = dashbService.getSearchedGameList(title);
        return response;
    }
}

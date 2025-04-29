package com.ssafy.spring.controller;

import com.ssafy.spring.common.response.ResponseDto;
import com.ssafy.spring.dto.dashb.response.GetFilteredGameListResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameListResponseDto;
import com.ssafy.spring.service.DashbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashb")
@RequiredArgsConstructor
public class DashbController {

    private final DashbService dashbService;

    @GetMapping("/list")
    public ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> getGameList() {
        ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> response = dashbService.getGameList();
        return response;
    }

    @GetMapping("/filter")
    public ResponseEntity<? super ResponseDto<List<GetFilteredGameListResponseDto>>> getFilteredGameList(
            @RequestParam(name = "people") List<Integer> people,
            @RequestParam(name = "level") List<Integer> level
    ) {
        ResponseEntity<? super ResponseDto<List<GetFilteredGameListResponseDto>>> response = dashbService.getFilteredGameList(people, level);
        return response;
    }
}

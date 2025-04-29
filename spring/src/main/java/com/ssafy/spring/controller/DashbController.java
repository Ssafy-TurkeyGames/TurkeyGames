package com.ssafy.spring.controller;

import com.ssafy.spring.common.response.ResponseDto;
import com.ssafy.spring.dto.dashb.response.GetGameListResponseDto;
import com.ssafy.spring.service.DashbService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashb")
@RequiredArgsConstructor
public class DashbController {

    private final DashbService dashbService;

    @GetMapping("/")
    public ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> getGameList() {
        ResponseEntity<? super ResponseDto<List<GetGameListResponseDto>>> response = dashbService.getGameList();
        return response;
    }
}

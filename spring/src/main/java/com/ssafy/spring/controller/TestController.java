package com.ssafy.spring.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {
	@GetMapping("/")
	public String hello(){
		return "CICD테스트 칠칠칠칠";
	}
}

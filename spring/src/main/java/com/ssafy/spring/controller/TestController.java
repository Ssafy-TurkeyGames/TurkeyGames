package com.ssafy.spring.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {
	@GetMapping("/")
	public String hello(){
		return "CICD테스트 마지막테스트7777777 ";
	}
}

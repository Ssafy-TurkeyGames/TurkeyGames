package com.ssafy.spring.controller;

import com.ssafy.spring.config.NoCacheConfig;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;


@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, classes = {NoCacheConfig.class})
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DashbControllerIntegrationTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void getGameList_success() {
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity("/dashb", String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getGameList_successNoData() {
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity("/dashb", String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getGameList_fail() {
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity("/dashb", String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void getFilteredGameList_success() {
        String url = "/dashb/filter?people=2,3,4&level=1";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFilteredGameList_successNoData() {
        String url = "/dashb/filter?people=4&level=4";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getFilteredGameList_fail() {
        String url = "/dashb/filter?people=&level=";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void getGameDetailRule_success() {
        String url = "/dashb/detail/3";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getGameDetailRule_successNoData() {
        String url = "/dashb/detail/1";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getGameDetailRule_fail() {
        String url = "/dashb/detail/15";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    void getSearchedGameList_success() {
        String url = "/dashb/search?title=터";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getSearchedGameList_successNoData() {
        String url = "/dashb/search?title=뷁";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void getSearchedGameList_fail() {
        String url = "/dashb/search?title";
        long startTime = System.currentTimeMillis();

        ResponseEntity<?> response = restTemplate.getForEntity(url, String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("📦 JSON 응답: " + response.getBody());
        System.out.println("📦 응답 시간: " + duration + "ms");

        Assertions.assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
}

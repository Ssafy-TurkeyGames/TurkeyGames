package com.ssafy.spring.dto.dashb.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
@AllArgsConstructor
public class GetGameListResponseDto {
    private int gameId;
    private String title;
    private String description;
    private String gameProfilePath;
    private int[] people;
    private int level;
}

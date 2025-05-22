package com.ssafy.spring.dto.dashb.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class GetGameDetailRuleResponseDto {
    private int gameId;
    private String gameProfilePath;
    private String description;
    private String[] imagePath;
    private String descriptionVideoPath;
}

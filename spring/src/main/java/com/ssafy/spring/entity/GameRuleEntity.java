package com.ssafy.spring.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameRuleEntity {
    private int gameId;
    private String description;
    private String imagePath;
    private String descriptionVideoPath;
}

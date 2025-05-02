package com.ssafy.spring.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameDashbDetailTestEntity {
    private int gameId;
    private String gameProfilePath;
    private String description;
    private String[] imagePath;
    private String descriptionVideoPath;
}

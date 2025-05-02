package com.ssafy.spring.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameDashbTestEntity {
    private int gameId;
    private String title;
    private String description;
    private String gameProfilePath;
    private int[] people;
    private int level;
}

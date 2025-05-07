package com.ssafy.spring.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameEntity {
    private int gameId;
    private String title;
    private String shortDescription;
    private String longDescription;
    private String[] imagePath;
    private String descriptionVideoPath;
    private String gameProfilePath;
    private int[] people;
    private int level;
}

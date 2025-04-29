package com.ssafy.spring.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ResponseDto<T> {
    private String code;
    private String message;
    private T data;
}
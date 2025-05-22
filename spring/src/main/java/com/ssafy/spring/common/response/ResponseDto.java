package com.ssafy.spring.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Getter
@AllArgsConstructor
public class ResponseDto<T> {
    private String code;
    private String message;
    private T data;

    public static <T> ResponseEntity<ResponseDto<T>> success(T data) {
        ResponseDto<T> body = new ResponseDto<>(ResponseCode.SUCCESS, ResponseMessage.GAMES_RETRIEVED_SUCCESSFULLY, data);
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    public static <T> ResponseEntity<ResponseDto<T>> successNoData() {
        ResponseDto<T> body = new ResponseDto<>(ResponseCode.SUCCESS, ResponseMessage.NO_GAMES_FOUND, null);
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    public static <T> ResponseEntity<ResponseDto<T>> fail() {
        ResponseDto<T> body = new ResponseDto<>(ResponseCode.INTERNAL_SERVER_ERROR, ResponseMessage.AN_UNEXPECTED_ERROR_OCCURRED, null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
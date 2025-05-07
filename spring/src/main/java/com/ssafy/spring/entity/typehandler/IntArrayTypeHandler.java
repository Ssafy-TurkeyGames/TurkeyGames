package com.ssafy.spring.entity.typehandler;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;
import java.util.Arrays;
import java.util.stream.Collectors;

public class IntArrayTypeHandler extends BaseTypeHandler<int[]> {

//    @Override
//    public void setNonNullParameter(PreparedStatement ps, int i, int[] parameter, JdbcType jdbcType) throws SQLException {
//        String arrayString = "{" + Arrays.stream(parameter)
//                .mapToObj(String::valueOf)
//                .collect(Collectors.joining(",")) + "}";
//        ps.setString(i, arrayString);
//    }

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, int[] parameter, JdbcType jdbcType) throws SQLException {
        // 반드시 boxed로 감싸야 합니다: int → Integer
        Integer[] boxedArray = Arrays.stream(parameter).boxed().toArray(Integer[]::new);
        // PostgreSQL INT[] 타입으로 변환
        Array array = ps.getConnection().createArrayOf("INT", boxedArray);
        ps.setArray(i, array);
    }

    private int[] parseArray(String result) {
        if (result == null || result.trim().isEmpty()) {
            return new int[0];
        }

        result = result.replaceAll("[{}\\s\"]", "");
        if (result.isEmpty()) return new int[0];

        return Arrays.stream(result.split(","))
                .mapToInt(Integer::parseInt)
                .toArray();
    }

    @Override
    public int[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parseArray(rs.getString(columnName));
    }

    @Override
    public int[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseArray(rs.getString(columnIndex));
    }

    @Override
    public int[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseArray(cs.getString(columnIndex));
    }
}

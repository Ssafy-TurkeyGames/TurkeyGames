FROM gradle:8.13-jdk17 AS build

WORKDIR /app/

COPY . .

RUN gradle clean build -x test

FROM openjdk:17-jdk-slim

WORKDIR /app/

ENV TZ=Asia/Seoul

COPY --from=build /app/build/libs/platform-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
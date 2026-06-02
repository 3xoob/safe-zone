FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY backend/pom.xml ./pom.xml
COPY backend ./
RUN mvn -pl discovery-service -am package -DskipTests

FROM maven:3.9-eclipse-temurin-17
WORKDIR /app
COPY --from=build /workspace/discovery-service/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]

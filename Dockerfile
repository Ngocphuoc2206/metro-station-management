# =============================
# Stage 1: Build application
# =============================
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .

#Download dependency
COPY .mvn .mvn

COPY mvnw .

RUN chmod +x mvnw

RUN ./mvnw -q -DskipTests dependency:go-offline

#Copy source
COPY src src

#Build project -> .jar
RUN ./mvnw -q -DskipTests clean package

# =========================
# Stage 2: Run application
# =========================

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar


EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

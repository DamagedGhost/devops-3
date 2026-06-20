# --- Etapa 1: Construcción (Build) ---
# Usamos una versión estable de Maven (3.9) y Java 17
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Oprimización: Primero copiamos solo el pom.xml para aprovechar la cache de dependencias
COPY pom.xml .
# Descargamos las dependencias sin compilar el código para acelerar futuras construcciones
RUN mvn dependency:go-offline

# Copiamos el código y compilamos saltando los tests
COPY src ./src
# Evitar logs innecesarios y acelerar la construcción al omitir los tests
RUN mvn clean package -B -ntp -Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=warn -DskipTests


# --- Etapa 2: Producción (Run stage) ---
# Usamos solo el JRE de Java 17 para mantener la imagen minúscula
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

# Copiamos el .jar
COPY --from=build /app/target/*.jar app.jar

# Exponemos el puerto en el que corre la aplicación
EXPOSE 8080

# Creacion de un usuario no root para mejorar la seguridad
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

ENTRYPOINT ["java", "-jar", "app.jar"]

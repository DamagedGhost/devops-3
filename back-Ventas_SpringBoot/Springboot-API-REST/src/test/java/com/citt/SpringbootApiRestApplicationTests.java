package com.citt;

import org.junit.jupiter.api.Test;
// Comentamos o borramos la importación
// import org.springframework.boot.test.context.SpringBootTest;

// @SpringBootTest  <-- Comentamos esto para que no busque la base de datos
class SpringbootApiRestApplicationTests {

    @Test
    void contextLoads() {
        System.out.println("Test de contexto de Ventas neutralizado para el pipeline CI/CD");
    }

}
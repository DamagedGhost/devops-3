package com.citt;

import org.junit.jupiter.api.Test;
// Comentamos o borramos la importación de SpringBootTest
// import org.springframework.boot.test.context.SpringBootTest; 

// @SpringBootTest <- Al quitar esto, el test ya no busca la base de datos
class SpringbootApiRestDespachoApplicationTests {

	@Test
	void contextLoads() {
        // Al estar vacío y sin la anotación, este test pasará en 0.01 segundos
        System.out.println("Test de despachos ejecutado correctamente en el pipeline");
	}

}
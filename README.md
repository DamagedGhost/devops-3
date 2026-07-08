# Proyecto Semestral

Repositorio con dos microservicios Spring Boot, un frontend React/Vite y manifiestos de Kubernetes preparados para desplegar en AWS. El flujo principal del proyecto está orientado a construir imágenes Docker, publicarlas en Amazon ECR y desplegarlas en Amazon EKS mediante `kubectl` autenticado con AWS CLI. También se describe el camino equivalente para Amazon ECS, donde el despliegue requiere task definitions y services en lugar de manifiestos Kubernetes.

## Arquitectura general

El repositorio está organizado en tres bloques:

- `back-Ventas_SpringBoot/Springboot-API-REST/`: API Spring Boot para el dominio de ventas.
- `back-Despachos_SpringBoot/Springboot-API-REST-DESPACHO/`: API Spring Boot para el dominio de despacho.
- `front_despacho/`: frontend React + Vite servido con Nginx.

La infraestructura de Kubernetes está en `k8s/` y define:

- `namespace.yaml`: crea el namespace `innovatech`.
- `secrets.yaml`: credenciales de la base de datos.
- `init-db.yaml`: inicialización de MySQL con schema y datos base.
- `database.yaml`: despliegue y service de MySQL.
- `backend.yaml`: despliegue y service de los dos microservicios Java.
- `frontend.yaml`: despliegue y service del frontend con LoadBalancer.
- `hpa.yaml`: autoescalado horizontal para los backends.

## Flujo de empaquetado

### Frontend

El frontend usa un Docker multi-stage:

1. Se construye la app con Node.js 18 Alpine.
2. Se ejecuta `npm ci` y luego `npm run build`.
3. El resultado final se copia a una imagen ligera de Nginx.
4. Nginx expone el puerto `80`.

### Backends Spring Boot

Ambos microservicios Java siguen el mismo patrón:

1. Se usa Maven con Java 17 para resolver dependencias.
2. Se ejecuta `mvn clean package` omitiendo tests en la etapa de imagen.
3. El artefacto final es un JAR ejecutable.
4. La imagen final usa `eclipse-temurin:17-jre-alpine` y expone el puerto `8080`.

### Base de datos

La base de datos usa una imagen oficial de MySQL 8.0 y se inicializa con un `ConfigMap` que monta un script SQL en `/docker-entrypoint-initdb.d/`. Ese script crea la base `innovatech_db`, la tabla `venta` y carga datos de ejemplo.

## Flujo de despliegue en AWS

El flujo recomendado para este repositorio es:

1. Compilar frontend y backends.
2. Construir las imágenes Docker.
3. Etiquetar cada imagen con una versión inmutable, idealmente el hash del commit.
4. Publicar las imágenes en Amazon ECR.
5. Autenticarse contra el clúster de Amazon EKS con AWS CLI.
6. Aplicar los manifiestos de Kubernetes con `kubectl`.
7. Verificar pods, services, HPA y logs.

## Conexión con AWS CLI

Antes de desplegar, configura tus credenciales de AWS:

```bash
aws configure
```

Para trabajar con EKS, actualiza el kubeconfig del clúster:

```bash
aws eks update-kubeconfig --region us-east-1 --name <nombre-del-cluster>
```

Para iniciar sesión en ECR y subir imágenes:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

## Publicación de imágenes en ECR

Ejemplo de flujo para los tres contenedores:

```bash
docker build -t front-despacho ./front_despacho
docker build -t back-ventas ./back-Ventas_SpringBoot/Springboot-API-REST
docker build -t back-despachos ./back-Despachos_SpringBoot/Springboot-API-REST-DESPACHO

docker tag front-despacho:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/front:latest
docker tag back-ventas:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/back-ventas:latest
docker tag back-despachos:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/back-despachos:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/front:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/back-ventas:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/back-despachos:latest
```

En CI/CD es mejor reemplazar `latest` por una etiqueta versionada, por ejemplo `gitsha-<hash>` o `v1.0.0`.

## Despliegue en EKS

Una vez que las imágenes estén en ECR y el `kubeconfig` esté configurado, aplica los manifiestos:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/init-db.yaml
kubectl apply -f k8s/database.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/hpa.yaml
```

Orden recomendado:

1. Namespace.
2. Secret.
3. ConfigMap de inicialización.
4. Base de datos.
5. Backends.
6. Frontend.
7. HPA.

## Qué hace cada manifiesto en EKS

- `database.yaml` levanta MySQL con un volumen efímero y monta el script de inicialización.
- `backend.yaml` levanta los dos microservicios Java con probes de arranque, readiness y liveness.
- `backend.yaml` también expone cada backend con un `Service` interno `ClusterIP`.
- `frontend.yaml` publica el frontend con `LoadBalancer` y anotación NLB para AWS.
- `hpa.yaml` escala los backends según utilización de CPU.

## Flujo de pipeline recomendado

Un pipeline típico debería ejecutar estos pasos:

1. Validar código y tests.
2. Construir las imágenes Docker.
3. Publicarlas en ECR.
4. Actualizar los manifiestos con la nueva etiqueta de imagen o inyectar la versión desde variables del pipeline.
5. Autenticarse en EKS con AWS CLI.
6. Aplicar o actualizar recursos con `kubectl`.
7. Verificar rollout y salud de los pods.

Ejemplo de comandos de verificación:

```bash
kubectl get pods -n innovatech
kubectl get svc -n innovatech
kubectl get hpa -n innovatech
kubectl rollout status deployment/backend-venta -n innovatech
kubectl rollout status deployment/backend-despacho -n innovatech
```

## Despliegue en ECS

ECS no usa estos manifiestos de Kubernetes directamente. Para ECS, el flujo es parecido en empaquetado, pero cambia la capa de orquestación:

1. Se construyen y publican las mismas imágenes en ECR.
2. Se crean task definitions para frontend, ventas, despacho y base de datos si corresponde.
3. Se crean services en ECS con Application Load Balancer o Network Load Balancer.
4. Se actualizan las revisiones de las task definitions desde el pipeline.
5. Se despliegan los cambios con AWS CLI.

Comandos útiles de ECS:

```bash
aws ecs list-clusters --region us-east-1
aws ecs list-services --cluster <cluster-name> --region us-east-1
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment --region us-east-1
```

## Observaciones importantes

- Los manifiestos actuales están pensados para EKS y Kubernetes, no para ECS puro.
- La configuración de health checks en los backends depende de Spring Boot Actuator en `/actuator/health`.
- El frontend se sirve como contenido estático, por lo que es ideal para Nginx o un service de tipo web en ECS/EKS.
- Para producción conviene usar secretos administrados por AWS Secrets Manager o Kubernetes Secrets gestionados externamente, en vez de valores en texto plano.

## Resumen del flujo

1. El código fuente se empaqueta en imágenes Docker.
2. Las imágenes se suben a ECR.
3. EKS consume esas imágenes usando los manifiestos de `k8s/`.
4. AWS CLI se usa para autenticación y conexión al clúster.
5. ECS sigue el mismo origen de imágenes, pero exige task definitions y services propios.

## Estructura del proyecto

```text
README.md
back-Despachos_SpringBoot/
back-Ventas_SpringBoot/
front_despacho/
k8s/
```

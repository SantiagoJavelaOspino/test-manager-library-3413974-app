# test-manager-library-3413974-app

> **Prueba técnica · Ficha ADSO 3413974**
> Horario: de **9:15 a. m. a 3:00 p. m.** (15:00). Después, **feria de presentación** de cada proyecto.

Aplicación **frontend** de *Manager Library* — React 18 + Vite 5.  
Implementación SDD completa sobre el stack PHP + PostgreSQL.

## Inicio rápido

### Requisitos
- Node.js 18+
- API corriendo en `http://localhost:8000` (ver repositorio `api`)

### Instalar dependencias
```bash
npm install
```

### Modo desarrollo
```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173).

### Build producción
```bash
npm run build
# Archivos en dist/
```

## Variables de entorno

Crea `.env.local` para sobreescribir la URL de la API:
```
VITE_API_URL=http://localhost:8000/api/v1
```

## Credenciales por defecto
| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `admin123` |

## Funcionalidades implementadas

| Módulo | Descripción |
|---|---|
| Login / Logout | Autenticación JWT |
| Catálogo | Listado, búsqueda y filtro por categoría |
| Alta de libro | Formulario con ISBN, categoría, portada |
| Préstamo | Carrito multi-libro → registro de préstamo |
| Socios | Listado y alta |
| Préstamos activos | Vista y devolución por ítem |
| Vencidos | Préstamos con `due_at` en el pasado |
| Reporte | Libros más prestados |
| Alta de bibliotecario | Solo para rol `admin` |

## Stack
- React 18 (SPA sin router externo)
- Vite 5
- Tailwind CSS (CDN)
- Fetch API nativa

## El reto se desarrolla con React y PHP

El spec está escrito para Python y para .NET, pero el reto **no** se hace en esos lenguajes:

| Capa | Tecnología del reto |
|---|---|
| Frontend | React 18 |
| Backend | PHP (arquitectura hexagonal, sin Laravel) |
| BD | PostgreSQL 16+ |

Lo que el spec define sobre el negocio —historias, criterios de aceptación, reglas, contrato de la API, modelo de datos— se respeta. Lo que define sobre la tecnología se traduce a React y PHP nativo.

## Los seis repositorios

| Repositorio | Qué va ahí |
|---|---|
| [`test-manager-library-3413974-docs`](https://github.com/code-sena/test-manager-library-3413974-docs) | El spec: `spec-python/` y `spec-.net/` |
| [`test-manager-library-3413974-api`](https://github.com/code-sena/test-manager-library-3413974-api) | Backend en PHP (arquitectura hexagonal) |
| [`test-manager-library-3413974-app`](https://github.com/code-sena/test-manager-library-3413974-app) | Frontend en React |
| [`test-manager-library-3413974-page`](https://github.com/code-sena/test-manager-library-3413974-page) | Sitio público estático de presentación |
| [`test-manager-library-3413974-infra`](https://github.com/code-sena/test-manager-library-3413974-infra) | Contenedores, red, volúmenes |
| [`test-manager-library-3413974-tool`](https://github.com/code-sena/test-manager-library-3413974-tool) | Sembrador de datos de demostración |

## Instrucciones

Cada aprendiz debe **crear el fork** de los seis repositorios del proyecto y **resolver el proyecto
con el spec planteado**.

1. Hacer fork, a su cuenta de GitHub, de cada repositorio de la tabla del final.
2. Leer el spec en [`test-manager-library-3413974-docs`](https://github.com/code-sena/test-manager-library-3413974-docs).
   Se entrega en dos versiones: `spec-python/` y `spec-.net/`.
3. Desarrollar en los forks.

## El reto se desarrolla con React y PHP (Laravel)

El spec está escrito para Python y para .NET, pero el reto **no** se hace en esos lenguajes:

| Capa | Tecnología del reto |
|---|---|
| Frontend | React |
| Backend | PHP con Laravel |

Lo que el spec define sobre el negocio —historias, criterios de aceptación, reglas, contrato de la
API, modelo de datos— se respeta. Lo que define sobre la tecnología se traduce a React y Laravel.

## La prueba no consiste en escribir el código

El propósito principal es ver la **capacidad de desempeño con SDD** (*Spec-Driven Development*,
desarrollo guiado por especificación): cómo se lee, se interpreta y se aplica una especificación
para llevarla a un stack distinto. El código es el medio, no el fin.

## Feria de presentación

Al cerrar la prueba (3:00 p. m.) cada aprendiz **presenta su proyecto** al grupo: qué construyó del spec, qué dejó fuera y por qué,
y una demostración corta de lo que funciona (la aplicación y el sitio público). Lo que se presenta es lo que quedó **subido a los forks
antes de las 3:00 p. m.**: no se presenta nada que no esté en GitHub.

## Los seis repositorios

| Repositorio | Qué va ahí |
|---|---|
| [`test-manager-library-3413974-docs`](https://github.com/code-sena/test-manager-library-3413974-docs) | El spec: `spec-python/` y `spec-.net/` |
| [`test-manager-library-3413974-api`](https://github.com/code-sena/test-manager-library-3413974-api) | Backend en PHP (Laravel) |
| [`test-manager-library-3413974-app`](https://github.com/code-sena/test-manager-library-3413974-app) | Frontend en React |
| [`test-manager-library-3413974-page`](https://github.com/code-sena/test-manager-library-3413974-page) | Sitio público estático de presentación |
| [`test-manager-library-3413974-infra`](https://github.com/code-sena/test-manager-library-3413974-infra) | Contenedores, red, volúmenes y motor de base de datos vacío |
| [`test-manager-library-3413974-tool`](https://github.com/code-sena/test-manager-library-3413974-tool) | Utilidades: sembrador de datos de demostración |

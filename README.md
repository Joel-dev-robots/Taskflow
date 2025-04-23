# Gestión de Tareas Colaborativa

Una aplicación web para la gestión colaborativa de tareas en equipo.

## Descripción

Esta aplicación permite a los usuarios registrarse, crear tareas, asignarlas a otros miembros del equipo, comentar, etiquetar y recibir notificaciones en tiempo real sobre los cambios.

## Tecnologías

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT para autenticación
- Socket.io para notificaciones en tiempo real
- Zod para validación
- Morgan para logging

### Frontend
- React (Next.js)
- TypeScript
- Redux Toolkit
- Tailwind CSS
- Socket.io-client
- React Hook Form
- Cypress para tests E2E

### DevOps
- Docker + Docker Compose
- Kubernetes
- GitHub Actions para CI/CD

## Estructura del Proyecto

```
.
├── src/
│   ├── backend/        # API REST con Express y MongoDB
│   └── frontend/       # Aplicación Next.js 
├── infra/
│   ├── docker-compose.yaml     # Configuración para entorno local
│   └── k8s/                    # Manifiestos de Kubernetes
├── docs/               # Documentación
└── .github/            # Flujos de CI/CD
```

## Instalación y Ejecución

### Método 1: Docker Compose (Recomendado)

1. Clonar el repositorio:
```bash
git clone https://github.com/yourusername/gestion-tareas-colaborativa.git
cd gestion-tareas-colaborativa
```

2. Iniciar con Docker Compose:
```bash
cd infra
docker-compose up -d
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- API: http://localhost:5000

### Método 2: Ejecución Local

1. Clonar el repositorio e instalar dependencias:
```bash
git clone https://github.com/yourusername/gestion-tareas-colaborativa.git
cd gestion-tareas-colaborativa

# Instalar dependencias del backend
cd src/backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

2. Configurar variables de entorno:
```bash
# Copiar los archivos de ejemplo y configurar según sea necesario
cp src/backend/.env.example src/backend/.env
cp src/frontend/.env.example src/frontend/.env
```

3. Iniciar MongoDB (requerido para el backend)

4. Iniciar el backend:
```bash
cd src/backend
npm run dev
```

5. Iniciar el frontend:
```bash
cd src/frontend
npm run dev
```

## Pruebas

### Backend
```bash
cd src/backend
npm test
```

### Frontend
```bash
cd src/frontend
npm run cypress:open  # Modo interactivo
npm run e2e          # Ejecutar todos los tests E2E
```

## Despliegue

Para información detallada sobre el despliegue, consultar [docs/deploy.md](docs/deploy.md).

## API

La API REST proporciona los siguientes endpoints principales:

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario autenticado
- `GET /api/tasks` - Obtener tareas
- `POST /api/tasks` - Crear tarea
- `GET /api/tasks/:id` - Obtener detalles de una tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `GET /api/comments/task/:taskId` - Obtener comentarios de una tarea
- `POST /api/comments/task/:taskId` - Crear comentario
- `PUT /api/comments/:commentId` - Actualizar comentario
- `DELETE /api/comments/:commentId` - Eliminar comentario

## Contribución

1. Crear un fork del repositorio
2. Crear una rama para tu funcionalidad (`git checkout -b feature/amazing-feature`)
3. Hacer commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 
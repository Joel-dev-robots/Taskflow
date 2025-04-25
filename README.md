# TaskFlow - Gestión de Tareas Colaborativa

![TaskFlow](https://via.placeholder.com/800x400.png?text=TaskFlow+Application)

TaskFlow es una aplicación web moderna para la gestión colaborativa de tareas en equipo, diseñada para mejorar la productividad y seguimiento de actividades en entornos de trabajo colaborativos.

## 🌟 Características Principales

- **Autenticación segura** con JWT y roles de usuario (admin/user)
- **Gestión completa de tareas** (crear, editar, eliminar, filtrar)
- **Asignación de tareas** a diferentes miembros del equipo
- **Estados de tareas** (pendiente, en progreso, completada) con seguimiento visual
- **Sistema de filtrado y búsqueda** para localizar tareas rápidamente
- **Panel de administración** para gestión de usuarios
- **Sistema de recuperación de contraseña** vía email
- **Interfaz de usuario moderna y responsive** con Tailwind CSS

## 🚀 Tecnologías

### Backend
- **Node.js** con **Express** para la API RESTful
- **MongoDB** para la base de datos
- **Mongoose** como ODM
- **JWT** para autenticación y autorización
- **Zod** para validación de datos
- **TypeScript** para tipado estático

### Frontend
- **Next.js** y **React** para la interfaz de usuario
- **Redux** para gestión de estado
- **React Hook Form** para manejo de formularios
- **Tailwind CSS** para diseño UI
- **Axios** para peticiones HTTP
- **TypeScript** para tipado estático

## 🏗️ Estructura del Proyecto

```
taskflow/
├── src/
│   ├── backend/                # Servidor API
│   │   ├── src/
│   │   │   ├── controllers/    # Controladores de la API
│   │   │   ├── middlewares/    # Middlewares (auth, validación)
│   │   │   ├── models/         # Modelos de datos para MongoDB
│   │   │   ├── routes/         # Definición de rutas API
│   │   │   ├── utils/          # Funciones de utilidad
│   │   │   └── index.ts        # Punto de entrada del servidor
│   │   └── createAdmin.js      # Script para crear usuario admin
│   │
│   └── frontend/               # Aplicación cliente
│       ├── public/             # Archivos estáticos
│       └── src/
│           ├── components/     # Componentes React
│           ├── pages/          # Páginas de Next.js
│           ├── services/       # Servicios para API
│           ├── store/          # Estado global con Redux
│           └── styles/         # Estilos CSS
│
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Configuración TypeScript
└── README.md                   # Documentación
```

## 🔧 Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

2. **Instalar dependencias**

```bash
# Instalar todas las dependencias
npm run install:all
```

3. **Configurar variables de entorno**

Copiar `.env.example` a `.env` en la carpeta backend:

```bash
cd src/backend
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

4. **Crear usuario administrador**

```bash
cd src/backend
node createAdmin.js
```

5. **Iniciar la aplicación**

```bash
# En la raíz del proyecto
npm start
```

## 💻 Ejemplos de Código

### Autenticación con JWT

```typescript
// src/backend/src/middlewares/auth.ts
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
```

### Formulario de Tareas con Validación

```typescript
// src/frontend/src/components/TaskForm.tsx (fragmento)
<form onSubmit={handleSubmit(onSubmit)}>
  <div>
    <label htmlFor="title" className="form-label">
      Título <span className="text-red-500">*</span>
    </label>
    <input
      id="title"
      type="text"
      className="form-input"
      placeholder="Título de la actividad"
      {...register('title', {
        required: 'El título es obligatorio',
        minLength: {
          value: 2,
          message: 'El título debe tener al menos 2 caracteres',
        },
      })}
    />
    {errors.title && <p className="form-error">{errors.title.message}</p>}
  </div>
  
  {/* Más campos del formulario */}
  
  <button type="submit" className="btn btn-primary">
    {isEditMode ? 'Actualizar' : 'Crear'}
  </button>
</form>
```

### API de Tareas con Filtrado

```typescript
// src/backend/src/controllers/taskController.ts (fragmento)
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // Basic filters
    const { status, assignedTo, search } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    // Filter by status if provided
    if (status && ['pending', 'in-progress', 'completed'].includes(status as string)) {
      filter.status = status;
    }
    
    // Filter by assignedTo if provided
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    // Implement search if term exists
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get tasks with populated fields
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks' });
  }
};
```

## 🔐 Panel de Administración

TaskFlow incluye un panel de administración que permite:

- Ver y gestionar todos los usuarios del sistema
- Cambiar roles de usuario (admin/user)
- Restablecer contraseñas de usuarios
- Enviar correos de recuperación de contraseña

![Admin Panel](https://via.placeholder.com/800x400.png?text=Admin+Panel)

## 🔄 Flujo de Trabajo

1. **Registro e Inicio de Sesión**
   - Los usuarios pueden registrarse y acceder a la plataforma
   - Soporte para recuperación de contraseña

2. **Gestión de Tareas**
   - Creación de nuevas tareas con título, descripción, etiquetas
   - Asignación a miembros del equipo
   - Actualización de estado (pendiente, en progreso, completada)

3. **Colaboración**
   - Visualización de todas las tareas del equipo
   - Filtrado y búsqueda de tareas específicas
   - Actualización de estado y seguimiento

## 📝 Desarrollo Futuro

- Implementación de notificaciones en tiempo real con Socket.io
- Integración con servicios de calendario
- Funcionalidades de comentarios en tareas
- Estadísticas y reportes de productividad

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para sugerencias o mejoras.

---

Desarrollado con ❤️ por el equipo de TaskFlow

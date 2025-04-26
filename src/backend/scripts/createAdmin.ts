import mongoose from 'mongoose';
import User from '../src/models/User';
import dotenv from 'dotenv';

dotenv.config();

// Usar la URI de MongoDB de las variables de entorno o la ruta por defecto
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';

// Datos del administrador
const adminData = {
  name: 'God',
  email: 'god@taskflow.com',
  password: 'God',  // En un entorno real, usar una contraseña más segura
  role: 'admin'
};

// Función para crear administrador
const createAdmin = async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Conexión exitosa a MongoDB');
    
    // Verificar si ya existe
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('El administrador ya existe');
      console.log('Email:', existingAdmin.email);
      console.log('Rol:', existingAdmin.role);
    } else {
      // Crear nuevo administrador
      const admin = new User(adminData);
      await admin.save();
      console.log('Administrador creado con éxito');
      console.log('Nombre:', admin.name);
      console.log('Email:', admin.email);
      console.log('Rol:', admin.role);
      console.log('\nPuedes iniciar sesión con:');
      console.log('Email: god@taskflow.com');
      console.log('Contraseña: God');
    }
    
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Ejecutar la función
createAdmin(); 
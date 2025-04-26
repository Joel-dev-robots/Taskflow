const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Configuración de MongoDB
const url = 'mongodb://localhost:27017';
const dbName = 'taskflow';

// Datos del administrador con contraseña que cumple la validación (min 6 caracteres)
const adminData = {
  name: 'God',
  email: 'god@taskflow.com',
  password: 'GodAdmin123',  // Ahora tiene 11 caracteres
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
};

async function createAdmin() {
  try {
    console.log('Conectando a MongoDB...');
    const client = new MongoClient(url);
    await client.connect();
    console.log('Conexión exitosa a MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Verificar si ya existe un usuario con este email
    const existingUser = await collection.findOne({ email: adminData.email });

    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    if (existingUser) {
      console.log('El administrador ya existe, actualizando contraseña...');
      
      // Actualizar el usuario existente
      const result = await collection.updateOne(
        { email: adminData.email },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('Administrador actualizado con éxito');
      console.log('Email:', adminData.email);
      console.log('Rol: admin');
    } else {
      // Actualizar datos con contraseña hasheada
      const userData = {
        ...adminData,
        password: hashedPassword
      };

      // Insertar el usuario en la base de datos
      const result = await collection.insertOne(userData);
      
      console.log('Administrador creado con éxito');
      console.log('ID:', result.insertedId);
      console.log('Nombre:', userData.name);
      console.log('Email:', userData.email);
      console.log('Rol:', userData.role);
    }
    
    console.log('\nPuedes iniciar sesión con:');
    console.log('Email: god@taskflow.com');
    console.log('Contraseña: GodAdmin123');

    await client.close();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la función
createAdmin(); 
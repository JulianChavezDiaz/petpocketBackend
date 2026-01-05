const servicioCtl = {};
const orm = require('../../Database/dataBase.orm.js');
const sql = require('../../Database/dataBase.sql.js');
const mongo = require('../../Database/dataBaseMongose');
const { descifrarDatos, cifrarDatos } = require('../../../application/controller/encrypDates.js');

/**
 * FUNCIÓN DE APOYO: Descifra datos de forma segura para evitar errores en el mapeo
 */
const descifrarSeguro = (dato) => {
    try {
        return dato ? descifrarDatos(dato) : '';
    } catch (error) {
        console.error('Error al descifrar dato:', error);
        return 'Error al leer dato';
    }
};

/**
 * MOSTRAR SERVICIOS (GET)
 * Esta función es la que consume el Dashboard de Angular.
 * Une datos de MySQL (precios/nombres) con MongoDB (imágenes/detalles).
 */
servicioCtl.mostrarServicios = async (req, res) => {
    try {
        // 1. Consulta a SQL: Traemos solo servicios activos
        const [listaServicios] = await sql.promise().query(`
            SELECT * FROM servicios 
            WHERE estadoServicio = 'activo'
            ORDER BY createServicio DESC
        `);

        // 2. Enriquecimiento de datos con MongoDB y Descifrado
        const serviciosCompletos = await Promise.all(
            listaServicios.map(async (servicio) => {
                // Buscamos detalles extendidos en Mongo (como la imagenUrl)
                const servicioMongo = await mongo.servicioModel.findOne({ 
                    idServicioSql: servicio.idServicio.toString()
                });

                // RETORNAMOS EL OBJETO MAPEADO PARA EL FRONTEND
                return {
                    id: servicio.idServicio, 
                    nombre: descifrarSeguro(servicio.nombreServicio),
                    precio: servicio.precioServicio,
                    desc: descifrarSeguro(servicio.descripcionServicio),
                    // Si no hay imagen en Mongo, usamos una por defecto
                    imagen: servicioMongo?.imagenUrl || '/assets/img/default.jpg',
                    // Campos adicionales para el diseño del Dashboard
                    icon: '🩺', 
                    color: 'border-blue-400',
                    // Guardamos el resto para uso futuro en el modal de detalles
                    detallesMongo: servicioMongo
                };
            })
        );

        return res.json(serviciosCompletos);
    } catch (error) {
        console.error('Error al mostrar servicios:', error);
        return res.status(500).json({ 
            message: 'Error al obtener los servicios para el dashboard', 
            error: error.message 
        });
    }
};

/**
 * CREAR SERVICIO (POST)
 */
servicioCtl.crearServicio = async (req, res) => {
    try {
        const { 
            nombreServicio, descripcionServicio, precioServicio,
            descripcionExtendida, requisitos, duracionMinutos, equipoNecesario,
            instruccionesPrevias, instruccionesPosteriores, etiquetas, destacado, imagenUrl
        } = req.body;

        if (!nombreServicio || !descripcionServicio || precioServicio === undefined) {
            return res.status(400).json({ message: 'Nombre, descripción y precio son obligatorios' });
        }

        // Guardamos en SQL cifrando los datos sensibles
        const nuevoServicio = await orm.servicio.create({
            nombreServicio: cifrarDatos(nombreServicio),
            descripcionServicio: cifrarDatos(descripcionServicio),
            precioServicio: precioServicio,
            estadoServicio: 'activo',
            createServicio: new Date().toLocaleString(),
        });

        // Guardamos los detalles en MongoDB
        await mongo.servicioModel.create({
            idServicioSql: nuevoServicio.idServicio.toString(),
            descripcionExtendida: descripcionExtendida || '',
            requisitos: requisitos || [],
            duracionMinutos: duracionMinutos || 60,
            equipoNecesario: equipoNecesario || [],
            instruccionesPrevias: instruccionesPrevias || '',
            instruccionesPosteriores: instruccionesPosteriores || '',
            etiquetas: etiquetas || [],
            destacado: destacado || false,
            imagenUrl: imagenUrl || ''
        });

        return res.status(201).json({ 
            message: 'Servicio creado exitosamente',
            idServicio: nuevoServicio.idServicio
        });

    } catch (error) {
        console.error('Error al crear servicio:', error);
        return res.status(500).json({ message: 'Error al crear el servicio', error: error.message });
    }
};

/**
 * ACTUALIZAR SERVICIO (PUT)
 */
servicioCtl.actualizarServicio = async (req, res) => {
    try {
        const { idServicio } = req.params;
        const data = req.body;

        await orm.servicio.update({
            nombreServicio: cifrarDatos(data.nombreServicio),
            descripcionServicio: cifrarDatos(data.descripcionServicio),
            precioServicio: data.precioServicio,
        }, { where: { idServicio } });

        await mongo.servicioModel.updateOne(
            { idServicioSql: idServicio },
            { 
                descripcionExtendida: data.descripcionExtendida,
                imagenUrl: data.imagenUrl,
                destacado: data.destacado
                // ... puedes agregar los demás campos aquí
            }
        );

        return res.json({ message: 'Servicio actualizado exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

/**
 * ELIMINAR SERVICIO (DELETE - Lógico)
 */
servicioCtl.eliminarServicio = async (req, res) => {
    try {
        const { idServicio } = req.params;

        await orm.servicio.update({
            estadoServicio: 'inactivo',
            updateServicio: new Date().toLocaleString(),
        }, { where: { idServicio } });

        return res.json({ message: 'Servicio desactivado' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
};

module.exports = servicioCtl;
const express = require('express');
const router = express.Router();
const pool = require('../../Database/dataBase.sql');
const { decrypt } = require('../../../application/controller/encrypDates');

// La ruta GET
router.get('/lista', async (req, res) => {
    try {
        const rows = await pool.query('SELECT * FROM servicios WHERE estadoServicio = "activo"');
        
        const serviciosProcesados = rows.map(s => {
            const nombreReal = decrypt(s.nombreServicio);
            return {
                id: s.idServicio,
                nombre: nombreReal,
                precio: s.precioServicio,
                desc: decrypt(s.descripcionServicio),
                ...asignarIconoYColor(nombreReal)
            };
        });

        res.json(serviciosProcesados);
    } catch (error) {
        console.error('Error en router:', error.message);
        res.status(500).json({ success: false });
    }
});

// Función auxiliar
function asignarIconoYColor(nombre) {
    const mapa = {
        'Consulta General': { icon: "🩺", color: "border-blue-400", imagen: "/assets/img/medicina-general.jpg" },
        'Vacunación': { icon: "💉", color: "border-orange-400", imagen: "/assets/img/vacunacion.jpg" },
        'Desparasitación': { icon: "🦠", color: "border-green-400", imagen: "/assets/img/diagnostico.png" },
        'Baño y Peluquería': { icon: "✂️", color: "border-pink-400", imagen: "/assets/img/peluqueria.jpg" },
        'Cirugía Menor': { icon: "🐾", color: "border-purple-400", imagen: "/assets/img/cirugia.jpg" }
    };
    return mapa[nombre] || { icon: "🐾", color: "border-gray-400", imagen: "/assets/img/logo-circular.png" };
}

// ¡ESTA LÍNEA ES LA MÁS IMPORTANTE!
module.exports = router;
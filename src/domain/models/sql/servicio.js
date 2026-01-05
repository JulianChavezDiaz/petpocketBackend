module.exports = (sequelize, Sequelize) => {
    const Servicio = sequelize.define("servicio", {
        nombre: { type: Sequelize.STRING },
        icon: { type: Sequelize.STRING },
        imagen: { type: Sequelize.STRING },
        precio: { type: Sequelize.DECIMAL(10, 2) },
        desc: { type: Sequelize.TEXT },
        color: { type: Sequelize.STRING }
    });
    return Servicio;
};
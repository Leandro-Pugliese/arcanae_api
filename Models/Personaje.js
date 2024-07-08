const mongoose = require("mongoose");

const personajeSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    nivel: {
        type: Number,
        required: true
    },
    experiencia: {
        type: Number,
        required: true
    },
    oro: {
        type: Number,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    genero: {
        type: String,
        required: true
    },
    raza: {
        type: String,
        required: true
    },
    clase: {
        type: String,
        required: true
    },
    atributos: {
        type: {},
        required: true
    },
    skills: {
        type: {},
        required: true
    },
    avatar: {
        type: Number,
        required: true
    },
    inventario: {
        type: [],
        required: true
    },
    ropa: {
        type: String,
        required: true
    },
    arma: {
        type: String,
        required: true
    },
    escudo: {
        type: String,
        required: true
    },
    casco: {
        type: String,
        required: true
    },
    joya: {
        type: String,
        required: true
    },
    refugio: {
        type: Number,
        required: true
    },
    mensajes: {
        type: [],
        required: true
    },
    status: {
        type: String,
        required: true
    },
    usuariosDerrotados: {
        type: Number,
        required: true
    },
    ciudadanosDerrotados: {
        type: Number,
        required: true
    },
    criminalesDerrotados: {
        type: Number,
        required: true
    },
    armada: {
        type: Boolean,
        required: true
    },
    legion: {
        type: Boolean,
        required: true
    },
    peleas: {
        type: {},
        required: true
    },
    duelos: {
        type: {},
        required: true
    },
    torneos: {
        type: {},
        required: true
    },
    misiones: {
        type: {},
        required: true
    },
    criaturasEliminadas: {
        type: Number,
        required:true
    }
}, {versionKey: false})

const Personaje = mongoose.model("Personaje", personajeSchema);

module.exports = Personaje
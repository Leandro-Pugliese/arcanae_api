const mongoose = require("mongoose");

const cuentaSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    premium: {
        type: Boolean,
        required: true
    },
    arcanaePoints: {
        type: Number,
        required: true
    },
    pjs: {
        type: [],
        required: true
    },
    password: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    }
}, {versionKey: false})

const Cuenta = mongoose.model("Cuenta", cuentaSchema);

module.exports = Cuenta
const express = require("express");
const { isAuthenticated, createCuenta } = require("../Controllers/cuentaController");
const { createPersonaje } = require("../Controllers/personajeController");

const router = express.Router();

// Rutas cuenta
router.post("/crear-cuenta", createCuenta);

// Rutas personaje
router.post("/crear-pj", isAuthenticated, createPersonaje);



module.exports = router 
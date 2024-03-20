const express = require("express");
const { isAuthenticated, createCuenta, loginCuenta } = require("../Controllers/cuentaController");
const { createPersonaje, dataPersonaje, comercioPersonaje, equiparItem, eliminarPersonaje } = require("../Controllers/personajeController");

const router = express.Router();

// Rutas cuenta
router.post("/crear-cuenta", createCuenta);
router.post("/login-cuenta", loginCuenta);

// Rutas personaje
router.post("/crear-pj", isAuthenticated, createPersonaje);
router.post("/data-pj", isAuthenticated, dataPersonaje);
router.post("/comercio-pj", isAuthenticated, comercioPersonaje);
router.post("/equipar-item", isAuthenticated, equiparItem);
router.post("/borrar-pj", isAuthenticated, eliminarPersonaje);



module.exports = router 
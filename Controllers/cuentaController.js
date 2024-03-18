const express = require("express");
const Cuentas = require("../Models/Cuenta");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config()

// Funcion para firmar el token
const signToken = (_id, email) => jwt.sign({_id, email}, process.env.JWT_CODE);

// Middleware para rutas con autenticación.
const validateJwt = jwt.verify(signToken(), process.env.JWT_CODE);
const findAndAssingUser = async (req, res, next) => {
    try {
        const user = await Cuentas.findById(req.user._id);
        if (!user) {
            return res.status(401).end();
        }
        req.user = user
        next()
    } catch (error) {
        next(error);
    }
}
const isAuthenticated = express.Router().use(validateJwt, findAndAssingUser);


// Controllers Cuentas
const createCuenta = async (req, res) => {
    const { body } = req
    try {
        const isCuenta = await Cuentas.findOne({email: body.email});
        if (isCuenta ) {
            return res.status(403).send("El email ingresado pertenece a una cuenta ya registrada.");
        }

        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(body.password, salt);
        const hashedPin = await bcrypt.hash(body.pin, salt); //El pin tiene que ser si o si string para poder usar el salt.

        const cuenta = await Cuentas.create({
            email: body.email,
            premium: false,
            pjs: ["-"],
            password: hashedPass,
            pin: hashedPin,
            salt
        })

        const token = signToken(cuenta._id, cuenta.email);
        const mensaje = "Cuenta creada exitosamente.";
        res.status(201).send({token, cuenta, mensaje});

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
}


module.exports = { isAuthenticated, createCuenta }


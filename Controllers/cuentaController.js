const express = require("express");
const Cuentas = require("../Models/Cuenta");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config()

// Función para firmar el token
const signToken = (_id, email) => jwt.sign({_id, email}, process.env.JWT_CODE);

// Controllers Cuentas
const createCuenta = async (req, res) => {
    const { body } = req
    try {
        const isCuenta = await Cuentas.findOne({email: body.email});
        if (isCuenta) {
            return res.status(403).send("El email ingresado pertenece a una cuenta ya registrada.");
        }
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(body.password, salt);
        const hashedPin = await bcrypt.hash(body.pin, salt); //El pin tiene que ser si o si string para poder usar el salt.
        const cuenta = await Cuentas.create({
            email: body.email,
            premium: false,
            arcanaePoints: 0,
            pjs: [],
            password: hashedPass,
            pin: hashedPin,
            salt
        })
        const token = signToken(cuenta._id, cuenta.email);
        const mensaje = "Cuenta creada exitosamente.";
        return res.status(201).send({token, cuenta, mensaje});
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const loginCuenta = async (req, res) => {
    const {body} = req
    try {
        const cuenta = await Cuentas.findOne({email: body.email});
        if (!cuenta) {
            return res.status(403).send("Email y/o contraseña incorrectos.");
        } else {
            const isMatch = await bcrypt.compare(body.password, cuenta.password);
            if (isMatch) {
                const token = signToken(cuenta._id, cuenta.email);
                return res.status(200).send({token, cuenta})
            } else {
                return res.status(403).send("Email y/o contraseña incorrectos.");
            }
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }
}



module.exports = { createCuenta, loginCuenta }


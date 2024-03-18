const express = require("express");
const Cuentas = require("../Models/Cuenta");
const Personajes = require("../Models/Personaje");
const jwt = require("jsonwebtoken");

const createPersonaje = async (req, res) => {
    const { body } = req
    try {
        const { email } = jwt.decode(body.token, {complete: true}).payload
        const isCuenta = await Cuentas.findOne({email: email});
        if (isCuenta.pjs.length === 3 && isCuenta.premium === false) {
            return res.status(403).send("Ya alcansaste el máximo de personajes que puedes tener en tu cuenta, si deseas tener hasta 10 personajes deberas ser premium.");
        }
        if (isCuenta.pjs.length === 6) {
            return res.status(403).send("Ya alcansaste el máximo de personajes que puedes tener en tu cuenta.");
        }
        const isPersonaje = await Personajes.findOne({nombre: body.nombre});
        if (isPersonaje) {
            return res.status(403).send("El nombre ingresado ya se encuentra en uso.");
        }
        const personaje = await Personajes.create({
            nombre: body.nombre,
            nivel: 1,
            experiencia: 0,
            owner: body.owner,
            genero: body.genero,
            raza: body.raza,
            clase: body.clase,
            atributos: body.atributos,
            skills: {
                        obtenidos: 2,
                        disponibles: 2
                    },
            avatar: 0,
            inventario: ["-"],
            ropa: "-",
            arma: "-",
            escudo: "-",
            casco: "-",
            refugio: 0,
            status: "Ciudadano",
            usuariosDerrotados: 0,
            ciudadanosDerrotados: 0,
            criminalesDerrotados: 0,
            armada: false,
            legion: false,
            peleas: {
                        disputadas: 0,
                        ganadas: 0
                    },
            duelos: {
                        disputadas: 0,
                        ganadas: 0
                    },
            torneos:{
                        disputados: 0,
                        ganados: 0
                    },
            misiones:{
                        activa: false,
                        aceptadas: 0,
                        superadas: 0
                    },  
            criaturasEliminadas: 0     
        })

        //Update Pjs Cuenta
        const updatePjsCuenta = await Cuentas.updateOne({email: email},
            {
                $set: {
                    pjs: body.pjs
                }
            })

        const mensaje = "Personaje creado exitosamente.";
        res.status(201).send({ personaje, mensaje });

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
}

module.exports = { createPersonaje }
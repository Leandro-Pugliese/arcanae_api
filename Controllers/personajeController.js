const express = require("express");
const Cuentas = require("../Models/Cuenta");
const Personajes = require("../Models/Personaje");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const createPersonaje = async (req, res) => {
    const { body } = req
    try {
        const { email } = jwt.decode(body.token, {complete: true}).payload
        const { _id } = jwt.decode(body.token, {complete: true}).payload
        const isCuenta = await Cuentas.findOne({email: email});
        if (isCuenta.pjs.length === 3 && isCuenta.premium === false) {
            return res.status(403).send("Ya alcansaste el máximo de personajes que puedes tener en tu cuenta, si deseas tener hasta 6 personajes deberas ser premium.");
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
            oro: 50,
            owner: _id,
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
            joya: "-",
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

        // Update Pjs Cuenta
        await Cuentas.updateOne({email: email},
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

const dataPersonaje = async (req, res) => {
    const {body} = req;
    try {
        const { email } = jwt.decode(body.token, {complete: true}).payload;
        const isCuenta = await Cuentas.findOne({email: email});
        if (!isCuenta) {
           return res.status(403).send("Credenciales inválidas.");  
        }
        const pj = await Personajes.findOne({nombre: body.nombre});
        if (!pj) {
            return res.status(403).send("Personaje no encontrado.");
        } else {
            return res.status(201).send(pj);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
}

const comercioPersonaje = async (req, res) => {
    const {body} = req
    try {
        const pj = await Personajes.findOne({_id: body._id});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        } else {
            const { email } = jwt.decode(body.token, {complete: true}).payload;
            const cuenta = await Cuentas.findOne({email: email});
            if (!cuenta) {
                return res.status(403).send("Credenciales inválidas.");
            } else {
                if (cuenta.pjs.includes(pj.nombre) === true) {
                    await Personajes.updateOne({_id: body._id},
                        {
                            $set: {
                                oro: body.oro,
                                inventario: body.inventario
                            }
                        })
                    res.status(201).send("Transacción realizada.")
                } else {
                    return res.status(403).send("El Personaje no pertenece a la cuenta a la que ingresaste.");
                }
            }
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
}

const equiparItem = async (req, res) => {
    const {body} = req
    try {
        const pj = await Personajes.findOne({_id: body._id});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        } else {
            const { email } = jwt.decode(body.token, {complete: true}).payload;
            const cuenta = await Cuentas.findOne({email: email});
            if (!cuenta) {
                return res.status(403).send("Credenciales inválidas.");
            } else {
                let nombreItemsInventario = ["-"]
                pj.inventario.map(element => (
                    nombreItemsInventario.push(element.nombre)
                ))
                if (cuenta.pjs.includes(pj.nombre) === true) {
                    if (body.item.tipo === "Ropa" && nombreItemsInventario.includes(body.item.nombre)) {
                        await Personajes.updateOne({_id: body._id},
                            {
                                $set: {
                                    ropa: body.item.nombre
                                }
                            })
                        res.status(200).send("Equipo modificado.")
                    } else if (body.item.tipo === "Arma" && nombreItemsInventario.includes(body.item.nombre)) {
                        await Personajes.updateOne({_id: body._id},
                            {
                                $set: {
                                    arma: body.item.nombre
                                }
                            })
                        res.status(200).send("Equipo modificado.")
                    } else if (body.item.tipo === "Escudo" && nombreItemsInventario.includes(body.item.nombre)) {
                        await Personajes.updateOne({_id: body._id},
                            {
                                $set: {
                                    escudo: body.item.nombre
                                }
                            })
                        res.status(200).send("Equipo modificado.")
                    } else if (body.item.tipo === "Casco" && nombreItemsInventario.includes(body.item.nombre)) {
                        await Personajes.updateOne({_id: body._id},
                            {
                                $set: {
                                    casco: body.item.nombre
                                }
                            })
                        res.status(200).send("Equipo modificado.")
                    }  else if (body.item.tipo === "Joya" && nombreItemsInventario.includes(body.item.nombre)) {
                        await Personajes.updateOne({_id: body._id},
                            {
                                $set: {
                                    joya: body.item.nombre
                                }
                            })
                        res.status(200).send("Equipo modificado.")
                    } else {
                        res.status(200).send("No es posible equipar el item.")
                    }
                } else {
                    return res.status(403).send("El Personaje no pertenece a la cuenta a la que ingresaste.");
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
}

const eliminarPersonaje = async (req, res) => {
    const {body} = req
    try {
        const pj = await Personajes.findOne({_id: body._id});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        } else {
            const { email } = jwt.decode(body.token, {complete: true}).payload;
            const cuenta = await Cuentas.findOne({email: email});
            if (!cuenta) {
                return res.status(403).send("Credenciales inválidas.");
            } else {
                if (cuenta.pjs.includes(pj.nombre) === true ) {
                    const pinMatch = await bcrypt.compare(body.pin, cuenta.pin);
                    if (pinMatch) {
                        await Personajes.deleteOne({_id: pj._id})
                        await Cuentas.updateOne({email: email},
                            {
                                $set: {
                                    pjs: body.pjs
                                }
                            })
                        res.status(200).send("Personaje borrado.")
                    } else {
                        res.status(403).send("Pin inválido.");
                    }
                } else {
                    return res.status(403).send("El Personaje que quieres borrar no pertenece a la cuenta a la que ingresaste.");
                }
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
}

module.exports = { createPersonaje, dataPersonaje, comercioPersonaje, equiparItem, eliminarPersonaje }
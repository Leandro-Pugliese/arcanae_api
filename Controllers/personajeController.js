const express = require("express");
const Cuentas = require("../Models/Cuenta");
const Personajes = require("../Models/Personaje");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { atributos, criaturas, items, misiones } = require("../Objetos/objetos");

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
        // Asignación de atributos para el pj.
        let atributosPersonaje = {}
        const atributosFiltrados = atributos.filter((elemento) => elemento.raza === body.raza);
        atributosPersonaje = atributosFiltrados[0]
        
        const personaje = await Personajes.create({
            nombre: body.nombre,
            nivel: 1,
            experiencia: 0,
            oro: 50,
            owner: _id,
            genero: body.genero,
            raza: body.raza,
            clase: body.clase,
            atributos: atributosPersonaje,
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
                        aceptadas: 0,
                        superadas: 0,
                        activa: false,
                        quest:  {
                                    nombre: "-",
                                    tipo: "-",
                                    criatura: [],
                                    objetivo: [],
                                    obtenido: []
                                }
                    },  
            criaturasEliminadas: 0     
        })

        // Update Pjs Cuenta
        let listaPersonajes = isCuenta.pjs.filter((elemento) => elemento !== "-")
        listaPersonajes.push(body.nombre)
        await Cuentas.updateOne({email: email},
            {
                $set: {
                    pjs: listaPersonajes
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
                const item = items.filter((item) => item.nombre === body.itemNombre);
                let inventarioPj = pj.inventario;
                const isItem = inventarioPj.filter((element) => element.nombre === body.itemNombre);
                if (cuenta.pjs.includes(pj.nombre) === true) {
                    if (body.operacion === "COMPRA") {
                        //------------------------------------------------------------------------------------------------------------------------------------------------------
                        // Mecánica de descuentos por skills en comercio.
                        const precioItem = item[0].precioCompra;
                        // Calcular la cantidad de descuentos a aplicar cada 5 puntos de comercio.
                        const descuentos = Math.floor(pj.atributos.comercio / 5);
                        // Calcular el porcentaje de descuento (es lo mismo que arriba pero si quiero modificar el porcentaje cada 5pts solo modifico el número aca abajo).
                        const porcentajeDescuento = descuentos * 1;
                        // Calcular el descuento total
                        const descuentoTotal = porcentajeDescuento / 100 * precioItem
                        // Calcular el valor final con descuento
                        const valorFinalItem = Math.floor(precioItem - descuentoTotal);
                        //------------------------------------------------------------------------------------------------------------------------------------------------------
                        // Calculo el valor de la transacción.
                        const valorTransaccion = valorFinalItem * body.itemCantidad
                        if (valorTransaccion <= pj.oro) {
                            if (isItem.length === 0) {
                                let objInventarioCreado =    {   
                                                                nombre: item[0].nombre, 
                                                                cantidad: body.itemCantidad
                                                            }
                                inventarioPj.push(objInventarioCreado)
                                await Personajes.updateOne({_id: body._id},
                                    {
                                        $set: {
                                            oro: pj.oro - valorTransaccion,
                                            inventario: inventarioPj
                                        }
                                    })
                                res.status(201).send("Transacción realizada.")
                            } else {
                                const itemInventario = inventarioPj.filter((item) => item.nombre === body.itemNombre);
                                let objInventarioModificado =    {
                                                                nombre: itemInventario[0].nombre,
                                                                cantidad: itemInventario[0].cantidad + body.itemCantidad
                                                            }
                                let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);  
                                inventarioFiltrado.push(objInventarioModificado)
                                await Personajes.updateOne({_id: body._id},
                                    {
                                        $set: {
                                            oro: pj.oro - valorTransaccion,
                                            inventario: inventarioFiltrado
                                        }
                                    })
                                res.status(201).send("Transacción realizada.")                         
                            }
                        } else {
                            res.status(201).send("Transacción rechazada, no tienes suficiente oro.")
                        }
                    } else if (body.operacion === "VENTA") {
                        const itemsEquipados = [ pj.ropa, pj.arma, pj.escudo, pj.casco, pj.joya ]
                        if (!isItem) {
                            res.status(403).send("Transacción rechazada, no tienes el item en tu inventario.")
                        } else {
                            if (isItem[0].cantidad > 1) {
                                const valorTransaccion = item[0].precioVenta * body.itemCantidad
                                if ((isItem[0].cantidad - body.itemCantidad) === 0) {
                                    if (itemsEquipados.includes(body.itemNombre) === false) {
                                        let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);
                                        await Personajes.updateOne({_id: body._id},
                                            {
                                                $set: {
                                                    oro: pj.oro + valorTransaccion,
                                                    inventario: inventarioFiltrado
                                                }
                                            })
                                        res.status(201).send("Transacción realizada.");
                                    } else {
                                        res.status(403).send("Transacción rechazada, el item que quieres vender esta equipado. Vende menos items o desequipa el item.");
                                    }
                                } else {
                                    const itemInventario = inventarioPj.filter((item) => item.nombre === body.itemNombre);
                                    let objInventarioModificado =    {
                                        nombre: itemInventario[0].nombre,
                                        cantidad: itemInventario[0].cantidad - body.itemCantidad
                                    }
                                    let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);
                                    inventarioFiltrado.push(objInventarioModificado)
                                    await Personajes.updateOne({_id: body._id},
                                        {
                                            $set: {
                                                oro: pj.oro + valorTransaccion,
                                                inventario: inventarioFiltrado
                                            }
                                        })
                                    res.status(201).send("Transacción realizada.") 
                                }
                            } else if (isItem[0].cantidad === 1) {
                                if (itemsEquipados.includes(body.itemNombre) === false) {
                                    let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);
                                        await Personajes.updateOne({_id: body._id},
                                            {
                                                $set: {
                                                    oro: pj.oro + item[0].precioVenta,
                                                    inventario: inventarioFiltrado
                                                }
                                            })
                                        res.status(201).send("Transacción realizada.")
                                } else {
                                    res.status(403).send("Transacción rechazada, el item que quieres vender esta equipado.");
                                }
                            } else {
                                res.status(403).send("Transacción rechazada, hubo un error con las cantidades del item.")
                            }
                        }
                    } else {
                        res.status(403).send("Transacción rechazada.")
                    }
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
                const item = items.filter((item) => item.nombre === body.itemNombre);
                let nombreItemsInventario = ["-"]
                pj.inventario.map(element => (
                    nombreItemsInventario.push(element.nombre)
                ))
                if (cuenta.pjs.includes(pj.nombre) === true) {
                    if(item.length > 0) {
                        if (item[0].clasePermitida.includes(pj.clase)) {
                            if (body.itemTipo === "Ropa" && nombreItemsInventario.includes(body.itemNombre)) {
                                await Personajes.updateOne({_id: body._id},
                                    {
                                        $set: {
                                            ropa: body.itemNombre
                                        }
                                    })
                                res.status(200).send("Equipo modificado.")
                            } else if (body.itemTipo === "Arma" && nombreItemsInventario.includes(body.itemNombre)) {
                                await Personajes.updateOne({_id: body._id},
                                    {
                                        $set: {
                                            arma: body.itemNombre
                                        }
                                    })
                                res.status(200).send("Equipo modificado.")
                            } else if (body.itemTipo === "Escudo" && nombreItemsInventario.includes(body.itemNombre)) {
                                await Personajes.updateOne({_id: body._id},
                                    {
                                        $set: {
                                            escudo: body.itemNombre
                                        }
                                    })
                                res.status(200).send("Equipo modificado.")
                            } else if (body.itemTipo === "Casco" && nombreItemsInventario.includes(body.itemNombre)) {
                                await Personajes.updateOne({_id: body._id},
                                    {
                                        $set: {
                                            casco: body.itemNombre
                                        }
                                    })
                                res.status(200).send("Equipo modificado.")
                            }  else if (body.itemTipo === "Joya" && nombreItemsInventario.includes(body.itemNombre)) {
                                await Personajes.updateOne({_id: body._id},
                                    {
                                        $set: {
                                            joya: body.itemNombre
                                        }
                                    })
                                res.status(200).send("Equipo modificado.")
                            } else {
                                res.status(403).send("No es posible equipar el item.")
                            }
                        } else {
                            res.status(403).send("Tu clase no puede usar este objeto.")
                        }
                    } else {
                        if (body.itemTipo === "Ropa" && nombreItemsInventario.includes(body.itemNombre)) {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        ropa: body.itemNombre
                                    }
                                })
                            res.status(200).send("Equipo modificado.")
                        } else if (body.itemTipo === "Arma" && nombreItemsInventario.includes(body.itemNombre)) {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        arma: body.itemNombre
                                    }
                                })
                            res.status(200).send("Equipo modificado.")
                        } else if (body.itemTipo === "Escudo" && nombreItemsInventario.includes(body.itemNombre)) {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        escudo: body.itemNombre
                                    }
                                })
                            res.status(200).send("Equipo modificado.")
                        } else if (body.itemTipo === "Casco" && nombreItemsInventario.includes(body.itemNombre)) {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        casco: body.itemNombre
                                    }
                                })
                            res.status(200).send("Equipo modificado.")
                        }  else if (body.itemTipo === "Joya" && nombreItemsInventario.includes(body.itemNombre)) {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        joya: body.itemNombre
                                    }
                                })
                            res.status(200).send("Equipo modificado.")
                        } else {
                            res.status(403).send("No es posible equipar el item.")
                        }
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

const ganarExperienciaCriaturas = async (req, res) => {
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
                    if (pj.nivel < 50) {
                        // Cálculo experiencia requerida para pasar al próximo nivel.
                        let iteraciones = pj.nivel;
                        let experienciaRequerida = 250;
                        // Bucle para aumentar el valor en un 20% en cada iteración.
                        for (let i = 1; i < iteraciones; i++) {
                            experienciaRequerida *= 1.20; // Multiplicamos por 1.20 para aumentar en un 20%.
                        }

                        let experienciaObtenida = body.experiencia
                        let experienciaPersonaje = pj.experiencia
                        let experienciaTotal = experienciaPersonaje + experienciaObtenida
                        
                        if (experienciaTotal <= experienciaRequerida) {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        experiencia: experienciaTotal
                                    }
                                })
                            res.status(200).send({experienciaPersonaje, experienciaObtenida, experienciaTotal, experienciaRequerida})
                        } else if (experienciaTotal > experienciaRequerida) {
                            let experienciaNueva = experienciaTotal - experienciaRequerida
                            let nuevoNivelPj = pj.nivel + 1
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        nivel: nuevoNivelPj,
                                        experiencia: experienciaNueva,
                                        atributos: {
                                            vida: pj.atributos.vida + 2,
                                            fuerza: pj.atributos.fuerza + 2,
                                            resistencia: pj.atributos.resistencia + 2,
                                            destreza: pj.atributos.destreza + 2,
                                            inteligencia: pj.atributos.inteligencia + 2,
                                            liderazgo: pj.atributos.liderazgo + 2,
                                            combate: pj.atributos.combate + 2,
                                            defensa: pj.atributos.defensa + 2,
                                            navegacion: pj.atributos.navegacion + 2,
                                            comercio: pj.atributos.comercio + 2
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos + 2,
                                            disponibles: pj.skills.disponibles + 2 
                                        }
                                    }
                                })
                            const msj = "¡Felicitaciones, has subido de nivel!"
                            res.status(200).send({experienciaPersonaje, experienciaObtenida, msj, nuevoNivelPj, experienciaNueva, experienciaRequerida})
                        } else {
                            res.status(200).send(`El personaje alcanzo el nivel máximo, no puedes obtener más experiencia.`)
                        }
                    } else {
                        res.status(403).send(`Error con la experiencia y nivel del personaje.`)
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

const asignarSkills = async (req, res) => {
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
                    let iteraciones = pj.skills.obtenidos - pj.skills.disponibles;
                    let valorBaseSkill = 35;
                    for (let i = 0; i < iteraciones; i++) {
                        valorBaseSkill *= 1.15; 
                    }
                    let valorSkill = Math.round(valorBaseSkill)
                    if (pj.oro >= valorSkill) {
                        if (body.atributoModificado === "Vida") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida + 1,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Skill asignado.");
                        } else if (body.atributoModificado === "Fuerza") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza + 1,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Transacción realizada.");
                        } else if (body.atributoModificado === "Resistencia") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia + 1,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Skill asignado.");
                        } else if (body.atributoModificado === "Destreza") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza + 1,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Skill asignado.");
                        } else if (body.atributoModificado === "Inteligencia") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia + 1,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Transacción realizada.");
                        } else if (body.atributoModificado === "Liderazgo") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo + 1,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Skill asignado.");
                        } else if (body.atributoModificado === "Combate") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate + 1,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Skill asignado.");
                        } else if (body.atributoModificado === "Defensa") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa + 1,
                                            navegacion: pj.atributos.navegacion
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Skill asignado.");
                        } else if (body.atributoModificado === "Navegacion") {
                            await Personajes.updateOne({_id: body._id},
                                {
                                    $set: {
                                        oro: pj.oro - valorSkill,
                                        atributos: {
                                            vida: pj.atributos.vida,
                                            fuerza: pj.atributos.fuerza,
                                            resistencia: pj.atributos.resistencia,
                                            destreza: pj.atributos.destreza,
                                            inteligencia: pj.atributos.inteligencia,
                                            liderazgo: pj.atributos.liderazgo,
                                            combate: pj.atributos.combate,
                                            defensa: pj.atributos.defensa,
                                            navegacion: pj.atributos.navegacion + 1 
                                        },
                                        skills: {
                                            obtenidos: pj.skills.obtenidos,
                                            disponibles: pj.skills.disponibles - 1
                                        }
                                    }
                                })
                            res.status(201).send("Skill asignado.");
                        } else {
                            res.status(403).send("Transacción rechazada, no es posible modificar el atributo solicitado.");
                        }
                    } else {
                        res.status(403).send("Transacción rechazada, no tienes suficiente oro.");
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
                        let listaPersonajesNueva = cuenta.pjs.filter((personaje) => personaje !== pj.nombre)
                        if (listaPersonajesNueva.length === 0) {
                            listaPersonajesNueva = ["-"]
                        }
                        await Personajes.deleteOne({_id: pj._id})
                        await Cuentas.updateOne({email: email},
                            {
                                $set: {
                                    pjs: listaPersonajesNueva
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

module.exports = { createPersonaje, dataPersonaje, comercioPersonaje, equiparItem, ganarExperienciaCriaturas, asignarSkills, eliminarPersonaje }
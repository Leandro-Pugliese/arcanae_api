const express = require("express");
const Cuentas = require("../Models/Cuenta");
const Personajes = require("../Models/Personaje");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { atributos, criaturas, items, misiones } = require("../Objetos/objetos");

const createPersonaje = async (req, res) => {
    const { body } = req; //Nombre, 
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { email } = jwt.decode(token, {complete: true}).payload
        const { _id } = jwt.decode(token, {complete: true}).payload
        const cuenta = await Cuentas.findOne({email: email});
        if (!cuenta) {
            return res.status(403).send("Cuenta no encontrada en la base de datos.");
        }
        if (cuenta.pjs.length === 3 && cuenta.premium === false) {
            return res.status(403).send("Ya alcansaste el máximo de personajes que puedes tener en tu cuenta, si deseas tener hasta 6 personajes deberas ser premium.");
        }
        if (cuenta.pjs.length === 6) {
            return res.status(403).send("Ya alcansaste el máximo de personajes que puedes tener en tu cuenta.");
        }
        const nombreEnMayusculas = body.nombre.toUpperCase()
        const isPersonaje = await Personajes.findOne({nombre: nombreEnMayusculas});
        if (isPersonaje) {
            return res.status(403).send("El nombre ingresado ya se encuentra en uso.");
        }
        // Asignación de atributos para el pj.
        const atributosFiltrados = atributos.filter((elemento) => elemento.raza === body.raza);
        if (atributosFiltrados.length === 0) {
            return res.status(403).send("Ups, algo salió mal con el filtro de los atributos de la raza.");
        }
        const atributosPersonaje = atributosFiltrados[0].atributos
        const personaje = await Personajes.create({
            nombre: nombreEnMayusculas,
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
            inventario: [],
            ropa: "-",
            arma: "-",
            escudo: "-",
            casco: "-",
            joya: "-",
            refugio: 0,
            mensajes: [],
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
        // En caso de ser el primer
        let listaPersonajes = [...cuenta.pjs]
        listaPersonajes.push(nombreEnMayusculas)
        await Cuentas.updateOne({email: email},
            {
                $set: {
                    pjs: listaPersonajes
                }
            })
        const mensaje = "Personaje creado exitosamente.";
        return res.status(201).send({ personaje, mensaje });
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const dataPersonaje = async (req, res) => {
    const {body} = req; //nombre
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const { email } = jwt.decode(token, {complete: true}).payload;
        const cuenta = await Cuentas.findOne({email: email});
        if (!cuenta) {
           return res.status(403).send("Credenciales inválidas.");  
        }
        const nombreEnMayusculas = body.nombre.toUpperCase()
        const pj = await Personajes.findOne({nombre: nombreEnMayusculas});
        if (!pj) {
            return res.status(403).send("Personaje no encontrado.");
        } 
        //Doble verificación la cuenta debe tener el nombre del pj y el pj debe tener el id de la cuenta como owner.
        let personajesCuenta = [...cuenta.pjs];
        if (personajesCuenta.includes(pj.nombre) === false) {
            return res.status(403).send("El Personaje no pertenece a la cuenta logueada.");
        }
        if (pj.owner !== cuenta._id.toString()) {
            return res.status(403).send("El Personaje no pertenece a la cuenta logueada.");
        }
        return res.status(201).send(pj);
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const comercioPersonaje = async (req, res) => {
    const {body} = req; //pjID, operacion, itemNombre, itemCantidad
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const pj = await Personajes.findOne({_id: body._id});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        } else {
            const { email } = jwt.decode(token, {complete: true}).payload;
            const cuenta = await Cuentas.findOne({email: email});
            if (!cuenta) {
                return res.status(403).send("Credenciales inválidas.");
            } else {
                if (pj.owner !== cuenta._id.toString()) {
                    return res.status(403).send("El Personaje no pertenece a la cuenta logueada.");
                }
                const item = items.filter((item) => item.nombre === body.itemNombre);
                let inventarioPj = [...pj.inventario];
                const isItem = inventarioPj.filter((element) => element.nombre === body.itemNombre);
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
                            let objInventarioCreado = {
                                nombre: item[0].nombre,
                                cantidad: body.itemCantidad
                            }
                            inventarioPj.push(objInventarioCreado)
                            await Personajes.updateOne({ _id: body._id },
                                {
                                    $set: {
                                        oro: pj.oro - valorTransaccion,
                                        inventario: inventarioPj
                                    }
                                })
                            return res.status(201).send("Transacción realizada.");
                        } else {
                            let objInventarioModificado = {
                                nombre: isItem[0].nombre,
                                cantidad: isItem[0].cantidad + body.itemCantidad
                            }
                            let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);
                            inventarioFiltrado.push(objInventarioModificado);
                            await Personajes.updateOne({ _id: body._id },
                                {
                                    $set: {
                                        oro: pj.oro - valorTransaccion,
                                        inventario: inventarioFiltrado
                                    }
                                })
                            return res.status(201).send("Transacción realizada.")
                        }
                    } else {
                        return res.status(201).send("Transacción rechazada, no tienes suficiente oro.")
                    }
                } else if (body.operacion === "VENTA") {
                    const itemsEquipados = [pj.ropa, pj.arma, pj.escudo, pj.casco, pj.joya]
                    if (isItem.length === 0) {
                        return res.status(403).send("Transacción rechazada, no tienes el item en tu inventario.");
                    }
                    if (isItem[0].cantidad > 1) {
                        const valorTransaccion = item[0].precioVenta * body.itemCantidad;
                        if ((isItem[0].cantidad - body.itemCantidad) === 0) {
                            if (itemsEquipados.includes(body.itemNombre) === false) {
                                let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);
                                await Personajes.updateOne({ _id: body._id },
                                    {
                                        $set: {
                                            oro: pj.oro + valorTransaccion,
                                            inventario: inventarioFiltrado
                                        }
                                    }
                                )
                                return res.status(201).send("Transacción realizada.");
                            } else {
                                return res.status(403).send("Transacción rechazada, el item que quieres vender esta equipado. Vende menos items o desequipa el item.");
                            }
                        } else if ((isItem[0].cantidad - body.itemCantidad) >= 1) {
                            let objInventarioModificado = {
                                nombre: isItem[0].nombre,
                                cantidad: isItem[0].cantidad - body.itemCantidad
                            }
                            let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);
                            inventarioFiltrado.push(objInventarioModificado)
                            await Personajes.updateOne({ _id: body._id },
                                {
                                    $set: {
                                        oro: pj.oro + valorTransaccion,
                                        inventario: inventarioFiltrado
                                    }
                                })
                            return res.status(201).send("Transacción realizada.");
                        } else {
                            return res.status(403).send("Transacción rechazada, no tienes la cantidad suficiente del item que quieres vender.");
                        }
                    } else if (isItem[0].cantidad === 1) {
                        if (itemsEquipados.includes(body.itemNombre) === false) {
                            let inventarioFiltrado = inventarioPj.filter((item) => item.nombre !== body.itemNombre);
                            await Personajes.updateOne({ _id: body._id },
                                {
                                    $set: {
                                        oro: pj.oro + item[0].precioVenta, //Si solo tengo un item no me importa el itemCantidad solo vendo uno meintras no este equipado.
                                        inventario: inventarioFiltrado
                                    }
                                }
                            )
                            return res.status(201).send("Transacción realizada.");
                        } else {
                            return res.status(403).send("Transacción rechazada, el item que quieres vender esta equipado.");
                        }
                    } else {
                        return res.status(403).send("Transacción rechazada, hubo un error con las cantidades del item.");
                    }
                } else {
                    return res.status(403).send("Transacción rechazada.");
                }
            }
        }
    } catch (error) {
        return res.status(500).send(error.message)
    }
}

const equiparItem = async (req, res) => {
    const {body} = req; //pjNombre, itemNombre, operacion(EQUIPAR/QUITAR)
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const pj = await Personajes.findOne({nombre: body.pjNombre});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        }
        const { email } = jwt.decode(token, { complete: true }).payload;
        const cuenta = await Cuentas.findOne({ email: email });
        if (!cuenta) {
            return res.status(403).send("Credenciales inválidas.");
        }
        if (cuenta.pjs.includes(pj.nombre) === true) {
            const item = items.filter((item) => item.nombre === body.itemNombre);
            let nombreItemsInventario = [];
            pj.inventario.map(element => (
                nombreItemsInventario.push(element.nombre)
            ));
            if (item.length === 0) {
                return res.status(403).send("Error: item no encontrado en base de datos.")
            }
            if (item.length >= 2) {
                return res.status(403).send("Error: item mal filtrado.")
            }
            if (item.length === 1 && body.operacion === "EQUIPAR") { // Verifico si existe el item y si la operacion es equipar. 
                if (item[0].clasePermitida.includes(pj.clase)) {
                    if (item[0].tipo === "Ropa" && nombreItemsInventario.includes(body.itemNombre)) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    ropa: body.itemNombre
                                }
                            }
                        )
                        return res.status(200).send("Equipo modificado.")
                    } else if (item[0].tipo === "Arma" && nombreItemsInventario.includes(body.itemNombre)) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    arma: body.itemNombre
                                }
                            })
                        return res.status(200).send("Equipo modificado.")
                    } else if (item[0].tipo === "Escudo" && nombreItemsInventario.includes(body.itemNombre)) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    escudo: body.itemNombre
                                }
                            })
                        return res.status(200).send("Equipo modificado.")
                    } else if (item[0].tipo === "Casco" && nombreItemsInventario.includes(body.itemNombre)) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    casco: body.itemNombre
                                }
                            })
                        return res.status(200).send("Equipo modificado.")
                    } else if (item[0].tipo === "Joya" && nombreItemsInventario.includes(body.itemNombre)) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    joya: body.itemNombre
                                }
                            })
                        return res.status(200).send("Equipo modificado.")
                    } else {
                        return res.status(403).send("No es posible equipar el item.")
                    }
                } else {
                    return res.status(403).send("Tu clase no puede usar este objeto.")
                }
            } else {
                if (body.operacion === "QUITAR") {
                    if (item[0].tipo === "Ropa" && pj.ropa === body.itemNombre) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    ropa: "-"
                                }
                            }
                        )
                        return res.status(200).send("Equipo modificado.");
                    } else if (item[0].tipo === "Arma" && pj.arma === body.itemNombre) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    arma: "-"
                                }
                            }
                        )
                        return res.status(200).send("Equipo modificado.");
                    } else if (item[0].tipo === "Escudo" && pj.escudo === body.itemNombre) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    escudo: "-"
                                }
                            }
                        )
                        return res.status(200).send("Equipo modificado.");
                    } else if (item[0].tipo === "Casco" && pj.casco === body.itemNombre) {
                        await Personajes.updateOne({ _id: body._id },
                            {
                                $set: {
                                    casco: "-"
                                }
                            })
                        return res.status(200).send("Equipo modificado.");
                    } else if (item[0].tipo === "Joya" && pj.joya === body.itemNombre) {
                        await Personajes.updateOne({ _id: pj._id },
                            {
                                $set: {
                                    joya: "-"
                                }
                            }
                        )
                        return res.status(200).send("Equipo modificado.");
                    } else {
                        return res.status(403).send("No es posible quitar el item equipado.");
                    }
                } else {
                    return res.status(403).send("Error: Operación indefinida.");
                }
            }
        } else {
            return res.status(403).send("El Personaje no pertenece a la cuenta a la que ingresaste.");
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const ganarExperiencia = async (req, res) => {
    const {body} = req; // pjNombre, experiencia
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const pj = await Personajes.findOne({nombre: body.pjNombre});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        } else {
            const { email } = jwt.decode(token, {complete: true}).payload;
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
                            await Personajes.updateOne({_id: pj._id},
                                {
                                    $set: {
                                        experiencia: experienciaTotal
                                    }
                                }
                            )
                            return res.status(200).send({experienciaPersonaje, experienciaObtenida, experienciaTotal, experienciaRequerida});
                        } else if (experienciaTotal > experienciaRequerida) {
                            let experienciaNueva = experienciaTotal - experienciaRequerida
                            let nuevoNivelPj = pj.nivel + 1
                            await Personajes.updateOne({_id: pj._id},
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
                            return res.status(200).send({experienciaPersonaje, experienciaObtenida, msj, nuevoNivelPj, experienciaNueva, experienciaRequerida});
                        } else {
                            return res.status(403).send(`Error con la experiencia y nivel del personaje.`);
                        }
                    } else {
                        return res.status(200).send(`El personaje alcanzo el nivel máximo, no puedes obtener más experiencia.`);
                    }
                } else {
                    return res.status(403).send("El Personaje no pertenece a la cuenta a la que ingresaste.");
                }
            }
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const asignarSkills = async (req, res) => {
    const {body} = req; //pjNombre, 
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const pj = await Personajes.findOne({nombre: body.pjNombre});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        } 
        const { email } = jwt.decode(token, { complete: true }).payload;
        const cuenta = await Cuentas.findOne({ email: email });
        if (!cuenta) {
            return res.status(403).send("Credenciales inválidas.");
        } 
        if (cuenta.pjs.includes(pj.nombre) === true) {
            let iteraciones = pj.skills.obtenidos - pj.skills.disponibles;
            let valorBaseSkill = 35;
            for (let i = 0; i < iteraciones; i++) {
                valorBaseSkill *= 1.15;
            }
            let valorSkill = Math.round(valorBaseSkill)
            if (pj.oro >= valorSkill) {
                if (body.atributoModificado === "VIDA") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else if (body.atributoModificado === "FUERZA") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Transacción realizada.");
                } else if (body.atributoModificado === "RESISTENCIA") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else if (body.atributoModificado === "DESTREZA") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else if (body.atributoModificado === "INTELIGENCIA") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else if (body.atributoModificado === "LIDERAZGO") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else if (body.atributoModificado === "COMBATE") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else if (body.atributoModificado === "DEFENSA") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else if (body.atributoModificado === "NAVEGACION") {
                    await Personajes.updateOne({ _id: pj._id },
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
                        }
                    )
                    return res.status(201).send("Skill asignado.");
                } else {
                    return res.status(403).send("Transacción rechazada, no es posible modificar el atributo solicitado.");
                }
            } else {
                return res.status(403).send("Transacción rechazada, no tienes suficiente oro.");
            }
        } else {
            return res.status(403).send("El Personaje no pertenece a la cuenta a la que ingresaste.");
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

const eliminarPersonaje = async (req, res) => {
    const {body} = req; //pjNombre, pin
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        }
        const pj = await Personajes.findOne({nombre: body.pjNombre});
        if (!pj) {
            return res.status(200).send("Personaje no encontrado.");
        } 
        const { email } = jwt.decode(token, { complete: true }).payload;
        const cuenta = await Cuentas.findOne({ email: email });
        if (!cuenta) {
            return res.status(403).send("Credenciales inválidas.");
        } 
        if (cuenta.pjs.includes(pj.nombre) === true) {
            const pinMatch = await bcrypt.compare(body.pin, cuenta.pin);
            if (pinMatch) {
                let listaPersonajesNueva = cuenta.pjs.filter((personaje) => personaje !== pj.nombre);
                await Personajes.deleteOne({ _id: pj._id })
                await Cuentas.updateOne({ email: email },
                    {
                        $set: {
                            pjs: listaPersonajesNueva
                        }
                    }
                )
                return res.status(200).send("Personaje borrado.")
            } else {
                return res.status(403).send("Pin inválido.");
            }
        } else {
            return res.status(403).send("El Personaje que quieres borrar no pertenece a la cuenta a la que ingresaste.");
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }
}

module.exports = { createPersonaje, dataPersonaje, comercioPersonaje, equiparItem, ganarExperiencia, asignarSkills, eliminarPersonaje }
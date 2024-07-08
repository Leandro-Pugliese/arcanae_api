const express = require("express");
const Cuentas = require("../Models/Cuenta");
const Personajes = require("../Models/Personaje");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { atributos, criaturas, items, misiones } = require("../Objetos/objetos");

// Clase para ejecutar batallas.
let damageInflingido = 0
class Luchador {
    constructor(nombre, vida, fuerza, resistencia, destreza) {
        this.nombre = nombre;
        this.vida = vida;
        this.fuerza = fuerza;
        this.resistencia = resistencia;
        this.destreza = destreza;
    }
    atacar(oponente) {
        const damage = Math.max(this.fuerza - oponente.resistencia, 1); // El daño mínimo siempre será 1; 
        oponente.vida -= damage;
        if (oponente.vida < 0) {
            oponente.vida = 0
        }
        damageInflingido = damage
    }
    esquivar() {
        return Math.random() < (this.destreza / 100);
    }
    estaVivo() {
        return this.vida > 0;
    }
}

const batalla = async(agresor, oponente) => {
    let ronda = 0;
    let infoBatalla = [];
    while (agresor.estaVivo() && oponente.estaVivo()) {
        let infoBatallaPorRonda = [];
        ronda++;
        infoBatallaPorRonda.push(`Ronda:${ronda}`)
        if (!oponente.esquivar()) {
            agresor.atacar(oponente);
            infoBatallaPorRonda.push(`${agresor.nombre} ataca a ${oponente.nombre} inflingiendole ${damageInflingido} puntos de daño. ${oponente.nombre} tiene ${oponente.vida} de vida restante.`)
        } else {
            infoBatallaPorRonda.push(`${oponente.nombre} esquiva el ataque de ${agresor.nombre}.`)
        }
        if (!agresor.estaVivo() || !oponente.estaVivo()) {
            infoBatalla.push(infoBatallaPorRonda);
            break;
        } 
        if (!agresor.esquivar()) {
            oponente.atacar(agresor);
            infoBatallaPorRonda.push(`${oponente.nombre} ataca a ${agresor.nombre} inflingiendole ${damageInflingido} puntos de daño. ${agresor.nombre} tiene ${agresor.vida} de vida restante.`)
        } else {
            infoBatallaPorRonda.push(`${agresor.nombre} esquiva el ataque de ${oponente.nombre}.`)
        }
        infoBatalla.push(infoBatallaPorRonda);
    }
    if (agresor.estaVivo()) {
        const dataFinal = {
            ganador: agresor.nombre,
            info: infoBatalla
        }
        return dataFinal
    } else {
        const dataFinal = {
            ganador: oponente.nombre,
            info: infoBatalla
        }
        return dataFinal
    }
}

const batallaCriaturas = async (req, res) => {
    const { body } = req; //pjNombre, criatura
    try {
        const token = req.header("Authorization");
        if (!token) {
            return res.status(403).send('No se detecto un token en la petición.')
        } 
        const { email } = jwt.decode(token, {complete: true}).payload
        const cuenta = await Cuentas.findOne({email: email});
        if (!cuenta) {
            return res.status(403).send("Cuenta no encontrada en la base de datos.");
        }
        const pj = await Personajes.findOne({nombre: body.pjNombre});
        if (!pj) {
            return res.status(403).send("Personaje no encontrado en la base de datos.");
        }
        if (cuenta.pjs.includes(pj.nombre) === false) {
            return res.status(403).send("El Personaje no pertenece a la cuenta en la que ingresaste.");
        }
        // Armo obj Luchador con el Personaje con las stats que va a usar para la batalla. (Combate mejora la fuerza y defensa mejora la resistencia del pj).
        const pjFuerza = pj.atributos.fuerza + pj.atributos.combate
        const pjResistencia = pj.atributos.resistencia + pj.atributos.defensa
        const agresor = new Luchador(pj.nombre, pj.atributos.vida, pjFuerza, pjResistencia, pj.atributos.destreza);
        // Buscamos la criatura con la cual se va a pelear.
        const criatura = criaturas.filter((npc) => npc.nombre === body.criatura);
        if (criatura.length === 0) {
            return res.status(403).send("Error: Criatura no encontrada en la base de datos.");
        }
        // Armo un obj Luchador con la criatura y sus stats parta la batalla.
        const oponente = new Luchador(criatura[0].nombre, criatura[0].vida, criatura[0].fuerza, criatura[0].resistencia, criatura[0].destreza);
        // Ejecutamos la batalla
        const resultadoBatalla = await batalla(agresor, oponente);
        // Chequeamos quien fue el ganador.
        if (resultadoBatalla.ganador === pj.nombre) { //Gano el usuario.
            // Agarramos el oro y/o el drop que otorga la critatura.
            const oroCriatura = criatura[0].oro; 
            const dropCriatura = criatura[0].drop;
            // Agregamos el drop de la criatura al inventario
            let inventarioPj = [...pj.inventario];
            if (dropCriatura !== "-") {
                const isItem = inventarioPj.filter((element) => element.nombre === dropCriatura);
                if (isItem.length === 0) {
                    let objInventarioCreado = {
                        nombre: dropCriatura,
                        cantidad: 1
                    }
                    inventarioPj.push(objInventarioCreado);
                } else if (isItem.length === 1) {
                    let objInventarioModificado = {
                        nombre: isItem[0].nombre,
                        cantidad: isItem[0].cantidad + 1
                    }
                    for (let indice in inventarioPj){
                        let objOriginal = inventarioPj[indice];
                        if (objOriginal.nombre === objInventarioModificado.nombre) {
                            inventarioPj.splice(indice, 1, objInventarioModificado); // array.splice(index, cantidadElementos, 'Elemento');
                        }
                    }
                } else {
                    return res.status(403).send("Error: Item del drop en inventario mal filtrado.");
                }
            }
            // Agarramos todo el obj misiones del usuario
            let usuarioMisiones = [];
            // Chequeamos si el usuario esta en misión o no y si la criatura sirve para la misión.
            if ((pj.misiones.activa === true) && (pj.misiones.quest.criatura.includes(criatura[0].nombre) === true)) {
                let obtenidosQuest = [...pj.misiones.quest.obtenido];
                const filtroObtenido = obtenidosQuest.filter((element) => element.nombre === criatura[0].nombre);
                if (filtroObtenido.length === 0) {
                    return res.status(403).send("Error en el filtrado de objetivos obtenidos de la quest.");
                }
                const objModificado = {
                    nombre: criatura[0].nombre,
                    cantidad: filtroObtenido[0].cantidad + 1
                }
                for (let indice in obtenidosQuest){
                    let objOriginal = obtenidosQuest[indice];
                    if (objOriginal.nombre === objModificado.nombre) {
                        obtenidosQuest.splice(indice, 1, objModificado); // array.splice(index, cantidadElementos, 'Elemento');
                    }
                }
                const usuarioMisionesNuevo = {
                    aceptadas: pj.misiones.aceptadas,
                    superadas: pj.misiones.superadas,
                    activa: pj.misiones.activa,
                    quest: {
                        nombre: pj.misiones.quest.nombre,
                        tipo: pj.misiones.quest.tipo,
                        criatura: pj.misiones.quest.criatura,
                        objetivo: pj.misiones.quest.objetivo,
                        obtenido: obtenidosQuest
                    }
                }
                usuarioMisiones.push(usuarioMisionesNuevo);
            } else {
                usuarioMisiones.push(pj.misiones);
            }
            //Agarramos los msj del usuario para despues agregarle el msj de la batalla.
            let mensajesUsuario = [...pj.mensajes];
            // Otorgamos la experiencia de la criatura al usuario y verificamos si pasa de nivel o no.
            if (pj.nivel < 50) {
                // Cálculo experiencia requerida para pasar al próximo nivel.
                let iteraciones = pj.nivel;
                let experienciaRequerida = 250;
                // Bucle para aumentar el valor en un 20% en cada iteración.
                for (let i = 1; i < iteraciones; i++) {
                    experienciaRequerida *= 1.20; // Multiplicamos por 1.20 para aumentar en un 20%.
                }
                let experienciaObtenida = criatura[0].experiencia
                let experienciaPersonaje = pj.experiencia
                let experienciaTotal = experienciaPersonaje + experienciaObtenida
                if (experienciaTotal <= experienciaRequerida) {
                    //Si no llega a pasar de nivel solo falta armar el msj con los resultados e info de la batalla y hacer el update del pj.
                    const msj = {
                        mensajeID: `MB-${pj.nombre}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        tipo: "Info",
                        remitente: "Arcanae",
                        titulo: "Batalla con Criatura",
                        contenido: {
                            ganador: resultadoBatalla.ganador,
                            detalleBatalla: resultadoBatalla.info,
                            oro: oroCriatura,
                            drop: dropCriatura,
                            experiencia: experienciaObtenida              
                        },
                        fecha: new Date(Date.now()),
                        leido: false
                    }
                    mensajesUsuario.push(msj);
                    await Personajes.updateOne({_id: pj._id},
                        {
                            $set: {
                                experiencia: experienciaTotal,
                                oro: pj.oro + oroCriatura,
                                inventario: inventarioPj,
                                mensajes: mensajesUsuario,
                                misiones: usuarioMisiones[0],
                                criaturasEliminadas: pj.criaturasEliminadas + 1
                            }
                        }
                    )
                    return res.status(200).send(`Batalla Finalizada`);
                } else if (experienciaTotal > experienciaRequerida) {
                    // Si pasa de nivel hay que agregar en el msj que paso de nivel y hacer update en los skills tambien.
                    let experienciaNueva = experienciaTotal - experienciaRequerida
                    let nuevoNivelPj = pj.nivel + 1
                    const msj = {
                        mensajeID: `MB-${pj.nombre}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        tipo: "Info",
                        remitente: "Arcanae",
                        titulo: "Batalla con Criatura",
                        contenido: {
                            ganador: resultadoBatalla.ganador,
                            detalleBatalla: resultadoBatalla.info,
                            oro: oroCriatura,
                            drop: dropCriatura,
                            experiencia: experienciaObtenida              
                        },
                        fecha: new Date(Date.now()),
                        leido: false
                    }
                    const msjNuevoNivel = {
                        mensajeID: `MN-${pj.nombre}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        tipo: "Info",
                        remitente: "Arcanae",
                        titulo: "Nuevo nivel",
                        contenido: {
                            contenido: `¡Felicitaciones subiste de nivel, tu nuevo nivel es ${nuevoNivelPj}, tienes dos nuevos skills para asginar y tus atributos fueron incrementados!`,              
                        },
                        fecha: new Date(Date.now()),
                        leido: false
                    }
                    mensajesUsuario.push(msj, msjNuevoNivel);
                    await Personajes.updateOne({_id: pj._id},
                        {
                            $set: {
                                nivel: nuevoNivelPj,
                                experiencia: experienciaNueva,
                                oro: pj.oro + oroCriatura,
                                inventario: inventarioPj,
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
                                },
                                mensajes: mensajesUsuario,
                                misiones: usuarioMisiones[0],
                                criaturasEliminadas: pj.criaturasEliminadas + 1
                            }
                        }
                    );
                    return res.status(200).send(`Batalla Finalizada`);
                } else {
                    return res.status(403).send(`Error con la experiencia y el nivel del personaje.`);
                }
            } else {
                //El pj tiene el nivel máximo, no le damos más experiencia.
                const msj = {
                    mensajeID: `MB-${pj.nombre}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    tipo: "Info",
                    remitente: "Arcanae",
                    titulo: "Batalla con Criatura",
                    contenido: {
                        ganador: resultadoBatalla.ganador,
                        detalleBatalla: resultadoBatalla.info,
                        oro: oroCriatura,
                        drop: dropCriatura,
                        experiencia: 0              
                    },
                    fecha: new Date(Date.now()),
                    leido: false
                }
                mensajesUsuario.push(msj);
                await Personajes.updateOne({_id: pj._id},
                    {
                        $set: {
                            oro: pj.oro + oroCriatura,
                            inventario: inventarioPj,
                            mensajes: mensajesUsuario,
                            misiones: usuarioMisiones[0],
                            criaturasEliminadas: pj.criaturasEliminadas + 1
                        }
                    }
                )
                return res.status(200).send(`Batalla Finalizada`);
            }
        } else if (resultadoBatalla.ganador === criatura[0].nombre) { //Gano la criatura.
            //Verificamos si le usuario pierde algún item o no al ser derrotado.
            //Armamos msj con detalle de la batalla y lo enviamos al  usuario.
            return res.status(200).send(`Batalla Finalizada: perdiste`);
        } else { //Error con el ganador
            return res.status(403).send("Error en el resultado de la batalla.");
        }
    } catch (error) {
        return res.status(500).send(error.message);
    }
}



module.exports = { batallaCriaturas }
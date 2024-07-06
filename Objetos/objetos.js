const express = require("express");


const atributos = [
    {
        raza: "Humano",
        atributos: {
            vida: 18,
            fuerza: 18,
            resistencia: 18,
            destreza: 18,
            inteligencia: 18,
            liderazgo: 18,
            combate: 0,
            defensa: 0,
            navegacion: 0,
            comercio: 0
        }
    },
    {
        raza: "Elfo",
        atributos: {
            vida: 16,
            fuerza: 16,
            resistencia: 16,
            destreza: 20,
            inteligencia: 20,
            liderazgo: 18,
            combate: 0,
            defensa: 0,
            navegacion: 0,
            comercio: 0
        }
    },
    {
        raza: "Elfo Oscuro",
        atributos: {
            vida: 16,
            fuerza: 18,
            resistencia: 17,
            destreza: 19,
            inteligencia: 20,
            liderazgo: 16,
            combate: 0,
            defensa: 0,
            navegacion: 0,
            comercio: 0
        }
    },
    {
        raza: "Enano",
        atributos: {
            vida: 20,
            fuerza: 20,
            resistencia: 20,
            destreza: 16,
            inteligencia: 14,
            liderazgo: 20,
            combate: 0,
            defensa: 0,
            navegacion: 0,
            comercio: 0
        }
    },
]

const criaturas = [
    {
        nombre: "Serpiente",
        vida: 100,
        experiencia: 10,
        fuerza: 2,
        resistencia: 3,
        destreza: 4,
        oro: 0,
        drop: "Veneno de serpiente"
    },
    {
        nombre: "Lobo",
        vida: 250,
        experiencia: 30,
        fuerza: 6,
        resistencia: 10,
        destreza: 10,
        oro: 0,
        drop: "Pelaje de lobo"
    },  
    {
        nombre: "Bandido",
        vida: 350,
        experiencia: 50,
        fuerza: 9,
        resistencia: 16,
        destreza: 16,
        oro: 300,
        drop: "-"
    },  
    {
        nombre: "Orco brujo",
        vida: 500,
        experiencia: 150,
        fuerza: 15,
        resistencia: 24,
        destreza: 24,
        oro: 600,
        drop: "-"
    },  
    {
        nombre: "Troll",
        vida: 800,
        experiencia: 200,
        fuerza: 20,
        resistencia: 30,
        destreza: 30,
        oro: 800,
        drop: "-"
    },  
    {
        nombre: "Daegal",
        vida: 2000,
        experiencia: 500,
        fuerza: 45,
        resistencia: 70,
        destreza: 70,
        oro: 2000,
        drop: "-"
    },    
    {
        nombre: "Demonio",
        vida: 8000,
        experiencia: 2000,
        fuerza: 60,
        resistencia: 80,
        destreza: 80,
        oro: 0,
        drop: "Cristal maldito"
    },         
]

const items = [
    {
        nombre: "Daga",
        tipo: "Arma",
        precioCompra: 50,
        precioVenta: 25,
        skillsCombate: 0,
        clasePermitida: ["Caballero", "Trabajador"],
        mejoraCombate: 1 
    },
    {
        nombre: "Varita mágica",
        tipo: "Arma",
        precioCompra: 50,
        precioVenta: 25,
        skillsCombate: 0,
        clasePermitida: ["Mago"],
        mejoraCombate: 1 
    },
    {
        nombre: "Hacha orca",
        tipo: "Arma",
        precioCompra: 300,
        precioVenta: 150,
        skillsCombate: 10,
        clasePermitida: ["Caballero", "Trabajador"],
        mejoraCombate: 7 
    },
    {
        nombre: "Báculo de roble",
        tipo: "Arma",
        precioCompra: 300,
        precioVenta: 150,
        skillsCombate: 10,
        clasePermitida: ["Mago"],
        mejoraCombate: 7 
    },
    {
        nombre: "Ropa de campesino",
        tipo: "Ropa",
        precioCompra: 30,
        precioVenta: 15,
        skillsDefensa: 0,
        clasePermitida: ["Caballero", "Trabajador", "Mago"],
        mejoraDefensa: 1
    },
    {
        nombre: "Armadura de cuero",
        tipo: "Ropa",
        precioCompra: 350,
        precioVenta: 175,
        skillsDefensa: 10,
        clasePermitida: ["Caballero", "Trabajador"],
        mejoraDefensa: 3
    },
    {
        nombre: "Túnica de monje",
        tipo: "Ropa",
        precioCompra: 350,
        precioVenta: 175,
        skillsDefensa: 10,
        clasePermitida: ["Mago", "Trabajador"],
        mejoraDefensa: 3
    },
]

const misiones = [
    {
        nombre: "Limpíeza del bosque",
        tipo: "NPC",
        criatura: ["Serpiente"],
        objetivo: [4],
        obtenido: [0]
    },
    {
        nombre: "Amenaza en manada",
        tipo: "NPC",
        criatura: ["Lobo"],
        objetivo: [12],
        obtenido: [0]
    },
    {
        nombre: "Bandidos",
        tipo: "NPC",
        criatura: ["Bandido"],
        objetivo: [10],
        obtenido: [0]
    },
    {
        nombre: "Explorando cuevas",
        tipo: "NPC",
        criatura: ["Orco brujo", "Troll"],
        objetivo: [4, 1],
        obtenido: [0, 0]
    },
    {
        nombre: "Busca pleitos",
        tipo: "PVP",
        criatura: ["PVP"],
        objetivo: [3],
        obtenido: [0]
    },
    {
        nombre: "Sed de sangre",
        tipo: "PVP",
        criatura: ["PVP"],
        objetivo: [10],
        obtenido: [0]
    }
]

module.exports = {atributos, criaturas, items, misiones}
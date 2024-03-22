const express = require("express");


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


module.exports = {criaturas, items}
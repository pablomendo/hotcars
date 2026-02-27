"use client";

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

const FAQ_DATA = [
  {
    question: "1) ¿Qué es HotCars?",
    answer: "HotCars es una plataforma profesional para vendedores y agencias automotor que conecta inventario entre colegas, ofrece estadísticas reales de rendimiento y permite tener tu propia web con dominio personalizado. Es un sistema diseñado para que no pierdas ventas por falta de stock, versión o color."
  },
  {
    question: "2) ¿En qué se diferencia de publicar en MercadoLibre o redes sociales?",
    answer: "Publicar en portales te da visibilidad. HotCars te da estructura, red y datos.\nNo solo mostrás tu auto: accedés al inventario de otros vendedores, recibís alertas de búsqueda y trabajás con información estratégica para cerrar operaciones que antes se perdían."
  },
  {
    question: "3) ¿Qué problema resuelve realmente?",
    answer: "Resuelve el problema más silencioso del rubro:\nEl cliente que se va porque no tenés la versión, el color o la unidad exacta.\nCon HotCars, si vos no lo tenés, puede tenerlo alguien de la red."
  },
  {
    question: "4) ¿Voy a compartir mis clientes?",
    answer: "No. HotCars no comparte tu base de clientes.\nCompartís oportunidades e inventario bajo reglas claras.\nVos decidís con quién trabajar y cómo hacerlo."
  },
  {
    question: "5) ¿Cómo funciona la red de vendedores?",
    answer: "Todos los usuarios pueden ser visibles dentro de la red.\nAdemás, podés trabajar en grupos reducidos de confianza para compartir primero entre ellos.\nSi no tenés una unidad, podés activarla como Flip compartido o solicitar acceso a la de otro miembro."
  },
  {
    question: "6) ¿Qué es el Flip compartido?",
    answer: "Es la posibilidad de activar una unidad para que otros vendedores la ofrezcan.\nEn lugar de que el cliente se pierda, la red actúa.\nMás exposición interna, más posibilidades de cierre."
  },
  {
    question: "7) ¿Puedo elegir con quién compartir?",
    answer: "Sí.\nPodés trabajar con toda la red o con grupos de trabajo específicos.\nLa idea es potenciar colaboración sin perder control."
  },
  {
    question: "8) ¿Qué es el Dashboard y para qué sirve?",
    answer: "Es tu panel profesional con estadísticas reales:\n- Publicaciones activas\n- Interacciones\n- Consultas\n- Búsquedas no encontradas\n- Tendencias\nNo trabajás por intuición. Trabajás con datos."
  },
  {
    question: "9) ¿Qué son las alertas de búsqueda no encontrada?",
    answer: "Si un cliente busca una unidad que no está disponible, el sistema lo registra.\nCuando alguien de la red carga esa unidad, podés accionar rápido.\nEs una oportunidad que no se pierde en el aire."
  },
  {
    question: "10) ¿Por qué es importante tener mi propia web?",
    answer: "Porque cambia cómo te percibe el cliente.\nNo es lo mismo mandar un link de portal que enviar tu propia web profesional con tu marca, tu inventario y tu respaldo tecnológico.\nEso genera status, confianza y autoridad."
  },
  {
    question: "11) ¿No puedo hacer mi propia web por fuera?",
    answer: "Sí, pero desarrollar una web con base de datos, estadísticas, carga optimizada, inteligencia de inventario y conexión a red es costoso.\nHotCars ya integra todo eso en un solo sistema."
  },
  {
    question: "12) ¿Es solo para agencias grandes?",
    answer: "No.\nEs para vendedores independientes y agencias que quieran profesionalizar su operación y no depender únicamente de portales externos."
  },
  {
    question: "13) ¿Cómo me ayuda a vender más?",
    answer: "- No perdés ventas por falta de stock.\n- Tenés más inventario disponible.\n- Trabajás con datos.\n- Mejorás tu imagen profesional.\n- Podés cerrar operaciones colaborativas."
  },
  {
    question: "14) ¿HotCars reemplaza los portales tradicionales?",
    answer: "No necesariamente.\nLos complementa.\nLa diferencia es que acá el sistema trabaja para vos, no solo como vidriera."
  },
  {
    question: "15) ¿Qué pasa si nadie comparte conmigo?",
    answer: "La red se basa en reciprocidad.\nCuanto más activo seas, más oportunidades generás.\nEl sistema está pensado para que todos ganen cuando colaboran."
  },
  {
    question: "16) ¿Es difícil cargar vehículos?",
    answer: "No.\nLa carga está pensada para ser rápida, clara y optimizada.\nMenos fricción, más acción."
  },
  {
    question: "17) ¿Quién debería usar HotCars?",
    answer: "Vendedores que:\n- Quieren dejar de perder oportunidades\n- Quieren profesionalizar su imagen\n- Quieren datos reales para decidir\n- Quieren escalar su operación"
  },
  {
    question: "18) ¿Qué es HotCars en una frase?",
    answer: "Es el sistema que convierte ventas que se iban en ventas que se quedan."
  }
];

export default function FreqAskedQuestions() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-20 pt-28 md:pt-32 px-4 md:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-8">
          <img 
            src="/Logo_Hotcars_allblack_iso_suelto.png" 
            alt="HotCars Logo" 
            className="h-9 w-auto"
          />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight">
          PREGUNTAS FRECUENTES
        </h1>

        <div className="space-y-4">
          {FAQ_DATA.map((item, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full bg-white p-5 flex justify-between items-center text-left transition-colors hover:bg-gray-50"
              >
                <span className="font-bold text-gray-900 text-sm md:text-base pr-4">
                  {item.question}
                </span>
                <ChevronDown 
                  className={`text-emerald-500 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} 
                  size={20}
                />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out bg-white ${
                  openIndex === index ? 'max-h-[1000px] border-t border-gray-100 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-5 text-gray-600 text-sm md:text-base font-normal leading-relaxed whitespace-pre-wrap">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA FINAL */}
        <div className="mt-16 flex flex-col items-center">
          <p className="text-gray-500 mb-6 font-medium text-center">
            ¿Listo para profesionalizar tu agencia?
          </p>
          <Link href="/register">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-12 rounded-full transition-all shadow-lg shadow-emerald-200 uppercase tracking-wider text-sm">
              crear cuenta
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
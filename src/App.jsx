import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import html2pdf from 'html2pdf.js'; 
import './App.css'; 

// --- 1. CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBVOqNHgWuMFmSLvV6bw5L-BwRaydFJqrk",
  authDomain: "fir-vraem.firebaseapp.com",
  databaseURL: "https://fir-vraem-default-rtdb.firebaseio.com",
  projectId: "fir-vraem",
  storageBucket: "fir-vraem.firebasestorage.app",
  messagingSenderId: "919723738473",
  appId: "1:919723738473:web:e139510a577959b3aee9f8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function useFirebaseState(key, initialValue) {
  const [state, setState] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dbRef = ref(db, key);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setState(snapshot.val());
      } else {
        set(dbRef, initialValue);
        setState(initialValue);
      }
      setLoaded(true);
    });
    return () => unsubscribe();
  }, [key]);

  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(state) : value;
    set(ref(db, key), valueToStore);
  };

  return [state, setValue, loaded];
}

// --- DENOMINACIONES ACTUALIZADAS ---
const ROLES = { M3: 'JEFE DEL CCFFAA', M2: 'CG - CEVRAEM', M1: 'CG - 31 BRIG INF' };
const RAZONES = ['Situación de Emergencia', 'Apoyo Táctico', 'Mantenimiento']; 

// ESTADOS ÚNICOS: SOLO ROJO, VERDE Y AMARILLO
const ST = {
  LIBERADA: 'GREEN',
  DELEGADA: 'YELLOW',
  RETENIDA: 'RED'
};

const RAW_PERMISOS = [
  { id: "E-1.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, en defensa propia, contra objetivos militares; durante el cumplimiento de sus deberes y funciones", type: "NORMAL" },
  { id: "E-1.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, en defensa de la Unidad, contra objetivos militares; durante el cumplimiento de sus deberes y funciones", type: "NORMAL" },
  { id: "E-2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).", type: "NORMAL" },
  { id: "E-2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel operacional; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).", type: "NORMAL" },
  { id: "E-2.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).", type: "NORMAL" },
  { id: "E-2.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).", type: "NORMAL" },
  { id: "E-2.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).", type: "NORMAL" },
  { id: "E-3.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de las armas de fuego pequeñas y ligeras; contra objetivos militares; para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-3.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de las armas pesadas y convencionales de nivel operacional y otras capacidades; contra objetivos militares; para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-3.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-3.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-3.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de las armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-3.4", name: "Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares (personas) que, durante el cumplimiento de la misión, estando fuera de combate (rendidos, heridos o detenidos), pongan en peligro inminente de muerte o lesiones graves a otras personas.", type: "NORMAL" },
  { id: "E-4.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra los integrantes de grupos hostiles, que interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.", type: "NORMAL" },
  { id: "E-4.2", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra los integrantes de grupos hostiles que, interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.", type: "NORMAL" },
  { id: "E-4.2.1", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra los integrantes de grupos hostiles que, interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.", type: "NORMAL" },
  { id: "E-4.2.2", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas; contra los integrantes de grupos hostiles que, interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.", type: "NORMAL" },
  { id: "E-4.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra los miembros de grupos hostiles, que interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.", type: "NORMAL" },
  { id: "E-5.1", name: "Se permite el empleo de la fuerza letal de armas de fuego pequeñas y ligeras; contra objetivos militares que, estando fuera de combate (rendidos, heridos o detenidos), durante las operaciones de intervención y la búsqueda de personas; pongan en peligro inminente de muerte o lesiones graves a otras personas.", type: "NORMAL" },
  { id: "E-5.2", name: "Se permite el empleo de la fuerza letal de armas de fuego pequeñas y ligeras; contra objetivos militares; durante su búsqueda e intervención; siempre que, no se hayan rendido o no se encuentren fuera de combate.", type: "NORMAL" },
  { id: "E-5.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de las armas de fuego pequeñas y ligeras; contra objetivos militares; para evitar su escape.", type: "NORMAL" },
  { id: "E-5.4", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; durante su búsqueda e intervención.", type: "NORMAL" },
  { id: "E-5.4.1", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; durante su búsqueda e intervención.", type: "NORMAL" },
  { id: "E-5.4.2", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas; contra objetivos militares; durante su búsqueda e intervención.", type: "NORMAL" },
  { id: "E-5.5", name: "Se permite el empleo de la fuerza hasta el nivel letal de las armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante su búsqueda e intervención.", type: "NORMAL" },
  { id: "E-6.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes.", type: "NORMAL" },
  { id: "E-6.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel operacional; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes.", type: "NORMAL" },
  { id: "E-6.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para liberar personas retenidas ilegalmente o tomados como rehenes.", type: "NORMAL" },
  { id: "E-6.4", name: "Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes; siempre que, exista peligro inminente de muerte o lesiones graves de los rehenes.", type: "NORMAL" },
  { id: "E-7.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, contra objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.", type: "NORMAL" },
  { id: "E-7.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra los objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.", type: "NORMAL" },
  { id: "E-7.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra los objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.", type: "NORMAL" },
  { id: "E-7.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra los objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.", type: "NORMAL" },
  { id: "E-7.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.", type: "NORMAL" },
  { id: "E-7.4", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.", type: "NORMAL" },
  { id: "E-7.5", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.", type: "NORMAL" },
  { id: "E-7.5.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.", type: "NORMAL" },
  { id: "E-7.5.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas, y otras capacidades; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.", type: "NORMAL" },
  { id: "E-7.6", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.", type: "NORMAL" },
  { id: "E-8.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; durante la configuración y ejecución de maniobras tácticas para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-8.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; objetivos militares; durante la configuración y ejecución de maniobras de nivel operacional y táctico para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-8.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; objetivos militares; durante la configuración y ejecución de maniobras de nivel operacional y táctico para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-8.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; objetivos militares; durante la configuración y ejecución de maniobras de nivel operacional y táctico para el cumplimiento de la misión.", type: "NORMAL" },
  { id: "E-8.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante la configuración y ejecución de maniobras estratégicas, operacionales y tácticas para el cumplimiento de la misión", type: "NORMAL" },
  { id: "E-9.1", name: "Se permite el empleo de iluminación con pirotécnicos, granadas o munición de iluminación; durante las acciones de seguimiento, vigilancia y desvío de objetivos militares en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-9.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pequeñas y ligeras; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-9.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-9.3.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-9.3.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-9.4", name: "Se permite el empleo de fuego incapacitante durante las acciones de seguimiento, vigilancia y desvío de embarcaciones tripulados por objetivos militares; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-9.5", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-10.1", name: "Se permite el empleo de iluminación con pirotécnicos, granadas o munición de iluminación; durante las acciones de interdicción de objetivos militares; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-10.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pequeñas y ligeras; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-10.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-10.3.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-10.3.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-10.4", name: "Se permite el empleo de fuego incapacitante durante las acciones de interdicción de embarcaciones tripulados por objetivos militares; en espacios acuáticos nacionales.", type: "NORMAL" },
  { id: "E-10.5", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales", type: "NORMAL" },
  { id: "E-10.6", name: "Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares; durante las acciones de interdicción en espacios acuáticos nacionales; siempre que, exista peligro inminente de muerte o lesiones graves de terceras personas.", type: "NORMAL" },
  { id: "E-11.1", name: "Se permite el empleo de la fuerza, hasta el nivel de disparos de advertencia, en el espacio aéreo nacional; durante las medidas de identificación, intervención y persuasión de objetivos militares.", type: "NORMAL" },
  { id: "E-11.2", name: "Se permite el empleo de la fuerza letal, en el espacio aéreo nacional; para neutralizar objetivos militares; siempre que, las medidas de identificación, intervención o persuasión, respectivamente, no hayan logrado los efectos correspondientes.", type: "NORMAL" },
  { id: "E-11.3", name: "Se permite el empleo de la fuerza letal, en el espacio aéreo nacional; para neutralizar objetivos militares; siempre que, exista peligro inminente de muerte o lesiones graves de terceras personas.", type: "NORMAL" },
  { id: "E-12.1", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.", type: "NORMAL" },
  { id: "E-12.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades, contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.", type: "NORMAL" },
  { id: "E-12.2.1", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.", type: "NORMAL" },
  { id: "E-12.2.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pesadas, contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.", type: "NORMAL" },
  { id: "E-12.3", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico, contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.", type: "NORMAL" },
  { id: "E-13.1", name: "Empleo de la fuerza no letal (menos letal) en forma arbitraria; en toda circunstancia y lugar.", type: "PROHIBITED" },
  { id: "E-13.2", name: "Empleo de la fuerza letal, en forma arbitraria; en toda circunstancia y lugar.", type: "PROHIBITED" },
  { id: "E-13.3", name: "Empleo de la fuerza no letal (menos letal); en toda circunstancia y lugar; y que existe alto grado de certeza de que el daño incidental sería excesivo comparado con la ventaja militar concreta y directa prevista.", type: "PROHIBITED" },
  { id: "E-13.4", name: "Empleo de la fuerza letal; contra grupos hostiles, en toda circunstancia y lugar; y que existe alto grado de certeza de que el daño incidental sería excesivo comparado con la ventaja militar concreta y directa prevista.", type: "PROHIBITED" },
  { id: "E-13.5", name: "Realizar ataques indiscriminados", type: "PROHIBITED" }
];

// ELIMINAMOS PUNTOS Y ESPACIOS PARA QUE FIREBASE NO TIRE PANTALLA BLANCA NUNCA
const PERMISOS_BASE = RAW_PERMISOS.map(p => ({ ...p, id_fb: p.id.replace(/\./g, '_').replace(/\s/g, ''), label: p.id }));

// MATRIZ INICIAL EXACTA SACADA DEL EXCEL
const initPermisos = () => {
  return {
    "JEFE DEL CCFFAA": {
      "E-1_1": "YELLOW", "E-1_2": "YELLOW", "E-2_1": "YELLOW", "E-2_2": "GREEN", "E-2_2_1": "RED", "E-2_2_2": "RED", "E-2_3": "YELLOW", "E-3_1": "YELLOW", "E-3_2": "GREEN", "E-3_2_1": "RED", "E-3_2_2": "RED", "E-3_3": "YELLOW", "E-3_4": "YELLOW", "E-4_1": "YELLOW", "E-4_2": "GREEN", "E-4_2_1": "RED", "E-4_2_2": "RED", "E-4_3": "YELLOW", "E-5_1": "YELLOW", "E-5_2": "YELLOW", "E-5_3": "YELLOW", "E-5_4": "GREEN", "E-5_4_1": "RED", "E-5_4_2": "RED", "E-5_5": "YELLOW", "E-6_1": "YELLOW", "E-6_2": "YELLOW", "E-6_3": "YELLOW", "E-6_4": "YELLOW", "E-7_1": "YELLOW", "E-7_2": "GREEN", "E-7_2_1": "RED", "E-7_2_2": "RED", "E-7_3": "YELLOW", "E-7_4": "YELLOW", "E-7_5": "GREEN", "E-7_5_1": "RED", "E-7_5_2": "RED", "E-7_6": "YELLOW", "E-8_1": "YELLOW", "E-8_2": "GREEN", "E-8_2_1": "RED", "E-8_2_2": "RED", "E-8_3": "YELLOW", "E-9_1": "YELLOW", "E-9_2": "YELLOW", "E-9_3": "GREEN", "E-9_3_1": "RED", "E-9_3_2": "RED", "E-9_4": "YELLOW", "E-9_5": "YELLOW", "E-10_1": "YELLOW", "E-10_2": "YELLOW", "E-10_3": "GREEN", "E-10_3_1": "RED", "E-10_3_2": "RED", "E-10_4": "YELLOW", "E-10_5": "YELLOW", "E-10_6": "YELLOW", "E-11_1": "YELLOW", "E-11_2": "YELLOW", "E-11_3": "YELLOW", "E-12_1": "YELLOW", "E-12_2": "GREEN", "E-12_2_1": "RED", "E-12_2_2": "RED", "E-12_3": "YELLOW", "E-13_1": "RED", "E-13_2": "RED", "E-13_3": "RED", "E-13_4": "RED", "E-13_5": "RED"
    },
    "CG - CEVRAEM": {
      "E-1_1": "YELLOW", "E-1_2": "YELLOW", "E-2_1": "YELLOW", "E-2_2": "RED", "E-2_2_1": "YELLOW", "E-2_2_2": "YELLOW", "E-2_3": "YELLOW", "E-3_1": "YELLOW", "E-3_2": "RED", "E-3_2_1": "YELLOW", "E-3_2_2": "YELLOW", "E-3_3": "YELLOW", "E-3_4": "YELLOW", "E-4_1": "YELLOW", "E-4_2": "RED", "E-4_2_1": "YELLOW", "E-4_2_2": "YELLOW", "E-4_3": "YELLOW", "E-5_1": "YELLOW", "E-5_2": "YELLOW", "E-5_3": "YELLOW", "E-5_4": "RED", "E-5_4_1": "YELLOW", "E-5_4_2": "YELLOW", "E-5_5": "YELLOW", "E-6_1": "YELLOW", "E-6_2": "YELLOW", "E-6_3": "YELLOW", "E-6_4": "YELLOW", "E-7_1": "YELLOW", "E-7_2": "RED", "E-7_2_1": "YELLOW", "E-7_2_2": "YELLOW", "E-7_3": "YELLOW", "E-7_4": "YELLOW", "E-7_5": "RED", "E-7_5_1": "YELLOW", "E-7_5_2": "YELLOW", "E-7_6": "YELLOW", "E-8_1": "YELLOW", "E-8_2": "RED", "E-8_2_1": "YELLOW", "E-8_2_2": "YELLOW", "E-8_3": "YELLOW", "E-9_1": "YELLOW", "E-9_2": "YELLOW", "E-9_3": "RED", "E-9_3_1": "YELLOW", "E-9_3_2": "YELLOW", "E-9_4": "YELLOW", "E-9_5": "YELLOW", "E-10_1": "YELLOW", "E-10_2": "YELLOW", "E-10_3": "RED", "E-10_3_1": "YELLOW", "E-10_3_2": "YELLOW", "E-10_4": "YELLOW", "E-10_5": "YELLOW", "E-10_6": "YELLOW", "E-11_1": "YELLOW", "E-11_2": "YELLOW", "E-11_3": "YELLOW", "E-12_1": "YELLOW", "E-12_2": "RED", "E-12_2_1": "YELLOW", "E-12_2_2": "YELLOW", "E-12_3": "YELLOW", "E-13_1": "RED", "E-13_2": "RED", "E-13_3": "RED", "E-13_4": "RED", "E-13_5": "RED"
    },
    "CG - 31 BRIG INF": {
      "E-1_1": "GREEN", "E-1_2": "GREEN", "E-2_1": "GREEN", "E-2_2": "RED", "E-2_2_1": "GREEN", "E-2_2_2": "GREEN", "E-2_3": "GREEN", "E-3_1": "GREEN", "E-3_2": "RED", "E-3_2_1": "GREEN", "E-3_2_2": "GREEN", "E-3_3": "GREEN", "E-3_4": "GREEN", "E-4_1": "GREEN", "E-4_2": "RED", "E-4_2_1": "GREEN", "E-4_2_2": "GREEN", "E-4_3": "GREEN", "E-5_1": "GREEN", "E-5_2": "GREEN", "E-5_3": "GREEN", "E-5_4": "RED", "E-5_4_1": "GREEN", "E-5_4_2": "GREEN", "E-5_5": "GREEN", "E-6_1": "GREEN", "E-6_2": "GREEN", "E-6_3": "GREEN", "E-6_4": "GREEN", "E-7_1": "GREEN", "E-7_2": "RED", "E-7_2_1": "GREEN", "E-7_2_2": "GREEN", "E-7_3": "GREEN", "E-7_4": "GREEN", "E-7_5": "RED", "E-7_5_1": "GREEN", "E-7_5_2": "GREEN", "E-7_6": "GREEN", "E-8_1": "GREEN", "E-8_2": "RED", "E-8_2_1": "GREEN", "E-8_2_2": "GREEN", "E-8_3": "GREEN", "E-9_1": "GREEN", "E-9_2": "GREEN", "E-9_3": "RED", "E-9_3_1": "GREEN", "E-9_3_2": "GREEN", "E-9_4": "GREEN", "E-9_5": "GREEN", "E-10_1": "GREEN", "E-10_2": "GREEN", "E-10_3": "RED", "E-10_3_1": "GREEN", "E-10_3_2": "GREEN", "E-10_4": "GREEN", "E-10_5": "GREEN", "E-10_6": "GREEN", "E-11_1": "GREEN", "E-11_2": "GREEN", "E-11_3": "GREEN", "E-12_1": "GREEN", "E-12_2": "RED", "E-12_2_1": "GREEN", "E-12_2_2": "GREEN", "E-12_3": "GREEN", "E-13_1": "RED", "E-13_2": "RED", "E-13_3": "RED", "E-13_4": "RED", "E-13_5": "RED"
    }
  };
};

const initialConfigPerRole = PERMISOS_BASE.reduce((acc, p) => { acc[p.id_fb] = { aprobar: [], rechazar: [] }; return acc; }, {});

// --- BLOQUE MAESTRO DE ESTILOS RESPONSIVE ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; }
    
    /* LOGIN SCREEN */
    .login-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #020617 100%); }
    .login-box { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); padding: 40px 50px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; width: 90%; max-width: 450px; }
    
    /* APP LAYOUT */
    .app-layout { display: flex; height: 100vh; overflow: hidden; background: #f1f5f9; color: #0f172a; }
    .sidebar { width: 300px; background: white; padding: 20px; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow-y: auto; z-index: 10; box-shadow: 2px 0 5px rgba(0,0,0,0.05); }
    .main-content { flex: 1; padding: 25px; overflow-y: auto; }
    
    /* COMPONENTES INTERNOS */
    .permiso-row { background: #ffffff; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; align-items: center; margin-bottom: 12px; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .permiso-row:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .permiso-text { flex: 1; padding-right: 20px; }
    .box-container { display: flex; flex-direction: column; align-items: center; min-width: 120px; justify-content: center; }
    
    .box-status { width: 100%; max-width: 110px; height: 38px; border-radius: 6px; border: 2px solid rgba(0,0,0,0.1); transition: all 0.3s; cursor: pointer; margin-bottom: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: block; margin-left: auto; margin-right: auto; }
    .box-green { background: #22c55e; }
    .box-yellow { background: #eab308; }
    .box-red { background: #ef4444; }
    .txt-status { font-size: 11px; font-weight: bold; width: 100%; text-align: center; color: #475569; display: block; margin-top: 4px; text-transform: uppercase; }
    
    .noti-container { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; }
    .noti-item { min-width: 280px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    
    /* MODALES */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 15px; }
    .modal-content-sm { background: white; padding: 25px; border-radius: 12px; width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); }
    .modal-content-lg { background: white; border-radius: 12px; width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); overflow: hidden; }
    .grid-config { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    
    @keyframes blink-border { 0% { border-color: #3b82f6; box-shadow: 0 0 12px #3b82f6; } 50% { border-color: transparent; box-shadow: none; } 100% { border-color: #3b82f6; box-shadow: 0 0 12px #3b82f6; } }
    .flash-active { animation: blink-border 1.5s infinite; border: 2px solid #3b82f6; }
    
    /* RESPONSIVE CELULAR MAGIA */
    @media (max-width: 768px) {
      .login-box { padding: 30px 20px; }
      .app-layout { flex-direction: column; overflow-y: auto; height: auto; min-height: 100vh; }
      .sidebar { width: 100%; height: auto; border-right: none; border-bottom: 2px solid #e2e8f0; padding: 15px; box-shadow: none; }
      .sidebar img { width: 100px !important; }
      .main-content { padding: 15px; overflow-y: visible; }
      
      .permiso-row { flex-direction: column; text-align: center; gap: 15px; padding: 20px 15px; }
      .permiso-text { padding-right: 0; }
      .box-container { width: 100%; border-top: 1px solid #f1f5f9; padding-top: 15px; }
      
      .grid-config { grid-template-columns: 1fr; gap: 15px; }
      .noti-item { min-width: 100%; margin-bottom: 10px; }
      .noti-container { flex-direction: column; }
    }
  `}} />
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [permisos, setPermisos, load1] = useFirebaseState('vraem_permisos_vfinal', initPermisos());
  const [requests, setRequests, load2] = useFirebaseState('vraem_requests_vfinal', []);
  const [autoModeActive, setAutoModeActive, load3] = useFirebaseState('vraem_autoModeActive_vfinal', { [ROLES.M3]: false, [ROLES.M2]: false });
  const [autoConfig, setAutoConfig, load4] = useFirebaseState('vraem_autoConfig_vfinal', { [ROLES.M3]: initialConfigPerRole, [ROLES.M2]: initialConfigPerRole });

  const [solicitarModal, setSolicitarModal] = useState({ open: false, permissionId: null, label: '', reason: RAZONES[0] });
  const [showConfig, setShowConfig] = useState(false);

  const isReady = load1 && load2 && load3 && load4;

  const handleConfigChange = (pId, accion, razon, isChecked) => {
    setAutoConfig(prev => {
      const newState = { ...prev };
      const c = { ...newState[currentUser][pId] };
      if (isChecked) {
        c[accion] = [...c[accion], razon];
        const otra = accion === 'aprobar' ? 'rechazar' : 'aprobar';
        c[otra] = c[otra].filter(r => r !== razon);
      } else {
        c[accion] = c[accion].filter(r => r !== razon);
      }
      newState[currentUser][pId] = c;
      return newState;
    });
  };

  const activarAutoMode = () => setShowConfig(true);

  const desactivarAutoMode = () => {
    setAutoModeActive(prev => ({ ...prev, [currentUser]: false }));
    setAutoConfig(prev => ({ ...prev, [currentUser]: initialConfigPerRole }));
    alert("Modo Manual activado. Se ha reiniciado tu configuración de automatización.");
  };

  const guardarConfiguracion = () => {
    setAutoModeActive(prev => ({ ...prev, [currentUser]: true }));
    setShowConfig(false);
    alert("¡Configuración guardada! Modo Automático ACTIVADO.");
  };

  const enviarSolicitudConMotivo = () => {
    const superior = currentUser === ROLES.M1 ? ROLES.M2 : ROLES.M3;
    const { permissionId, label, reason } = solicitarModal;
    
    if (autoModeActive[superior]) {
      const cSuperior = autoConfig[superior][permissionId];
      if (cSuperior.aprobar.includes(reason)) {
        if (superior !== ROLES.M3 && permisos[superior][permissionId] === ST.RETENIDA) {
          alert(`El ${superior} configuró auto-aprobación, pero él no posee la regla ${label}. Pasa a revisión manual.`);
        } else {
          setPermisos(prev => {
            const copy = { ...prev };
            copy[currentUser][permissionId] = ST.LIBERADA;
            copy[superior][permissionId] = ST.DELEGADA;
            return copy;
          });
          alert(`¡Liberado automáticamente por el ${superior}!`);
          setSolicitarModal({ open: false, permissionId: null, label: '', reason: RAZONES[0] });
          return;
        }
      } else if (cSuperior.rechazar.includes(reason)) {
        alert(`Denegado automáticamente por el ${superior}.`);
        setSolicitarModal({ open: false, permissionId: null, label: '', reason: RAZONES[0] });
        return;
      }
    }

    setRequests(prev => [...prev, { id: Date.now(), from: currentUser, to: superior, permissionId, label, reason }]);
    alert('Solicitud enviada a revisión.');
    setSolicitarModal({ open: false, permissionId: null, label: '', reason: RAZONES[0] });
  };

  const resolverSolicitud = (reqId, aprobar) => {
    const req = requests.find(r => r.id === reqId);
    if (aprobar) {
      if (currentUser !== ROLES.M3 && permisos[currentUser][req.permissionId] === ST.RETENIDA) {
        alert(`❌ ERROR: No tienes la regla ${req.label} en Verde o Amarillo. No puedes delegarla.`);
        return;
      }
      setPermisos(prev => {
        const copy = { ...prev };
        copy[req.from][req.permissionId] = ST.LIBERADA;
        copy[currentUser][req.permissionId] = ST.DELEGADA;
        return copy;
      });
    }
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const revocarPermiso = (pId_fb) => {
    setPermisos(prev => {
      const copy = { ...prev };
      copy[currentUser][pId_fb] = ST.LIBERADA; 
      if (currentUser === ROLES.M3) {
        copy[ROLES.M2][pId_fb] = ST.RETENIDA;
        copy[ROLES.M1][pId_fb] = ST.RETENIDA;
      } else if (currentUser === ROLES.M2) {
        copy[ROLES.M1][pId_fb] = ST.RETENIDA;
      }
      return copy;
    });
    alert("Permiso revocado a los escalones subordinados.");
  };

  const descargarDocumento = () => {
    setIsDownloading(true);
    const estadoActual = permisos[currentUser];
    
    const liberadas = PERMISOS_BASE.filter(p => estadoActual[p.id_fb] === ST.LIBERADA);
    const delegadas = PERMISOS_BASE.filter(p => estadoActual[p.id_fb] === ST.DELEGADA);
    
    const retenidasDirectas = [];
    const retenidas2doEscalon = [];
    
    PERMISOS_BASE.forEach(p => {
      if (estadoActual[p.id_fb] === ST.RETENIDA) {
        if (currentUser === ROLES.M1 && permisos[ROLES.M2][p.id_fb] === ST.RETENIDA && permisos[ROLES.M3][p.id_fb] === ST.RETENIDA) {
          retenidas2doEscalon.push(p);
        } else {
          retenidasDirectas.push(p);
        }
      }
    });

    let cargoFirma = '';
    let nombreFirmaImg = '';

    if (currentUser === ROLES.M3) {
      cargoFirma = 'PRESIDENTE DE LA REPÚBLICA';
      nombreFirmaImg = 'firma-presidente.png';
    } else if (currentUser === ROLES.M2) {
      cargoFirma = 'JEFE DEL COMANDO CONJUNTO DE LAS FUERZAS ARMADAS';
      nombreFirmaImg = 'firma-ccffaa.png';
    } else if (currentUser === ROLES.M1) {
      cargoFirma = 'COMANDANTE GENERAL DEL CE - VRAEM';
      nombreFirmaImg = 'firma-cevraem.png';
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
        <h1 style="text-align: center; font-size: 16px; text-decoration: underline; margin-bottom: 20px;">REGISTRO AUTOMATIZADO DE REGLAS DE CONDUCTA OPERATIVA</h1>
        <p style="font-size: 12px;"><strong>UNIDAD / COMANDO:</strong> ${currentUser}</p>
        <p style="font-size: 12px;"><strong>FECHA DE EMISIÓN:</strong> ${new Date().toLocaleDateString()}</p>

        ${liberadas.length > 0 ? `
          <h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">1. REGLAS LIBERADAS (AUTORIZADAS PARA USO)</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
            <tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>
            ${liberadas.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}
          </table>
        ` : ''}

        ${delegadas.length > 0 ? `
          <h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">2. REGLAS DELEGADAS AL ESCALÓN SUBORDINADO</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
            <tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>
            ${delegadas.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}
          </table>
        ` : ''}

        ${retenidasDirectas.length > 0 ? `
          <h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">3. REGLAS RETENIDAS (REQUIEREN AUTORIZACIÓN)</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
            <tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>
            ${retenidasDirectas.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}
          </table>
        ` : ''}

        ${retenidas2doEscalon.length > 0 ? `
          <h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">4. REGLAS RETENIDAS POR EL 2DO ESCALÓN SUPERIOR</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
            <tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>
            ${retenidas2doEscalon.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}
          </table>
        ` : ''}

        <div style="margin-top: 50px; text-align: center;">
          <img src="${window.location.origin}/${nombreFirmaImg}" style="max-width: 150px; max-height: 80px; display: block; margin: 0 auto 5px auto;" onerror="this.style.display='none'" />
          <p style="margin: 0; font-weight: bold; font-size: 11px; border-top: 1px solid #000; display: inline-block; padding-top: 5px;">${cargoFirma}</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt = {
      margin:       10,
      filename:     `REN_${currentUser.replace(/ /g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      setIsDownloading(false);
    });
  };

  const resetFirebaseDB = () => {
    if(window.confirm("¿Limpiar base de datos completa y reiniciar sistema con la matriz original?")) {
      set(ref(db, 'vraem_permisos_vfinal'), initPermisos());
      set(ref(db, 'vraem_requests_vfinal'), []);
      set(ref(db, 'vraem_autoModeActive_vfinal'), { [ROLES.M3]: false, [ROLES.M2]: false });
      set(ref(db, 'vraem_autoConfig_vfinal'), { [ROLES.M3]: initialConfigPerRole, [ROLES.M2]: initialConfigPerRole });
    }
  };

  if (!isReady) {
    return (
      <>
        <GlobalStyles />
        <div className="login-wrapper" style={{color: '#38bdf8'}}>
          <h2>Estableciendo conexión segura... 📡</h2>
        </div>
      </>
    );
  }

  const misNotificaciones = requests.filter(r => r.to === currentUser);

  if (!currentUser) {
    return (
      <>
        <GlobalStyles />
        <div className="login-wrapper">
          <div className="login-box">
            <img src="logo.png" alt="Escudo Militar" style={{ width: '120px', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
            <h1 style={{ color: '#f8fafc', fontSize: '20px', margin: '0 0 8px 0', letterSpacing: '1px' }}>SISTEMA AUTOMATIZADO</h1>
            <h2 style={{ color: '#38bdf8', fontSize: '13px', margin: '0 0 35px 0', fontWeight: '500', letterSpacing: '2px' }}>REGLAS DE ENFRENTAMIENTO (ROE)</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.values(ROLES).map(rol => (
                <button 
                  key={rol} 
                  onClick={() => setCurrentUser(rol)} 
                  style={{ background: 'linear-gradient(to right, #1e293b, #334155)', color: '#f8fafc', border: '1px solid #475569', padding: '16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{color: '#38bdf8', marginRight: '10px'}}>►</span> Ingresar como {rol}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <button onClick={resetFirebaseDB} style={{ background: 'transparent', color: '#64748b', border: '1px solid #334155', padding: '8px 15px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}>
                ⚠ Limpiar Base de Datos
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="app-layout">
        
        {/* SIDEBAR */}
        <div className="sidebar">
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <img src="logo.png" alt="Escudo" style={{width: '140px', margin: '0 auto'}} />
          </div>
          <h3 style={{fontSize: '15px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a', textAlign: 'center'}}>{currentUser}</h3>
          
          {currentUser !== ROLES.M1 && (
            <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0'}}>
              <h4 style={{margin: '0 0 10px 0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', textAlign: 'center'}}>Autorización Automática</h4>
              <button onClick={activarAutoMode} style={{width: '100%', padding: '10px', marginBottom: '8px', background: autoModeActive[currentUser] ? '#22c55e' : '#e2e8f0', color: autoModeActive[currentUser] ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'}}>
                MODO AUTOMÁTICO
              </button>
              <button onClick={desactivarAutoMode} style={{width: '100%', padding: '10px', background: !autoModeActive[currentUser] ? '#ef4444' : '#e2e8f0', color: !autoModeActive[currentUser] ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'}}>
                MODO MANUAL
              </button>
            </div>
          )}

          <button onClick={descargarDocumento} disabled={isDownloading} style={{background: isDownloading ? '#94a3b8' : '#38bdf8', color: 'white', border: 'none', padding: '12px', width: '100%', borderRadius: '6px', cursor: isDownloading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginBottom: '15px', fontSize: '12px'}}>
            {isDownloading ? 'GENERANDO PDF...' : '📄 DESCARGAR PDF'}
          </button>

          {currentUser !== ROLES.M1 && (
            <button onClick={() => setShowConfig(true)} style={{background: '#475569', color:'white', border:'none', padding:'12px', width:'100%', borderRadius:'6px', marginBottom:'20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'}}>
              ⚙️ CONFIGURAR REGLAS
            </button>
          )}
          
          <button onClick={() => setCurrentUser(null)} style={{marginTop: 'auto', background: 'transparent', color: '#ef4444', border:'1px solid #ef4444', padding:'10px', width:'100%', cursor:'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px'}}>
            ⬅ CERRAR SESIÓN
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          
          {/* NOTIFICACIONES */}
          <div style={{background: 'white', padding: '15px 20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
            <h3 style={{margin: '0 0 15px 0', display: 'flex', alignItems: 'center', fontSize: '16px'}}>
              🔔 Solicitudes Pendientes 
              {misNotificaciones.length > 0 && <span style={{background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '12px', marginLeft: '10px', animation: 'blink-border 1s infinite'}}>{misNotificaciones.length}</span>}
            </h3>
            {misNotificaciones.length === 0 ? <p style={{fontSize: '13px', color: '#64748b', margin: 0}}>No hay solicitudes en cola.</p> : (
              <div className="noti-container">
                {misNotificaciones.map(req => (
                  <div key={req.id} className="noti-item">
                    <p style={{margin: '0 0 5px 0', fontSize: '12px'}}><strong>{req.from}</strong> solicita:</p>
                    <p style={{margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: '#0f172a'}}>{req.label}</p>
                    <p style={{margin: '0 0 12px 0', fontSize: '12px', color: '#2563eb'}}>Motivo: {req.reason}</p>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button onClick={() => resolverSolicitud(req.id, true)} style={{flex: 1, background: '#22c55e', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize:'12px', fontWeight: 'bold'}}>Aprobar</button>
                      <button onClick={() => resolverSolicitud(req.id, false)} style={{flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize:'12px', fontWeight: 'bold'}}>Denegar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MATRIZ DE REGLAS */}
          <div style={{background: 'white', padding: '25px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
            <h2 style={{borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a'}}>Matriz de Reglas de Enfrentamiento</h2>
            
            <div>
              {PERMISOS_BASE.map(p => {
                const estado = permisos[currentUser][p.id_fb];
                const isPending = requests.some(r => r.to === currentUser && r.permissionId === p.id_fb);

                let boxClass = 'box-red';
                let textStatus = 'SOLICITAR';
                
                if (estado === ST.LIBERADA) { boxClass = 'box-green'; textStatus = 'DELEGAR (ACTIVO)'; }
                else if (estado === ST.DELEGADA) { boxClass = 'box-yellow'; textStatus = 'REVOCAR'; }

                const handleBoxClick = () => {
                  if (p.type === 'PROHIBITED') {
                    alert("Esta regla es una prohibición estipulada por ley y no puede ser solicitada, delegada ni liberada.");
                    return;
                  }
                  if (estado === ST.RETENIDA && currentUser !== ROLES.M3) {
                    setSolicitarModal({ open: true, permissionId: p.id_fb, label: p.label, reason: RAZONES[0] });
                  } else if (estado === ST.DELEGADA) {
                    if(window.confirm(`¿Revocar el permiso ${p.label} a los subordinados?`)) revocarPermiso(p.id_fb);
                  }
                };

                return (
                  <div key={p.id_fb} className="permiso-row">
                    <div className="permiso-text">
                      <strong style={{color: '#0f172a', fontSize: '15px', display: 'block', marginBottom: '6px'}}>{p.label}</strong>
                      <span style={{fontSize: '13px', color: '#475569', lineHeight: '1.5'}}>{p.name}</span>
                    </div>
                    <div className="box-container">
                      <div 
                        onClick={handleBoxClick}
                        className={`box-status ${boxClass} ${isPending ? 'flash-active' : ''}`}
                        title={p.type === 'PROHIBITED' ? 'Prohibido por Ley' : (estado === ST.DELEGADA ? 'Clic para Revocar' : (estado === ST.RETENIDA ? 'Clic para Solicitar' : ''))}
                      ></div>
                      <span className="txt-status">{p.type === 'PROHIBITED' ? 'RETENIDA' : textStatus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL SOLICITUD */}
        {solicitarModal.open && (
          <div className="modal-overlay">
            <div className="modal-content-sm">
              <h3 style={{marginTop: 0, fontSize: '18px'}}>Solicitar {solicitarModal.label}</h3>
              <p style={{fontSize: '13px', color: '#64748b', marginBottom: '15px'}}>Indique el motivo estratégico de la operación:</p>
              <select value={solicitarModal.reason} onChange={(e) => setSolicitarModal({...solicitarModal, reason: e.target.value})} style={{width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px'}}>
                {RAZONES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{display: 'flex', gap: '10px'}}>
                <button onClick={() => setSolicitarModal({ open: false, permissionId: null, label: '', reason: RAZONES[0]})} style={{flex: 1, padding: '12px', border: 'none', background: '#e2e8f0', color: '#475569', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold'}}>Cancelar</button>
                <button onClick={enviarSolicitudConMotivo} style={{flex: 1, padding: '12px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold'}}>Enviar a Revisión</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONFIG AUTO */}
        {showConfig && currentUser !== ROLES.M1 && (
          <div className="modal-overlay">
            <div className="modal-content-lg">
              <div style={{padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'}}>
                <h2 style={{margin: 0, fontSize: '18px', color: '#0f172a'}}>Configuración: Modo Automático</h2>
                <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#64748b'}}>Selecciona qué motivos desencadenan una respuesta automática.</p>
              </div>
              
              <div style={{padding: '25px', overflowY: 'auto', flex: 1, background: '#f1f5f9'}}>
                {PERMISOS_BASE.filter(p => p.type !== 'PROHIBITED').map(p => (
                  <div key={p.id_fb} style={{background: '#fff', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
                    <h4 style={{margin: '0 0 15px 0', fontSize: '15px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px'}}>{p.label} - {p.name.substring(0, 50)}...</h4>
                    <div className="grid-config">
                      <div style={{background: '#f0fdf4', padding: '15px', borderRadius: '6px', border: '1px solid #bbf7d0'}}>
                        <span style={{color: '#16a34a', fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>✅ Liberar si piden para:</span>
                        {RAZONES.map(razon => (
                          <label key={`apr-${p.id_fb}-${razon}`} style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px', cursor: 'pointer'}}>
                            <input type="checkbox" checked={autoConfig[currentUser][p.id_fb].aprobar.includes(razon)} onChange={(e) => handleConfigChange(p.id_fb, 'aprobar', razon, e.target.checked)} /> {razon}
                          </label>
                        ))}
                      </div>
                      <div style={{background: '#fef2f2', padding: '15px', borderRadius: '6px', border: '1px solid #fecaca'}}>
                        <span style={{color: '#dc2626', fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>❌ Denegar si piden para:</span>
                        {RAZONES.map(razon => (
                          <label key={`rec-${p.id_fb}-${razon}`} style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px', cursor: 'pointer'}}>
                            <input type="checkbox" checked={autoConfig[currentUser][p.id_fb].rechazar.includes(razon)} onChange={(e) => handleConfigChange(p.id_fb, 'rechazar', razon, e.target.checked)} /> {razon}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{padding: '20px 25px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                 <button onClick={() => setShowConfig(false)} style={{padding: '12px 25px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'}}>Cancelar</button>
                 <button onClick={guardarConfiguracion} style={{padding: '12px 25px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'}}>Guardar y Activar Auto</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

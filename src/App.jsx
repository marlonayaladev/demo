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

const ST = {
  LIBERADA: 'GREEN',
  DELEGADA: 'YELLOW',
  RETENIDA: 'RED',
  LIBERADA_LEY: 'LIBERADA_LEY',
  PROHIBIDA_LEY: 'PROHIBIDA_LEY'
};

// =====================================================================
// DATASET 1: REGLAS DE ENFRENTAMIENTO (REN) - TIEMPO DE GUERRA
// =====================================================================
const RAW_PERMISOS_REN = [
  { id: "E-1.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, en defensa propia, contra objetivos militares; durante el cumplimiento de sus deberes y funciones", type: ST.LIBERADA_LEY },
  { id: "E-1.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, en defensa de la Unidad, contra objetivos militares; durante el cumplimiento de sus deberes y funciones", type: ST.LIBERADA_LEY },
  { id: "E-2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para la protección y defensa de terceras personas.", type: ST.LIBERADA },
  { id: "E-2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel operacional; contra objetivos militares; para la protección de terceras personas.", type: ST.LIBERADA },
  { id: "E-2.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; para la protección de terceras personas.", type: ST.LIBERADA },
  { id: "E-2.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; para la protección y defensa de terceras personas.", type: ST.LIBERADA },
  { id: "E-2.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para la protección y defensa de terceras personas.", type: ST.LIBERADA },
  { id: "E-3.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de las armas de fuego pequeñas y ligeras; contra objetivos militares; para el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "E-3.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de las armas pesadas y convencionales de nivel operacional y otras capacidades; contra objetivos militares; para el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "E-3.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional, y otras capacidades de este nivel; contra objetivos militares; para el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "E-3.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; para el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "E-3.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de las armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "E-3.4", name: "Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares (personas) que, durante el cumplimiento de la misión, estando fuera de combate, pongan en peligro inminente de muerte a otras personas.", type: ST.LIBERADA },
  { id: "E-4.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra los integrantes de grupos hostiles, que interfieran con la libertad de movimiento.", type: ST.LIBERADA },
  { id: "E-4.2", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra grupos hostiles que interfieran con la libertad de movimiento.", type: ST.LIBERADA },
  { id: "E-4.2.1", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales de nivel operacional; contra grupos hostiles que interfieran con la libertad de movimiento.", type: ST.LIBERADA },
  { id: "E-4.2.2", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas; contra integrantes de grupos hostiles que interfieran con la libertad de movimiento.", type: ST.LIBERADA },
  { id: "E-4.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra grupos hostiles que interfieran con la libertad de movimiento.", type: ST.LIBERADA },
  { id: "E-5.1", name: "Se permite el empleo de la fuerza letal de armas de fuego pequeñas y ligeras; contra objetivos militares que, estando fuera de combate, pongan en peligro inminente a otras personas.", type: ST.LIBERADA },
  { id: "E-5.2", name: "Se permite el empleo de la fuerza letal de armas de fuego pequeñas y ligeras; contra objetivos militares; durante su búsqueda e intervención; siempre que no se hayan rendido.", type: ST.LIBERADA },
  { id: "E-5.3", name: "Se permite el empleo de la fuerza hasta el nivel letal de las armas de fuego pequeñas y ligeras; contra objetivos militares; para evitar su escape.", type: ST.LIBERADA },
  { id: "E-5.4", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas y convencionales de nivel operacional; contra objetivos militares; durante su búsqueda e intervención.", type: ST.LIBERADA },
  { id: "E-5.4.1", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales de nivel operacional; contra objetivos militares; durante su búsqueda e intervención.", type: ST.LIBERADA },
  { id: "E-5.4.2", name: "Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas; contra objetivos militares; durante su búsqueda e intervención.", type: ST.LIBERADA },
  { id: "E-5.5", name: "Se permite el empleo de la fuerza hasta el nivel letal de las armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante su búsqueda e intervención.", type: ST.LIBERADA },
  { id: "E-6.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes.", type: ST.LIBERADA },
  { id: "E-6.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel operacional; contra objetivos militares; para liberar personas retenidas.", type: ST.LIBERADA },
  { id: "E-6.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para liberar personas retenidas.", type: ST.LIBERADA },
  { id: "E-6.4", name: "Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes; siempre que, exista peligro inminente de muerte.", type: ST.LIBERADA },
  { id: "E-7.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, contra objetivos militares; para proteger instalaciones de uso militar, vehículos, buques y aeronaves.", type: ST.LIBERADA },
  { id: "E-7.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional; contra objetivos militares; para proteger instalaciones de uso militar y activos críticos.", type: ST.LIBERADA },
  { id: "E-7.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional; contra objetivos militares; para proteger instalaciones de uso militar y activos críticos.", type: ST.LIBERADA },
  { id: "E-7.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; para proteger instalaciones de uso militar y activos críticos.", type: ST.LIBERADA },
  { id: "E-7.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para proteger instalaciones de uso militar.", type: ST.LIBERADA },
  { id: "E-7.4", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para liberar, recuperar, ocupar o controlar instalaciones y vehículos.", type: ST.LIBERADA },
  { id: "E-7.5", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional; contra objetivos militares; para liberar, recuperar o controlar instalaciones y vehículos.", type: ST.LIBERADA },
  { id: "E-7.5.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional; contra objetivos militares; para liberar o recuperar instalaciones y vehículos.", type: ST.LIBERADA },
  { id: "E-7.5.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; para liberar o recuperar instalaciones y vehículos.", type: ST.LIBERADA },
  { id: "E-7.6", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para liberar, recuperar o controlar instalaciones.", type: ST.LIBERADA },
  { id: "E-8.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; durante maniobras tácticas para el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "E-8.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional; objetivos militares; durante maniobras de nivel operacional y táctico.", type: ST.LIBERADA },
  { id: "E-8.2.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional; objetivos militares; durante maniobras de nivel operacional y táctico.", type: ST.LIBERADA },
  { id: "E-8.2.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; objetivos militares; durante maniobras de nivel operacional y táctico.", type: ST.LIBERADA },
  { id: "E-8.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante maniobras estratégicas y operacionales.", type: ST.LIBERADA },
  { id: "E-9.1", name: "Se permite el empleo de iluminación con pirotécnicos o munición de iluminación; durante las acciones de seguimiento, vigilancia y desvío de objetivos en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-9.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pequeñas y ligeras; contra objetivos militares; durante las acciones de seguimiento y vigilancia en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-9.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional; contra objetivos militares; durante las acciones de seguimiento en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-9.3.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional; contra objetivos militares; durante seguimiento en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-9.3.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; durante seguimiento en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-9.4", name: "Se permite el empleo de fuego incapacitante durante las acciones de seguimiento, vigilancia y desvío de embarcaciones en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-9.5", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y de nivel estratégico; contra objetivos militares; durante seguimiento en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.1", name: "Se permite el empleo de iluminación con pirotécnicos o munición de iluminación; durante las acciones de interdicción de objetivos militares en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pequeñas y ligeras; contra objetivos militares; durante las acciones de interdicción en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.3", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional; contra objetivos militares; durante interdicción en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.3.1", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales de nivel operacional; contra objetivos militares; durante interdicción en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.3.2", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas; contra objetivos militares; durante interdicción en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.4", name: "Se permite el empleo de fuego incapacitante durante las acciones de interdicción de embarcaciones tripuladas por objetivos militares en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.5", name: "Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y de nivel estratégico; contra objetivos militares; durante interdicción en espacios acuáticos.", type: ST.LIBERADA },
  { id: "E-10.6", name: "Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares; durante interdicción en espacios acuáticos si existe peligro inminente de muerte.", type: ST.LIBERADA },
  { id: "E-11.1", name: "Se permite el empleo de la fuerza, hasta el nivel de disparos de advertencia, en el espacio aéreo nacional; durante la identificación, intervención y persuasión.", type: ST.LIBERADA },
  { id: "E-11.2", name: "Se permite el empleo de la fuerza letal, en el espacio aéreo nacional; para neutralizar objetivos militares si la persuasión falla.", type: ST.LIBERADA },
  { id: "E-11.3", name: "Se permite el empleo de la fuerza letal, en el espacio aéreo nacional; para neutralizar objetivos militares si existe peligro inminente de muerte.", type: ST.LIBERADA },
  { id: "E-12.1", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas y ligeras; para su captura, destrucción o neutralización durante operaciones militares planificadas.", type: ST.LIBERADA },
  { id: "E-12.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional; para captura o destrucción durante operaciones planificadas.", type: ST.LIBERADA },
  { id: "E-12.2.1", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas convencionales operacionales; para captura o destrucción durante operaciones planificadas.", type: ST.LIBERADA },
  { id: "E-12.2.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pesadas; para su captura o destrucción durante operaciones militares planificadas.", type: ST.LIBERADA },
  { id: "E-12.3", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas convencionales estratégicas; para captura o destrucción durante operaciones militares planificadas.", type: ST.LIBERADA },
  { id: "E-13.1", name: "Empleo de la fuerza no letal (menos letal) en forma arbitraria; en toda circunstancia y lugar.", type: ST.PROHIBIDA_LEY },
  { id: "E-13.2", name: "Empleo de la fuerza letal, en forma arbitraria; en toda circunstancia y lugar.", type: ST.PROHIBIDA_LEY },
  { id: "E-13.3", name: "Empleo de la fuerza con daño incidental excesivo comparado con la ventaja militar concreta y directa.", type: ST.PROHIBIDA_LEY },
  { id: "E-13.4", name: "Empleo de fuerza letal contra grupos con daño incidental excesivo.", type: ST.PROHIBIDA_LEY },
  { id: "E-13.5", name: "Realizar ataques indiscriminados.", type: ST.PROHIBIDA_LEY }
];

const initPermisosREN = () => {
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

// =====================================================================
// DATASET 2: REGLAS DE USO DE LA FUERZA (RUF) - TIEMPO DE PAZ
// =====================================================================
const RAW_PERMISOS_RUF = [
  { id: "U-1.1", name: "Se permite el uso de la fuerza no letal (menos letal) en defensa propia.", type: ST.LIBERADA },
  { id: "U-1.2", name: "Se permite el uso de la fuerza, hasta llegar al nivel letal de armas de fuego pequeñas, en defensa propia siempre que exista peligro inminente de muerte o lesiones graves.", type: ST.LIBERADA },
  { id: "U-1.3", name: "Se permite el uso de la fuerza no letal (menos letal) en autodefensa de la unidad.", type: ST.LIBERADA },
  { id: "U-1.4", name: "Se permite el uso de la fuerza, hasta llegar al nivel letal de armas de fuego pequeñas, en autodefensa de la unidad; siempre que exista peligro inminente.", type: ST.LIBERADA },
  { id: "U-2.1", name: "Se permite el uso de la fuerza no letal; en contra de las amenazas que no sean grupos hostiles, para la protección de otras personas.", type: ST.LIBERADA },
  { id: "U-2.2", name: "Se permite el uso de la fuerza, hasta llegar al nivel letal de armas pequeñas; para proteger a otras personas frente a peligro inminente.", type: ST.LIBERADA },
  { id: "U-2.3", name: "Se permite el uso de la fuerza, hasta llegar al nivel letal de armas ligeras; en contra de organizaciones criminales; para proteger a personas.", type: ST.LIBERADA },
  { id: "U-3.1", name: "Se permite el uso de la fuerza no letal (menos letal); contra amenazas que no sean grupos hostiles, y que interfieran con la misión.", type: ST.LIBERADA },
  { id: "U-3.2", name: "Se permite el uso de la fuerza no letal (menos letal); contra grupo de personas que interfieren con el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "U-3.3", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; contra amenazas que no sean grupos hostiles, y que impidan la misión.", type: ST.LIBERADA },
  { id: "U-3.4", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; contra grupo de personas que interfieren con el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "U-3.5", name: "Se permite hacer uso de la fuerza letal por los tiradores selectos (francotiradores) contra amenazas que no sean grupos hostiles; ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-3.6", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas ligeras; en contra de las organizaciones criminales; para el cumplimiento de la misión.", type: ST.LIBERADA },
  { id: "U-4.1", name: "Se permite realizar disparos de advertencia con munición de fogueo.", type: ST.LIBERADA },
  { id: "U-4.2", name: "Se permite realizar disparos de advertencia con munición real sobre trampa balas u otros que garanticen la no afectación a terceros.", type: ST.LIBERADA },
  { id: "U-4.3", name: "Realizar disparos de advertencia con munición real al aire o sobre superficies que generen rebotes.", type: ST.LIBERADA },
  { id: "U-5.1", name: "Se permite el uso de la fuerza no letal; contra amenazas o grupos que interfieran con la libertad de movimiento de una fuerza militar.", type: ST.LIBERADA },
  { id: "U-5.2", name: "Se permite el uso de la fuerza no letal; contra amenazas o grupos que interfieran con la libertad de tránsito de personas y vehículos.", type: ST.LIBERADA },
  { id: "U-5.3", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; contra amenazas que interfieran con la libertad de movimiento; ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-5.4", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; contra amenazas que interfieran con la libertad de tránsito; ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-6.1", name: "Se permite el uso de la fuerza no letal; en contra de amenazas que no sean grupos hostiles, y que interfieran con la búsqueda de personas.", type: ST.LIBERADA },
  { id: "U-6.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; en contra de amenazas que interfieran con la búsqueda de personas.", type: ST.LIBERADA },
  { id: "U-6.3", name: "Se permite el uso de la fuerza no letal; en contra de amenazas que interfieran con la búsqueda de personas requisitoriadas por la justicia.", type: ST.LIBERADA },
  { id: "U-6.4", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; en contra de amenazas que interfieran con la búsqueda de requisitoriados.", type: ST.LIBERADA },
  { id: "U-6.5", name: "Se permite el uso de la fuerza no letal; en contra de amenazas, para la intervención de personas requisitoriadas o sospechosas.", type: ST.LIBERADA },
  { id: "U-6.6", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; para la intervención de personas requisitoriadas o sospechosas.", type: ST.LIBERADA },
  { id: "U-6.7", name: "Se permite el uso de la fuerza no letal; para evitar el escape de personas requisitoriadas o sospechosas.", type: ST.LIBERADA },
  { id: "U-6.8", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; para evitar el escape de personas requisitoriadas o sospechosas.", type: ST.LIBERADA },
  { id: "U-7.1", name: "Se permite el uso de la fuerza hasta el nivel letal en contra de amenazas que no sean grupos hostiles para asegurar la liberación de personas.", type: ST.LIBERADA },
  { id: "U-7.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; para asegurar la liberación de personas civiles y personal militar retenido.", type: ST.LIBERADA },
  { id: "U-7.3", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas ligeras; en contra de las amenazas para asegurar la liberación de personas retenidas.", type: ST.LIBERADA },
  { id: "U-8.1", name: "Se permite el uso de la fuerza no letal; para proteger instalaciones, vehículos, buques y aeronaves de las Fuerzas Armadas.", type: ST.LIBERADA },
  { id: "U-8.2", name: "Se permite el uso de la fuerza hasta el nivel letal de armas pequeñas; para proteger instalaciones, vehículos, buques y aeronaves.", type: ST.LIBERADA },
  { id: "U-8.3", name: "Se permite el uso de la fuerza no letal; para liberar instalaciones, vehículos, buques y aeronaves de las Fuerzas Armadas.", type: ST.LIBERADA },
  { id: "U-8.4", name: "Se permite el uso de la fuerza hasta el nivel letal de armas pequeñas; para liberar instalaciones, vehículos, buques y aeronaves.", type: ST.LIBERADA },
  { id: "U-8.5", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas ligeras; en contra de organizaciones criminales; para la protección de instalaciones.", type: ST.LIBERADA },
  { id: "U-8.6", name: "Se permite el uso de la fuerza no letal; para proteger instalaciones estratégicas, servicios públicos esenciales y activos críticos nacionales.", type: ST.LIBERADA },
  { id: "U-8.7", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; para proteger instalaciones estratégicas y servicios públicos esenciales.", type: ST.LIBERADA },
  { id: "U-8.8", name: "Se permite el uso de la fuerza no letal; para liberar instalaciones estratégicas, servicios públicos esenciales y activos críticos.", type: ST.LIBERADA },
  { id: "U-8.9", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas ligeras; para liberar instalaciones estratégicas y activos críticos.", type: ST.LIBERADA },
  { id: "U-8.10", name: "Se permite el uso de la fuerza no letal; en contra de amenazas que no sean grupos hostiles, para el registro de propiedades.", type: ST.LIBERADA },
  { id: "U-8.11", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; en contra de amenazas o grupos que interfieran en el registro de propiedades.", type: ST.LIBERADA },
  { id: "U-8.12", name: "Se permite el uso de la fuerza no letal; en contra de amenazas, para la incautación de bienes dentro de las propiedades.", type: ST.LIBERADA },
  { id: "U-8.13", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; contra amenazas que interfieran con la incautación de bienes.", type: ST.LIBERADA },
  { id: "U-8.14", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas ligeras; en contra de las organizaciones criminales para protección de activos.", type: ST.LIBERADA },
  { id: "U-9.1", name: "Se permite el uso de la fuerza no letal; durante las acciones de seguimiento, vigilancia y desvío de contactos en espacios acuáticos.", type: ST.LIBERADA },
  { id: "U-9.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; durante el seguimiento y desvío de embarcaciones en espacios acuáticos.", type: ST.LIBERADA },
  { id: "U-10.1", name: "Se permite el uso de la fuerza no letal; en contra de amenazas durante la interdicción de contactos de interés en espacios acuáticos.", type: ST.LIBERADA },
  { id: "U-10.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; durante la interdicción de contactos en espacios acuáticos.", type: ST.LIBERADA },
  { id: "U-10.3", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas ligeras; en contra de las organizaciones criminales; para la interdicción en espacios acuáticos.", type: ST.LIBERADA },
  { id: "U-11.1", name: "Se permite el uso de la fuerza, hasta el nivel de disparos de advertencia en el espacio aéreo nacional; durante la identificación e intervención.", type: ST.LIBERADA },
  { id: "E-11.2", name: "Se permite el uso de la fuerza, hasta el nivel letal; en contra de aeronaves hostiles, durante la interceptación si acciones de persuasión fallan (peligro inminente).", type: ST.LIBERADA },
  { id: "U-11.3", name: "Se permite el uso de la fuerza, hasta el nivel letal; en contra de aeronaves hostiles, durante la interceptación en zona de identificación aérea.", type: ST.LIBERADA },
  { id: "U-12.1", name: "Se permite el uso de la fuerza no letal; en contra de amenazas que no sean grupos hostiles, para evitar la comisión de un delito.", type: ST.LIBERADA },
  { id: "U-12.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; para evitar la comisión de un delito ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-12.3", name: "Se permite el uso de la fuerza no letal; en contra de amenazas que no sean grupos hostiles, durante el registro a una persona intervenida.", type: ST.LIBERADA },
  { id: "U-12.4", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; durante el registro a una persona intervenida; ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-12.5", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; para desarmar a una persona intervenida; ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-12.6", name: "Se permite el uso de la fuerza no letal; en contra de amenazas que no sean grupos hostiles, en caso se presenten disturbios civiles.", type: ST.LIBERADA },
  { id: "U-12.7", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; en caso se presenten disturbios civiles; ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-13.1", name: "Se permite el uso de la fuerza no letal; contra amenazas que interfieran con acciones militares en escenarios de ayuda humanitaria o desastres.", type: ST.LIBERADA },
  { id: "U-13.2", name: "Se permite el uso de la fuerza, hasta el nivel letal de armas pequeñas; contra amenazas que interfieran con ayuda humanitaria; ante peligro inminente.", type: ST.LIBERADA },
  { id: "U-14.1", name: "Uso de la fuerza no letal (menos letal) en forma arbitraria; contra amenazas, en toda circunstancia y lugar.", type: ST.PROHIBIDA_LEY },
  { id: "U-14.2", name: "Uso de la fuerza, hasta el nivel letal en forma arbitraria; contra amenazas, en toda circunstancia y lugar.", type: ST.PROHIBIDA_LEY },
  { id: "U-14.3", name: "Uso de la fuerza no letal; contra amenazas, en toda circunstancia; y que exista certeza de que ocasione grave daño colateral.", type: ST.PROHIBIDA_LEY },
  { id: "U-14.4", name: "Uso de la fuerza, hasta el nivel letal; contra amenazas, en toda circunstancia; y que exista certeza de que ocasione grave daño colateral.", type: ST.PROHIBIDA_LEY },
  { id: "U-14.5", name: "Realizar disparos indiscriminados.", type: ST.PROHIBIDA_LEY }
];

const initPermisosRUF = () => {
  return {
    "JEFE DEL CCFFAA": {
      "U-1_1": "YELLOW", "U-1_2": "YELLOW", "U-1_3": "YELLOW", "U-1_4": "YELLOW", "U-2_1": "YELLOW", "U-2_2": "YELLOW", "U-2_3": "YELLOW", "U-3_1": "YELLOW", "U-3_2": "YELLOW", "U-3_3": "YELLOW", "U-3_4": "YELLOW", "U-3_5": "YELLOW", "U-3_6": "YELLOW", "U-4_1": "YELLOW", "U-4_2": "YELLOW", "U-4_3": "YELLOW", "U-5_1": "YELLOW", "U-5_2": "YELLOW", "U-5_3": "YELLOW", "U-5_4": "YELLOW", "U-6_1": "YELLOW", "U-6_2": "YELLOW", "U-6_3": "YELLOW", "U-6_4": "YELLOW", "U-6_5": "YELLOW", "U-6_6": "YELLOW", "U-6_7": "YELLOW", "U-6_8": "YELLOW", "U-7_1": "YELLOW", "U-7_2": "YELLOW", "U-7_3": "YELLOW", "U-8_1": "YELLOW", "U-8_2": "YELLOW", "U-8_3": "YELLOW", "U-8_4": "YELLOW", "U-8_5": "YELLOW", "U-8_6": "YELLOW", "U-8_7": "YELLOW", "U-8_8": "YELLOW", "U-8_9": "YELLOW", "U-8_10": "YELLOW", "U-8_11": "YELLOW", "U-8_12": "YELLOW", "U-8_13": "YELLOW", "U-8_14": "YELLOW", "U-9_1": "YELLOW", "U-9_2": "YELLOW", "U-10_1": "YELLOW", "U-10_2": "YELLOW", "U-10_3": "YELLOW", "U-11_1": "YELLOW", "E-11_2": "YELLOW", "U-11_3": "YELLOW", "U-12_1": "YELLOW", "U-12_2": "YELLOW", "U-12_3": "YELLOW", "U-12_4": "YELLOW", "U-12_5": "YELLOW", "U-12_6": "YELLOW", "U-12_7": "YELLOW", "U-13_1": "YELLOW", "U-13_2": "YELLOW", "U-14_1": "RED", "U-14_2": "RED", "U-14_3": "RED", "U-14_4": "RED", "U-14_5": "RED"
    },
    "CG - CEVRAEM": {
      "U-1_1": "YELLOW", "U-1_2": "YELLOW", "U-1_3": "YELLOW", "U-1_4": "YELLOW", "U-2_1": "YELLOW", "U-2_2": "YELLOW", "U-2_3": "YELLOW", "U-3_1": "YELLOW", "U-3_2": "YELLOW", "U-3_3": "YELLOW", "U-3_4": "YELLOW", "U-3_5": "YELLOW", "U-3_6": "YELLOW", "U-4_1": "YELLOW", "U-4_2": "YELLOW", "U-4_3": "YELLOW", "U-5_1": "YELLOW", "U-5_2": "YELLOW", "U-5_3": "YELLOW", "U-5_4": "YELLOW", "U-6_1": "YELLOW", "U-6_2": "YELLOW", "U-6_3": "YELLOW", "U-6_4": "YELLOW", "U-6_5": "YELLOW", "U-6_6": "YELLOW", "U-6_7": "YELLOW", "U-6_8": "YELLOW", "U-7_1": "YELLOW", "U-7_2": "YELLOW", "U-7_3": "YELLOW", "U-8_1": "YELLOW", "U-8_2": "YELLOW", "U-8_3": "YELLOW", "U-8_4": "YELLOW", "U-8_5": "YELLOW", "U-8_6": "YELLOW", "U-8_7": "YELLOW", "U-8_8": "YELLOW", "U-8_9": "YELLOW", "U-8_10": "YELLOW", "U-8_11": "YELLOW", "U-8_12": "YELLOW", "U-8_13": "YELLOW", "U-8_14": "YELLOW", "U-9_1": "YELLOW", "U-9_2": "YELLOW", "U-10_1": "YELLOW", "U-10_2": "YELLOW", "U-10_3": "YELLOW", "U-11_1": "YELLOW", "E-11_2": "YELLOW", "U-11_3": "YELLOW", "U-12_1": "YELLOW", "U-12_2": "YELLOW", "U-12_3": "YELLOW", "U-12_4": "YELLOW", "U-12_5": "YELLOW", "U-12_6": "YELLOW", "U-12_7": "YELLOW", "U-13_1": "YELLOW", "U-13_2": "YELLOW", "U-14_1": "RED", "U-14_2": "RED", "U-14_3": "RED", "U-14_4": "RED", "U-14_5": "RED"
    },
    "CG - 31 BRIG INF": {
      "U-1_1": "GREEN", "U-1_2": "GREEN", "U-1_3": "GREEN", "U-1_4": "GREEN", "U-2_1": "GREEN", "U-2_2": "GREEN", "U-2_3": "GREEN", "U-3_1": "GREEN", "U-3_2": "GREEN", "U-3_3": "GREEN", "U-3_4": "GREEN", "U-3_5": "GREEN", "U-3_6": "GREEN", "U-4_1": "GREEN", "U-4_2": "GREEN", "U-4_3": "GREEN", "U-5_1": "GREEN", "U-5_2": "GREEN", "U-5_3": "GREEN", "U-5_4": "GREEN", "U-6_1": "GREEN", "U-6_2": "GREEN", "U-6_3": "GREEN", "U-6_4": "GREEN", "U-6_5": "GREEN", "U-6_6": "GREEN", "U-6_7": "GREEN", "U-6_8": "GREEN", "U-7_1": "GREEN", "U-7_2": "GREEN", "U-7_3": "GREEN", "U-8_1": "GREEN", "U-8_2": "GREEN", "U-8_3": "GREEN", "U-8_4": "GREEN", "U-8_5": "GREEN", "U-8_6": "GREEN", "U-8_7": "GREEN", "U-8_8": "GREEN", "U-8_9": "GREEN", "U-8_10": "GREEN", "U-8_11": "GREEN", "U-8_12": "GREEN", "U-8_13": "GREEN", "U-8_14": "GREEN", "U-9_1": "GREEN", "U-9_2": "GREEN", "U-10_1": "GREEN", "U-10_2": "GREEN", "U-10_3": "GREEN", "U-11_1": "GREEN", "E-11_2": "GREEN", "U-11_3": "GREEN", "U-12_1": "GREEN", "U-12_2": "GREEN", "U-12_3": "GREEN", "U-12_4": "GREEN", "U-12_5": "GREEN", "U-12_6": "GREEN", "U-12_7": "GREEN", "U-13_1": "GREEN", "U-13_2": "GREEN", "U-14_1": "RED", "U-14_2": "RED", "U-14_3": "RED", "U-14_4": "RED", "U-14_5": "RED"
    }
  };
};

// --- BLOQUE DE ESTILOS ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; }
    .login-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #020617 100%); }
    .login-box { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; width: 90%; max-width: 500px; }
    .app-layout { display: flex; height: 100vh; overflow: hidden; background: #f1f5f9; color: #0f172a; }
    .sidebar { width: 300px; background: white; padding: 20px; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow-y: auto; z-index: 10; box-shadow: 2px 0 5px rgba(0,0,0,0.05); }
    .main-content { flex: 1; padding: 25px; overflow-y: auto; }
    .permiso-row { background: #ffffff; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; align-items: center; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .box-container { display: flex; flex-direction: column; align-items: center; min-width: 120px; justify-content: center; }
    .box-status { width: 100%; max-width: 110px; height: 38px; border-radius: 6px; border: 2px solid rgba(0,0,0,0.1); cursor: pointer; margin-bottom: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: block; margin-left: auto; margin-right: auto; }
    .box-green { background: #22c55e; } .box-yellow { background: #eab308; } .box-red { background: #ef4444; }
    .txt-status { font-size: 11px; font-weight: bold; width: 100%; text-align: center; color: #475569; display: block; margin-top: 4px; text-transform: uppercase; }
    .noti-container { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; }
    .noti-item { min-width: 280px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 15px; }
    .modal-content-sm { background: white; padding: 25px; border-radius: 12px; width: 100%; max-width: 400px; }
    .modal-content-lg { background: white; border-radius: 12px; width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
    .btn-menu { background: linear-gradient(to right, #1e293b, #334155); color: #f8fafc; border: 1px solid #475569; padding: 20px; border-radius: 12px; font-size: 14px; font-weight: bold; cursor: pointer; text-transform: uppercase; display: block; width: 100%; margin-bottom: 15px; transition: transform 0.2s; }
    .btn-menu:active { transform: scale(0.98); }
    @keyframes blink-border { 0% { border-color: #3b82f6; box-shadow: 0 0 12px #3b82f6; } 50% { border-color: transparent; } 100% { border-color: #3b82f6; box-shadow: 0 0 12px #3b82f6; } }
    .flash-active { animation: blink-border 1.5s infinite; border: 2px solid #3b82f6; }
    @media (max-width: 768px) {
      .app-layout { flex-direction: column; overflow-y: auto; height: auto; min-height: 100vh; }
      .sidebar { width: 100%; height: auto; border-right: none; border-bottom: 2px solid #e2e8f0; padding: 15px; }
      .permiso-row { flex-direction: column; text-align: center; gap: 15px; padding: 20px 15px; }
    }
  `}} />
);

// --- COMPONENTE CENTRAL (Se reinicia según si es REN o RUF) ---
function SystemCore({ sistemaActivo, onBack }) {
  const isREN = sistemaActivo === 'REN';
  const RAW_PERMISOS = isREN ? RAW_PERMISOS_REN : RAW_PERMISOS_RUF;
  const dbSuffix = isREN ? 'ren' : 'ruf';
  
  // Limpiamos los IDs de puntos y espacios para evitar bug de pantalla blanca
  const PERMISOS_BASE = RAW_PERMISOS.map(p => ({ ...p, id_fb: p.id.replace(/\./g, '_').replace(/\s/g, ''), label: p.id }));
  const initialConfigPerRole = PERMISOS_BASE.reduce((acc, p) => { acc[p.id_fb] = { aprobar: [], rechazar: [] }; return acc; }, {});

  const [currentUser, setCurrentUser] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Rutas en Firebase dinámicas para separar Guerra (REN) de Paz (RUF)
  const [permisos, setPermisos, load1] = useFirebaseState(`vraem_permisos_${dbSuffix}`, isREN ? initPermisosREN() : initPermisosRUF());
  const [requests, setRequests, load2] = useFirebaseState(`vraem_req_${dbSuffix}`, []);
  const [autoModeActive, setAutoModeActive, load3] = useFirebaseState(`vraem_autoMode_${dbSuffix}`, { [ROLES.M3]: false, [ROLES.M2]: false });
  const [autoConfig, setAutoConfig, load4] = useFirebaseState(`vraem_autoConf_${dbSuffix}`, { [ROLES.M3]: initialConfigPerRole, [ROLES.M2]: initialConfigPerRole });

  const [solicitarModal, setSolicitarModal] = useState({ open: false, permissionId: null, label: '', reason: RAZONES[0] });
  const [showConfig, setShowConfig] = useState(false);

  const isReady = load1 && load2 && load3 && load4;

  const handleConfigChange = (pId, accion, razon, isChecked) => {
    setAutoConfig(prev => {
      const newState = { ...prev };
      if (!newState[currentUser]) newState[currentUser] = {};
      const c = { ...(newState[currentUser]?.[pId] || { aprobar: [], rechazar: [] }) };
      
      if (isChecked) {
        c[accion] = [...(c[accion] || []), razon];
        const otra = accion === 'aprobar' ? 'rechazar' : 'aprobar';
        c[otra] = (c[otra] || []).filter(r => r !== razon);
      } else {
        c[accion] = (c[accion] || []).filter(r => r !== razon);
      }
      newState[currentUser][pId] = c;
      return newState;
    });
  };

  const activarAutoMode = () => setShowConfig(true);

  const desactivarAutoMode = () => {
    setAutoModeActive(prev => ({ ...prev, [currentUser]: false }));
    setAutoConfig(prev => ({ ...prev, [currentUser]: initialConfigPerRole }));
    alert("Modo Manual activado. Se ha reiniciado la automatización.");
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
      const cSuperior = autoConfig[superior]?.[permissionId] || { aprobar: [], rechazar: [] };
      if ((cSuperior.aprobar || []).includes(reason)) {
        if (superior !== ROLES.M3 && permisos[superior]?.[permissionId] === ST.RETENIDA) {
          alert(`El ${superior} tiene auto-aprobación, pero él no posee la regla ${label}. Pasa a revisión manual.`);
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
      } else if ((cSuperior.rechazar || []).includes(reason)) {
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
      if (currentUser !== ROLES.M3 && permisos[currentUser]?.[req.permissionId] === ST.RETENIDA) {
        alert(`❌ ERROR: No tienes la regla ${req.label} disponible. No puedes delegarla.`);
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
    alert("Permiso revocado a los subordinados.");
  };

  const descargarDocumento = () => {
    setIsDownloading(true);
    const estadoActual = permisos[currentUser] || {};
    
    const liberadas = PERMISOS_BASE.filter(p => estadoActual[p.id_fb] === ST.LIBERADA);
    const delegadas = PERMISOS_BASE.filter(p => estadoActual[p.id_fb] === ST.DELEGADA);
    
    const retenidasDirectas = [];
    const retenidas2doEscalon = [];
    
    PERMISOS_BASE.forEach(p => {
      if (estadoActual[p.id_fb] === ST.RETENIDA && p.type !== ST.PROHIBIDA_LEY) {
        if (currentUser === ROLES.M1 && permisos[ROLES.M2]?.[p.id_fb] === ST.RETENIDA && permisos[ROLES.M3]?.[p.id_fb] === ST.RETENIDA) {
          retenidas2doEscalon.push(p);
        } else {
          retenidasDirectas.push(p);
        }
      }
    });

    const prohibidas = PERMISOS_BASE.filter(p => p.type === ST.PROHIBIDA_LEY);

    let cargoFirma = currentUser === ROLES.M3 ? 'PRESIDENTE DE LA REPÚBLICA' : (currentUser === ROLES.M2 ? 'JEFE DEL CCFFAA' : 'CG CEVRAEM');
    let nombreFirmaImg = currentUser === ROLES.M3 ? 'firma-presidente.png' : (currentUser === ROLES.M2 ? 'firma-ccffaa.png' : 'firma-cevraem.png');
    let tituloDoc = isREN ? 'REGLAS DE ENFRENTAMIENTO (REN) - TIEMPO DE GUERRA' : 'REGLAS DE USO DE LA FUERZA (RUF) - TIEMPO DE PAZ';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
        <h1 style="text-align: center; font-size: 16px; text-decoration: underline; margin-bottom: 20px;">REGISTRO AUTOMATIZADO: ${tituloDoc}</h1>
        <p style="font-size: 12px;"><strong>UNIDAD / COMANDO:</strong> ${currentUser}</p>
        <p style="font-size: 12px;"><strong>FECHA DE EMISIÓN:</strong> ${new Date().toLocaleDateString()}</p>

        ${liberadas.length > 0 ? `<h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">1. REGLAS LIBERADAS (AUTORIZADAS PARA USO)</h2><table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;"><tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>${liberadas.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}</table>` : ''}
        ${delegadas.length > 0 ? `<h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">2. REGLAS DELEGADAS AL ESCALÓN SUBORDINADO</h2><table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;"><tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>${delegadas.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}</table>` : ''}
        ${retenidasDirectas.length > 0 ? `<h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">3. REGLAS RETENIDAS (REQUIEREN AUTORIZACIÓN)</h2><table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;"><tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>${retenidasDirectas.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}</table>` : ''}
        ${retenidas2doEscalon.length > 0 ? `<h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">4. REGLAS RETENIDAS POR EL 2DO ESCALÓN SUPERIOR</h2><table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;"><tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>${retenidas2doEscalon.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}</table>` : ''}
        ${prohibidas.length > 0 ? `<h2 style="font-size: 12px; background: #e2e8f0; padding: 4px; margin-top: 15px;">5. REGLAS PROHIBIDAS POR LEY (NO AUTORIZADAS)</h2><table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;"><tr><th style="border: 1px solid #000; padding: 4px; background: #f8fafc; width: 15%;">CÓDIGO</th><th style="border: 1px solid #000; padding: 4px; background: #f8fafc;">DESCRIPCIÓN</th></tr>${prohibidas.map(p => `<tr><td style="border: 1px solid #000; padding: 4px;"><strong>${p.label}</strong></td><td style="border: 1px solid #000; padding: 4px;">${p.name}</td></tr>`).join('')}</table>` : ''}

        <div style="margin-top: 50px; text-align: center;">
          <img src="${window.location.origin}/${nombreFirmaImg}" style="max-width: 150px; max-height: 80px; display: block; margin: 0 auto 5px auto;" onerror="this.style.display='none'" />
          <p style="margin: 0; font-weight: bold; font-size: 11px; border-top: 1px solid #000; display: inline-block; padding-top: 5px;">${cargoFirma}</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    html2pdf().from(element).set({ margin: 10, filename: `DOC_${isREN ? 'REN' : 'RUF'}_${currentUser.replace(/ /g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).save().then(() => setIsDownloading(false));
  };

  const resetFirebaseDB = () => {
    if(window.confirm(`¿Resetear BD de ${isREN ? 'REN (Guerra)' : 'RUF (Paz)'} a la matriz oficial por defecto?`)) {
      set(ref(db, `vraem_permisos_${dbSuffix}`), isREN ? initPermisosREN() : initPermisosRUF());
      set(ref(db, `vraem_req_${dbSuffix}`), []);
      set(ref(db, `vraem_autoMode_${dbSuffix}`), { [ROLES.M3]: false, [ROLES.M2]: false });
      set(ref(db, `vraem_autoConf_${dbSuffix}`), { [ROLES.M3]: initialConfigPerRole, [ROLES.M2]: initialConfigPerRole });
      alert("Base de datos limpia y lista.");
    }
  };

  if (!isReady) return <><GlobalStyles /><div className="login-wrapper" style={{color: '#38bdf8'}}><h2>Cargando matriz {sistemaActivo}... 📡</h2></div></>;

  const misNotificaciones = requests.filter(r => r.to === currentUser);

  if (!currentUser) {
    return (
      <>
        <GlobalStyles />
        <div className="login-wrapper">
          <div className="login-box">
            <img src="logo.png" alt="Escudo Militar" style={{ width: '120px', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
            <h1 style={{ color: '#f8fafc', fontSize: '20px', margin: '0 0 8px 0', letterSpacing: '1px' }}>ACCESO: {isREN ? 'REN' : 'RUF'}</h1>
            <h2 style={{ color: '#38bdf8', fontSize: '12px', margin: '0 0 35px 0', fontWeight: '500', letterSpacing: '2px' }}>{isREN ? 'MARCO: TIEMPO DE GUERRA' : 'MARCO: TIEMPO DE PAZ'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.values(ROLES).map(rol => (
                <button key={rol} onClick={() => setCurrentUser(rol)} style={{ background: 'linear-gradient(to right, #1e293b, #334155)', color: '#f8fafc', border: '1px solid #475569', padding: '16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>► Ingresar como {rol}</button>
              ))}
            </div>

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <button onClick={onBack} style={{ background: 'transparent', color: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: '12px' }}>⬅ Cambiar Marco</button>
              <button onClick={resetFirebaseDB} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>⚠ Reset BD</button>
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
        <div className="sidebar">
          <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <img src="logo.png" alt="Escudo" style={{width: '120px', margin: '0 auto'}} />
          </div>
          <h3 style={{fontSize: '15px', marginBottom: '10px', color: '#0f172a', textAlign: 'center'}}>{currentUser}</h3>
          <p style={{textAlign: 'center', fontSize: '11px', background: '#3b82f6', color: 'white', padding: '5px', borderRadius: '4px', marginBottom: '20px'}}>MODO: {isREN ? 'REN (GUERRA)' : 'RUF (PAZ)'}</p>
          
          {currentUser !== ROLES.M1 && (
            <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0'}}>
              <h4 style={{margin: '0 0 10px 0', color: '#475569', fontSize: '11px', textTransform: 'uppercase', textAlign: 'center'}}>Autorización Automática</h4>
              <button onClick={activarAutoMode} style={{width: '100%', padding: '10px', marginBottom: '8px', background: autoModeActive[currentUser] ? '#22c55e' : '#e2e8f0', color: autoModeActive[currentUser] ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'}}>MODO AUTOMÁTICO</button>
              <button onClick={desactivarAutoMode} style={{width: '100%', padding: '10px', background: !autoModeActive[currentUser] ? '#ef4444' : '#e2e8f0', color: !autoModeActive[currentUser] ? 'white' : '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'}}>MODO MANUAL</button>
            </div>
          )}

          <button onClick={descargarDocumento} disabled={isDownloading} style={{background: isDownloading ? '#94a3b8' : '#38bdf8', color: 'white', border: 'none', padding: '12px', width: '100%', borderRadius: '6px', cursor: isDownloading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginBottom: '15px', fontSize: '12px'}}>{isDownloading ? 'GENERANDO PDF...' : '📄 DESCARGAR PDF'}</button>
          
          {currentUser !== ROLES.M1 && (
            <button onClick={() => setShowConfig(true)} style={{background: '#475569', color:'white', border:'none', padding:'12px', width:'100%', borderRadius:'6px', marginBottom:'20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'}}>⚙️ CONFIGURAR REGLAS</button>
          )}
          
          <button onClick={() => setCurrentUser(null)} style={{marginTop: 'auto', background: 'transparent', color: '#ef4444', border:'1px solid #ef4444', padding:'10px', width:'100%', cursor:'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px'}}>⬅ CERRAR SESIÓN</button>
        </div>

        <div className="main-content">
          {misNotificaciones.length > 0 && (
            <div style={{background: 'white', padding: '15px 20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
              <h3 style={{margin: '0 0 15px 0', display: 'flex', alignItems: 'center', fontSize: '16px'}}>🔔 Solicitudes Pendientes <span style={{background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '12px', marginLeft: '10px', animation: 'blink-border 1s infinite'}}>{misNotificaciones.length}</span></h3>
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
            </div>
          )}

          <div style={{background: 'white', padding: '25px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
            <h2 style={{borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a'}}>Matriz de Reglas: {isREN ? 'Enfrentamiento (REN)' : 'Uso de la Fuerza (RUF)'}</h2>
            <div>
              {PERMISOS_BASE.map(p => {
                const estado = permisos[currentUser]?.[p.id_fb] || ST.RETENIDA;
                const isPending = requests.some(r => r.to === currentUser && r.permissionId === p.id_fb);

                let boxClass = 'box-red';
                let textStatus = 'SOLICITAR';
                
                if (estado === ST.LIBERADA) { boxClass = 'box-green'; textStatus = p.type === ST.LIBERADA_LEY ? 'LIBRE POR LEY' : 'DELEGAR (ACTIVO)'; } 
                else if (estado === ST.DELEGADA) { boxClass = 'box-yellow'; textStatus = 'REVOCAR'; } 
                else if (estado === ST.RETENIDA) { boxClass = 'box-red'; textStatus = p.type === ST.PROHIBIDA_LEY ? 'PROHIBIDO (LEY)' : 'SOLICITAR'; }

                const handleBoxClick = () => {
                  if (p.type === ST.LIBERADA_LEY) return alert("Esta regla es Libre por Ley y está autorizada para todos los niveles.");
                  if (p.type === ST.PROHIBIDA_LEY) return alert("Esta regla es una prohibición estipulada por ley y no puede ser solicitada, delegada ni liberada.");
                  if (estado === ST.RETENIDA && currentUser !== ROLES.M3) setSolicitarModal({ open: true, permissionId: p.id_fb, label: p.label, reason: RAZONES[0] });
                  else if (estado === ST.DELEGADA && window.confirm(`¿Revocar el permiso ${p.label} a los subordinados?`)) revocarPermiso(p.id_fb);
                };

                return (
                  <div key={p.id_fb} className="permiso-row">
                    <div className="permiso-text">
                      <strong style={{color: '#0f172a', fontSize: '15px', display: 'block', marginBottom: '6px'}}>{p.label}</strong>
                      <span style={{fontSize: '13px', color: '#475569', lineHeight: '1.5'}}>{p.name}</span>
                    </div>
                    <div className="box-container">
                      <div onClick={handleBoxClick} className={`box-status ${boxClass} ${isPending ? 'flash-active' : ''}`} title={p.type === ST.PROHIBIDA_LEY ? 'Prohibido por Ley' : (estado === ST.DELEGADA ? 'Clic para Revocar' : (estado === ST.RETENIDA ? 'Clic para Solicitar' : ''))}></div>
                      <span className="txt-status">{p.type === ST.PROHIBIDA_LEY ? 'RETENIDA' : textStatus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {solicitarModal.open && (
          <div className="modal-overlay">
            <div className="modal-content-sm">
              <h3 style={{marginTop: 0, fontSize: '18px'}}>Solicitar {solicitarModal.label}</h3>
              <p style={{fontSize: '13px', color: '#64748b', marginBottom: '15px'}}>Indique el motivo estratégico:</p>
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

        {showConfig && currentUser !== ROLES.M1 && (
          <div className="modal-overlay">
            <div className="modal-content-lg">
              <div style={{padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'}}>
                <h2 style={{margin: 0, fontSize: '18px', color: '#0f172a'}}>Configuración: Modo Automático</h2>
              </div>
              <div style={{padding: '25px', overflowY: 'auto', flex: 1, background: '#f1f5f9'}}>
                {PERMISOS_BASE.filter(p => p.type !== ST.LIBERADA_LEY && p.type !== ST.PROHIBIDA_LEY).map(p => {
                  const configRegla = autoConfig[currentUser]?.[p.id_fb] || { aprobar: [], rechazar: [] };
                  return (
                    <div key={p.id_fb} style={{background: '#fff', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '15px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
                      <h4 style={{margin: '0 0 15px 0', fontSize: '15px'}}>{p.label} - {p.name.substring(0, 50)}...</h4>
                      <div className="grid-config">
                        <div style={{background: '#f0fdf4', padding: '15px', borderRadius: '6px', border: '1px solid #bbf7d0'}}>
                          <span style={{color: '#16a34a', fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>✅ Liberar si piden para:</span>
                          {RAZONES.map(r => <label key={`apr-${p.id_fb}-${r}`} style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px', cursor: 'pointer'}}><input type="checkbox" checked={(configRegla.aprobar || []).includes(r)} onChange={(e) => handleConfigChange(p.id_fb, 'aprobar', r, e.target.checked)} /> {r}</label>)}
                        </div>
                        <div style={{background: '#fef2f2', padding: '15px', borderRadius: '6px', border: '1px solid #fecaca'}}>
                          <span style={{color: '#dc2626', fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>❌ Denegar si piden para:</span>
                          {RAZONES.map(r => <label key={`rec-${p.id_fb}-${r}`} style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '8px', cursor: 'pointer'}}><input type="checkbox" checked={(configRegla.rechazar || []).includes(r)} onChange={(e) => handleConfigChange(p.id_fb, 'rechazar', r, e.target.checked)} /> {r}</label>)}
                        </div>
                      </div>
                    </div>
                  )
                })}
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

// --- PANTALLA DE SELECCIÓN INICIAL ---
export default function MainApp() {
  const [systemType, setSystemType] = useState(null);

  if (!systemType) {
    return (
      <>
        <GlobalStyles />
        <div className="login-wrapper">
          <div className="login-box" style={{maxWidth: '600px'}}>
            <img src="logo.png" alt="Escudo Militar" style={{ width: '130px', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
            <h1 style={{ color: '#f8fafc', fontSize: '22px', margin: '0 0 8px 0', letterSpacing: '1px' }}>SISTEMA DE CONDUCTA OPERATIVA</h1>
            <h2 style={{ color: '#64748b', fontSize: '13px', margin: '0 0 40px 0', fontWeight: '400' }}>Seleccione el marco normativo aplicable a la misión</h2>
            
            <button className="btn-menu" style={{borderColor: '#ef4444', borderLeft: '5px solid #ef4444'}} onClick={() => setSystemType('REN')}>
              <span style={{display: 'block', fontSize: '16px', color: '#f8fafc', marginBottom: '5px'}}>⚔️ Reglas de Enfrentamiento (REN)</span>
              <span style={{display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 'normal'}}>Operaciones militares en TIEMPO DE GUERRA</span>
            </button>

            <button className="btn-menu" style={{borderColor: '#22c55e', borderLeft: '5px solid #22c55e'}} onClick={() => setSystemType('RUF')}>
              <span style={{display: 'block', fontSize: '16px', color: '#f8fafc', marginBottom: '5px'}}>🛡️ Reglas de Uso de la Fuerza (RUF)</span>
              <span style={{display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 'normal'}}>Apoyo a la PNP en TIEMPO DE PAZ</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  // La key obliga a React a reiniciar todos los hooks de Firebase al cambiar de REN a RUF
  return <SystemCore key={systemType} sistemaActivo={systemType} onBack={() => setSystemType(null)} />;
}
import React, { useState, useEffect } from 'react';
import './App.css'; 

// --- HOOK MÁGICO PARA SINCRONIZAR PESTAÑAS ---
function useSharedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    const onStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [key]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [state, setValue];
}

// --- CONFIGURACIÓN DE USUARIOS Y RAZONES ---
const ROLES = { M3: 'JEFE DEL CCFFAA', M2: 'JEFE DEL CE-VRAEM', M1: 'CMDTE 31 BRIG INF' };
const RAZONES = ['Situación de Emergencia', 'Apoyo Táctico', 'Mantenimiento']; 

// --- BASE DE DATOS DE REGLAS (Las 52 del Excel) ---
const PERMISOS_BASE = [
  { id: 'E-1.1', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, en defensa propia, contra objetivos militares; durante el cumplimiento de sus deberes y funciones' },
  { id: 'E-1.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, en defensa de la Unidad, contra objetivos militares; durante el cumplimiento de sus deberes y funciones' },
  { id: 'E-2.1', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).' },
  { id: 'E-2.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel operacional; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).' },
  { id: 'E-2.3', name: 'Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para la protección y defensa de terceras personas (civiles, miembros de la PNP y otros miembros de las Fuerzas Armadas).' },
  { id: 'E-3.1', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de las armas de fuego pequeñas y ligeras; contra objetivos militares; para el cumplimiento de la misión.' },
  { id: 'E-3.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de las armas pesadas y convencionales de nivel operacional y otras capacidades; contra objetivos militares; para el cumplimiento de la misión.' },
  { id: 'E-3.3', name: 'Se permite el empleo de la fuerza hasta el nivel letal de las armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para el cumplimiento de la misión.' },
  { id: 'E-3.4', name: 'Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares (personas) que, durante el cumplimiento de la misión, estando fuera de combate (rendidos, heridos o detenidos), pongan en peligro inminente de muerte o lesiones graves a otras personas.' },
  { id: 'E-4.1', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra los integrantes de grupos hostiles, que interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.' },
  { id: 'E-4.2', name: 'Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra los integrantes de grupos hostiles que, interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.' },
  { id: 'E-4.3', name: 'Se permite el empleo de la fuerza hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra los miembros de grupos hostiles, que interfieran con la libertad de movimiento y maniobra de una fuerza militar y/o la libertad de tránsito de personas, vehículos, embarcaciones y otros.' },
  { id: 'E-5.1', name: 'Se permite el empleo de la fuerza letal de armas de fuego pequeñas y ligeras; contra objetivos militares que, estando fuera de combate (rendidos, heridos o detenidos), durante las operaciones de intervención y la búsqueda de personas; pongan en peligro inminente de muerte o lesiones graves a otras personas.' },
  { id: 'E-5.2', name: 'Se permite el empleo de la fuerza letal de armas de fuego pequeñas y ligeras; contra objetivos militares; durante su búsqueda e intervención; siempre que, no se hayan rendido o no se encuentren fuera de combate.' },
  { id: 'E-5.3', name: 'Se permite el empleo de la fuerza hasta el nivel letal de las armas de fuego pequeñas y ligeras; contra objetivos militares; para evitar su escape.' },
  { id: 'E-5.4', name: 'Se permite el empleo de la fuerza hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; durante su búsqueda e intervención.' },
  { id: 'E-5.5', name: 'Se permite el empleo de la fuerza hasta el nivel letal de las armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante su búsqueda e intervención.' },
  { id: 'E-6.1', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes.' },
  { id: 'E-6.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel operacional; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes.' },
  { id: 'E-6.3', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para liberar personas retenidas ilegalmente o tomados como rehenes.' },
  { id: 'E-6.4', name: 'Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares; para liberar personas retenidas ilegalmente o tomadas como rehenes; siempre que, exista peligro inminente de muerte o lesiones graves de los rehenes.' },
  { id: 'E-7.1', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, contra objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.' },
  { id: 'E-7.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra los objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.' },
  { id: 'E-7.3', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para proteger instalaciones de uso militar, vehículos, buques, embarcaciones y/o aeronaves de las Fuerzas Armadas; así como, instalaciones estratégicas, servicios públicos esenciales, activos críticos nacionales y recursos clave entre otros.' },
  { id: 'E-7.4', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.' },
  { id: 'E-7.5', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.' },
  { id: 'E-7.6', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; para liberar, recuperar, ocupar, controlar y registrar instalaciones, vehículos, buques, embarcaciones y/o aeronaves, entre otros.' },
  { id: 'E-8.1', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras; contra objetivos militares; durante la configuración y ejecución de maniobras tácticas para el cumplimiento de la misión.' },
  { id: 'E-8.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; objetivos militares; durante la configuración y ejecución de maniobras de nivel operacional y táctico para el cumplimiento de la misión.' },
  { id: 'E-8.3', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante la configuración y ejecución de maniobras estratégicas, operacionales y tácticas para el cumplimiento de la misión' },
  { id: 'E-9.1', name: 'Se permite el empleo de iluminación con pirotécnicos, granadas o munición de iluminación; durante las acciones de seguimiento, vigilancia y desvío de objetivos militares en espacios acuáticos nacionales.' },
  { id: 'E-9.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas pequeñas y ligeras; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.' },
  { id: 'E-9.3', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.' },
  { id: 'E-9.4', name: 'Se permite el empleo de fuego incapacitante durante las acciones de seguimiento, vigilancia y desvío de embarcaciones tripulados por objetivos militares; en espacios acuáticos nacionales.' },
  { id: 'E-9.5', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante las acciones de seguimiento, vigilancia y desvío; en espacios acuáticos nacionales.' },
  { id: 'E-10.1', name: 'Se permite el empleo de iluminación con pirotécnicos, granadas o munición de iluminación; durante las acciones de interdicción de objetivos militares; en espacios acuáticos nacionales.' },
  { id: 'E-10.2', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas pequeñas y ligeras; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales.' },
  { id: 'E-10.3', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales.' },
  { id: 'E-10.4', name: 'Se permite el empleo de fuego incapacitante durante las acciones de interdicción de embarcaciones tripulados por objetivos militares; en espacios acuáticos nacionales.' },
  { id: 'E-10.5', name: 'Se permite el empleo de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico; contra objetivos militares; durante las acciones de interdicción; en espacios acuáticos nacionales' },
  { id: 'E-10.6', name: 'Se permite el empleo de la fuerza, hasta el nivel letal; contra objetivos militares; durante las acciones de interdicción en espacios acuáticos nacionales; siempre que, exista peligro inminente de muerte o lesiones graves de terceras personas.' },
  { id: 'E-11.1', name: 'Se permite el empleo de la fuerza, hasta el nivel de disparos de advertencia, en el espacio aéreo nacional; durante las medidas de identificación, intervención y persuasión de objetivos militares.' },
  { id: 'E-11.2', name: 'Se permite el empleo de la fuerza letal, en el espacio aéreo nacional; para neutralizar objetivos militares; siempre que, las medidas de identificación, intervención o persuasión, respectivamente, no hayan logrado los efectos correspondientes.' },
  { id: 'E-11.3', name: 'Se permite el empleo de la fuerza letal, en el espacio aéreo nacional; para neutralizar objetivos militares; siempre que, exista peligro inminente de muerte o lesiones graves de terceras personas.' },
  { id: 'E-12.1', name: 'Se permite el uso de la fuerza, hasta el nivel letal de armas de fuego pequeñas y ligeras, contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.' },
  { id: 'E-12.2', name: 'Se permite el uso de la fuerza, hasta el nivel letal de armas pesadas y convencionales de nivel operacional, y otras capacidades, contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.' },
  { id: 'E-12.3', name: 'Se permite el uso de la fuerza, hasta el nivel letal de armas convencionales y otras capacidades de nivel estratégico, contra objetivos militares; para su captura, conquista, destrucción, degradación, neutralización o control; durante el desarrollo de operaciones militares planificadas.' },
  { id: 'E-13.1', name: 'Empleo de la fuerza no letal (menos letal) en forma arbitraria; en toda circunstancia y lugar.' },
  { id: 'E-13.2', name: 'Empleo de la fuerza letal, en forma arbitraria; en toda circunstancia y lugar.' },
  { id: 'E-13.3', name: 'Empleo de la fuerza no letal (menos letal); en toda circunstancia y lugar; y que existe alto grado de certeza de que el daño incidental sería excesivo comparado con la ventaja militar concreta y directa prevista.' },
  { id: 'E-13.4', name: 'Empleo de la fuerza letal; contra grupos hostiles, en toda circunstancia y lugar; y que existe alto grado de certeza de que el daño incidental sería excesivo comparado con la ventaja militar concreta y directa prevista.' },
  { id: 'E-13.5', name: 'Realizar ataques indiscriminados' }
];

// Inicializamos la configuración vacía para que cada jefe (M3 y M2) tenga sus propias reglas
const initialConfigPerRole = PERMISOS_BASE.reduce((acc, p) => {
  acc[p.id] = { aprobar: [], rechazar: [] }; // Guarda qué razones aprueban o rechazan
  return acc;
}, {});

export default function App() {
  const [currentUser, setCurrentUser] = useSharedState('app_currentUser', null);
  
  const [permisos, setPermisos] = useSharedState('app_permisos', {
    [ROLES.M3]: PERMISOS_BASE.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
    [ROLES.M2]: PERMISOS_BASE.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}),
    [ROLES.M1]: PERMISOS_BASE.reduce((acc, p) => ({ ...acc, [p.id]: false }), {})
  });

  const [requests, setRequests] = useSharedState('app_requests', []);
  const [autoModeActive, setAutoModeActive] = useSharedState('app_autoModeActive', { [ROLES.M3]: false, [ROLES.M2]: false });
  
  // Ahora autoConfig separa la configuración del Jefe CCFFAA y del Jefe VRAEM
  const [autoConfig, setAutoConfig] = useSharedState('app_autoConfig', {
    [ROLES.M3]: initialConfigPerRole,
    [ROLES.M2]: initialConfigPerRole
  });

  const [solicitarModal, setSolicitarModal] = useState({ open: false, permissionId: null, reason: RAZONES[0] });
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Maneja los checks del panel de configuración
  const handleConfigChange = (pId, accion, razon, isChecked) => {
    setAutoConfig(prev => {
      const newState = { ...prev };
      const configDelUsuarioActual = { ...newState[currentUser] };
      const configDeLaRegla = { ...configDelUsuarioActual[pId] };

      if (isChecked) {
        configDeLaRegla[accion] = [...configDeLaRegla[accion], razon];
        // Desmarcar de la otra lista para evitar contradicciones
        const otraAccion = accion === 'aprobar' ? 'rechazar' : 'aprobar';
        configDeLaRegla[otraAccion] = configDeLaRegla[otraAccion].filter(r => r !== razon);
      } else {
        configDeLaRegla[accion] = configDeLaRegla[accion].filter(r => r !== razon);
      }

      configDelUsuarioActual[pId] = configDeLaRegla;
      newState[currentUser] = configDelUsuarioActual;
      return newState;
    });
  };

  const enviarSolicitudConMotivo = () => {
    const superior = currentUser === ROLES.M1 ? ROLES.M2 : ROLES.M3;
    const { permissionId, reason } = solicitarModal;
    
    // Si el superior tiene el modo activo, evaluamos la razón enviada
    if (autoModeActive[superior]) {
      const configDelSuperior = autoConfig[superior][permissionId];
      
      if (configDelSuperior.aprobar.includes(reason)) {
        alert(`¡Liberado automáticamente! El ${superior} aprobó esta acción para "${reason}".`);
        setPermisos(prev => ({ ...prev, [currentUser]: { ...prev[currentUser], [permissionId]: true } }));
        setSolicitarModal({ open: false, permissionId: null, reason: RAZONES[0] });
        return;
      } else if (configDelSuperior.rechazar.includes(reason)) {
        alert(`Denegado. El ${superior} tiene bloqueada la liberación para "${reason}".`);
        setSolicitarModal({ open: false, permissionId: null, reason: RAZONES[0] });
        return;
      }
      // Si la razón no está ni en aprobar ni en rechazar, cae a revisión manual por defecto
    }

    // Flujo normal (o manual por defecto)
    const newReq = { id: Date.now(), from: currentUser, to: superior, permissionId, reason };
    setRequests(prev => [...prev, newReq]);
    if(autoModeActive[superior]){
        alert('Enviado a revisión. (El superior no tiene una regla automática para esta razón específica).');
    }
    setSolicitarModal({ open: false, permissionId: null, reason: RAZONES[0] });
  };

  const resolverSolicitud = (reqId, aprobar) => {
    const req = requests.find(r => r.id === reqId);
    if (aprobar) {
      setPermisos(prev => ({ ...prev, [req.from]: { ...prev[req.from], [req.permissionId]: true } }));
    }
    setRequests(prev => prev.filter(r => r.id !== reqId));
    if (requests.length === 1) setShowNotificaciones(false);
  };

  const misNotificaciones = requests.filter(r => r.to === currentUser);

  if (!currentUser) {
    return (
      <div className="login-screen" style={{overflowY: 'auto'}}>
        <h1 style={{marginBottom: '30px', textAlign: 'center'}}>Sistema de Reglas de Enfrentamiento</h1>
        {Object.values(ROLES).map(rol => (
          <button key={rol} onClick={() => setCurrentUser(rol)} className="login-btn">
            Ingresar como {rol}
          </button>
        ))}
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{marginTop: '50px', background: 'transparent', color: '#666', border: '1px solid #666', padding: '5px 10px', cursor: 'pointer'}}>
          Reiniciar Base de Datos Local
        </button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <div className="sidebar" style={{width: '280px'}}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <img 
            src="https://cdn-icons-png.flaticon.com/512/1164/1164328.png" 
            alt="Escudo" 
            style={{width: '100px', height: 'auto', margin: '0 auto'}} 
          />
        </div>

        <h3 style={{fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid #475569', paddingBottom: '10px'}}>{currentUser}</h3>
        
        {currentUser !== ROLES.M1 && (
          <div className="panel-auto" style={{background: '#0f172a'}}>
            <h4 style={{margin: '0 0 15px 0', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase'}}>Control de Autorización</h4>
            
            <button 
              onClick={() => setAutoModeActive(prev => ({ ...prev, [currentUser]: true }))}
              style={{width: '100%', padding: '10px', marginBottom: '5px', background: autoModeActive[currentUser] ? '#22c55e' : '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
            >
              MODO ACTIVO
            </button>
            <button 
              onClick={() => setAutoModeActive(prev => ({ ...prev, [currentUser]: false }))}
              style={{width: '100%', padding: '10px', background: !autoModeActive[currentUser] ? '#ef4444' : '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
            >
              MODO INACTIVO
            </button>
          </div>
        )}

        <button style={{background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px', width: '100%', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px'}}>
          DESCARGAR REN
        </button>

        {/* AMBOS MAYORES TIENEN EL BOTÓN DE CONFIGURAR (M3 y M2) */}
        {currentUser !== ROLES.M1 && (
          <button onClick={() => setShowConfig(true)} className="btn-config">
            ⚙️ Configurar Reglas (Auto)
          </button>
        )}
        
        <button onClick={() => setCurrentUser(null)} className="btn-logout" style={{marginTop: 'auto'}}>⬅ Cerrar Sesión</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{maxHeight: '100vh', overflowY: 'auto'}}>
        <div className="bell-container">
          {currentUser !== ROLES.M1 && (
            <button onClick={() => setShowNotificaciones(!showNotificaciones)} className="bell-btn" style={{position: 'relative'}}>
              🔔
              {misNotificaciones.length > 0 && <span className="badge" style={{animation: 'pulse 2s infinite'}}>{misNotificaciones.length}</span>}
            </button>
          )}
          
          {showNotificaciones && currentUser !== ROLES.M1 && (
            <div className="notificaciones-box">
              <h4 style={{marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px'}}>Solicitudes Pendientes</h4>
              {misNotificaciones.length === 0 ? <p>No hay solicitudes.</p> : null}
              {misNotificaciones.map(req => (
                <div key={req.id} className="noti-item">
                  <p style={{margin: '0 0 5px 0', fontSize: '13px'}}><strong>{req.from}</strong> solicita:</p>
                  <p style={{margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold'}}>{req.permissionId}</p>
                  <p style={{margin: '0 0 10px 0', fontSize: '12px', color: '#2563eb'}}>Motivo: {req.reason}</p>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button onClick={() => resolverSolicitud(req.id, true)} className="btn-green">Permitir</button>
                    <button onClick={() => resolverSolicitud(req.id, false)} className="btn-red" style={{marginLeft: 0}}>Denegar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="permisos-card" style={{maxWidth: '1200px'}}>
          <h2 style={{borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0}}>Reglas de Enfrentamiento</h2>
          
          <div className="grid-permisos" style={{gridTemplateColumns: '1fr', gap: '10px'}}>
            {PERMISOS_BASE.map(p => {
              const tienePermiso = permisos[currentUser][p.id];
              return (
                <div key={p.id} className="permiso-row" style={{background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0'}}>
                  <div style={{flex: 1, paddingRight: '20px'}}>
                    <strong style={{color: '#0f172a', fontSize: '16px', display: 'block', marginBottom: '5px'}}>{p.id}</strong>
                    <span style={{fontSize: '13px', color: '#475569', lineHeight: '1.5'}}>{p.name}</span>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px'}}>
                    {/* SIEMPRE ABRE EL MODAL DE RAZÓN */}
                    <div 
                      onClick={() => !tienePermiso && currentUser !== ROLES.M3 && setSolicitarModal({ open: true, permissionId: p.id, reason: RAZONES[0] })}
                      className={`box-status ${tienePermiso ? 'box-green' : 'box-red'}`}
                      style={{width: '90px', height: '35px', transition: 'all 0.2s', marginBottom: '5px'}}
                    ></div>
                    <span className="txt-status" style={{width: '100%', textAlign: 'center'}}>
                      {!tienePermiso && currentUser !== ROLES.M3 ? 'SOLICITAR' : tienePermiso ? 'RETENER' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL PARA SELECCIONAR RAZÓN DE LA SOLICITUD */}
      {solicitarModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{marginTop: 0}}>Solicitar {solicitarModal.permissionId}</h3>
            <p style={{fontSize: '14px', color: '#666'}}>Seleccione el motivo de la solicitud (requerido para evaluación automática o manual):</p>
            <select value={solicitarModal.reason} onChange={(e) => setSolicitarModal({...solicitarModal, reason: e.target.value})} style={{width: '100%', padding: '10px', marginTop: '10px', marginBottom: '20px'}}>
              {RAZONES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="modal-actions">
              <button onClick={() => setSolicitarModal({ open: false, permissionId: null, reason: RAZONES[0]})} className="btn-cancel">Cancelar</button>
              <button onClick={enviarSolicitudConMotivo} className="btn-submit">Enviar Solicitud</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURACIÓN AUTOMÁTICA DETALLADA POR RAZONES */}
      {showConfig && currentUser !== ROLES.M1 && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width: '700px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h2 style={{marginTop: 0, position: 'sticky', top: 0, background: 'white', paddingBottom: '15px', borderBottom: '2px solid #eee', zIndex: 10}}>
              Automatización de Reglas de Enfrentamiento
            </h2>
            <p style={{fontSize: '13px', color: '#666', marginBottom: '20px'}}>
              Configura qué razones otorgan el permiso o lo deniegan automáticamente. Lo que no marques pasará a revisión manual en tu campanita.
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {PERMISOS_BASE.map(p => (
                <div key={p.id} style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                  <h4 style={{margin: '0 0 10px 0', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px'}}>{p.id}</h4>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                    {/* COLUMNA APROBAR */}
                    <div>
                      <span style={{color: '#16a34a', fontSize: '13px', fontWeight: 'bold'}}>✅ Liberar si se solicita para:</span>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px'}}>
                        {RAZONES.map(razon => (
                          <label key={`apr-${p.id}-${razon}`} style={{fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <input 
                              type="checkbox" 
                              checked={autoConfig[currentUser][p.id].aprobar.includes(razon)}
                              onChange={(e) => handleConfigChange(p.id, 'aprobar', razon, e.target.checked)}
                            /> {razon}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* COLUMNA RECHAZAR */}
                    <div>
                      <span style={{color: '#dc2626', fontSize: '13px', fontWeight: 'bold'}}>❌ Denegar si se solicita para:</span>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px'}}>
                        {RAZONES.map(razon => (
                          <label key={`rec-${p.id}-${razon}`} style={{fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <input 
                              type="checkbox" 
                              checked={autoConfig[currentUser][p.id].rechazar.includes(razon)}
                              onChange={(e) => handleConfigChange(p.id, 'rechazar', razon, e.target.checked)}
                            /> {razon}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{position: 'sticky', bottom: 0, background: 'white', paddingTop: '15px', borderTop: '2px solid #eee', marginTop: '20px'}}>
              <button onClick={() => setShowConfig(false)} className="btn-submit" style={{width: '100%', padding: '12px', fontSize: '16px'}}>Guardar Configuración</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
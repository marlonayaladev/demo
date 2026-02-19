import React, { useState } from 'react';
import './App.css'; 

const ROLES = { M3: 'MAYOR 3', M2: 'MAYOR 2', M1: 'MAYOR 1' };
const RAZONES = ['Razón 1', 'Razón 2', 'Razón 3'];
const PERMISOS_BASE = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Permiso ${i + 1}` }));

// Inicializamos la configuración vacía para CADA permiso
const initialAutoConfig = PERMISOS_BASE.reduce((acc, p) => {
  acc[p.id] = { aprobar: [], rechazar: [] };
  return acc;
}, {});

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  const [permisos, setPermisos] = useState({
    [ROLES.M3]: PERMISOS_BASE.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
    [ROLES.M2]: PERMISOS_BASE.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}),
    [ROLES.M1]: PERMISOS_BASE.reduce((acc, p) => ({ ...acc, [p.id]: false }), {})
  });

  const [requests, setRequests] = useState([]);
  const [autoModeActive, setAutoModeActive] = useState({ [ROLES.M3]: false, [ROLES.M2]: false });
  
  // Estado que guarda la configuración por CADA permiso individualmente
  const [autoConfig, setAutoConfig] = useState(initialAutoConfig);

  const [solicitarModal, setSolicitarModal] = useState({ open: false, permissionId: null, reason: 'Razón 1' });
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Función para manejar los checks por cada permiso
  const handleConfigChange = (permisoId, accion, razon, isChecked) => {
    setAutoConfig(prev => {
      const newState = { ...prev };
      const configDelPermiso = { ...newState[permisoId] };

      if (isChecked) {
        configDelPermiso[accion] = [...configDelPermiso[accion], razon];
        // Quitar de la lista contraria para evitar errores lógicos
        const otraAccion = accion === 'aprobar' ? 'rechazar' : 'aprobar';
        configDelPermiso[otraAccion] = configDelPermiso[otraAccion].filter(r => r !== razon);
      } else {
        configDelPermiso[accion] = configDelPermiso[accion].filter(r => r !== razon);
      }

      newState[permisoId] = configDelPermiso;
      return newState;
    });
  };

  const handleSolicitar = () => {
    const superior = currentUser === ROLES.M1 ? ROLES.M2 : ROLES.M3;
    const { permissionId, reason } = solicitarModal;

    // LÓGICA AUTOMÁTICA ESPECÍFICA POR PERMISO
    if (autoModeActive[superior]) {
      const reglasDelPermiso = autoConfig[permissionId];
      
      if (reglasDelPermiso.aprobar.includes(reason)) {
        alert(`¡Aprobado automáticamente! Para el ${permissionId}, la ${reason} es válida según el ${superior}.`);
        setPermisos(prev => ({ ...prev, [currentUser]: { ...prev[currentUser], [permissionId]: true } }));
        setSolicitarModal({ open: false, permissionId: null, reason: 'Razón 1' });
        return;
      } else if (reglasDelPermiso.rechazar.includes(reason)) {
        alert(`Denegado. El ${superior} tiene configurado rechazar automáticamente la ${reason} para este permiso.`);
        setSolicitarModal({ open: false, permissionId: null, reason: 'Razón 1' });
        return;
      }
      // Si no está marcada ni en aprobar ni en rechazar, pasa a revisión manual (campanita)
    }

    const newReq = { id: Date.now(), from: currentUser, to: superior, permissionId, reason };
    setRequests([...requests, newReq]);
    setSolicitarModal({ open: false, permissionId: null, reason: 'Razón 1' });
  };

  const resolverSolicitud = (reqId, aprobar) => {
    const req = requests.find(r => r.id === reqId);
    if (aprobar) {
      setPermisos(prev => ({ ...prev, [req.from]: { ...prev[req.from], [req.permissionId]: true } }));
    }
    setRequests(requests.filter(r => r.id !== reqId));
    setShowNotificaciones(false);
  };

  const misNotificaciones = requests.filter(r => r.to === currentUser);

  if (!currentUser) {
    return (
      <div className="login-screen">
        <h1 style={{marginBottom: '30px'}}>Sistema de Permisos</h1>
        {Object.values(ROLES).map(rol => (
          <button key={rol} onClick={() => setCurrentUser(rol)} className="login-btn">
            Ingresar como {rol}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>{currentUser}</h2>
        
        {currentUser !== ROLES.M1 && (
          <div className="panel-auto">
            <h4 style={{margin: '0 0 10px 0'}}>Modo Automático</h4>
            <label style={{cursor: 'pointer'}}>
              <input type="checkbox" checked={autoModeActive[currentUser]} onChange={() => setAutoModeActive(prev => ({ ...prev, [currentUser]: !prev[currentUser] }))} />
              <span style={{marginLeft: '10px'}}>{autoModeActive[currentUser] ? 'ACTIVADO' : 'INACTIVO'}</span>
            </label>
          </div>
        )}

        {currentUser === ROLES.M3 && (
          <button onClick={() => setShowConfig(true)} className="btn-config">
            ⚙️ Configurar Auto Mode
          </button>
        )}
        
        <button onClick={() => setCurrentUser(null)} className="btn-logout">⬅ Cerrar Sesión</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="bell-container">
          {currentUser !== ROLES.M1 && (
            <button onClick={() => setShowNotificaciones(!showNotificaciones)} className="bell-btn">
              🔔
              {misNotificaciones.length > 0 && <span className="badge">{misNotificaciones.length}</span>}
            </button>
          )}
          
          {showNotificaciones && currentUser !== ROLES.M1 && (
            <div className="notificaciones-box">
              <h4 style={{marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '10px'}}>Solicitudes Pendientes</h4>
              {misNotificaciones.length === 0 ? <p>No hay solicitudes.</p> : null}
              {misNotificaciones.map(req => (
                <div key={req.id} className="noti-item">
                  <p style={{margin: '0 0 5px 0'}}><strong>{req.from}</strong> solicita:</p>
                  <p style={{margin: '0 0 5px 0', fontSize: '14px'}}>Permiso {req.permissionId}</p>
                  <p style={{margin: '0 0 10px 0', fontSize: '12px', color: '#2563eb', fontWeight: 'bold'}}>Motivo: {req.reason}</p>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button onClick={() => resolverSolicitud(req.id, true)} className="btn-green">Permitir</button>
                    <button onClick={() => resolverSolicitud(req.id, false)} className="btn-red" style={{marginLeft: 0}}>Denegar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="permisos-card">
          <h2 style={{borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0}}>Estado de Mis Permisos</h2>
          <div className="grid-permisos">
            {PERMISOS_BASE.map(p => {
              const tienePermiso = permisos[currentUser][p.id];
              return (
                <div key={p.id} className="permiso-row">
                  <span style={{fontFamily: 'monospace', fontSize: '14px'}}>{p.name}</span>
                  <div>
                    <div 
                      onClick={() => !tienePermiso && currentUser !== ROLES.M3 && setSolicitarModal({ open: true, permissionId: p.id, reason: 'Razón 1' })}
                      className={`box-status ${tienePermiso ? 'box-green' : 'box-red'}`}
                      title={!tienePermiso ? "Clic para solicitar" : "Permiso activo"}
                    ></div>
                    <span className="txt-status">
                      {!tienePermiso && currentUser !== ROLES.M3 ? 'SOLICITAR' : tienePermiso ? 'RETENER' : ''}
                    </span>
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
          <div className="modal-content">
            <h3 style={{marginTop: 0}}>Solicitar Permiso {solicitarModal.permissionId}</h3>
            <p style={{fontSize: '14px', color: '#666'}}>Elige la razón para tu solicitud:</p>
            <select value={solicitarModal.reason} onChange={(e) => setSolicitarModal({...solicitarModal, reason: e.target.value})}>
              {RAZONES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="modal-actions">
              <button onClick={() => setSolicitarModal({ open: false, permissionId: null, reason: 'Razón 1'})} className="btn-cancel">Cancelar</button>
              <button onClick={handleSolicitar} className="btn-submit">Enviar Solicitud</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIG AUTO (Por cada permiso) */}
      {showConfig && currentUser === ROLES.M3 && (
        <div className="modal-overlay">
          <div className="modal-content" style={{width: '650px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h2 style={{marginTop: 0, position: 'sticky', top: 0, background: 'white', paddingBottom: '15px', borderBottom: '2px solid #eee', zIndex: 10}}>
              Configuración Detallada del Modo Automático
            </h2>
            <p style={{fontSize: '13px', color: '#666', marginBottom: '20px'}}>
              Define qué razones aprueban o rechazan automáticamente <b>cada permiso por separado</b>.
            </p>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              {PERMISOS_BASE.map(p => (
                <div key={p.id} style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                  <h4 style={{margin: '0 0 10px 0', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px'}}>{p.name}</h4>
                  
                  <div style={{marginBottom: '10px'}}>
                    <span style={{color: '#16a34a', fontSize: '12px', fontWeight: 'bold'}}>✅ Aprobarlo con:</span>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px'}}>
                      {RAZONES.map(razon => (
                        <label key={`apr-${p.id}-${razon}`} style={{fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                          <input 
                            type="checkbox" 
                            checked={autoConfig[p.id].aprobar.includes(razon)}
                            onChange={(e) => handleConfigChange(p.id, 'aprobar', razon, e.target.checked)}
                          /> {razon}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{color: '#dc2626', fontSize: '12px', fontWeight: 'bold'}}>❌ Rechazarlo con:</span>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px'}}>
                      {RAZONES.map(razon => (
                        <label key={`rec-${p.id}-${razon}`} style={{fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                          <input 
                            type="checkbox" 
                            checked={autoConfig[p.id].rechazar.includes(razon)}
                            onChange={(e) => handleConfigChange(p.id, 'rechazar', razon, e.target.checked)}
                          /> {razon}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{position: 'sticky', bottom: 0, background: 'white', paddingTop: '15px', marginTop: '20px', borderTop: '2px solid #eee'}}>
              <button onClick={() => setShowConfig(false)} className="btn-submit" style={{width: '100%', padding: '12px', fontSize: '16px'}}>Guardar y Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
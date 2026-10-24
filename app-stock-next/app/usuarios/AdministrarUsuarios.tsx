'use client';
import { useState, useTransition } from 'react';
import type { UsuarioListado } from '@/lib/almacen';
import { ROLES, type Rol } from '@/lib/tipos';
import {
  agregarUsuario,
  cambiarAccesoUsuario,
  cambiarRolUsuario,
  darClaveProvisoria,
  type ResultadoUsuarios,
} from './acciones';

export default function AdministrarUsuarios({ usuarios, miId }: { usuarios: UsuarioListado[]; miId: number }) {
  const [resultado, setResultado] = useState<ResultadoUsuarios | null>(null);
  const [trabajando, empezar] = useTransition();
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<Rol>('Colaborador');

  // Corre una acción del servidor y muestra el resultado arriba.
  function correr(accion: () => Promise<ResultadoUsuarios>, despues?: () => void) {
    empezar(async () => {
      const r = await accion();
      setResultado(r);
      if (r.ok) despues?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return (
    <section className="usuarios">
      {resultado && (
        <div className={`mensaje ${resultado.ok ? 'ok' : 'error'}`}>
          {resultado.mensaje}
          {resultado.clave && (
            <>
              <div className="clave-provisoria">{resultado.clave}</div>
              <div className="ayuda">Anotala y pasásela en persona o por mensaje privado: no se vuelve a mostrar.</div>
            </>
          )}
        </div>
      )}

      <div className="tarjeta">
        <h2 className="seccion">Agregar usuario</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            correr(() => agregarUsuario(nombre, rol), () => setNombre(''));
          }}
        >
          <div className="dos">
            <div>
              <label htmlFor="nombre-nuevo">Nombre</label>
              <input id="nombre-nuevo" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={40} required />
            </div>
            <div>
              <label htmlFor="rol-nuevo">Rol</label>
              <select id="rol-nuevo" value={rol} onChange={e => setRol(e.target.value as Rol)}>
                {ROLES.map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="ayuda">La app le crea una clave provisoria; al ingresar por primera vez elige la suya.</p>
          <button type="submit" className="principal" disabled={trabajando}>
            Agregar
          </button>
        </form>
      </div>

      <h2 className="seccion">Usuarios ({usuarios.filter(u => u.activo).length} activos)</h2>
      <div className="grilla">
        {usuarios.map(u => {
          const soyYo = u.id === miId;
          return (
            <div key={u.id} className={u.activo ? 'tarjeta usuario-tarjeta' : 'tarjeta usuario-tarjeta de-baja'}>
              <div className="usuario-cabeza">
                <b>{u.nombre}</b>
                {soyYo && <span className="etiqueta">Vos</span>}
                {!u.activo && <span className="etiqueta baja">De baja</span>}
                {u.activo && u.bloqueado && <span className="etiqueta baja">Bloqueado</span>}
                {u.activo && u.cambiarClave && <span className="etiqueta">Clave provisoria</span>}
              </div>
              <div className="ayuda">
                {u.ultimoIngreso ? `Último ingreso: ${u.ultimoIngreso}` : 'Todavía no ingresó'}
              </div>
              <label htmlFor={`rol-${u.id}`}>Rol</label>
              <select
                id={`rol-${u.id}`}
                value={u.rol}
                disabled={soyYo || !u.activo || trabajando}
                onChange={e => correr(() => cambiarRolUsuario(u.id, e.target.value as Rol))}
              >
                {ROLES.map(r => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              {!soyYo && (
                <div className="anular-botones">
                  {u.activo && (
                    <button
                      type="button"
                      className="boton-secundario"
                      disabled={trabajando}
                      onClick={() => {
                        if (confirm(`¿Darle una clave provisoria nueva a ${u.nombre}? Su clave actual deja de servir.`)) {
                          correr(() => darClaveProvisoria(u.id, u.nombre));
                        }
                      }}
                    >
                      Clave provisoria
                    </button>
                  )}
                  <button
                    type="button"
                    className={u.activo ? 'boton-peligro' : 'boton-secundario'}
                    disabled={trabajando}
                    onClick={() => {
                      if (!u.activo || confirm(`¿Dar de baja a ${u.nombre}? No va a poder ingresar más (se puede volver a dar de alta).`)) {
                        correr(() => cambiarAccesoUsuario(u.id, !u.activo));
                      }
                    }}
                  >
                    {u.activo ? 'Dar de baja' : 'Dar de alta'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

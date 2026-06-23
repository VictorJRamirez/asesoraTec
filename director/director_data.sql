-- director_data.sql
-- ----------------------------------------------------------------------------
-- Única tabla NUEVA que necesita el panel del Director.
-- Sirve para distinguir qué nóminas 'L' son de Director (las demás son profesor).
-- El login (Maestro-Estudiante/auth.js) busca aquí: si la nómina está, entra
-- como Director; si no, sigue el flujo normal de profesor.
--
-- (La otra tabla que usa el Director, `kv_store`, se crea SOLA al arrancar el
--  servidor — no necesitas correr nada para ella.)
--
-- Cómo cargarlo en TU base de datos:
--     mysql -u <usuario> -p <tu_base_de_datos> < director_data.sql
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS director_data (
  nomina VARCHAR(15) PRIMARY KEY,
  nombre VARCHAR(80)
);

-- Reemplaza estas filas con las nóminas REALES de tus directores:
INSERT INTO director_data (nomina, nombre) VALUES
  ('L09000001', 'Nombre del Director')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

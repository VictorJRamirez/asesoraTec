# Integración del Panel del Director — Guía de despliegue

Para el compañero que tiene **Maestro-Estudiante** desplegado (servidor + dominio + base de
datos). El panel del **Director** se monta **sobre tu mismo servidor Express** y usa **tus
mismas tablas** (`student_data`, `student_names`, `teacher_data`). No es una app aparte.

> **TL;DR:** copia la carpeta `director/`, aplica 4 cambios chiquitos en tu código (vienen
> marcados con comentarios en español), corre `director_data.sql` en tu BD, y despliega.
> Tu `.env` y tu dominio **no necesitan cambios especiales**.

---

## Requisitos (ya los tienes)
- Servidor Node/Express (el de Maestro-Estudiante, ESM).
- MySQL/MariaDB con las tablas `student_data`, `student_names`, `teacher_data`.

## Paso 1 — Copiar la carpeta `director/`
Ponla **al lado** de `Maestro-Estudiante/` (carpetas hermanas):
```
<repo>/
  Maestro-Estudiante/
  director/          ← copiar esta
```

## Paso 2 — Aplicar 4 cambios en tu código
Todos vienen comentados con `// Comentario:` en español.

**a) `Maestro-Estudiante/server.js`** — arriba, junto a los demás `import`:
```js
import { registerDirectorRoutes } from "../director/directorRoutes.mjs";
```
…y justo después de `app.use("/api/auth", authRouter);`:
```js
registerDirectorRoutes(app, db);                                   // monta /api/* del Director
app.use("/director/server", (req, res) => res.status(404).end());  // protege archivos sensibles
app.use("/director", express.static(path.join(__dirname, "../director"))); // sirve el dashboard
```

**b) `Maestro-Estudiante/auth.js`** — dentro del `else if (userId.startsWith('L'))`, al inicio,
para distinguir director de profesor (es resiliente: si la tabla no existe, sigue como profesor):
```js
let dirRows = [];
try { [dirRows] = await db.query("SELECT nomina FROM director_data WHERE nomina = ?", [userId]); }
catch (e) { dirRows = []; }
if (dirRows.length > 0) {
    if (password !== UNIVERSAL_PASSWORD) return res.status(401).json({ error: "Contraseña incorrecta" });
    req.session.user = { id: userId, role: 'director' };
    return res.json({ success: true, redirect: '/director/Director.html' });
}
// …debajo sigue tu lógica normal de profesor…
```

**c) `Maestro-Estudiante/student.html`** y **d) `Maestro-Estudiante/teacher.html`** — una línea
antes de su `<script>` principal, para sincronizar las asesorías con el servidor:
```html
<script src="/director/store-sync.js"></script>
```

## Paso 3 — Base de datos (una sola tabla nueva)
```bash
mysql -u <usuario> -p <tu_base_de_datos> < director/director_data.sql
```
- `director_data` → guarda las nóminas de los **directores** (edita el SQL con las reales).
- `kv_store` → **se crea sola** al arrancar (no corras nada).

## Paso 4 — Variables de entorno
- No se necesita nada nuevo. Tu `.env` con `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/SESSION_SECRET`
  ya sirve.
- No hay datos de demostración: `kv_store` arranca **vacío** y se llena con las asesorías
  reales que publiquen los maestros.

## Paso 5 — Desplegar en tu dominio
Despliega como siempre. El frontend usa rutas **relativas** (`/api/...`, `/director/...`), así que
funciona igual en `localhost` que en tu dominio, sin configurar nada.

Acceso del Director: cualquier nómina `L…` que esté en `director_data`, con la contraseña del
sistema. Lo lleva a `/director/Director.html`.

---

## Qué incluye la carpeta `director/`
| Archivo | Qué hace |
|---|---|
| `Director.html` / `.css` / `.js` | El dashboard (gráficas con Chart.js vía CDN) |
| `directorRoutes.mjs` | Los endpoints `/api/*` del Director + almacén `kv_store` (se montan en TU app) |
| `store-sync.js` | Sincroniza las asesorías (localStorage ⇄ servidor/BD) |
| `director_data.sql` | La tabla nueva para identificar directores |

## De dónde salen los números del dashboard
- KPIs / donut / riesgo → de tus tablas `student_data` y `teacher_data` (datos reales).
- Demanda por materia y asesorías por día → de las asesorías reales (`kv_store`).

## Notas
- **Sesión única por navegador:** el sistema usa una sola sesión (cookie). Para probar dos roles
  a la vez, usa navegadores distintos o ventanas de incógnito. (Es del diseño original, no del
  Director.)
- El bloque "Próximas Asesorías" y la curva de la derecha del dashboard son ilustrativos
  (no hay aún datos que los respalden).

## Carpeta `director/server/` (ignorar)
Es un servidor de desarrollo viejo, ya no se usa (todo corre sobre tu servidor). Puedes borrarla.

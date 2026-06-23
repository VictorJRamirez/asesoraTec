import express from "express";
import { db } from "./server.js";

export const authRouter = express.Router();
const UNIVERSAL_PASSWORD = "prepaTec2026";

authRouter.post('/login', async (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    const userId = req.body.username.toUpperCase();
    const password = req.body.password;

    try {
        if (userId.startsWith('A')) {
            if (password !== UNIVERSAL_PASSWORD) {
                return res.status(401).json({ error: "Contraseña incorrecta" });
            }

            const [rows] = await db.query("SELECT matricula FROM student_data WHERE matricula = ?", [userId]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: "Matrícula no encontrada" });
            }

            req.session.user = { id: userId, role: 'student' };
            return res.json({ success: true, redirect: 'student.html' });
        }
        
        else if (userId.startsWith('L')) {
            let dirRows = []; // Comentario: por defecto, la nómina NO es de director
            try { [dirRows] = await db.query("SELECT nomina FROM director_data WHERE nomina = ?", [userId]); } // Comentario: profesores y directores comparten el prefijo 'L'; revisamos si la nómina es de un director
            catch (e) { dirRows = []; } // Comentario: si la tabla director_data aún no existe, se trata como profesor (no rompe el login)
            if (dirRows.length > 0) { // Comentario: si la nómina está en director_data, se trata como Director
                if (password !== UNIVERSAL_PASSWORD) { // Comentario: el Director usa la misma contraseña universal
                    return res.status(401).json({ error: "Contraseña incorrecta" }); // Comentario: contraseña inválida para el Director
                }
                req.session.user = { id: userId, role: 'director' }; // Comentario: guarda la sesión del Director
                return res.json({ success: true, redirect: '/director/Director.html' }); // Comentario: redirige al panel del Director
            }

            const [rows] = await db.query("SELECT profesor FROM teacher_data WHERE nomina = ?", [userId]);

            if (rows.length === 0) {
                return res.status(404).json({ error: "Nómina no encontrada" });
            }

            if (password !== UNIVERSAL_PASSWORD) {
                return res.status(401).json({ error: "Contraseña incorrecta" });
            }

            req.session.user = { id: userId, role: 'teacher', name: rows[0].profesor };
            return res.json({ success: true, redirect: 'teacher.html' });
        }

        else {
            return res.status(400).json({ error: "Usuario no válido" });
        }

    } catch (error) {
        console.error("Login logic error:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

authRouter.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: "No active session" });
    }
});

export default authRouter;
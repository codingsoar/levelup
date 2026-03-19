const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const parseCourseIds = (value) => {
    try {
        const parsed = value ? JSON.parse(value) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const formatReflectionRow = (row) => ({
    studentId: row.student_id,
    courseId: row.course_id,
    stageId: row.stage_id,
    difficulty: row.difficulty,
    reflection: row.content,
    missionTitle: row.mission_title || '',
    courseTitle: row.course_title || '',
    stageTitle: row.stage_title || '',
    timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
});

const parseJsonField = (value, fallback) => {
    if (!value) return fallback;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const APP_STATE_KEYS = new Set(['courses', 'assessments', 'marketplace', 'badges']);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'StarQuest Server is running!' });
});

app.post('/api/auth/login', (req, res) => {
    const { id, password } = req.body;

    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (row.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        let user = { role: row.role };
        if (row.role === 'admin' || row.role === 'subadmin') {
            user.adminId = row.id;
            user.name = row.name;
            user.courseIds = parseCourseIds(row.courseIds);
            try {
                user.permissions = row.permissions ? JSON.parse(row.permissions) : {};
            } catch {
                user.permissions = {};
            }
        } else {
            user.studentId = row.id;
            user.name = row.name;
            user.courseIds = parseCourseIds(row.courseIds);
            user.grade = row.grade || 1;
            user.admissionYear = row.admission_year || new Date().getFullYear();
        }

        return res.json({ success: true, user });
    });
});

app.get('/api/app-state', (req, res) => {
    db.all(`SELECT key, value FROM app_state`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        const state = {};
        (rows || []).forEach((row) => {
            state[row.key] = parseJsonField(row.value, null);
        });

        return res.json({ success: true, state });
    });
});

app.put('/api/app-state/:key', (req, res) => {
    const { key } = req.params;
    const { value } = req.body || {};

    if (!APP_STATE_KEYS.has(key)) {
        return res.status(400).json({ success: false, message: 'Invalid app-state key' });
    }

    db.run(
        `
            INSERT INTO app_state (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
        `,
        [key, JSON.stringify(value ?? null)],
        (err) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            return res.json({ success: true });
        }
    );
});

app.get('/api/progress/:studentId', (req, res) => {
    const { studentId } = req.params;

    db.all(`SELECT * FROM progress WHERE student_id = ?`, [studentId], (err, progressRows) => {
        if (err) return res.status(500).json({ error: err.message });

        const progressGraph = {};
        progressRows.forEach(row => {
            if (!progressGraph[row.course_id]) progressGraph[row.course_id] = {};
            if (!progressGraph[row.course_id][row.stage_id]) progressGraph[row.course_id][row.stage_id] = {};
            progressGraph[row.course_id][row.stage_id][row.difficulty] = row.completed === 1;
        });

        db.get(`SELECT total_stars, total_xp, level FROM student_stats WHERE student_id = ?`, [studentId], (err2, stats) => {
            if (err2) return res.status(500).json({ error: err2.message });

            db.all(`SELECT * FROM reflections WHERE student_id = ? ORDER BY created_at DESC`, [studentId], (err3, reflections) => {
                if (err3) return res.status(500).json({ error: err3.message });

                return res.json({
                    progress: progressGraph,
                    totalStars: stats ? stats.total_stars : 0,
                    reflections: (reflections || []).map(formatReflectionRow),
                });
            });
        });
    });
});

app.post('/api/progress/complete', (req, res) => {
    const { studentId, courseId, stageId, difficulty, reflectionEntry } = req.body;

    db.get(
        `
            SELECT completed
            FROM progress
            WHERE student_id = ? AND course_id = ? AND stage_id = ? AND difficulty = ?
        `,
        [studentId, courseId, stageId, difficulty],
        (checkErr, existingProgress) => {
            if (checkErr) {
                return res.status(500).json({ success: false, error: checkErr.message });
            }

            const alreadyCompleted = existingProgress?.completed === 1;

            db.run(
                `
                    INSERT OR REPLACE INTO progress (student_id, course_id, stage_id, difficulty, completed, last_updated)
                    VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
                `,
                [studentId, courseId, stageId, difficulty],
                (progressErr) => {
                    if (progressErr) {
                        return res.status(500).json({ success: false, error: progressErr.message });
                    }

                    const finishResponse = () => {
                        res.json({
                            success: true,
                            alreadyCompleted,
                            message: alreadyCompleted
                                ? 'Mission was already completed'
                                : 'Mission completed successfully',
                        });
                    };

                    const insertReflectionIfNeeded = () => {
                        if (!reflectionEntry || alreadyCompleted) {
                            return finishResponse();
                        }

                        db.run(
                            `
                                INSERT INTO reflections (
                                    student_id,
                                    course_id,
                                    stage_id,
                                    difficulty,
                                    content,
                                    mission_title,
                                    course_title,
                                    stage_title
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            `,
                            [
                                studentId,
                                courseId,
                                stageId,
                                difficulty,
                                reflectionEntry.reflection,
                                reflectionEntry.missionTitle || '',
                                reflectionEntry.courseTitle || '',
                                reflectionEntry.stageTitle || '',
                            ],
                            (reflectionErr) => {
                                if (reflectionErr) {
                                    return res.status(500).json({ success: false, error: reflectionErr.message });
                                }
                                finishResponse();
                            }
                        );
                    };

                    if (alreadyCompleted) {
                        return insertReflectionIfNeeded();
                    }

                    db.run(
                        `
                            INSERT INTO student_stats (student_id, total_stars)
                            VALUES (?, 1)
                            ON CONFLICT(student_id) DO UPDATE SET total_stars = total_stars + 1
                        `,
                        [studentId],
                        (statsErr) => {
                            if (statsErr) {
                                return res.status(500).json({ success: false, error: statsErr.message });
                            }
                            insertReflectionIfNeeded();
                        }
                    );
                }
            );
        }
    );
});

app.post('/api/progress/spend-stars', (req, res) => {
    const { studentId, amount } = req.body || {};

    if (!studentId || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid spend-stars payload' });
    }

    db.get(`SELECT total_stars FROM student_stats WHERE student_id = ?`, [studentId], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        const currentStars = row?.total_stars || 0;
        if (currentStars < amount) {
            return res.status(400).json({ success: false, reason: 'insufficient_stars' });
        }

        db.run(
            `UPDATE student_stats SET total_stars = total_stars - ? WHERE student_id = ?`,
            [amount, studentId],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ success: false, error: updateErr.message });
                }

                return res.json({ success: true, totalStars: currentStars - amount });
            }
        );
    });
});

app.post('/api/admin/students/upsert', (req, res) => {
    const {
        studentId,
        name,
        password,
        courseIds = [],
        grade = 1,
        admissionYear = new Date().getFullYear(),
    } = req.body;

    if (!studentId || !name || !password) {
        return res.status(400).json({ success: false, message: 'Missing required student fields' });
    }

    db.run(
        `
            INSERT INTO users (id, password, name, role, courseIds, grade, admission_year)
            VALUES (?, ?, ?, 'student', ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                password = excluded.password,
                name = excluded.name,
                role = 'student',
                courseIds = excluded.courseIds,
                grade = excluded.grade,
                admission_year = excluded.admission_year
        `,
        [studentId, password, name, JSON.stringify(courseIds || []), grade, admissionYear],
        (err) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            return res.json({ success: true });
        }
    );
});

app.delete('/api/admin/students/:studentId', (req, res) => {
    db.run(`DELETE FROM users WHERE id = ? AND role = 'student'`, [req.params.studentId], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        return res.json({ success: true });
    });
});

app.get('/api/admin/subadmins', (req, res) => {
    db.all(`SELECT id, password, name, courseIds, permissions FROM users WHERE role = 'subadmin' ORDER BY id ASC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        return res.json({
            success: true,
            subAdmins: (rows || []).map((row) => ({
                adminId: row.id,
                password: row.password,
                name: row.name,
                courseIds: parseCourseIds(row.courseIds),
                permissions: parseJsonField(row.permissions, {}),
            })),
        });
    });
});

app.post('/api/admin/subadmins/upsert', (req, res) => {
    const { adminId, password, name, courseIds = [], permissions = {} } = req.body || {};

    if (!adminId || !password || !name) {
        return res.status(400).json({ success: false, message: 'Missing required sub-admin fields' });
    }

    if (adminId === 'admin') {
        return res.status(400).json({ success: false, message: 'Reserved admin ID' });
    }

    db.run(
        `
            INSERT INTO users (id, password, name, role, courseIds, permissions)
            VALUES (?, ?, ?, 'subadmin', ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                password = excluded.password,
                name = excluded.name,
                role = 'subadmin',
                courseIds = excluded.courseIds,
                permissions = excluded.permissions
        `,
        [adminId, password, name, JSON.stringify(courseIds || []), JSON.stringify(permissions || {})],
        (err) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            return res.json({ success: true });
        }
    );
});

app.delete('/api/admin/subadmins/:adminId', (req, res) => {
    db.run(`DELETE FROM users WHERE id = ? AND role = 'subadmin'`, [req.params.adminId], (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        return res.json({ success: true });
    });
});

app.post('/api/admin/change-password', (req, res) => {
    const { adminId = 'admin', currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, reason: 'invalid_input' });
    }

    db.get(`SELECT id, password FROM users WHERE id = ? AND role = 'admin'`, [adminId], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        if (!row || row.password !== currentPassword) {
            return res.status(401).json({ success: false, reason: 'incorrect_password' });
        }

        db.run(`UPDATE users SET password = ? WHERE id = ? AND role = 'admin'`, [newPassword, adminId], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ success: false, error: updateErr.message });
            }

            return res.json({ success: true });
        });
    });
});

app.post('/api/admin/reset-progress', (req, res) => {
    db.serialize(() => {
        db.run(`DELETE FROM progress`);
        db.run(`DELETE FROM reflections`);
        db.run(`DELETE FROM student_stats`);
        db.run(`DELETE FROM badges`, (err) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            return res.json({ success: true });
        });
    });
});

app.get('/api/admin/dashboard', (req, res) => {
    db.all(`SELECT id, name, courseIds, grade, admission_year FROM users WHERE role = 'student'`, [], (err, students) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(`SELECT student_id, total_stars FROM student_stats`, [], (err2, statsRaw) => {
            if (err2) return res.status(500).json({ error: err2.message });
            const statsMap = {};
            statsRaw.forEach(row => {
                statsMap[row.student_id] = row.total_stars;
            });

            db.all(`SELECT * FROM progress`, [], (err3, progressRows) => {
                if (err3) return res.status(500).json({ error: err3.message });

                const progressGraph = {};
                progressRows.forEach(row => {
                    const sid = row.student_id;
                    if (!progressGraph[sid]) progressGraph[sid] = {};
                    if (!progressGraph[sid][row.course_id]) progressGraph[sid][row.course_id] = {};
                    if (!progressGraph[sid][row.course_id][row.stage_id]) progressGraph[sid][row.course_id][row.stage_id] = {};
                    progressGraph[sid][row.course_id][row.stage_id][row.difficulty] = row.completed === 1;
                });

                db.all(`SELECT * FROM reflections ORDER BY created_at DESC`, [], (err4, reflections) => {
                    if (err4) return res.status(500).json({ error: err4.message });

                    return res.json({
                        success: true,
                        students: students.map(student => ({
                            studentId: student.id,
                            name: student.name,
                            courseIds: parseCourseIds(student.courseIds),
                            grade: student.grade || 1,
                            admissionYear: student.admission_year || new Date().getFullYear(),
                            totalStars: statsMap[student.id] || 0,
                            progress: progressGraph[student.id] || {},
                        })),
                        allReflections: reflections.map(formatReflectionRow),
                    });
                });
            });
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

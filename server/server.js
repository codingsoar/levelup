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

    db.serialize(() => {
        db.run(
            `
                INSERT OR REPLACE INTO progress (student_id, course_id, stage_id, difficulty, completed, last_updated)
                VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            `,
            [studentId, courseId, stageId, difficulty]
        );

        db.run(
            `
                INSERT INTO student_stats (student_id, total_stars)
                VALUES (?, 1)
                ON CONFLICT(student_id) DO UPDATE SET total_stars = total_stars + 1
            `,
            [studentId]
        );

        if (reflectionEntry) {
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
                ]
            );
        }
    });

    res.json({ success: true, message: 'Mission completed successfully' });
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

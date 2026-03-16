const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

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

// 미들웨어
app.use(cors()); // 프론트와 통신 허용
app.use(express.json()); // JSON 바디 파싱

// 테스트용 루트 경로
app.get('/', (req, res) => {
    res.json({ message: 'StarQuest Server is running!' });
});

// ==========================================
// 1. 인증(Auth) API
// ==========================================

// 로그인 (초기 앱의 경우 비밀번호 평문 비교 혹은 bcrypt 검증)
app.post('/api/auth/login', (req, res) => {
    const { id, password } = req.body;
    
    // users 테이블에서 학생 혹은 관리자 찾기
    const query = `SELECT * FROM users WHERE id = ?`;
    db.get(query, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            // 편무를 위해: 학생 DB가 없으면 첫 로그인 시 자동 생성
            // (실제 학교 보안 시에는 관리자가 등록한 계정만 쓰도록 변경 필요)
            const insert = `INSERT INTO users (id, password, name, role) VALUES (?, ?, ?, ?)`;
            // 임시로 ID와 동일한 이름을 name으로, student 롤 부여
            db.run(insert, [id, password, id, 'student'], function(err2) {
                if (err2) return res.status(500).json({ error: err2.message });
                return res.json({ 
                    success: true, 
                    user: { studentId: id, name: id, role: 'student' } 
                });
            });
            return;
        }

        // 비밀번호 체크
        if (row.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // 로그인 성공 응답
        let user = { role: row.role };
        if (row.role === 'admin' || row.role === 'subadmin') {
            user.adminId = row.id;
            user.name = row.name;
            try {
                user.courseIds = row.courseIds ? JSON.parse(row.courseIds) : [];
                user.permissions = row.permissions ? JSON.parse(row.permissions) : {};
            } catch(e) { /* ignore */ }
        } else {
            user.studentId = row.id;
            user.name = row.name;
            // 학생이 어느 수업인지 등의 정보는 추후 users나 별도 테이블로 관리
        }

        res.json({ success: true, user });
    });
});

// ==========================================
// 2. 진도(Progress) 동기화 API
// ==========================================

// 학생의 전체 진행 상황 및 별 개수 조회
app.get('/api/progress/:studentId', (req, res) => {
    const { studentId } = req.params;
    
    // 1. Progress 내역
    db.all(`SELECT * FROM progress WHERE student_id = ?`, [studentId], (err, progressRows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // 프론트엔드의 객체 구조로 변환
        // { [courseId]: { [stageId]: { easy: true } } }
        const progressGraph = {};
        progressRows.forEach(row => {
            if (!progressGraph[row.course_id]) progressGraph[row.course_id] = {};
            if (!progressGraph[row.course_id][row.stage_id]) progressGraph[row.course_id][row.stage_id] = {};
            progressGraph[row.course_id][row.stage_id][row.difficulty] = row.completed === 1;
        });

        // 2. 총 별, 경험치 조회
        db.get(`SELECT total_stars, total_xp, level FROM student_stats WHERE student_id = ?`, [studentId], (err2, stats) => {
            if (err2) return res.status(500).json({ error: err2.message });

            // 3. 성찰 내역
            db.all(`SELECT * FROM reflections WHERE student_id = ? ORDER BY created_at DESC`, [studentId], (err3, reflections) => {
                if (err3) return res.status(500).json({ error: err3.message });

                res.json({
                    progress: progressGraph,
                    totalStars: stats ? stats.total_stars : 0,
                    reflections: (reflections || []).map(formatReflectionRow)
                });
            });
        });
    });
});

// 미션 완료 (별 증가, 진도 업데이트, 성찰 기록 추가)
app.post('/api/progress/complete', (req, res) => {
    const { studentId, courseId, stageId, difficulty, reflectionEntry } = req.body;
    
    // 트랜잭션과 유사하게 병렬 실행
    db.serialize(() => {
        // 1. Progress 업데이트 / 추가
        db.run(`
            INSERT OR REPLACE INTO progress (student_id, course_id, stage_id, difficulty, completed, last_updated)
            VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `, [studentId, courseId, stageId, difficulty]);

        // 2. Stats (별 개수) 업데이트 (없는 열쇠면 +1 처리)
        // 실제로는 처음 완료한 난이도인지 체크해야 함. (INSERT OR IGNORE 후 UPDATE 이용)
        db.run(`
            INSERT INTO student_stats (student_id, total_stars) 
            VALUES (?, 1)
            ON CONFLICT(student_id) DO UPDATE SET total_stars = total_stars + 1
        `, [studentId]);

        // 3. Reflection이 존재하면 추가
        if (reflectionEntry) {
            db.run(`
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
            `, [
                studentId,
                courseId,
                stageId,
                difficulty,
                reflectionEntry.reflection,
                reflectionEntry.missionTitle || '',
                reflectionEntry.courseTitle || '',
                reflectionEntry.stageTitle || '',
            ]);
        }
    });

    res.json({ success: true, message: 'Mission completed successfully' });
});


// ==========================================
// 3. 관리자(Admin) 전용 API
// ==========================================

// 모든 학생 목록 및 각각의 진도 통합 조회
app.get('/api/admin/dashboard', (req, res) => {
    // 1. 모든 학생 유저 조회
    db.all(`SELECT id, name FROM users WHERE role = 'student'`, [], (err, students) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. 모든 통계(별) 조회
        db.all(`SELECT student_id, total_stars FROM student_stats`, [], (err2, statsRaw) => {
            if (err2) return res.status(500).json({ error: err2.message });
            const statsMap = {};
            statsRaw.forEach(row => { statsMap[row.student_id] = row.total_stars; });
            
            // 3. 모든 진도 조회
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

                // 4. 모든 성찰 조회
                db.all(`SELECT * FROM reflections ORDER BY created_at DESC`, [], (err4, reflections) => {
                    if (err4) return res.status(500).json({ error: err4.message });

                    res.json({
                        success: true,
                        students: students.map(s => ({
                            studentId: s.id,
                            name: s.name,
                            totalStars: statsMap[s.id] || 0,
                            progress: progressGraph[s.id] || {},
                        })),
                        allReflections: reflections.map(formatReflectionRow)
                    });
                });
            });
        });
    });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite DB 연결 (앱 폴더 내 data/database.sqlite 에 저장)
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // 1. 사용자(학생/관리자) 테이블
        // role: 'admin', 'subadmin', 'student'
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'student',
                courseIds TEXT,     -- JSON string (for subadmins)
                permissions TEXT,   -- JSON string (for subadmins)
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. 진행 상황 테이블 (Zustand: progress)
        db.run(`
            CREATE TABLE IF NOT EXISTS progress (
                student_id TEXT,
                course_id TEXT,
                stage_id TEXT,
                difficulty TEXT,
                completed BOOLEAN DEFAULT 1,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (student_id, course_id, stage_id, difficulty)
            )
        `);

        // 3. 획득 뱃지 테이블 (Zustand: useBadgeStore -> unlockedBadges)
        db.run(`
            CREATE TABLE IF NOT EXISTS badges (
                student_id TEXT,
                badge_id TEXT,
                unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (student_id, badge_id)
            )
        `);

        // 4. 성찰(Reflection) 테이블
        db.run(`
            CREATE TABLE IF NOT EXISTS reflections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                stage_id TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. 총 별 개수 (totalStars)는 progress 테이블에 파생되거나, 별도 스탯 테이블로 사용
        db.run(`
            CREATE TABLE IF NOT EXISTS student_stats (
                student_id TEXT PRIMARY KEY,
                total_stars INTEGER DEFAULT 0,
                total_xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1
            )
        `);

        console.log('Database tables initialized.');
    });
}

module.exports = db;

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

function ensureColumn(tableName, columnName, definition) {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
            console.error(`Error reading ${tableName} schema:`, err.message);
            return;
        }

        if (!columns.some(column => column.name === columnName)) {
            db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`, (alterErr) => {
                if (alterErr) {
                    console.error(`Error adding ${columnName} to ${tableName}:`, alterErr.message);
                }
            });
        }
    });
}

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
                mission_title TEXT,
                course_title TEXT,
                stage_title TEXT,
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

        db.run(
            `
                INSERT OR IGNORE INTO users (id, password, name, role)
                VALUES (?, ?, ?, ?)
            `,
            ['admin', 'admin1234', '관리자', 'admin']
        );

        ensureColumn('reflections', 'mission_title', 'TEXT');
        ensureColumn('reflections', 'course_title', 'TEXT');
        ensureColumn('reflections', 'stage_title', 'TEXT');

        console.log('Database tables initialized.');
    });
}

module.exports = db;

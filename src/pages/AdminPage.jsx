import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../stores/useAuthStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useStageStore } from '../stores/useStageStore';
import { useBadgeStore } from '../stores/useBadgeStore';
import useThemeStore from '../stores/useThemeStore';
import { useMarketplaceStore } from '../stores/useMarketplaceStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useAssessmentStore, ASSESSMENT_METHODS, findNearestScore, ACHIEVEMENT_LEVELS, autoGenerateScoring, scoreFromCheckedCount, getAchievementGrade } from '../stores/useAssessmentStore';
// Note: addSessionScoreForAllAreas, deleteSessionScoreByLabel are used via useAssessmentStore hook
import DashboardCalendar from '../components/DashboardCalendar';
// --- Sub-components for Views ---

const DashboardOverview = ({ totalLearners, totalClasses, totalStarsIssued, courseCompletion, courses, registeredStudents, progress, purchases, sessionScores }) => {
    // Compute per-course completion
    const courseStats = courses.map(course => {
        let totalDone = 0;
        let totalPossible = 0;
        registeredStudents.forEach(s => {
            course.stages.forEach(stage => {
                const sp = progress?.[s.studentId]?.[course.id]?.[stage.id];
                ['easy', 'normal', 'hard'].forEach(d => {
                    totalPossible++;
                    if (sp?.[d]) totalDone++;
                });
            });
        });
        const pct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
        return { ...course, pct, studentCount: registeredStudents.length };
    }).sort((a, b) => b.pct - a.pct);

    const colorSets = [
        { bg: 'bg-admin-pink/20', text: 'text-admin-pink' },
        { bg: 'bg-admin-secondary/20', text: 'text-admin-secondary' },
        { bg: 'bg-admin-yellow/20', text: 'text-admin-yellow' },
        { bg: 'bg-admin-green/20', text: 'text-admin-green' },
    ];

    const sessionCalendarData = useMemo(() => {
        const courseMetaById = Object.fromEntries(
            courses.map(course => [
                course.id,
                {
                    title: course.title || course.name || '수업',
                    icon: course.icon || '📚',
                },
            ])
        );
        const uniqueSessions = new Map();

        sessionScores.forEach(session => {
            const sessionKey = `${session.courseId}:${session.sessionDate}:${session.sessionLabel}`;
            if (!uniqueSessions.has(sessionKey)) {
                const courseMeta = courseMetaById[session.courseId] || { title: '수업', icon: '📚' };
                uniqueSessions.set(sessionKey, {
                    id: sessionKey,
                    date: session.sessionDate,
                    label: session.sessionLabel,
                    courseId: session.courseId,
                    courseTitle: courseMeta.title,
                    courseIcon: courseMeta.icon,
                });
            }
        });

        return Array.from(uniqueSessions.values())
            .sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                const labelOrder = a.label.localeCompare(b.label, 'ko', { numeric: true, sensitivity: 'base' });
                if (labelOrder !== 0) return labelOrder;
                return a.courseTitle.localeCompare(b.courseTitle, 'ko', { sensitivity: 'base' });
            })
            .reduce((acc, session) => {
                if (!acc[session.date]) {
                    acc[session.date] = { sessions: [] };
                }
                acc[session.date].sessions.push(session);
                return acc;
            }, {});
    }, [courses, sessionScores]);

    const recentPurchases = [...purchases].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

    return (
        <div className="w-full max-w-none mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-secondary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-white">groups</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">전체 학생</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{totalLearners}명</h3>
                    </div>
                    <div className="mt-4 w-full bg-gray-700/30 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-admin-secondary to-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(totalLearners * 10, 100)}%` }}></div>
                    </div>
                </div>
                {/* Card 2 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-pink/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-admin-pink">school</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">전체 수업</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{totalClasses}개</h3>
                    </div>
                    <div className="mt-4 flex gap-1">
                        {courses.map((_, i) => (
                            <div key={i} className="h-1.5 flex-1 bg-admin-pink rounded-full"></div>
                        ))}
                        {courses.length === 0 && <div className="h-1.5 flex-1 bg-gray-700/30 rounded-full"></div>}
                    </div>
                </div>
                {/* Card 3 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-yellow/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-admin-yellow">star</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">발급된 별</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{totalStarsIssued}개</h3>
                    </div>
                    <div className="mt-4 w-full bg-gray-700/30 rounded-full h-1.5">
                        <div className="bg-admin-yellow h-1.5 rounded-full" style={{ width: `${Math.min(totalStarsIssued * 2, 100)}%` }}></div>
                    </div>
                </div>
                {/* Card 4 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-green/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-admin-green">check_circle</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">전체 완료율</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{courseCompletion}%</h3>
                    </div>
                    <div className="mt-4 w-full bg-gray-700/30 rounded-full h-1.5">
                        <div className="bg-admin-green h-1.5 rounded-full" style={{ width: `${courseCompletion}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Calendar & Top Classes */}
            <div>
                <DashboardCalendar classData={sessionCalendarData} />
            </div>
            <div className="bg-admin-card-dark rounded-2xl border border-white/5 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">수업별 진행률</h3>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {courseStats.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-500 py-8">등록된 수업이 없습니다.</div>
                        )}
                        {courseStats.map((cs, idx) => {
                            const color = colorSets[idx % colorSets.length];
                            return (
                                <div key={cs.id} className="flex items-center gap-4 p-3 rounded-xl bg-background-dark border border-white/5 hover:border-admin-secondary/30 transition-colors group cursor-pointer">
                                    <div className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center ${color.text}`}>
                                        <span className="text-xl">{cs.icon || '📚'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-sm font-semibold group-hover:text-admin-secondary transition-colors truncate">{cs.title || cs.name}</h4>
                                        <p className="text-gray-500 text-xs">{cs.studentCount}명 수강 · {cs.stages.length}개 스테이지</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-bold ${cs.pct >= 70 ? 'text-admin-green' : cs.pct >= 30 ? 'text-admin-yellow' : 'text-admin-pink'}`}>{cs.pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            {/* Recent Activity */}
            <div className="bg-admin-card-dark rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">최근 활동 내역</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">학생</th>
                                <th className="px-6 py-4 font-semibold">활동 내용</th>
                                <th className="px-6 py-4 font-semibold">별 사용</th>
                                <th className="px-6 py-4 font-semibold">날짜</th>
                                <th className="px-6 py-4 font-semibold text-right">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {recentPurchases.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">아직 활동 내역이 없습니다.</td></tr>
                            )}
                            {recentPurchases.map((p, idx) => (
                                <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(p.studentName || p.studentId)}&background=random')` }}></div>
                                            <div>
                                                <p className="font-medium text-white">{p.studentName || p.studentId}</p>
                                                <p className="text-xs text-gray-500">{p.studentId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        <span className="text-lg mr-1">{p.itemIcon}</span>
                                        <span className="text-white font-medium">{p.itemName}</span> 구매
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-admin-yellow font-medium">
                                            <span className="material-symbols-outlined text-[16px]">star</span>
                                            -{p.price}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{new Date(p.timestamp).toLocaleString('ko-KR')}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'delivered'
                                            ? 'bg-admin-green/10 text-admin-green border border-admin-green/20'
                                            : 'bg-admin-yellow/10 text-admin-yellow border border-admin-yellow/20'
                                            }`}>
                                            {p.status === 'delivered' ? '수령 완료' : '준비 중'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components for Views ---


const ExcelUploadModal = ({ isOpen, onClose, onUpload }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setError('');

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const bstr = event.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    setPreviewData(data);
                } catch (err) {
                    setError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
                    console.error(err);
                }
            };
            reader.readAsBinaryString(selectedFile);
        }
    };

    const handleUpload = () => {
        if (!previewData.length) {
            setError('No data found in file');
            return;
        }
        // Validate required fields
        const validData = previewData.map(row => ({
            name: row.Name || row.name || row['이름'],
            studentId: row.StudentId || row.studentId || row['아이디'] || row['ID'],
            password: row.Password || row.password || row['비밀번호'] || '1234',
            grade: row.Grade || row.grade || row['학년'],
            admissionYear: row.Year || row.year || row['입학년도'] || row['Year'] || row['AdmissionYear']
        })).filter(item => item.name && item.studentId);

        if (validData.length === 0) {
            setError('No valid student data found. Please check column headers (Name, StudentId, Grade, Year).');
            return;
        }

        onUpload(validData);
        onClose();
        setFile(null);
        setPreviewData([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-admin-card-dark w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Bulk Register Students</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-admin-primary/50 transition-colors bg-white/5 relative">
                        <button
                            onClick={() => {
                                const ws = XLSX.utils.json_to_sheet([
                                    { Year: 2024, Grade: 1, Name: "Hong Gildong", StudentId: "student01", Password: "123" }
                                ]);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Students");
                                XLSX.writeFile(wb, "student_upload_template.xlsx");
                            }}
                            className="absolute top-4 right-4 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                            Template
                        </button>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-gray-400">upload_file</span>
                            <span className="text-gray-300 font-medium">Click to upload Excel file</span>
                            <span className="text-xs text-gray-500">.xlsx or .xls files only</span>
                        </label>
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                        <p>Supported Columns: Name, StudentId, Password, Grade, Year</p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}

                    {previewData.length > 0 && (
                        <div className="max-h-60 overflow-y-auto border border-white/10 rounded-lg scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <table className="w-full text-xs text-left text-gray-300">
                                <thead className="bg-white/5 sticky top-0 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-3 py-2">Year</th>
                                        <th className="px-3 py-2">Grade</th>
                                        <th className="px-3 py-2">Name</th>
                                        <th className="px-3 py-2">ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((row, i) => (
                                        <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-3 py-2">{row.Year || row.year || row['입학년도'] || row['Year']}</td>
                                            <td className="px-3 py-2">{row.Grade || row.grade || row['학년']}</td>
                                            <td className="px-3 py-2">{row.Name || row.name || row['이름']}</td>
                                            <td className="px-3 py-2">{row.StudentId || row.studentId || row['아이디']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 50 && (
                                <div className="px-3 py-2 text-center text-gray-500 italic bg-white/5">
                                    ...and {previewData.length - 50} more rows
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium">
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-admin-primary hover:bg-admin-primary/90 text-white transition-colors font-medium shadow-lg shadow-admin-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Import {previewData.length > 0 ? `${previewData.length} Students` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LearnersManagement = ({ registeredStudents, onAddStudent, onDeleteStudent, onBulkRegister, onUpdateStudent }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null); // For editing and viewing badges
    
    // Badge store selector
    const getUnlockedBadges = useBadgeStore(state => state.getUnlockedBadges);
    const allBadges = useBadgeStore(state => state.getAllBadges());

    const [openMenuId, setOpenMenuId] = useState(null);
    const [formData, setFormData] = useState({ name: '', studentId: '', password: '', grade: '1', admissionYear: new Date().getFullYear() });
    const [error, setError] = useState('');

    // Filters
    const [filterGrade, setFilterGrade] = useState('all');
    const [filterYear, setFilterYear] = useState('all');

    // Filter Logic
    const filteredStudents = useMemo(() => {
        return registeredStudents.filter(student => {
            const gradeMatch = filterGrade === 'all' || student.grade === parseInt(filterGrade);
            const yearMatch = filterYear === 'all' || student.admissionYear === parseInt(filterYear);
            return gradeMatch && yearMatch;
        });
    }, [registeredStudents, filterGrade, filterYear]);

    // Unique Years for Filter
    const availableYears = useMemo(() => {
        const years = new Set(registeredStudents.map(s => s.admissionYear));
        return Array.from(years).sort((a, b) => b - a);
    }, [registeredStudents]);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setError('');
        // Pass grade and admissionYear
        const result = onAddStudent(formData.studentId, formData.name, formData.password, formData.grade, formData.admissionYear);
        if (result.ok) {
            setIsAddModalOpen(false);
            setFormData({ name: '', studentId: '', password: '', grade: '1', admissionYear: new Date().getFullYear() });
        } else {
            setError(result.reason === 'already_exists' ? 'Student ID already exists' : 'Invalid input');
        }
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!currentStudent) return;

        const updates = {
            name: formData.name,
            grade: parseInt(formData.grade),
            admissionYear: parseInt(formData.admissionYear)
        };
        // Only update password if the admin actually typed a new one
        if (formData.password && formData.password.trim() !== '') {
            updates.password = formData.password.trim();
        }
        onUpdateStudent(currentStudent.studentId, updates);
        setIsEditModalOpen(false);
        setCurrentStudent(null);
        setFormData({ name: '', studentId: '', password: '', grade: '1', admissionYear: new Date().getFullYear() });
    };

    const openEditModal = (student) => {
        setCurrentStudent(student);
        setFormData({
            name: student.name,
            studentId: student.studentId,
            password: '', // Leave blank - admin types new password only if changing
            grade: student.grade || 1,
            admissionYear: student.admissionYear || new Date().getFullYear()
        });
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const openBadgeModal = (student) => {
        setCurrentStudent(student);
        setIsBadgeModalOpen(true);
        setOpenMenuId(null);
    };

    const handlePromoteAll = () => {
        if (filterGrade === 'all') {
            alert('Please select a specific grade to promote.');
            return;
        }
        if (window.confirm(`Are you sure you want to promote all Grade ${filterGrade} students to Grade ${parseInt(filterGrade) + 1}?`)) {
            filteredStudents.forEach(student => {
                onUpdateStudent(student.studentId, { grade: student.grade + 1 });
            });
            alert(`Promoted ${filteredStudents.length} students.`);
        }
    };

    const handleBulkUpload = (data) => {
        const result = onBulkRegister(data);
        if (result.errors.length > 0) {
            alert(`Registered ${result.addedCount} students. ${result.errors.length} errors occurred (duplicates or missing info). Check console for details.`);
            console.log('Bulk Upload Errors:', result.errors);
        } else {
            alert(`Successfully registered ${result.addedCount} students.`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Learners Management</h3>
                    <p className="text-gray-400 text-sm mt-1">Manage all registered students</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setIsExcelModalOpen(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-green-600/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        <span>Import Excel</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-admin-primary hover:bg-admin-primary/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-admin-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span>Add Student</span>
                    </button>
                </div>
            </div>

            {/* Filters and Actions Bar */}
            <div className="bg-admin-card-dark p-4 rounded-xl border border-white/5 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Year:</span>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-1.5 focus:outline-none focus:border-admin-primary"
                        >
                            <option value="all" className="bg-gray-800">All Years</option>
                            {availableYears.map(y => <option key={y} value={y} className="bg-gray-800">{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Grade:</span>
                        <select
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-1.5 focus:outline-none focus:border-admin-primary"
                        >
                            <option value="all" className="bg-gray-800">All Grades</option>
                            {[1, 2, 3].map(g => <option key={g} value={g} className="bg-gray-800">Grade {g}</option>)}
                        </select>
                    </div>
                </div>

                {filterGrade !== 'all' && (
                    <button
                        onClick={handlePromoteAll}
                        className="flex items-center gap-2 text-admin-secondary hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_up</span>
                        Promote All Grade {filterGrade}
                    </button>
                )}
            </div>

            <div className="bg-admin-card-dark rounded-2xl border border-white/5">
                <div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Year</th>
                                <th className="px-6 py-4 font-semibold">Grade</th>
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Student ID</th>
                                <th className="px-6 py-4 font-semibold">Enrolled Courses</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {filteredStudents.map((student) => (
                                <tr key={student.studentId} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-gray-300 font-medium">{student.admissionYear || '-'}</td>
                                    <td className="px-6 py-4 text-gray-300">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${student.grade === 1 ? 'bg-yellow-500/10 text-yellow-400' :
                                            student.grade === 2 ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            Gr. {student.grade || 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${student.name}&background=random')` }}></div>
                                            <span className="font-medium text-white">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{student.studentId}</td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {student.courseIds?.length > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-secondary/10 text-admin-secondary border border-admin-secondary/20">
                                                {student.courseIds.length} Courses
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 italic">None</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === student.studentId ? null : student.studentId)}
                                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                        >
                                            <span className="material-symbols-outlined">more_vert</span>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openMenuId === student.studentId && (
                                            <div className="absolute right-8 top-8 w-48 bg-admin-card-dark border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                                    onClick={() => openEditModal(student)}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    Edit Details
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to remove this student?')) {
                                                            onDeleteStudent(student.studentId);
                                                            setOpenMenuId(null);
                                                        }
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">person_remove</span>
                                                    Remove Student
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-amber-400 hover:bg-amber-400/10 transition-colors flex items-center gap-2 border-t border-white/5"
                                                    onClick={() => openBadgeModal(student)}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">hotel_class</span>
                                                    View Badges
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No students found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Excel Import Modal */}
            <ExcelUploadModal
                isOpen={isExcelModalOpen}
                onClose={() => setIsExcelModalOpen(false)}
                onUpload={handleBulkUpload}
            />

            {/* Add/Edit Student Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-admin-card-dark w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{isEditModalOpen ? 'Edit Student' : 'Add New Student'}</h3>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                    placeholder="Enter student name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Student ID (Login ID)</label>
                                <input
                                    type="text"
                                    required
                                    disabled={isEditModalOpen} // Cannot change ID during edit
                                    value={formData.studentId}
                                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    className={`w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors ${isEditModalOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="e.g. student01"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Admission Year</label>
                                    <input
                                        type="number"
                                        min="2000"
                                        max={new Date().getFullYear() + 1}
                                        value={formData.admissionYear}
                                        onChange={(e) => setFormData({ ...formData, admissionYear: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Grade</label>
                                    <select
                                        value={formData.grade}
                                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors appearance-none cursor-pointer"
                                    >
                                        <option value="1" className="bg-gray-800">Grade 1</option>
                                        <option value="2" className="bg-gray-800">Grade 2</option>
                                        <option value="3" className="bg-gray-800">Grade 3</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                    placeholder={isEditModalOpen ? "비워두면 기존 비밀번호 유지" : "비워두면 기본값 '1234'"}
                                />
                                {!isEditModalOpen && <p className="text-xs text-gray-500 mt-1">Default password is '1234' if left empty.</p>}
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-admin-primary hover:bg-admin-primary/90 text-white transition-colors font-medium shadow-lg shadow-admin-primary/20"
                                >
                                    {isEditModalOpen ? 'Save Changes' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Badges Modal */}
            {isBadgeModalOpen && currentStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-admin-card-dark rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-white/10 zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <span className="material-symbols-outlined text-amber-400">workspace_premium</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{currentStudent.name}'s Badges</h3>
                                    <p className="text-sm text-gray-400">{currentStudent.studentId} • Grade {currentStudent.grade || 1}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsBadgeModalOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                {(() => {
                                    const unlocked = getUnlockedBadges(currentStudent.studentId);
                                    if (unlocked.length === 0) {
                                        return (
                                            <div className="col-span-full py-12 text-center text-gray-400">
                                                <span className="material-symbols-outlined text-5xl mb-3 opacity-30">block</span>
                                                <p>This student hasn't unlocked any badges yet.</p>
                                            </div>
                                        );
                                    }
                                    return unlocked.map(badge => (
                                        <div key={badge.id} className="group relative flex flex-col items-center justify-center p-3 rounded-xl border border-amber-500/20 bg-gradient-to-br from-white/5 to-amber-500/10 hover:to-amber-500/20 transition-all shadow-sm">
                                            <div className="text-3xl mb-2 drop-shadow-md group-hover:scale-110 transition-transform">{badge.emoji}</div>
                                            <div className="text-[10px] font-bold text-center text-white line-clamp-1">{badge.name}</div>
                                            
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 border border-white/10 text-white text-xs rounded py-1.5 px-3 z-10 pointer-events-none shadow-xl w-max max-w-[150px] text-center">
                                                <div className="font-bold text-amber-300 mb-0.5">{badge.name}</div>
                                                <div className="text-[10px] text-gray-300">{badge.desc}</div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/10 flex justify-end bg-white/5 rounded-b-2xl">
                            <button onClick={() => setIsBadgeModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MissionEditorModal = ({ isOpen, onClose, mission, onSave, difficulty }) => {
    const MAX_TUTORIAL_HTML_BYTES = 50 * 1024 * 1024; // 50 MB
    const [formData, setFormData] = useState({
        title: '',
        type: 'video',
        description: '',
        videoUrl: '',
        taskDescription: '',
        tutorialSteps: [],
        htmlContent: '',
        htmlFileName: '',
        hasQuiz: false,
        quizQuestions: []
    });
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (mission) {
            setFormData({
                title: mission.title || '',
                type: mission.type || 'video',
                description: mission.description || '',
                videoUrl: mission.videoUrl || '',
                taskDescription: mission.taskDescription || '',
                tutorialSteps: mission.tutorialSteps || [],
                htmlContent: mission.htmlContent || '',
                htmlFileName: mission.htmlFileName || '',
                hasQuiz: (mission.quizQuestions && mission.quizQuestions.length > 0) || false,
                quizQuestions: mission.quizQuestions || []
            });
        } else {
            setFormData({
                title: '',
                type: 'video',
                description: '',
                videoUrl: '',
                taskDescription: '',
                tutorialSteps: [],
                htmlContent: '',
                htmlFileName: '',
                hasQuiz: false,
                quizQuestions: []
            });
        }
        setUploadError('');
    }, [mission, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalData = { ...formData };
        // Normalize YouTube URL to embed format
        if (finalData.videoUrl) {
            let url = finalData.videoUrl.trim();
            // 1) iframe embed code → extract src
            if (url.includes('<iframe')) {
                const srcMatch = url.match(/src=["']([^"']+)["']/);
                if (srcMatch) url = srcMatch[1].replace(/&amp;/g, '&');
            }
            // 2) watch?v= format → embed
            const watchMatch = url.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]+)/);
            if (watchMatch) url = `https://www.youtube.com/embed/${watchMatch[1]}`;
            // 3) youtu.be/ short link → embed
            const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (shortMatch) url = `https://www.youtube.com/embed/${shortMatch[1]}`;
            // 4) shorts/ format → embed
            const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
            if (shortsMatch) url = `https://www.youtube.com/embed/${shortsMatch[1]}`;
            finalData.videoUrl = url;
        }
        // Strip quizQuestions if quiz is disabled
        if (!finalData.hasQuiz) {
            finalData.quizQuestions = [];
        }
        delete finalData.hasQuiz;
        onSave({ ...mission, ...finalData });
        onClose();
    };

    const handleTutorialFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_TUTORIAL_HTML_BYTES) {
            setUploadError('File is too large. Please upload an HTML file smaller than 1 MB.');
            return;
        }

        try {
            const text = await file.text();
            setFormData(prev => ({
                ...prev,
                htmlContent: text,
                htmlFileName: file.name
            }));
            setUploadError('');
        } catch (error) {
            setUploadError('Failed to read file. Please try again with a valid HTML file.');
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-admin-card-dark w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-6">
                    Edit {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mission
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-admin-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-admin-primary focus:outline-none"
                        >
                            <option value="video">Video & Quiz</option>
                            <option value="tutorial">Tutorial</option>
                            <option value="practice">Practice Task</option>
                        </select>
                    </div>

                    {formData.type === 'video' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">YouTube Embed Code or URL</label>
                                <textarea
                                    value={formData.videoUrl}
                                    onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-admin-primary focus:outline-none h-24 font-mono text-sm"
                                    placeholder={'YouTube에서 "공유 > 퍼가기"로 복사한 <iframe> 코드를 붙여넣거나,\nhttps://www.youtube.com/embed/... URL을 입력하세요.'}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    YouTube 공유 → 퍼가기(embed) 코드를 그대로 붙여넣으면 자동으로 URL이 추출됩니다.
                                </p>
                            </div>

                            {/* Quiz Toggle */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-gray-300">퀴즈 포함</span>
                                    <div
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            hasQuiz: !prev.hasQuiz,
                                            quizQuestions: !prev.hasQuiz && prev.quizQuestions.length === 0
                                                ? [{ question: '', options: ['', '', '', ''], answer: 0 }]
                                                : prev.quizQuestions
                                        }))}
                                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${formData.hasQuiz ? 'bg-admin-primary' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${formData.hasQuiz ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </div>
                                </label>

                                {formData.hasQuiz && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-gray-500">학생은 66% 이상 정답을 맞춰야 미션을 완료할 수 있습니다.</p>

                                        {formData.quizQuestions.map((q, qIdx) => (
                                            <div key={qIdx} className="p-4 bg-background-dark rounded-xl border border-white/10 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-admin-primary">Q{qIdx + 1}</span>
                                                    {formData.quizQuestions.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                quizQuestions: prev.quizQuestions.filter((_, i) => i !== qIdx)
                                                            }))}
                                                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                                        >삭제</button>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={q.question}
                                                    onChange={e => {
                                                        const updated = [...formData.quizQuestions];
                                                        updated[qIdx] = { ...updated[qIdx], question: e.target.value };
                                                        setFormData(prev => ({ ...prev, quizQuestions: updated }));
                                                    }}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-admin-primary focus:outline-none"
                                                    placeholder="질문을 입력하세요"
                                                />
                                                <div className="space-y-2">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`quiz-answer-${qIdx}`}
                                                                checked={q.answer === oIdx}
                                                                onChange={() => {
                                                                    const updated = [...formData.quizQuestions];
                                                                    updated[qIdx] = { ...updated[qIdx], answer: oIdx };
                                                                    setFormData(prev => ({ ...prev, quizQuestions: updated }));
                                                                }}
                                                                className="accent-green-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={e => {
                                                                    const updated = [...formData.quizQuestions];
                                                                    const newOpts = [...updated[qIdx].options];
                                                                    newOpts[oIdx] = e.target.value;
                                                                    updated[qIdx] = { ...updated[qIdx], options: newOpts };
                                                                    setFormData(prev => ({ ...prev, quizQuestions: updated }));
                                                                }}
                                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:border-admin-primary focus:outline-none"
                                                                placeholder={`보기 ${oIdx + 1}`}
                                                            />
                                                        </div>
                                                    ))}
                                                    <p className="text-[10px] text-gray-500 pl-6">● 라디오 버튼으로 정답을 선택하세요</p>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                quizQuestions: [...prev.quizQuestions, { question: '', options: ['', '', '', ''], answer: 0 }]
                                            }))}
                                            className="w-full py-2 rounded-xl border border-dashed border-white/20 text-sm text-gray-400 hover:border-admin-primary hover:text-admin-primary transition-colors"
                                        >+ 질문 추가</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {formData.type === 'practice' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Task Description</label>
                            <textarea
                                value={formData.taskDescription}
                                onChange={e => setFormData({ ...formData, taskDescription: e.target.value })}
                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-admin-primary focus:outline-none h-[512px]"
                                placeholder="Describe the task..."
                            />
                        </div>
                    )}

                    {/* Simplified Tutorial Editor for brevity - can be expanded */}
                    {formData.type === 'tutorial' && (
                        <div className="space-y-3 p-4 bg-white/5 rounded-xl">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tutorial HTML File</label>
                                <input
                                    type="file"
                                    accept=".html,.htm,text/html"
                                    onChange={handleTutorialFileUpload}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-admin-primary focus:outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-admin-primary/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-admin-primary hover:file:bg-admin-primary/30"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload a standalone tutorial HTML (max 1 MB). Inline styles/scripts are allowed.
                                </p>
                            </div>
                            {uploadError && (
                                <p className="text-sm text-red-400">{uploadError}</p>
                            )}
                            <div className="text-xs text-gray-400">
                                {formData.htmlContent
                                    ? `Loaded: ${formData.htmlFileName || 'inline tutorial'} (${formData.htmlContent.length.toLocaleString()} chars)`
                                    : 'No tutorial HTML uploaded yet.'}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-xl bg-admin-primary text-white hover:bg-admin-primary/90 transition-colors">Save Mission</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EnrollStudentModal = ({ isOpen, onClose, courseId, onEnroll }) => {
    const { registeredStudents } = useAuthStore();
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Filter students NOT already enrolled in this course
    const availableStudents = useMemo(() =>
        registeredStudents.filter(s => !s.courseIds.includes(courseId))
        , [registeredStudents, courseId]);

    const handleToggle = (studentId) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const handleEnroll = () => {
        onEnroll(selectedStudents);
        onClose();
        setSelectedStudents([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-admin-card-dark w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Enroll Students</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2">
                    {availableStudents.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">All students are already enrolled.</p>
                    ) : (
                        availableStudents.map(student => (
                            <div
                                key={student.studentId}
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${selectedStudents.includes(student.studentId)
                                    ? 'bg-admin-primary/10 border-admin-primary'
                                    : 'bg-background-dark border-white/5 hover:border-white/10'
                                    }`}
                                onClick={() => handleToggle(student.studentId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedStudents.includes(student.studentId)
                                        ? 'bg-admin-primary border-admin-primary'
                                        : 'border-gray-500'
                                        }`}>
                                        {selectedStudents.includes(student.studentId) && (
                                            <span className="material-symbols-outlined text-[14px] text-white">check</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{student.name} <span className="text-gray-500 text-sm">({student.studentId})</span></p>
                                        <p className="text-gray-500 text-xs">Grade {student.grade} • {student.admissionYear}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-6 border-t border-white/10 mt-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
                    <button
                        onClick={handleEnroll}
                        disabled={selectedStudents.length === 0}
                        className="px-4 py-2 rounded-xl bg-admin-primary text-white hover:bg-admin-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Enroll {selectedStudents.length} Students
                    </button>
                </div>
            </div>
        </div>
    );
};

const CourseEditor = ({ course, onBack }) => {
    const { addStage, updateStage, deleteStage, getCourse } = useStageStore();
    const { registeredStudents, enrollStudent, unenrollStudent } = useAuthStore();

    // Re-fetch course to ensure fresh state
    const currentCourse = getCourse(course.id) || course;

    const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'students'
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState(null);
    const [stageFormData, setStageFormData] = useState({ title: '', description: '' });

    const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
    const [editingMission, setEditingMission] = useState({ stageId: null, difficulty: null, data: null });

    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

    const enrolledStudents = useMemo(() =>
        registeredStudents.filter(s => s.courseIds.includes(currentCourse.id))
        , [registeredStudents, currentCourse.id]);

    const handleEnrollStudents = (studentIds) => {
        studentIds.forEach(id => enrollStudent(id, currentCourse.id));
    };

    const handleStageSubmit = (e) => {
        e.preventDefault();
        if (editingStage) {
            updateStage(course.id, editingStage.id, stageFormData);
        } else {
            addStage(course.id, {
                id: `stage-${Date.now()}`,
                courseId: course.id,
                title: stageFormData.title,
                description: stageFormData.description,
                order: currentCourse.stages.length + 1,
                missions: { easy: null, normal: null, hard: null }
            });
        }
        setIsStageModalOpen(false);
        setEditingStage(null);
        setStageFormData({ title: '', description: '' });
    };

    const openMissionEditor = (stageId, difficulty, missionData) => {
        setEditingMission({ stageId, difficulty, data: missionData });
        setIsMissionModalOpen(true);
    };

    const saveMission = (updatedMission) => {
        const stage = currentCourse.stages.find(s => s.id === editingMission.stageId);
        if (!stage) return;

        const updatedMissions = {
            ...stage.missions,
            [editingMission.difficulty]: updatedMission
        };

        updateStage(course.id, editingMission.stageId, { missions: updatedMissions });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="text-3xl">{currentCourse.icon}</span>
                            {currentCourse.title}
                        </h2>
                        <p className="text-gray-400 text-sm">Curriculum Design & Enrollment</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white/5 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setActiveTab('curriculum')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'curriculum' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Curriculum
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Students ({enrolledStudents.length})
                    </button>
                </div>

                {activeTab === 'curriculum' ? (
                    <button
                        onClick={() => {
                            setEditingStage(null);
                            setStageFormData({ title: '', description: '' });
                            setIsStageModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-admin-primary hover:bg-admin-primary/90 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-admin-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add Stage
                    </button>
                ) : (
                    <button
                        onClick={() => setIsEnrollModalOpen(true)}
                        className="flex items-center gap-2 bg-admin-primary hover:bg-admin-primary/90 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-admin-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Enroll Students
                    </button>
                )}
            </div>

            {/* Content Area */}
            {activeTab === 'curriculum' ? (
                /* Stage List */
                <div className="space-y-4">
                    {currentCourse.stages.length === 0 ? (
                        <div className="text-center py-20 bg-admin-card-dark rounded-2xl border border-white/5 border-dashed">
                            <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">layers</span>
                            <p className="text-gray-500">No stages yet. Add one to start designing the curriculum.</p>
                        </div>
                    ) : (
                        currentCourse.stages.sort((a, b) => a.order - b.order).map((stage, index) => (
                            <div key={stage.id} className="bg-admin-card-dark rounded-xl border border-white/5 overflow-hidden">
                                {/* Stage Header */}
                                <div className="p-4 bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-gray-300">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">{stage.title}</h4>
                                            <p className="text-gray-400 text-xs">{stage.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingStage(stage);
                                                setStageFormData({ title: stage.title, description: stage.description });
                                                setIsStageModalOpen(true);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this stage?')) deleteStage(course.id, stage.id);
                                            }}
                                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Missions Grid */}
                                <div className="grid grid-cols-3 gap-4 p-4 border-t border-white/5">
                                    {['easy', 'normal', 'hard'].map(difficulty => {
                                        const mission = stage.missions?.[difficulty];
                                        return (
                                            <div key={difficulty} className="bg-background-dark rounded-lg p-3 border border-white/5 flex flex-col gap-2 relative group hover:border-admin-secondary/30 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${difficulty === 'easy' ? 'bg-admin-green/10 text-admin-green' :
                                                        difficulty === 'normal' ? 'bg-admin-secondary/10 text-admin-secondary' :
                                                            'bg-admin-pink/10 text-admin-pink'
                                                        }`}>
                                                        {difficulty}
                                                    </span>
                                                    {mission && (
                                                        <span className="material-symbols-outlined text-xs text-gray-500">
                                                            {mission.type === 'video' ? 'play_circle' : mission.type === 'tutorial' ? 'menu_book' : 'task'}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="min-h-[40px] flex items-center justify-center text-center">
                                                    {mission ? (
                                                        <span className="text-sm text-gray-200 font-medium line-clamp-2">{mission.title}</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-600 italic">No mission set</span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => openMissionEditor(stage.id, difficulty, mission)}
                                                    className="w-full mt-auto py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors border border-white/5"
                                                >
                                                    {mission ? 'Edit Mission' : 'Add Mission'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Student List */
                <div className="bg-admin-card-dark rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Student ID</th>
                                <th className="px-6 py-4 font-semibold">Grade</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {enrolledStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No students enrolled in this course yet.
                                    </td>
                                </tr>
                            ) : (
                                enrolledStudents.map(student => (
                                    <tr key={student.studentId} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                                        <td className="px-6 py-4 text-gray-400">{student.studentId}</td>
                                        <td className="px-6 py-4 text-gray-400">{student.grade}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Unenroll ${student.name} from this course?`)) {
                                                        unenrollStudent(student.studentId, course.id);
                                                    }
                                                }}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1 rounded-lg text-xs transition-colors"
                                            >
                                                Unenroll
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stage Modal */}
            {isStageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-admin-card-dark w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">{editingStage ? 'Edit Stage' : 'Add New Stage'}</h3>
                        <form onSubmit={handleStageSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={stageFormData.title}
                                    onChange={e => setStageFormData({ ...stageFormData, title: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-admin-primary focus:outline-none"
                                    placeholder="e.g. Chapter 1: Basics"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={stageFormData.description}
                                    onChange={e => setStageFormData({ ...stageFormData, description: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-admin-primary focus:outline-none"
                                    placeholder="Brief summary of this stage"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsStageModalOpen(false)} className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-xl bg-admin-primary text-white hover:bg-admin-primary/90 transition-colors">{editingStage ? 'Save Changes' : 'Create Stage'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mission Modal */}
            <MissionEditorModal
                isOpen={isMissionModalOpen}
                onClose={() => setIsMissionModalOpen(false)}
                mission={editingMission.data}
                difficulty={editingMission.difficulty || ''}
                onSave={saveMission}
            />

            {/* Enroll Student Modal */}
            <EnrollStudentModal
                isOpen={isEnrollModalOpen}
                onClose={() => setIsEnrollModalOpen(false)}
                courseId={course.id}
                onEnroll={handleEnrollStudents}
            />
        </div>
    );
};

const ClassManagement = ({ courses, onAddCourse, onDeleteCourse }) => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title) {
            setError('Class title is required');
            return;
        }

        const newCourse = {
            id: `course-${Date.now()}`,
            title: formData.title,
            description: formData.description || 'No description provided.',
            icon: '📚', // Default icon
            theme: {
                primaryColor: '#3F72AF',
                accentColor: '#DBE2EF',
                bgPattern: 'blueprint',
            },
            stages: []
        };

        onAddCourse(newCourse);
        setIsModalOpen(false);
        setFormData({ title: '', description: '' });
        setError('');
    };

    if (selectedCourse) {
        return <CourseEditor course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
    }


    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-white">Class Management</h3>
                    <p className="text-gray-400 text-sm mt-1">Manage all classes and curriculum</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-admin-primary hover:bg-admin-primary/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-admin-primary/20"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Add Class</span>
                </button>
            </div>

            <div className="bg-admin-card-dark rounded-2xl border border-white/5">
                <div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Class Name</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold">Stages</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {courses.map((course) => (
                                <tr
                                    key={course.id}
                                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => setSelectedCourse(course)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-admin-primary/20 flex items-center justify-center text-2xl">
                                                {course.icon}
                                            </div>
                                            <span className="font-medium text-white">{course.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{course.description}</td>
                                    <td className="px-6 py-4 text-gray-300">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-secondary/10 text-admin-secondary border border-admin-secondary/20">
                                            {course.stages?.length || 0} Stages
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === course.id ? null : course.id);
                                            }}
                                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                        >
                                            <span className="material-symbols-outlined">more_vert</span>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openMenuId === course.id && (
                                            <div className="absolute right-8 top-8 w-48 bg-admin-card-dark border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                                    onClick={() => setOpenMenuId(null)}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    Edit Class
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this class?')) {
                                                            onDeleteCourse(course.id);
                                                            setOpenMenuId(null);
                                                        }
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    Delete Class
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {courses.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No classes created yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Class Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-admin-card-dark w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Add New Class</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Class Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                        placeholder="e.g. Design Principles 101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors h-24 resize-none"
                                        placeholder="Brief description of the class..."
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">error</span>
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-admin-primary hover:bg-admin-primary/90 text-white transition-colors font-medium shadow-lg shadow-admin-primary/20"
                                    >
                                        Add Class
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >

    );
};

const AssessmentsManagement = ({ courses, registeredStudents }) => {
    const [selectedCourseId, setSelectedCourseId] = useState(courses.length > 0 ? courses[0].id : '');
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const {
        assessmentPlans, createPlan, updatePlanWeights, addPerformanceArea,
        updatePerformanceArea, removePerformanceArea,
        studentScores, setWrittenExamScore, calculateTotal, getAreaFinalScore,
        uploadNeisScores, addSessionComment, deleteSessionComment,
        getStudentComments, saveGeneratedReport, generatedReports,
        sessionScores, addSessionScore, updateSessionStudentScore, deleteSessionScore,
        getSessionScoresForArea,
    } = useAssessmentStore();

    const [activeSubTab, setActiveSubTab] = useState('plan');
    const [editAreaModal, setEditAreaModal] = useState(null);
    const [scoringSessionModal, setScoringSessionModal] = useState(null); // { areaId }
    const [commentTarget, setCommentTarget] = useState('');
    const [newAreaName, setNewAreaName] = useState('');
    const [newAreaWeight, setNewAreaWeight] = useState(10);
    const [commentDate, setCommentDate] = useState(new Date().toISOString().split('T')[0]);
    const [commentText, setCommentText] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiStudentId, setAiStudentId] = useState(null);

    // Edit area modal states
    const [editField, setEditField] = useState({ achievementStandard: '', newElement: '', newLevelLabel: '', newLevelDesc: '', newLevelScore: '' });

    const plan = assessmentPlans[selectedCourseId];
    const ensurePlan = () => { if (!plan) createPlan(selectedCourseId); };

    const enrolledStudents = useMemo(() => {
        if (!selectedCourse) return [];
        return registeredStudents.filter(s => s.courseIds?.includes(selectedCourseId));
    }, [selectedCourseId, registeredStudents, selectedCourse]);

    const handleNeisUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',').map(c => c.trim());
                    if (cols.length >= 2) data.push({ studentId: cols[0], score: Number(cols[1]) });
                }
                uploadNeisScores(selectedCourseId, file.name, data);
                alert(`${data.length}명의 지필평가 점수가 업로드되었습니다.`);
            } catch { alert('CSV 형식 오류'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleGenerateReport = async (studentId) => {
        setAiLoading(true); setAiStudentId(studentId);
        const comments = getStudentComments(selectedCourseId, studentId);
        const student = registeredStudents.find(s => s.studentId === studentId);
        const total = calculateTotal(selectedCourseId, studentId);
        const report = `[AI 과세특 초안 - ${student?.name || studentId}]\n\n${selectedCourse?.title || '수업'} 과목에서 꾸준한 학습 참여를 보이며, 수업 활동에 적극적으로 임하는 모습이 관찰됨. 특히 실습 과제에서 높은 집중력을 발휘하였음. ${comments.length > 0 ? `총 ${comments.length}회의 수업에서 교사 코멘트가 기록되었으며, ` : ''}종합 점수 ${total?.total || '-'}점.\n\n※ Gemini API 키를 설정하면 실제 AI 과세특이 생성됩니다.`;
        saveGeneratedReport(selectedCourseId, studentId, report);
        setAiLoading(false); setAiStudentId(null);
    };

    // 수업 채점 모달: 새 차시 추가
    const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
    const [newSessionLabel, setNewSessionLabel] = useState('');

    const subTabs = [
        { id: 'plan', label: '평가 계획', icon: 'edit_note' },
        { id: 'scoring', label: '채점 & 성적', icon: 'grading' },
        { id: 'comments', label: '코멘트 & 과세특', icon: 'forum' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Assessments</h3>
                    <p className="text-gray-400 text-sm mt-1">평가 계획 설정, 채점, 수업 코멘트 관리</p>
                </div>
                <div className="flex items-center gap-3 bg-admin-card-dark p-2 rounded-xl border border-white/10">
                    <span className="text-sm text-gray-400 pl-2">수업:</span>
                    <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="bg-white/5 border-none rounded-lg text-sm text-white focus:ring-1 focus:ring-admin-primary py-1.5 pl-3 pr-8 cursor-pointer hover:bg-white/10">
                        {courses.map(c => <option key={c.id} value={c.id} className="bg-admin-card-dark">{c.title}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-admin-card-dark rounded-xl border border-white/10">
                {subTabs.map(tab => (
                    <button key={tab.id} onClick={() => { ensurePlan(); setActiveSubTab(tab.id); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${activeSubTab === tab.id ? 'bg-admin-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>{tab.label}
                    </button>
                ))}
            </div>

            {/* ═══ Plan Setup ═══ */}
            {activeSubTab === 'plan' && (
                <div className="space-y-6">
                    {!plan ? (
                        <div className="text-center py-12 bg-admin-card-dark rounded-2xl border border-white/10">
                            <span className="material-symbols-outlined text-5xl text-gray-500 mb-4">assignment_add</span>
                            <p className="text-gray-400 mb-4">평가 계획이 없습니다.</p>
                            <button onClick={() => createPlan(selectedCourseId)} className="px-6 py-3 bg-admin-primary text-white rounded-xl font-medium hover:bg-admin-primary/80">평가 계획 만들기</button>
                        </div>
                    ) : (
                        <>
                            {/* 지필/수행 비율 */}
                            <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-admin-primary">tune</span>지필 / 수행 비율 설정
                                </h4>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-blue-400">지필 {plan.writtenExamWeight}%</span>
                                    <span className="text-emerald-400">수행 {plan.performanceWeight}%</span>
                                </div>
                                <input type="range" min="0" max="100" step="5" value={plan.writtenExamWeight}
                                    onChange={e => updatePlanWeights(selectedCourseId, Number(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                    style={{ background: `linear-gradient(to right, #3b82f6 ${plan.writtenExamWeight}%, #10b981 ${plan.writtenExamWeight}%)` }} />
                                <div className="mt-4 flex items-center gap-3">
                                    <span className="text-sm text-gray-400">지필 만점:</span>
                                    <input type="number" min="1" value={plan.writtenExamMaxScore}
                                        onChange={e => useAssessmentStore.setState(s => ({ assessmentPlans: { ...s.assessmentPlans, [selectedCourseId]: { ...s.assessmentPlans[selectedCourseId], writtenExamMaxScore: Number(e.target.value) } } }))}
                                        className="w-24 bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 text-center" />
                                    <span className="text-sm text-gray-500">점</span>
                                </div>
                            </div>

                            {/* 수행평가 영역 */}
                            <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-400">checklist</span>수행평가 영역
                                </h4>
                                <div className="space-y-3">
                                    {plan.performanceAreas.map((area, idx) => (
                                        <div key={area.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-admin-primary/30 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl font-bold text-admin-primary">{'가나다라마바사아자차카타파하'.charAt(idx) || String(idx + 1)}.</span>
                                                    <div>
                                                        <span className="font-semibold text-white">{area.name}</span>
                                                        <span className="text-sm text-gray-400 ml-3">비율 {area.weight}%</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditAreaModal({ ...area }); setEditField({ achievementStandard: area.achievementStandard || '', newElement: '', newLevelLabel: '', newLevelDesc: '', newLevelScore: '' }); }}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"><span className="material-symbols-outlined text-lg">edit</span></button>
                                                    <button onClick={() => { if (confirm('삭제?')) removePerformanceArea(selectedCourseId, area.id); }}
                                                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">delete</span></button>
                                                </div>
                                            </div>
                                            {/* 요약 정보 */}
                                            <div className="mt-3 space-y-1.5">
                                                {area.achievementStandard && (
                                                    <div className="text-xs text-gray-400"><span className="text-emerald-400 font-medium">성취기준:</span> {area.achievementStandard.length > 60 ? area.achievementStandard.slice(0, 60) + '...' : area.achievementStandard}</div>
                                                )}
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {area.assessmentMethods?.map(m => (
                                                        <span key={m} className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{m}</span>
                                                    ))}
                                                    {area.assessmentElements?.map((el, i) => (
                                                        <span key={i} className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{el.length > 15 ? el.slice(0, 15) + '…' : el}</span>
                                                    ))}
                                                </div>
                                                <div className="flex gap-1.5 mt-1 items-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${area.scoringMode === 'checklist' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-admin-primary/20 text-admin-primary/80'}`}>
                                                        {area.scoringMode === 'checklist' ? '✓ 체크리스트' : '직접 입력'}
                                                    </span>
                                                    {area.scoringLevels?.map(lv => (
                                                        <span key={lv.id} className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{lv.label}:{lv.score}점</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* 새 영역 추가 */}
                                <div className="mt-4 p-4 border-2 border-dashed border-white/10 rounded-xl">
                                    <div className="flex flex-wrap items-end gap-3">
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="text-xs text-gray-400 mb-1 block">영역 이름</label>
                                            <input value={newAreaName} onChange={e => setNewAreaName(e.target.value)} placeholder="예: 표현 기법" className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2" />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-gray-400 mb-1 block">비율(%)</label>
                                            <input type="number" value={newAreaWeight} onChange={e => setNewAreaWeight(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 text-center" />
                                        </div>
                                        <button onClick={() => { if (!newAreaName.trim()) return; addPerformanceArea(selectedCourseId, { name: newAreaName, weight: newAreaWeight }); setNewAreaName(''); setNewAreaWeight(10); }}
                                            className="px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-medium hover:bg-admin-primary/80 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-lg">add</span>추가
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══ Scoring & NEIS ═══ */}
            {activeSubTab === 'scoring' && plan && (
                <div className="space-y-6">
                    {/* 나이스 업로드 */}
                    <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-400">upload_file</span>나이스 지필평가 업로드
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">CSV 형식: 학번, 점수 (첫 줄 헤더)</p>
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-admin-primary/50">
                            <span className="material-symbols-outlined text-gray-400">cloud_upload</span>
                            <span className="text-sm text-gray-400">CSV 파일 선택</span>
                            <input type="file" accept=".csv" className="hidden" onChange={handleNeisUpload} />
                        </label>
                    </div>

                    {/* 공통 차시 관리 */}
                    {plan.performanceAreas.length > 0 && (
                        <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10">
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-400">event_note</span>차시 관리
                            </h4>
                            <p className="text-xs text-gray-400 mb-3">차시를 추가하면 모든 수행평가 영역에 동시 적용됩니다.</p>
                            <div className="flex items-end gap-3 p-3 bg-white/5 rounded-xl border border-dashed border-white/10 mb-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">날짜</label>
                                    <input type="date" value={newSessionDate} onChange={e => setNewSessionDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg text-xs text-white px-2 py-1.5" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">차시명</label>
                                    <input value={newSessionLabel} onChange={e => setNewSessionLabel(e.target.value)} placeholder="예: 1차시" className="bg-white/5 border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 w-24" />
                                </div>
                                <button onClick={() => {
                                    if (!newSessionLabel.trim()) return;
                                    useAssessmentStore.getState().addSessionScoreForAllAreas(selectedCourseId, newSessionDate, newSessionLabel);
                                    const allSessions = getSessionScoresForArea(selectedCourseId, plan.performanceAreas[0]?.id);
                                    setNewSessionLabel(`${(allSessions?.length || 0) + 1}차시`);
                                }} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">add</span>차시 추가
                                </button>
                            </div>
                            {/* 등록된 차시 목록 */}
                            {(() => {
                                const firstArea = plan.performanceAreas[0];
                                if (!firstArea) return null;
                                const sessions = getSessionScoresForArea(selectedCourseId, firstArea.id);
                                if (sessions.length === 0) return <p className="text-xs text-gray-500">등록된 차시가 없습니다.</p>;
                                return (
                                    <div className="flex flex-wrap gap-2">
                                        {sessions.map(s => (
                                            <div key={s.id} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
                                                <span className="text-xs text-white font-medium">{s.sessionLabel}</span>
                                                <span className="text-[10px] text-gray-500">{s.sessionDate}</span>
                                                <button onClick={() => { if (confirm(`'${s.sessionLabel}' 차시를 모든 영역에서 삭제하시겠습니까?`)) useAssessmentStore.getState().deleteSessionScoreByLabel(selectedCourseId, s.sessionDate, s.sessionLabel); }}
                                                    className="text-gray-500 hover:text-red-400 ml-1"><span className="material-symbols-outlined text-xs">close</span></button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* 수업별 채점 영역 */}
                    {plan.performanceAreas.length > 0 && (
                        <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400">fact_check</span>수업별 채점
                            </h4>
                            <div className="space-y-4">
                                {plan.performanceAreas.map(area => {
                                    const sessions = getSessionScoresForArea(selectedCourseId, area.id);
                                    return (
                                        <div key={area.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <span className="font-semibold text-white">{area.name}</span>
                                                    <span className="text-xs text-gray-400 ml-2">({sessions.length}회 채점)</span>
                                                </div>
                                                <button onClick={() => { setScoringSessionModal({ areaId: area.id, area }); }}
                                                    className="px-3 py-1.5 bg-admin-primary text-white rounded-lg text-xs font-medium hover:bg-admin-primary/80 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">edit</span>채점하기
                                                </button>
                                            </div>
                                            {/* 채점 이력 */}
                                            {sessions.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b border-white/10">
                                                                <th className="text-left py-2 px-2 text-gray-400">학생</th>
                                                                {sessions.map(s => (
                                                                    <th key={s.id} className="text-center py-2 px-2 text-gray-400">
                                                                        <div>{s.sessionLabel}</div>
                                                                        <div className="text-[10px] text-gray-500">{s.sessionDate}</div>
                                                                    </th>
                                                                ))}
                                                                <th className="text-center py-2 px-2 text-amber-400">평균</th>
                                                                <th className="text-center py-2 px-2 text-emerald-400">산출</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {enrolledStudents.map(student => {
                                                                const result = getAreaFinalScore(selectedCourseId, student.studentId, area.id);
                                                                return (
                                                                    <tr key={student.studentId} className="border-b border-white/5">
                                                                        <td className="py-2 px-2 text-white font-medium">{student.name}</td>
                                                                        {sessions.map(s => (
                                                                            <td key={s.id} className="py-2 px-2 text-center">
                                                                                <span className={`${s.scores[student.studentId] !== undefined ? 'text-white' : 'text-gray-600'}`}>
                                                                                    {s.scores[student.studentId] ?? '-'}
                                                                                </span>
                                                                            </td>
                                                                        ))}
                                                                        <td className="py-2 px-2 text-center text-amber-400 font-medium">{result.sessionCount > 0 ? result.avg : '-'}</td>
                                                                        <td className="py-2 px-2 text-center text-emerald-400 font-bold">{result.sessionCount > 0 ? result.finalScore : '-'}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 종합 성적표 */}
                    <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10 overflow-x-auto">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-400">grading</span>종합 성적표
                        </h4>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-3 text-gray-400">학생명</th>
                                    <th className="text-center py-3 px-2 text-blue-400">지필<br /><span className="text-[10px]">({plan.writtenExamWeight}%)</span></th>
                                    {plan.performanceAreas.map(a => (
                                        <th key={a.id} className="text-center py-3 px-2 text-emerald-400">{a.name}<br /><span className="text-[10px]">({a.weight}%)</span></th>
                                    ))}
                                    <th className="text-center py-3 px-2 text-amber-400">합계</th>
                                    <th className="text-center py-3 px-2 text-orange-400">성취율</th>
                                    <th className="text-center py-3 px-2 text-purple-400">성취도</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrolledStudents.map(student => {
                                    const sData = studentScores[selectedCourseId]?.[student.studentId];
                                    const totalResult = calculateTotal(selectedCourseId, student.studentId);
                                    const totalScore = totalResult?.total || 0;
                                    const achieveRate = Math.round(totalScore);
                                    const achieveGrade = getAchievementGrade(achieveRate);
                                    return (
                                        <tr key={student.studentId} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-3 text-white font-medium">{student.name}</td>
                                            <td className="py-3 px-2 text-center">
                                                <input type="number" min="0" max={plan.writtenExamMaxScore} value={sData?.writtenExamScore ?? ''} onChange={e => setWrittenExamScore(selectedCourseId, student.studentId, Number(e.target.value))} className="w-16 bg-white/5 border border-white/10 rounded-lg text-sm text-white px-2 py-1.5 text-center" placeholder="-" />
                                            </td>
                                            {plan.performanceAreas.map(area => {
                                                const result = getAreaFinalScore(selectedCourseId, student.studentId, area.id);
                                                return (
                                                    <td key={area.id} className="py-3 px-2 text-center">
                                                        <span className="text-white font-medium">{result.sessionCount > 0 ? result.finalScore : '-'}</span>
                                                        {result.sessionCount > 0 && <span className="text-[10px] text-gray-500 block">avg {result.avg}</span>}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-3 px-2 text-center text-amber-400 font-bold">{totalResult?.total ?? '-'}</td>
                                            <td className="py-3 px-2 text-center text-orange-400 text-xs font-medium">{totalScore > 0 ? `${achieveRate}%` : '-'}</td>
                                            <td className="py-3 px-2 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${achieveGrade.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    achieveGrade.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                                        achieveGrade.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                                                            achieveGrade.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-red-500/20 text-red-400'}`}>
                                                    {totalScore > 0 ? achieveGrade.grade : '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ Comments & 과세특 ═══ */}
            {activeSubTab === 'comments' && (
                <div className="space-y-6">
                    <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400">edit_note</span>수업 코멘트 입력
                        </h4>
                        <div className="flex flex-wrap items-end gap-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">날짜</label>
                                <input type="date" value={commentDate} onChange={e => setCommentDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">학생</label>
                                <select value={commentTarget} onChange={e => setCommentTarget(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2">
                                    <option value="" className="bg-admin-card-dark">선택</option>
                                    {enrolledStudents.map(s => <option key={s.studentId} value={s.studentId} className="bg-admin-card-dark">{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[250px]">
                                <label className="text-xs text-gray-400 mb-1 block">코멘트</label>
                                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="학생의 수업 참여, 태도, 성장 등..." className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2" onKeyDown={e => { if (e.key === 'Enter' && commentTarget && commentText.trim()) { addSessionComment(selectedCourseId, commentTarget, commentDate, commentText.trim()); setCommentText(''); } }} />
                            </div>
                            <button onClick={() => { if (!commentTarget || !commentText.trim()) return; addSessionComment(selectedCourseId, commentTarget, commentDate, commentText.trim()); setCommentText(''); }}
                                className="px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-medium hover:bg-admin-primary/80 flex items-center gap-1">
                                <span className="material-symbols-outlined text-lg">send</span>저장
                            </button>
                        </div>
                    </div>

                    <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400">forum</span>학생별 코멘트
                            </h4>
                            <button onClick={() => {
                                const rows = [['학생', '코멘트']];
                                enrolledStudents.forEach(student => {
                                    const cmts = getStudentComments(selectedCourseId, student.studentId);
                                    if (cmts.length > 0) {
                                        const merged = cmts.map(c => c.comment).join(' ');
                                        rows.push([student.name, merged]);
                                    }
                                });
                                const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                                const bom = '\uFEFF';
                                const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `코멘트_${selectedCourse?.title || '수업'}_${new Date().toISOString().split('T')[0]}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">download</span>엑셀 다운로드
                            </button>
                        </div>
                        <div className="space-y-4">
                            {enrolledStudents.map(student => {
                                const cmts = getStudentComments(selectedCourseId, student.studentId);
                                return (
                                    <div key={student.studentId} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-admin-primary/20 flex items-center justify-center text-admin-primary text-sm font-bold">{student.name?.[0]}</div>
                                                <span className="font-medium text-white">{student.name}</span>
                                                <span className="text-xs text-gray-500">코멘트 {cmts.length}건</span>
                                            </div>
                                            {cmts.length > 0 && (
                                                <button onClick={() => {
                                                    const text = cmts.map(c => `[${c.date}] ${c.comment}`).join('\n');
                                                    navigator.clipboard.writeText(text);
                                                }}
                                                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">content_copy</span>코멘트 복사
                                                </button>
                                            )}
                                        </div>
                                        {cmts.length > 0 ? (
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {cmts.map(c => (
                                                    <div key={c.id} className="flex items-start gap-2 text-sm">
                                                        <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{c.date}</span>
                                                        <span className="text-gray-300 flex-1">{c.comment}</span>
                                                        <button onClick={() => deleteSessionComment(c.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0"><span className="material-symbols-outlined text-sm">close</span></button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">등록된 코멘트가 없습니다.</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Scoring Session Modal ═══ */}
            {scoringSessionModal && plan && (() => {
                const area = plan.performanceAreas.find(a => a.id === scoringSessionModal.areaId);
                if (!area) return null;
                const sessions = getSessionScoresForArea(selectedCourseId, area.id);
                const isChecklistMode = area.scoringMode === 'checklist';
                const criteria = area.assessmentElements || [];
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setScoringSessionModal(null)}>
                        <div className="bg-[#1e1e2e] rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10 m-4" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-bold text-white">{area.name} — 수업별 채점</h4>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${isChecklistMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-admin-primary/20 text-admin-primary'}`}>
                                        {isChecklistMode ? '✓ 체크리스트 모드' : '직접 입력 모드'}
                                    </span>
                                </div>
                                <div className="flex gap-1.5 mt-2">
                                    {area.scoringLevels.map(lv => (
                                        <span key={lv.id} className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{lv.label}: {lv.score}점</span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 space-y-4">

                                {/* 차시 탭 */}
                                {sessions.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {sessions.map(session => (
                                            <button key={session.id}
                                                onClick={() => setScoringSessionModal({ ...scoringSessionModal, activeSessionId: session.id })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(scoringSessionModal.activeSessionId || sessions[sessions.length - 1]?.id) === session.id
                                                    ? 'bg-admin-primary text-white shadow-lg'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                                                <div>{session.sessionLabel}</div>
                                                <div className="text-[9px] opacity-70">{session.sessionDate}</div>
                                            </button>
                                        ))}
                                        <button onClick={() => { if (confirm('선택된 차시를 삭제하시겠습니까?')) { const activeId = scoringSessionModal.activeSessionId || sessions[sessions.length - 1]?.id; deleteSessionScore(activeId); } }}
                                            className="px-2 py-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                )}

                                {/* 활성 차시 채점 */}
                                {(() => {
                                    const activeSession = sessions.find(s => s.id === (scoringSessionModal.activeSessionId || sessions[sessions.length - 1]?.id));
                                    if (!activeSession) return <p className="text-gray-500 text-sm text-center py-4">차시를 추가해주세요</p>;

                                    const selectedStudentId = scoringSessionModal.selectedStudentId || enrolledStudents[0]?.studentId;
                                    const currentStudentIdx = enrolledStudents.findIndex(s => s.studentId === selectedStudentId);
                                    const student = enrolledStudents[currentStudentIdx];
                                    if (!student) return null;

                                    const checkedItems = activeSession.checkedCriteria?.[student.studentId] || [];
                                    const currentScore = activeSession.scores[student.studentId];

                                    return (
                                        <div className="bg-white/5 rounded-xl border border-white/10">
                                            {/* 학생 선택 영역 */}
                                            <div className="flex items-center gap-2 p-4 border-b border-white/10">
                                                <button onClick={() => {
                                                    const prevIdx = Math.max(currentStudentIdx - 1, 0);
                                                    setScoringSessionModal({ ...scoringSessionModal, selectedStudentId: enrolledStudents[prevIdx].studentId });
                                                }} disabled={currentStudentIdx <= 0}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                                </button>

                                                <select value={selectedStudentId}
                                                    onChange={e => setScoringSessionModal({ ...scoringSessionModal, selectedStudentId: e.target.value })}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 font-medium appearance-none cursor-pointer text-center">
                                                    {enrolledStudents.map((s, i) => (
                                                        <option key={s.studentId} value={s.studentId} className="bg-[#1e1e2e] text-white">
                                                            {i + 1}. {s.name} {activeSession.scores[s.studentId] !== undefined ? `(${activeSession.scores[s.studentId]}점)` : ''}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button onClick={() => {
                                                    const nextIdx = Math.min(currentStudentIdx + 1, enrolledStudents.length - 1);
                                                    setScoringSessionModal({ ...scoringSessionModal, selectedStudentId: enrolledStudents[nextIdx].studentId });
                                                }} disabled={currentStudentIdx >= enrolledStudents.length - 1}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                                </button>

                                                <span className="text-[10px] text-gray-500 whitespace-nowrap">{currentStudentIdx + 1}/{enrolledStudents.length}</span>
                                            </div>

                                            {/* 채점 내용 */}
                                            <div className="p-4">
                                                {isChecklistMode && criteria.length > 0 ? (
                                                    /* 체크리스트 모드: 세로 정렬 */
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2 mb-1">
                                                            <button onClick={() => {
                                                                const allChecked = criteria.map((_, i) => i);
                                                                const derivedScore = scoreFromCheckedCount(area.scoringLevels, allChecked.length, criteria.length);
                                                                updateSessionStudentScore(activeSession.id, student.studentId, derivedScore, allChecked);
                                                            }}
                                                                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">done_all</span>모두 체크
                                                            </button>
                                                            <button onClick={() => {
                                                                const derivedScore = scoreFromCheckedCount(area.scoringLevels, 0, criteria.length);
                                                                updateSessionStudentScore(activeSession.id, student.studentId, derivedScore, []);
                                                            }}
                                                                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all flex items-center justify-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">remove_done</span>모두 해제
                                                            </button>
                                                        </div>
                                                        {criteria.map((cr, idx) => {
                                                            const isChecked = checkedItems.includes(idx);
                                                            return (
                                                                <button key={idx} onClick={() => {
                                                                    let newChecked;
                                                                    if (isChecked) {
                                                                        newChecked = checkedItems.filter(x => x !== idx);
                                                                    } else {
                                                                        newChecked = [...checkedItems, idx];
                                                                    }
                                                                    const derivedScore = scoreFromCheckedCount(area.scoringLevels, newChecked.length, criteria.length);
                                                                    updateSessionStudentScore(activeSession.id, student.studentId, derivedScore, newChecked);
                                                                }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${isChecked
                                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isChecked
                                                                        ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                                                        {isChecked ? '✓' : (idx + 1)}
                                                                    </span>
                                                                    <span className="flex-1">{cr}</span>
                                                                </button>
                                                            );
                                                        })}
                                                        {/* 요약 */}
                                                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
                                                            <span className="text-sm text-gray-400">{checkedItems.length}/{criteria.length} 만족</span>
                                                            <span className="text-lg font-bold text-amber-400">{currentScore ?? '-'}점</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* 직접 입력 모드 */
                                                    <div className="space-y-2">
                                                        {area.scoringLevels.map(lv => {
                                                            const isSelected = currentScore === lv.score;
                                                            return (
                                                                <button key={lv.id} onClick={() => updateSessionStudentScore(activeSession.id, student.studentId, lv.score)}
                                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${isSelected
                                                                        ? 'bg-admin-primary/20 text-admin-primary border border-admin-primary/40 shadow-lg'
                                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                                                                    <span>{lv.label}: {lv.description}</span>
                                                                    <span className={`text-lg font-bold ${isSelected ? 'text-admin-primary' : 'text-gray-500'}`}>{lv.score}점</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="p-4 border-t border-white/10 flex justify-end">
                                <button onClick={() => setScoringSessionModal(null)} className="px-6 py-2.5 bg-admin-primary text-white rounded-xl font-medium hover:bg-admin-primary/80">닫기</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ═══ Edit Area Modal ═══ */}
            {editAreaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditAreaModal(null)}>
                    <div className="bg-[#1e1e2e] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10 m-4" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10">
                            <h4 className="text-lg font-bold text-white">영역 편집: {editAreaModal.name}</h4>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* 기본 정보 */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-400 mb-1 block">영역 이름</label>
                                    <input value={editAreaModal.name} onChange={e => { const name = e.target.value; setEditAreaModal({ ...editAreaModal, name }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { name }); }} className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2" />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-gray-400 mb-1 block">비율(%)</label>
                                    <input type="number" value={editAreaModal.weight} onChange={e => { const weight = Number(e.target.value); setEditAreaModal({ ...editAreaModal, weight }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { weight }); }} className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 text-center" />
                                </div>
                            </div>

                            {/* 성취 기준 */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">성취 기준</label>
                                <textarea value={editField.achievementStandard} onChange={e => { setEditField({ ...editField, achievementStandard: e.target.value }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { achievementStandard: e.target.value }); }}
                                    placeholder="예: [건해 01-02] 건축 제도에 사용되는 선과 글자를 제도 규칙 작성 방법에 맞게 쓸 수 있다."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-2 resize-none h-20" />
                            </div>

                            {/* 평가 요소 (체크리스트용 문항) */}
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">평가 요소 <span className="text-gray-500">(체크리스트 채점 시 각 항목을 Y/N 체크)</span></label>
                                <div className="space-y-1.5 mb-2">
                                    {(editAreaModal.assessmentElements || []).map((el, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 group">
                                            <span className="text-xs text-purple-400 font-mono w-5 flex-shrink-0">▪</span>
                                            <span className="text-xs text-gray-200 flex-1">{el}</span>
                                            <button onClick={() => { const els = editAreaModal.assessmentElements.filter((_, idx) => idx !== i); setEditAreaModal({ ...editAreaModal, assessmentElements: els }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { assessmentElements: els }); }} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm">close</span></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input value={editField.newElement} onChange={e => setEditField({ ...editField, newElement: e.target.value })} placeholder="예: 도면의 중심을 작도하여 찾아낼 수 있는가?" className="flex-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-1.5"
                                        onKeyDown={e => { if (e.key === 'Enter' && editField.newElement.trim()) { const els = [...(editAreaModal.assessmentElements || []), editField.newElement.trim()]; setEditAreaModal({ ...editAreaModal, assessmentElements: els }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { assessmentElements: els }); setEditField({ ...editField, newElement: '' }); } }} />
                                    <button onClick={() => { if (!editField.newElement.trim()) return; const els = [...(editAreaModal.assessmentElements || []), editField.newElement.trim()]; setEditAreaModal({ ...editAreaModal, assessmentElements: els }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { assessmentElements: els }); setEditField({ ...editField, newElement: '' }); }}
                                        className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/30">추가</button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1.5">💡 평가 요소 수 = 체크리스트 항목 수. 배점 자동 생성에 사용됩니다.</p>
                            </div>

                            {/* 평가 방법 */}
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">평가 방법</label>
                                <div className="flex flex-wrap gap-2">
                                    {ASSESSMENT_METHODS.map(method => {
                                        const isChecked = (editAreaModal.assessmentMethods || []).includes(method);
                                        return (
                                            <button key={method} onClick={() => {
                                                const methods = isChecked ? editAreaModal.assessmentMethods.filter(m => m !== method) : [...(editAreaModal.assessmentMethods || []), method];
                                                setEditAreaModal({ ...editAreaModal, assessmentMethods: methods });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { assessmentMethods: methods });
                                            }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isChecked ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                                                {isChecked && <span className="mr-1">✓</span>}{method}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 채점 모드 선택 */}
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">채점 모드</label>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditAreaModal({ ...editAreaModal, scoringMode: 'direct' }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringMode: 'direct' }); }}
                                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${(editAreaModal.scoringMode || 'direct') === 'direct' ? 'bg-admin-primary/20 text-admin-primary ring-2 ring-admin-primary/50' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                                        <span className="material-symbols-outlined text-lg">touch_app</span>
                                        <span>직접 입력</span>
                                        <span className="text-[10px] text-gray-500">배점을 직접 선택</span>
                                    </button>
                                    <button onClick={() => { setEditAreaModal({ ...editAreaModal, scoringMode: 'checklist' }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringMode: 'checklist' }); }}
                                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${editAreaModal.scoringMode === 'checklist' ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                                        <span className="material-symbols-outlined text-lg">checklist</span>
                                        <span>체크리스트</span>
                                        <span className="text-[10px] text-gray-500">평가요소 Y/N → 자동 산출</span>
                                    </button>
                                </div>
                            </div>

                            {/* 채점 기준 & 배점 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs text-gray-400">채점 기준 & 배점</label>
                                    {(editAreaModal.assessmentElements || []).length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <label className="text-[10px] text-gray-500 whitespace-nowrap">간격</label>
                                                <input type="number" min="0.5" step="0.5" value={editAreaModal._scoreStep ?? 1}
                                                    onChange={e => setEditAreaModal({ ...editAreaModal, _scoreStep: Number(e.target.value) || 1 })}
                                                    className="w-12 bg-white/5 border border-white/10 rounded text-[11px] text-white px-1.5 py-0.5 text-center" />
                                            </div>
                                            <button onClick={() => {
                                                const count = (editAreaModal.assessmentElements || []).length;
                                                const maxScore = editAreaModal.weight || 30;
                                                const step = editAreaModal._scoreStep ?? 1;
                                                const levels = autoGenerateScoring(count, maxScore, step);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-medium hover:bg-emerald-500/30 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                                                배점 자동 생성
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {(editAreaModal.scoringLevels || []).map(lv => (
                                        <div key={lv.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2.5 border border-white/10">
                                            <input value={lv.label} onChange={e => {
                                                const levels = editAreaModal.scoringLevels.map(l => l.id === lv.id ? { ...l, label: e.target.value } : l);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className="w-20 bg-white/10 border-none rounded text-xs text-white px-2 py-1 text-center font-bold" />
                                            <input value={lv.description} onChange={e => {
                                                const levels = editAreaModal.scoringLevels.map(l => l.id === lv.id ? { ...l, description: e.target.value } : l);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className="flex-1 bg-white/5 border border-white/10 rounded text-xs text-white px-2 py-1" placeholder="설명" />
                                            <input type="number" value={lv.score} onChange={e => {
                                                const levels = editAreaModal.scoringLevels.map(l => l.id === lv.id ? { ...l, score: Number(e.target.value) } : l);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className="w-16 bg-white/10 border-none rounded text-xs text-white px-2 py-1 text-center" />
                                            <span className="text-xs text-gray-500">점</span>
                                            <button onClick={() => {
                                                const levels = editAreaModal.scoringLevels.filter(l => l.id !== lv.id);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className="text-gray-500 hover:text-red-400"><span className="material-symbols-outlined text-sm">close</span></button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => {
                                    const newLevel = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: '', description: '', score: 0 };
                                    const levels = [...(editAreaModal.scoringLevels || []), newLevel];
                                    setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                    updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                }} className="mt-2 px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-xs font-medium hover:bg-white/10 flex items-center gap-1 border border-dashed border-white/10">
                                    <span className="material-symbols-outlined text-sm">add</span>채점 기준 추가
                                </button>
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 flex justify-end">
                            <button onClick={() => setEditAreaModal(null)} className="px-6 py-2.5 bg-admin-primary text-white rounded-xl font-medium hover:bg-admin-primary/80">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};




function MarketplaceManagement() {
    const { shopItems, purchases, addShopItem, removeShopItem, updateShopItems, deliverPurchase } = useMarketplaceStore();
    const { registeredStudents } = useAuthStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('items');
    const [newItem, setNewItem] = useState({ name: '', description: '', price: 5, icon: '🎁', category: 'snack', stock: 99 });
    const [iconPickerFor, setIconPickerFor] = useState(null); // 'add' | 'edit' | null

    const categoryLabels = { snack: '간식/음료', school: '학교생활', stationery: '학용품', special: '특별보상' };
    const categoryIcons = { snack: '🍪', school: '🏫', stationery: '✏️', special: '🏆' };

    const iconGroups = [
        { label: '간식/음료', emojis: ['🍪', '🧃', '🍦', '🍫', '🍬', '🍩', '🍰', '☕', '🥤', '🧁', '🍿', '🍭'] },
        { label: '학교생활', emojis: ['💺', '😴', '📝', '🧹', '🎒', '🏃', '🎵', '📅', '🕐', '🎮', '📱', '🎯'] },
        { label: '학용품', emojis: ['🖊️', '📓', '🎀', '📐', '✂️', '📎', '🖍️', '📏', '🗂️', '💼', '🎨', '📦'] },
        { label: '특별보상', emojis: ['⭐', '🏅', '🎖️', '👑', '💎', '🏆', '🎉', '🌟', '✨', '🎁', '🎊', '💫'] },
    ];

    const handleAddItem = () => {
        if (!newItem.name.trim()) return;
        addShopItem(newItem);
        setNewItem({ name: '', description: '', price: 5, icon: '🎁', category: 'snack', stock: 99 });
        setShowAddModal(false);
    };

    const handleEditItem = () => {
        if (!editingItem) return;
        updateShopItems(shopItems.map(item => item.id === editingItem.id ? editingItem : item));
        setEditingItem(null);
    };

    const pendingPurchases = purchases.filter(p => p.status === 'pending');
    const deliveredPurchases = purchases.filter(p => p.status === 'delivered');

    const getStudentName = (purchase) => {
        return purchase.studentName || (() => {
            const s = registeredStudents.find(st => st.studentId === purchase.studentId);
            return s ? s.name : purchase.studentId;
        })();
    };

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-3">
                <button
                    onClick={() => setActiveSubTab('items')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSubTab === 'items' ? 'bg-admin-secondary text-white shadow-lg shadow-admin-secondary/30' : 'bg-admin-card-dark text-gray-400 hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-sm mr-1.5 align-text-bottom">inventory_2</span>
                    상품 관리 ({shopItems.length})
                </button>
                <button
                    onClick={() => setActiveSubTab('orders')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSubTab === 'orders' ? 'bg-admin-secondary text-white shadow-lg shadow-admin-secondary/30' : 'bg-admin-card-dark text-gray-400 hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-sm mr-1.5 align-text-bottom">receipt_long</span>
                    주문 처리
                    {pendingPurchases.length > 0 && (
                        <span className="ml-2 bg-admin-pink text-white text-xs px-1.5 py-0.5 rounded-full">{pendingPurchases.length}</span>
                    )}
                </button>
            </div>

            {/* Items Management Tab */}
            {activeSubTab === 'items' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400 text-sm">학생 마켓플레이스에 표시되는 상품을 관리합니다.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-admin-secondary text-white rounded-xl text-sm font-semibold hover:bg-admin-secondary/80 transition-all flex items-center gap-1.5 shadow-lg shadow-admin-secondary/20"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            상품 추가
                        </button>
                    </div>

                    {/* Items Table */}
                    <div className="bg-admin-card-dark rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">상품</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">카테고리</th>
                                    <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">가격 (⭐)</th>
                                    <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">재고</th>
                                    <th className="text-right px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {shopItems.map(item => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.icon}</span>
                                                <div>
                                                    <p className="text-white text-sm font-medium">{item.name}</p>
                                                    <p className="text-gray-500 text-xs">{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                                                {categoryIcons[item.category]} {categoryLabels[item.category] || item.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="text-amber-400 font-bold text-sm">⭐ {item.price}</span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`text-sm font-medium ${item.stock <= 5 ? 'text-red-400' : 'text-gray-300'}`}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingItem({ ...item })}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-admin-secondary transition-colors"
                                                    title="수정"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(`"${item.name}" 상품을 삭제하시겠습니까?`)) removeShopItem(item.id); }}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                                    title="삭제"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Orders Tab */}
            {activeSubTab === 'orders' && (
                <div className="space-y-6">
                    {/* Pending */}
                    <div>
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-400">pending_actions</span>
                            대기 중인 주문 ({pendingPurchases.length})
                        </h3>
                        {pendingPurchases.length === 0 ? (
                            <div className="bg-admin-card-dark rounded-xl p-8 text-center text-gray-500 border border-white/5">
                                대기 중인 주문이 없습니다.
                            </div>
                        ) : (
                            <div className="bg-admin-card-dark rounded-xl border border-white/5 divide-y divide-white/5">
                                {purchases.map((purchase, idx) => purchase.status === 'pending' && (
                                    <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{purchase.itemIcon}</span>
                                            <div>
                                                <p className="text-white text-sm font-medium">{purchase.itemName}</p>
                                                <p className="text-gray-500 text-xs">
                                                    {getStudentName(purchase)} ({purchase.studentId}) · {new Date(purchase.timestamp).toLocaleString('ko-KR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-amber-400 text-sm font-bold">⭐ {purchase.price}</span>
                                            <button
                                                onClick={() => deliverPurchase(idx)}
                                                className="px-3 py-1.5 bg-admin-secondary text-white text-xs font-semibold rounded-lg hover:bg-admin-secondary/80 transition-all"
                                            >
                                                수령 완료
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Delivered */}
                    <div>
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-400">check_circle</span>
                            완료된 주문 ({deliveredPurchases.length})
                        </h3>
                        {deliveredPurchases.length === 0 ? (
                            <div className="bg-admin-card-dark rounded-xl p-8 text-center text-gray-500 border border-white/5">
                                완료된 주문이 없습니다.
                            </div>
                        ) : (
                            <div className="bg-admin-card-dark rounded-xl border border-white/5 divide-y divide-white/5 max-h-80 overflow-y-auto">
                                {purchases.map((purchase, idx) => purchase.status === 'delivered' && (
                                    <div key={idx} className="flex items-center justify-between px-5 py-3 opacity-60">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{purchase.itemIcon}</span>
                                            <div>
                                                <p className="text-white text-sm font-medium">{purchase.itemName}</p>
                                                <p className="text-gray-500 text-xs">
                                                    {getStudentName(purchase)} ({purchase.studentId}) · {new Date(purchase.timestamp).toLocaleString('ko-KR')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-green-400 text-xs font-medium px-2 py-0.5 rounded-full bg-green-400/10">수령 완료</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-admin-card-dark rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-admin-secondary">add_circle</span>
                            새 상품 추가
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-20">
                                    <label className="block text-xs text-gray-500 mb-1">아이콘</label>
                                    <button
                                        type="button"
                                        onClick={() => setIconPickerFor(iconPickerFor === 'add' ? null : 'add')}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-2xl hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-admin-secondary transition-colors"
                                    >
                                        {newItem.icon}
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">상품명</label>
                                    <input
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                        placeholder="상품명 입력"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">설명</label>
                                <input
                                    value={newItem.description}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    placeholder="상품 설명"
                                />
                            </div>
                            {/* Icon Picker Grid */}
                            {iconPickerFor === 'add' && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                                    {iconGroups.map(group => (
                                        <div key={group.label}>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{group.label}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {group.emojis.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => { setNewItem({ ...newItem, icon: emoji }); setIconPickerFor(null); }}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-admin-secondary/30 transition-colors ${newItem.icon === emoji ? 'bg-admin-secondary/40 ring-1 ring-admin-secondary' : 'bg-white/5'}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">카테고리</label>
                                    <select
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    >
                                        <option value="snack" className="bg-[#1e1e2e] text-white">🍪 간식/음료</option>
                                        <option value="school" className="bg-[#1e1e2e] text-white">🏫 학교생활</option>
                                        <option value="stationery" className="bg-[#1e1e2e] text-white">✏️ 학용품</option>
                                        <option value="special" className="bg-[#1e1e2e] text-white">🏆 특별보상</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs text-gray-500 mb-1">가격 (⭐)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newItem.price}
                                        onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs text-gray-500 mb-1">재고</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newItem.stock}
                                        onChange={e => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                                취소
                            </button>
                            <button onClick={handleAddItem} className="flex-1 py-2.5 bg-admin-secondary text-white rounded-xl text-sm font-semibold hover:bg-admin-secondary/80 transition-all shadow-lg shadow-admin-secondary/20">
                                추가
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditingItem(null)}>
                    <div className="bg-admin-card-dark rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-admin-secondary">edit</span>
                            상품 수정
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-20">
                                    <label className="block text-xs text-gray-500 mb-1">아이콘</label>
                                    <button
                                        type="button"
                                        onClick={() => setIconPickerFor(iconPickerFor === 'edit' ? null : 'edit')}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-2xl hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-admin-secondary transition-colors"
                                    >
                                        {editingItem.icon}
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">상품명</label>
                                    <input
                                        value={editingItem.name}
                                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">설명</label>
                                <input
                                    value={editingItem.description}
                                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                />
                            </div>
                            {/* Icon Picker Grid */}
                            {iconPickerFor === 'edit' && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                                    {iconGroups.map(group => (
                                        <div key={group.label}>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{group.label}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {group.emojis.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => { setEditingItem({ ...editingItem, icon: emoji }); setIconPickerFor(null); }}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-admin-secondary/30 transition-colors ${editingItem.icon === emoji ? 'bg-admin-secondary/40 ring-1 ring-admin-secondary' : 'bg-white/5'}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">카테고리</label>
                                    <select
                                        value={editingItem.category}
                                        onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                        className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    >
                                        <option value="snack" className="bg-[#1e1e2e] text-white">🍪 간식/음료</option>
                                        <option value="school" className="bg-[#1e1e2e] text-white">🏫 학교생활</option>
                                        <option value="stationery" className="bg-[#1e1e2e] text-white">✏️ 학용품</option>
                                        <option value="special" className="bg-[#1e1e2e] text-white">🏆 특별보상</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs text-gray-500 mb-1">가격 (⭐)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editingItem.price}
                                        onChange={e => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs text-gray-500 mb-1">재고</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editingItem.stock}
                                        onChange={e => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setEditingItem(null)} className="flex-1 py-2.5 bg-white/5 text-gray-400 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                                취소
                            </button>
                            <button onClick={handleEditItem} className="flex-1 py-2.5 bg-admin-secondary text-white rounded-xl text-sm font-semibold hover:bg-admin-secondary/80 transition-all shadow-lg shadow-admin-secondary/20">
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const SettingsManagement = () => {
    const { user } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    const { clearAllProgress } = useProgressStore();

    const handleResetProgress = () => {
        if (window.confirm('WARNING: This will delete ALL student progress data. This action cannot be undone. Are you sure?')) {
            clearAllProgress();
            alert('All progress data has been reset.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-white">Settings</h3>
                <p className="text-gray-400 text-sm mt-1">Manage admin profile and system preferences</p>
            </div>

            <div className="grid gap-6">
                {/* Admin Profile Card */}
                <div className="bg-admin-card-dark rounded-2xl border border-white/5 p-6 space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <span className="material-symbols-outlined text-admin-primary text-3xl">badge</span>
                        <div>
                            <h4 className="text-lg font-bold text-white">Admin Profile</h4>
                            <p className="text-sm text-gray-400">Your account information</p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Display Name</label>
                            <div className="bg-background-dark border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-medium">
                                {user?.name || 'Administrator'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Admin ID</label>
                            <div className="bg-background-dark border border-white/5 rounded-xl px-4 py-3 text-gray-300 text-sm font-mono">
                                @{user?.adminId || 'admin'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Preferences Card */}
                <div className="bg-admin-card-dark rounded-2xl border border-white/5 p-6 space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <span className="material-symbols-outlined text-admin-secondary text-3xl">tune</span>
                        <div>
                            <h4 className="text-lg font-bold text-white">System Preferences</h4>
                            <p className="text-sm text-gray-400">Customize appearance and behavior</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                    <span className="material-symbols-outlined">{isDark ? 'dark_mode' : 'light_mode'}</span>
                                </div>
                                <div>
                                    <h5 className="text-white text-sm font-medium">Interface Theme</h5>
                                    <p className="text-gray-500 text-xs">Toggle between dark and light mode</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-admin-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${isDark ? 'bg-admin-primary' : 'bg-gray-600'}`}
                            >
                                <span className={`${isDark ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-white/5 opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined">notifications</span>
                                </div>
                                <div>
                                    <h5 className="text-white text-sm font-medium">Notifications</h5>
                                    <p className="text-gray-500 text-xs">Email triggers and push alerts</p>
                                </div>
                            </div>
                            <div className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-gray-400 uppercase tracking-wider">Coming Soon</div>
                        </div>
                    </div>
                </div>

                {/* Data Management (Danger Zone) */}
                <div className="bg-admin-card-dark rounded-2xl border border-red-500/20 p-6 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600"></div>
                    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
                        <div>
                            <h4 className="text-lg font-bold text-white">Data Management</h4>
                            <p className="text-sm text-gray-400">Irreversible actions and resets</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                        <div>
                            <h5 className="text-red-400 text-sm font-bold mb-1">Reset All Student Progress</h5>
                            <p className="text-red-400/60 text-xs max-w-sm">This will permanently delete all mission completions, stars, and progress data for ALL students. Accounts and classes will remain.</p>
                        </div>
                        <button
                            onClick={handleResetProgress}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                            Reset All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SUBADMIN_PERMISSION_OPTIONS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'learners', label: 'Learners' },
    { key: 'class', label: 'Class' },
    { key: 'assessments', label: 'Assessments' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'subadmins', label: 'Sub-Admin' },
    { key: 'settings', label: 'Settings' },
];

const SubAdminManagement = ({ subAdmins, courses, onAddSubAdmin, onRemoveSubAdmin, onUpdateSubAdmin }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdminId, setEditingAdminId] = useState(null);
    const [formData, setFormData] = useState({
        adminId: '',
        name: '',
        password: '',
        permissions: Object.fromEntries(SUBADMIN_PERMISSION_OPTIONS.map(option => [option.key, true])),
    });
    const [error, setError] = useState('');

    const resetForm = () => {
        setFormData({
            adminId: '',
            name: '',
            password: '',
            permissions: Object.fromEntries(SUBADMIN_PERMISSION_OPTIONS.map(option => [option.key, true])),
        });
        setEditingAdminId(null);
        setError('');
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (subAdmin) => {
        setEditingAdminId(subAdmin.adminId);
        setFormData({
            adminId: subAdmin.adminId,
            name: subAdmin.name,
            password: subAdmin.password,
            permissions: Object.fromEntries(
                SUBADMIN_PERMISSION_OPTIONS.map(option => [option.key, subAdmin.permissions?.[option.key] !== false])
            ),
        });
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const nextAdminId = formData.adminId.trim();
        const nextName = formData.name.trim();
        const nextPassword = formData.password.trim();
        const fullCourseIds = courses.map(course => course.id);
        const nextPermissions = formData.permissions;

        if (!nextAdminId || !nextName || !nextPassword) {
            setError('아이디, 이름, 비밀번호를 모두 입력하세요.');
            return;
        }

        const duplicate = subAdmins.find(sub => sub.adminId === nextAdminId && sub.adminId !== editingAdminId);
        if (duplicate) {
            setError('이미 사용 중인 서브관리자 아이디입니다.');
            return;
        }

        if (editingAdminId) {
            onUpdateSubAdmin(editingAdminId, {
                adminId: nextAdminId,
                name: nextName,
                password: nextPassword,
                courseIds: fullCourseIds,
                permissions: nextPermissions,
            });
        } else {
            const result = onAddSubAdmin(nextAdminId, nextPassword, nextName, fullCourseIds, nextPermissions);
            if (!result?.ok) {
                if (result?.reason === 'already_exists') {
                    setError('이미 사용 중인 서브관리자 아이디입니다.');
                    return;
                }
                if (result?.reason === 'reserved_id') {
                    setError('`admin` 아이디는 사용할 수 없습니다.');
                    return;
                }
                setError('서브관리자 생성에 실패했습니다.');
                return;
            }
        }

        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Sub-Admin Management</h3>
                    <p className="text-gray-400 text-sm mt-1">동료 교사용 서브관리자 계정을 만들고 관리합니다.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-admin-primary hover:bg-admin-primary/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-admin-primary/20"
                >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>서브관리자 추가</span>
                </button>
            </div>

            <div className="bg-admin-card-dark rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">이름</th>
                            <th className="px-6 py-4 font-semibold">아이디</th>
                            <th className="px-6 py-4 font-semibold">권한</th>
                            <th className="px-6 py-4 font-semibold text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {subAdmins.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                    아직 생성된 서브관리자 계정이 없습니다.
                                </td>
                            </tr>
                        )}
                        {subAdmins.map(subAdmin => (
                            <tr key={subAdmin.adminId} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{subAdmin.name}</td>
                                <td className="px-6 py-4 text-gray-300 font-mono">@{subAdmin.adminId}</td>
                                <td className="px-6 py-4 text-gray-300">
                                    <div className="flex flex-wrap gap-2">
                                        {SUBADMIN_PERMISSION_OPTIONS.filter(option => subAdmin.permissions?.[option.key] !== false).map(option => (
                                            <span key={option.key} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-admin-secondary/10 text-admin-secondary border border-admin-secondary/20">
                                                {option.label}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(subAdmin)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`${subAdmin.name} 서브관리자 계정을 삭제하시겠습니까?`)) {
                                                    onRemoveSubAdmin(subAdmin.adminId);
                                                }
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-admin-card-dark w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">{editingAdminId ? '서브관리자 수정' : '서브관리자 추가'}</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">이름</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                    placeholder="예: 홍길동"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">아이디</label>
                                <input
                                    type="text"
                                    value={formData.adminId}
                                    onChange={e => setFormData({ ...formData, adminId: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                    placeholder="예: teacher01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">비밀번호</label>
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                    placeholder="비밀번호 입력"
                                    required
                                />
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
                                <p className="text-sm font-medium text-white mb-3">권한 설정</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {SUBADMIN_PERMISSION_OPTIONS.map(option => (
                                        <label key={option.key} className="flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions[option.key]}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    permissions: {
                                                        ...formData.permissions,
                                                        [option.key]: e.target.checked,
                                                    },
                                                })}
                                                className="h-4 w-4 rounded border-white/20 bg-background-dark text-admin-primary focus:ring-admin-primary"
                                            />
                                            <span>{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-admin-primary hover:bg-admin-primary/90 text-white transition-colors font-medium shadow-lg shadow-admin-primary/20"
                                >
                                    {editingAdminId ? '저장' : '생성'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};



export default function AdminPage() {
    const navigate = useNavigate();
    const { user, logout, registeredStudents, registerStudent, removeStudent, bulkRegisterStudents, updateStudent, subAdmins, addSubAdmin, removeSubAdmin, updateSubAdmin } = useAuthStore();
    const sessionScores = useAssessmentStore(state => state.sessionScores);
    const { courses, addCourse, deleteCourse } = useStageStore();
    const { submissions, totalStars, progress } = useProgressStore();
    const isSubAdmin = user?.role === 'subadmin';
    const [currentView, setCurrentView] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifTarget, setNotifTarget] = useState('all');
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const { notifications, sendNotification, deleteNotification } = useNotificationStore();

    // --- Data Aggregation for Dashboard ---
    const totalLearners = registeredStudents.length;
    const totalClasses = courses.length;
    const { purchases } = useMarketplaceStore();

    const totalStarsIssued = Object.values(totalStars).reduce((sum, s) => sum + s, 0);
    const subAdminPermissions = user?.permissions || {};
    const hasViewAccess = (view) => !isSubAdmin || subAdminPermissions[view] !== false;
    const visibleAdminViews = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', emphasized: true },
        { id: 'learners', label: 'Learners', icon: 'school' },
        { id: 'class', label: 'Class', icon: 'menu_book' },
        { id: 'assessments', label: 'Assessments', icon: 'quiz' },
        { id: 'marketplace', label: 'Marketplace', icon: 'storefront' },
        { id: 'subadmins', label: '?쒕툕愿由ъ옄', icon: 'supervisor_account' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ].filter(view => hasViewAccess(view.id));

    useEffect(() => {
        if (!visibleAdminViews.some(view => view.id === currentView)) {
            setCurrentView(visibleAdminViews[0]?.id || 'dashboard');
        }
    }, [currentView, visibleAdminViews]);

    const courseCompletion = useMemo(() => {
        if (courses.length === 0 || registeredStudents.length === 0) return 0;
        let totalDone = 0;
        let totalPossible = 0;
        registeredStudents.forEach(s => {
            courses.forEach(course => {
                course.stages.forEach(stage => {
                    const sp = progress?.[s.studentId]?.[course.id]?.[stage.id];
                    ['easy', 'normal', 'hard'].forEach(d => {
                        totalPossible++;
                        if (sp?.[d]) totalDone++;
                    });
                });
            });
        });
        return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
    }, [courses, registeredStudents, progress])

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 flex flex-col bg-admin-primary h-full transition-all duration-300 z-20 shadow-xl relative overflow-y-auto">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stadia_controller</span>
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-bold tracking-tight">{isSubAdmin ? 'SUB-ADMIN' : 'ADMIN PAGE'}</h1>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{user?.name || 'Gamified Portal'}</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
                    {hasViewAccess('dashboard') && <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'dashboard'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                        <span className="text-white font-semibold">Dashboard</span>
                    </button>}
                    {hasViewAccess('learners') && <button
                        onClick={() => setCurrentView('learners')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'learners'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">school</span>
                        <span className={`font-medium ${currentView === 'learners' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Learners</span>
                    </button>}
                    {/* Class (Project Classes) */}
                    {hasViewAccess('class') && <button
                        onClick={() => setCurrentView('class')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'class'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">menu_book</span>
                        <span className={`font-medium ${currentView === 'class' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Class</span>
                    </button>}
                    {/* Assessments */}
                    {hasViewAccess('assessments') && <button
                        onClick={() => setCurrentView('assessments')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'assessments'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">quiz</span>
                        <span className={`font-medium ${currentView === 'assessments' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Assessments</span>
                    </button>}
                    {hasViewAccess('marketplace') && <button
                        onClick={() => setCurrentView('marketplace')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'marketplace'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">storefront</span>
                        <span className={`font-medium ${currentView === 'marketplace' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Marketplace</span>
                    </button>}
                    {hasViewAccess('subadmins') && <button
                        onClick={() => setCurrentView('subadmins')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'subadmins'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">supervisor_account</span>
                        <span className={`font-medium ${currentView === 'subadmins' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>서브관리자</span>
                    </button>}
                    {hasViewAccess('settings') && <button
                        onClick={() => setCurrentView('settings')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'settings'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">settings</span>
                        <span className={`font-medium ${currentView === 'settings' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Settings</span>
                    </button>}
                </nav>

                <div className="p-4 mt-auto border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-white/30"
                            style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Admin+User&background=random')" }}
                        ></div>
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-semibold">{user?.name || 'Administrator'}</span>
                            <span className="text-white/60 text-xs text-left">@{user?.adminId || 'admin'}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="w-full py-2.5 bg-white/5 hover:bg-admin-secondary text-white text-sm font-medium rounded-xl border border-white/10 hover:border-admin-secondary transition-all flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-admin-secondary/20"
                    >
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform text-white/70 group-hover:text-white">logout</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Header */}
                <header className="h-20 border-b border-white/5 bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {currentView === 'dashboard' ? 'Dashboard Overview' :
                                currentView === 'learners' ? 'Learners' :
                                    currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="relative p-2.5 rounded-xl bg-admin-card-dark hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[22px]">notifications</span>
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-admin-pink text-[9px] text-white font-bold flex items-center justify-center border-2 border-admin-card-dark">{notifications.length > 9 ? '9+' : notifications.length}</span>
                                )}
                            </button>
                            <button className="p-2.5 rounded-xl bg-admin-card-dark hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[22px]">help</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Notification Panel */}
                {showNotifPanel && (
                    <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowNotifPanel(false)}>
                        <div className="w-full max-w-md bg-admin-primary border-l border-white/10 h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-5 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-admin-secondary">send</span>
                                    알림 보내기
                                </h3>
                                <button onClick={() => setShowNotifPanel(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Send Form */}
                            <div className="p-5 space-y-4 border-b border-white/10">
                                {/* Target */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">받는 대상</label>
                                    <select
                                        value={notifTarget}
                                        onChange={e => setNotifTarget(e.target.value)}
                                        className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    >
                                        <option value="all" className="bg-[#1e1e2e] text-white">📢 전체 학생</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={`class:${c.id}`} className="bg-[#1e1e2e] text-white">📚 {c.title} 수강생</option>
                                        ))}
                                        {registeredStudents.map(s => (
                                            <option key={s.studentId} value={s.studentId} className="bg-[#1e1e2e] text-white">👤 {s.name} ({s.studentId})</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Title */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">제목</label>
                                    <input
                                        value={notifTitle}
                                        onChange={e => setNotifTitle(e.target.value)}
                                        className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                        placeholder="알림 제목"
                                    />
                                </div>
                                {/* Message */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">메시지</label>
                                    <textarea
                                        value={notifMessage}
                                        onChange={e => setNotifMessage(e.target.value)}
                                        className="w-full bg-[#1e1e2e] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary resize-none h-24"
                                        placeholder="학생에게 보낼 메시지를 입력하세요..."
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        if (!notifTitle.trim() || !notifMessage.trim()) return;
                                        const courseName = notifTarget.startsWith('class:') ? courses.find(c => c.id === notifTarget.replace('class:', ''))?.title : null;
                                        sendNotification({ to: notifTarget, title: notifTitle, message: notifMessage, courseName });
                                        setNotifTitle('');
                                        setNotifMessage('');
                                    }}
                                    disabled={!notifTitle.trim() || !notifMessage.trim()}
                                    className="w-full py-2.5 bg-admin-secondary text-white rounded-xl text-sm font-semibold hover:bg-admin-secondary/80 transition-all shadow-lg shadow-admin-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">send</span>
                                    알림 전송
                                </button>
                            </div>

                            {/* Sent History */}
                            <div className="flex-1 overflow-y-auto p-5">
                                <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">보낸 알림 ({notifications.length})</h4>
                                {notifications.length === 0 && (
                                    <div className="text-center text-gray-500 py-8 text-sm">보낸 알림이 없습니다.</div>
                                )}
                                <div className="space-y-2">
                                    {notifications.map(n => (
                                        <div key={n.id} className="bg-[#1e1e2e] rounded-xl p-3 border border-white/5 group">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-admin-secondary/20 text-admin-secondary font-medium">
                                                            {n.to === 'all' ? '전체' : n.to.startsWith('class:') ? `📚 ${n.courseName || '수업'}` : `👤 ${n.to}`}
                                                        </span>
                                                    </div>
                                                    <p className="text-white text-sm font-medium truncate">{n.title}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                                                    <p className="text-gray-600 text-[10px] mt-1">{new Date(n.timestamp).toLocaleString('ko-KR')}</p>
                                                </div>
                                                <button
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="p-1 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    {currentView === 'dashboard' && (
                        <DashboardOverview
                            totalLearners={totalLearners}
                            totalClasses={totalClasses}
                            totalStarsIssued={totalStarsIssued}
                            courseCompletion={courseCompletion}
                            courses={courses}
                            registeredStudents={registeredStudents}
                            progress={progress}
                            purchases={purchases}
                            sessionScores={sessionScores}
                        />
                    )}
                    {currentView === 'learners' && (
                        <LearnersManagement
                            registeredStudents={registeredStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))}
                            onAddStudent={registerStudent}
                            onDeleteStudent={removeStudent}
                            onBulkRegister={bulkRegisterStudents}
                            onUpdateStudent={updateStudent}
                        />
                    )}
                    {currentView === 'class' && (
                        <ClassManagement
                            courses={courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))}
                            onAddCourse={addCourse}
                            onDeleteCourse={deleteCourse}
                        />
                    )}
                    {currentView === 'assessments' && (
                        <AssessmentsManagement
                            courses={courses}
                            registeredStudents={registeredStudents}
                        />
                    )}
                    {currentView === 'marketplace' && (
                        <MarketplaceManagement />
                    )}
                    {currentView === 'subadmins' && (
                        <SubAdminManagement
                            subAdmins={subAdmins}
                            courses={courses}
                            onAddSubAdmin={addSubAdmin}
                            onRemoveSubAdmin={removeSubAdmin}
                            onUpdateSubAdmin={updateSubAdmin}
                        />
                    )}
                    {currentView === 'settings' && (
                        <SettingsManagement />
                    )}
                    {currentView !== 'dashboard' && currentView !== 'learners' && currentView !== 'class' && currentView !== 'assessments' && currentView !== 'marketplace' && currentView !== 'subadmins' && currentView !== 'settings' && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Component for {currentView} is under construction.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

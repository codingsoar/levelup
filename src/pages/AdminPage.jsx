import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../stores/useAuthStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useStageStore } from '../stores/useStageStore';
import { useBadgeStore } from '../stores/useBadgeStore';
import useThemeStore from '../stores/useThemeStore';
import { useMarketplaceStore } from '../stores/useMarketplaceStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useAssessmentStore, ASSESSMENT_METHODS, ACHIEVEMENT_LEVELS, autoGenerateScoring, scoreFromCheckedCount, getAchievementGrade } from '../stores/useAssessmentStore';
// Note: addSessionScoreForAllAreas, deleteSessionScoreByLabel are used via useAssessmentStore hook
import DashboardCalendar from '../components/DashboardCalendar';
// --- Sub-components for Views ---

const DashboardOverview = ({ totalLearners, totalClasses, totalStarsIssued, courseCompletion, courses, registeredStudents, progress, purchases, sessionScores, onOpenCourseProgress }) => {
    // Compute per-course completion
    const courseStats = courses.map(course => {
        const enrolledStudents = registeredStudents.filter(student => student.courseIds?.includes(course.id));
        let totalDone = 0;
        let totalPossible = 0;
        enrolledStudents.forEach(s => {
            course.stages.forEach(stage => {
                const sp = progress?.[s.studentId]?.[course.id]?.[stage.id];
                ['easy', 'normal', 'hard'].forEach(d => {
                    totalPossible++;
                    if (sp?.[d]) totalDone++;
                });
            });
        });
        const pct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
        return { ...course, pct, studentCount: enrolledStudents.length };
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
                                <button
                                    key={cs.id}
                                    type="button"
                                    onClick={() => onOpenCourseProgress?.(cs.id)}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-background-dark border border-white/5 hover:border-admin-secondary/30 transition-colors group cursor-pointer text-left"
                                >
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
                                </button>
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
    const isDark = useThemeStore(state => state.isDark);
    
    // Badge store selector
    const getUnlockedBadges = useBadgeStore(state => state.getUnlockedBadges);

    const [openMenuId, setOpenMenuId] = useState(null);
    const [formData, setFormData] = useState({ name: '', studentId: '', password: '', grade: '1', admissionYear: new Date().getFullYear() });
    const [error, setError] = useState('');

    // Filters
    const [filterGrade, setFilterGrade] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [sortOrder, setSortOrder] = useState('asc');

    // Filter Logic
    const filteredStudents = useMemo(() => {
        const visibleStudents = registeredStudents.filter(student => {
            const gradeMatch = filterGrade === 'all' || student.grade === parseInt(filterGrade);
            const yearMatch = filterYear === 'all' || student.admissionYear === parseInt(filterYear);
            return gradeMatch && yearMatch;
        });

        return [...visibleStudents].sort((a, b) => {
            const direction = sortOrder === 'asc' ? 1 : -1;
            const nameCompare = (a.name || '').localeCompare(b.name || '', 'ko', { numeric: true, sensitivity: 'base' });

            if (nameCompare !== 0) {
                return nameCompare * direction;
            }

            return (a.studentId || '').localeCompare(b.studentId || '', 'ko', { numeric: true, sensitivity: 'base' }) * direction;
        });
    }, [registeredStudents, filterGrade, filterYear, sortOrder]);

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
                            className={`rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:border-admin-primary ${
                                isDark
                                    ? 'border-white/10 bg-white/5 text-white'
                                    : 'border-slate-300 bg-white text-slate-900'
                            }`}
                        >
                            <option value="all" className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}>All Years</option>
                            {availableYears.map(y => <option key={y} value={y} className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Grade:</span>
                        <select
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className={`rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:border-admin-primary ${
                                isDark
                                    ? 'border-white/10 bg-white/5 text-white'
                                    : 'border-slate-300 bg-white text-slate-900'
                            }`}
                        >
                            <option value="all" className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}>All Grades</option>
                            {[1, 2, 3].map(g => <option key={g} value={g} className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}>Grade {g}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Sort:</span>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={`rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:border-admin-primary ${
                                isDark
                                    ? 'border-white/10 bg-white/5 text-white'
                                    : 'border-slate-300 bg-white text-slate-900'
                            }`}
                        >
                            <option value="asc" className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}>Name Asc</option>
                            <option value="desc" className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}>Name Desc</option>
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

            <div className={`rounded-2xl border ${
                isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
            }`}>
                <div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-xs uppercase tracking-wider ${
                                isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                                <th className="px-6 py-4 font-semibold">Year</th>
                                <th className="px-6 py-4 font-semibold">Grade</th>
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Student ID</th>
                                <th className="px-6 py-4 font-semibold">Enrolled Courses</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`text-sm ${isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-200'}`}>
                            {filteredStudents.map((student) => (
                                <tr key={student.studentId} className={`group transition-colors ${
                                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                }`}>
                                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{student.admissionYear || '-'}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
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
                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.name}</span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{student.studentId}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                        {student.courseIds?.length > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-secondary/10 text-admin-secondary border border-admin-secondary/20">
                                                {student.courseIds.length} Courses
                                            </span>
                                        ) : (
                                            <span className={isDark ? 'text-gray-500 italic' : 'text-slate-500 italic'}>None</span>
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

const AdminHelpModal = ({ isOpen, onClose, currentView, availableViews, isSubAdmin }) => {
    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const visibleViewIds = new Set(availableViews.map(view => view.id));
    const currentViewLabel = availableViews.find(view => view.id === currentView)?.label || 'Current page';
    const quickStartSteps = [
        'Dashboard에서 전체 진행률, 최근 활동, 수업 일정을 먼저 확인합니다.',
        'Learners에서 학생 계정을 만들거나 엑셀로 일괄 등록합니다.',
        'Class에서 수업을 만든 뒤 Stage와 난이도별 Mission을 채웁니다.',
        'Reflection에서 과목별 학생 성찰 문장을 모아서 확인합니다.',
        'Assessments에서 수행평가 영역과 차시 점수를 입력합니다.',
        'Marketplace와 Settings는 운영 준비가 끝난 뒤 점검합니다.',
    ];
    const guideSections = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'dashboard',
            summary: '운영 현황을 한눈에 보는 시작 화면입니다.',
            details: [
                '학생 수, 수업 수, 전체 완료율, 별 사용량을 빠르게 확인할 수 있습니다.',
                '달력에서 차시가 배치된 날짜를 확인하고, 날짜별 세부 세션을 볼 수 있습니다.',
                '최근 활동 영역에서 최근 구매와 운영 흐름을 점검할 수 있습니다.',
            ],
        },
        {
            id: 'learners',
            label: 'Learners',
            icon: 'school',
            summary: '학생 계정 생성, 수정, 삭제, 뱃지 확인을 담당합니다.',
            details: [
                'Add Student로 개별 등록하고, Import로 여러 학생을 한 번에 등록할 수 있습니다.',
                '학생 ID는 로그인 ID로 쓰이므로 중복 없이 관리해야 합니다.',
                '각 학생의 메뉴에서 정보 수정, 삭제, 뱃지 확인이 가능합니다.',
            ],
        },
        {
            id: 'class',
            label: 'Class',
            icon: 'menu_book',
            summary: '수업, 스테이지, 미션, 수강 학생을 설정하는 핵심 메뉴입니다.',
            details: [
                '먼저 Add Class로 수업을 만들고, 수업 안에서 Stage를 순서대로 추가합니다.',
                '각 Stage에는 easy, normal, hard 미션을 따로 넣을 수 있습니다.',
                'Students 탭에서 수강생을 배정해야 학생 화면에서 해당 수업이 보입니다.',
            ],
        },
        {
            id: 'reflection',
            label: 'Reflection',
            icon: 'edit_note',
            summary: '학생들이 미션 완료 후 남긴 성찰 문장을 과목별로 모아 봅니다.',
            details: [
                '과목을 선택하면 해당 수업을 듣는 학생들의 성찰 문장을 한 번에 확인할 수 있습니다.',
                '학생별로 몇 개의 성찰을 작성했는지와 문장 내용을 함께 볼 수 있습니다.',
                '스테이지, 난이도, 미션 이름, 작성 시각이 함께 보여 운영 기록으로 활용할 수 있습니다.',
            ],
        },
        {
            id: 'assessments',
            label: 'Assessments',
            icon: 'quiz',
            summary: '수행평가 기준, 차시 점수, 결과 정리를 관리합니다.',
            details: [
                '수업별 평가 계획을 먼저 만들고 성취기준, 평가방법, 요소를 입력합니다.',
                '차시를 추가한 뒤 학생별 점수 또는 체크리스트를 기록할 수 있습니다.',
                '누적 결과를 보고 성취율과 등급을 빠르게 확인할 수 있습니다.',
            ],
        },
        {
            id: 'marketplace',
            label: 'Marketplace',
            icon: 'storefront',
            summary: '학생들이 별로 교환하는 상품과 주문 상태를 관리합니다.',
            details: [
                '상품명, 가격, 재고, 아이콘을 입력해 상품을 등록합니다.',
                '주문 목록에서 준비 중과 수령 완료 상태를 구분해 처리합니다.',
                '재고가 적은 상품은 수시로 점검하는 편이 안전합니다.',
            ],
        },
        {
            id: 'subadmins',
            label: 'Sub-Admin',
            icon: 'supervisor_account',
            summary: '서브관리자 계정과 권한 범위를 관리합니다.',
            details: [
                '메인 관리자만 서브관리자를 생성, 수정, 삭제하는 것이 좋습니다.',
                '권한 체크를 통해 보이는 메뉴를 제한할 수 있습니다.',
                '서브관리자는 허용된 메뉴만 관리자 페이지에서 사용할 수 있습니다.',
            ],
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: 'settings',
            summary: '테마와 시스템성 옵션을 조정하는 마무리 메뉴입니다.',
            details: [
                '운영 전후에 테마와 환경 설정을 점검할 수 있습니다.',
                '전체 데이터에 영향을 줄 수 있는 작업은 실행 전에 반드시 확인해야 합니다.',
            ],
        },
    ].filter(section => visibleViewIds.has(section.id));

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-admin-card-dark shadow-2xl" onClick={event => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/5 px-6 py-5">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-admin-secondary/30 bg-admin-secondary/10 px-3 py-1 text-xs font-semibold text-admin-secondary">
                            <span className="material-symbols-outlined text-base">help</span>
                            Admin Guide
                        </div>
                        <h3 className="text-2xl font-bold text-white">관리자 페이지 사용 안내</h3>
                        <p className="mt-2 text-sm text-gray-300">
                            처음 사용하는 사람도 현재 보고 있는 <span className="text-white font-semibold">{currentViewLabel}</span> 화면을 포함해 전체 운영 흐름을 따라갈 수 있도록 정리했습니다.
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-xl bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="border-b border-white/10 bg-background-dark/40 p-6 lg:border-b-0 lg:border-r">
                        <div className="rounded-2xl border border-admin-primary/20 bg-admin-primary/10 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-secondary">Quick Start</p>
                            <ol className="mt-4 space-y-3">
                                {quickStartSteps.map((step, index) => (
                                    <li key={step} className="flex gap-3 text-sm text-gray-200">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-admin-secondary/20 text-xs font-bold text-admin-secondary">
                                            {index + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                            <p className="font-semibold text-white">처음 운영할 때 추천 순서</p>
                            <p className="mt-2">학생 등록 전에는 수업 구조를 먼저 만들고, 수업 배정 후에 평가와 상점을 설정하는 편이 가장 덜 헷갈립니다.</p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                            <p className="font-semibold text-white">권한 상태</p>
                            <p className="mt-2">{isSubAdmin ? '현재 계정은 서브관리자이며, 허용된 메뉴만 안내 목록에 표시됩니다.' : '현재 계정은 메인 관리자 기준으로 전체 메뉴 안내를 보고 있습니다.'}</p>
                        </div>
                    </aside>

                    <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {guideSections.map(section => (
                                <section
                                    key={section.id}
                                    className={`rounded-2xl border p-5 transition-colors ${section.id === currentView ? 'border-admin-secondary/40 bg-admin-secondary/10' : 'border-white/10 bg-white/5'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${section.id === currentView ? 'bg-admin-secondary/20 text-admin-secondary' : 'bg-background-dark text-white'}`}>
                                            <span className="material-symbols-outlined">{section.icon}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-lg font-bold text-white">{section.label}</h4>
                                                {section.id === currentView && (
                                                    <span className="rounded-full border border-admin-secondary/30 bg-admin-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-admin-secondary">
                                                        현재 화면
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-300">{section.summary}</p>
                                        </div>
                                    </div>

                                    <ul className="mt-4 space-y-2 text-sm text-gray-200">
                                        {section.details.map(detail => (
                                            <li key={detail} className="flex gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-admin-secondary"></span>
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>

                        <div className="mt-6 rounded-2xl border border-admin-green/20 bg-admin-green/10 p-5">
                            <h4 className="text-lg font-bold text-white">초보자용 운영 팁</h4>
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-gray-200">
                                    <p className="font-semibold text-white">1. 먼저 틀을 만드세요</p>
                                    <p className="mt-2">수업, Stage, Mission을 먼저 만든 뒤 학생을 배정하면 이후 수정이 훨씬 적습니다.</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-gray-200">
                                    <p className="font-semibold text-white">2. 차시는 날짜 기준으로 관리하세요</p>
                                    <p className="mt-2">Assessments의 차시 날짜가 Dashboard 달력과 연결되므로 실제 수업 날짜로 입력하는 편이 좋습니다.</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-gray-200">
                                    <p className="font-semibold text-white">3. 큰 작업 전에는 확인</p>
                                    <p className="mt-2">학생 삭제, 수업 삭제, 전체 데이터 초기화 같은 작업은 되돌리기 어려우니 실행 전 한 번 더 확인해야 합니다.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const createMissionFormData = (mission) => ({
    title: mission?.title || '',
    type: mission?.type || 'video',
    description: mission?.description || '',
    videoUrl: mission?.videoUrl || '',
    taskDescription: mission?.taskDescription || '',
    tutorialSteps: mission?.tutorialSteps || [],
    htmlContent: mission?.htmlContent || '',
    htmlFileName: mission?.htmlFileName || '',
    hasQuiz: (mission?.quizQuestions && mission.quizQuestions.length > 0) || false,
    quizQuestions: mission?.quizQuestions || [],
});

const MissionEditorModal = ({ isOpen, onClose, mission, onSave, difficulty }) => {
    const MAX_TUTORIAL_HTML_BYTES = 50 * 1024 * 1024; // 50 MB
    const [formData, setFormData] = useState(() => createMissionFormData(mission));
    const [uploadError, setUploadError] = useState('');

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
    const isDark = useThemeStore(state => state.isDark);

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
                        <div className={`text-center py-20 rounded-2xl border border-dashed ${
                            isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
                        }`}>
                            <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">layers</span>
                            <p className="text-gray-500">No stages yet. Add one to start designing the curriculum.</p>
                        </div>
                    ) : (
                        currentCourse.stages.sort((a, b) => a.order - b.order).map((stage, index) => (
                            <div key={stage.id} className={`rounded-xl border overflow-hidden ${
                                isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
                            }`}>
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
                                <div className={`grid grid-cols-3 gap-4 p-4 border-t ${
                                    isDark ? 'border-white/5' : 'border-slate-200'
                                }`}>
                                    {['easy', 'normal', 'hard'].map(difficulty => {
                                        const mission = stage.missions?.[difficulty];
                                        return (
                                            <div key={difficulty} className={`rounded-lg p-3 border flex flex-col gap-2 relative group hover:border-admin-secondary/30 transition-colors ${
                                                isDark ? 'bg-background-dark border-white/5' : 'bg-slate-50 border-slate-200'
                                            }`}>
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
                <div className={`rounded-2xl border overflow-hidden ${
                    isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
                }`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-xs uppercase tracking-wider ${
                                isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Student ID</th>
                                <th className="px-6 py-4 font-semibold">Grade</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`text-sm ${isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-200'}`}>
                            {enrolledStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No students enrolled in this course yet.
                                    </td>
                                </tr>
                            ) : (
                                enrolledStudents.map(student => (
                                    <tr key={student.studentId} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                        <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.name}</td>
                                        <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{student.studentId}</td>
                                        <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{student.grade}</td>
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
                key={`${editingMission.stageId || 'new'}-${editingMission.difficulty || 'none'}-${editingMission.data?.title || 'blank'}-${isMissionModalOpen ? 'open' : 'closed'}`}
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

const createUniqueId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const cloneCourseForReuse = (course, titleOverride) => {
    const nextCourseId = createUniqueId('course');

    return {
        ...course,
        id: nextCourseId,
        title: titleOverride || `${course.title} Copy`,
        stages: (course.stages || []).map((stage, index) => ({
            ...stage,
            id: createUniqueId('stage'),
            courseId: nextCourseId,
            order: index + 1,
            missions: stage.missions ? {
                easy: stage.missions.easy ? { ...stage.missions.easy } : null,
                normal: stage.missions.normal ? { ...stage.missions.normal } : null,
                hard: stage.missions.hard ? { ...stage.missions.hard } : null,
            } : { easy: null, normal: null, hard: null },
        })),
    };
};

const normalizeImportedCourse = (course, mode = 'copy', usedCourseIds = new Set()) => {
    const normalizedCourse = {
        ...course,
        icon: course?.icon || '📚',
        theme: {
            ...DEFAULT_CLASS_THEME,
            ...(course?.theme || {}),
        },
        stages: Array.isArray(course?.stages) ? course.stages : [],
    };

    if (mode === 'replace') {
        const preferredCourseId = typeof normalizedCourse.id === 'string' && normalizedCourse.id.trim()
            ? normalizedCourse.id
            : createUniqueId('course');
        const nextCourseId = usedCourseIds.has(preferredCourseId) ? createUniqueId('course') : preferredCourseId;
        usedCourseIds.add(nextCourseId);
        const usedStageIds = new Set();

        return {
            ...normalizedCourse,
            id: nextCourseId,
            stages: normalizedCourse.stages.map((stage, index) => ({
                ...stage,
                id: (() => {
                    const preferredStageId = typeof stage?.id === 'string' && stage.id.trim()
                        ? stage.id
                        : createUniqueId('stage');

                    if (usedStageIds.has(preferredStageId)) {
                        const generatedStageId = createUniqueId('stage');
                        usedStageIds.add(generatedStageId);
                        return generatedStageId;
                    }

                    usedStageIds.add(preferredStageId);
                    return preferredStageId;
                })(),
                courseId: nextCourseId,
                order: index + 1,
                missions: stage.missions ? {
                    easy: stage.missions.easy ? { ...stage.missions.easy } : null,
                    normal: stage.missions.normal ? { ...stage.missions.normal } : null,
                    hard: stage.missions.hard ? { ...stage.missions.hard } : null,
                } : { easy: null, normal: null, hard: null },
            })),
        };
    }

    return cloneCourseForReuse(normalizedCourse, `${normalizedCourse.title} (Imported)`);
};

const buildCourseBackupPayload = (course) => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    course,
});

const buildCoursesBackupPayload = (courses) => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    courses,
});

const DEFAULT_CLASS_THEME = {
    primaryColor: '#3F72AF',
    accentColor: '#DBE2EF',
    bgPattern: 'blueprint',
};

const createClassFormData = (course = null) => ({
    title: course?.title || '',
    description: course?.description || '',
    icon: course?.icon || '📚',
    primaryColor: course?.theme?.primaryColor || DEFAULT_CLASS_THEME.primaryColor,
    accentColor: course?.theme?.accentColor || DEFAULT_CLASS_THEME.accentColor,
    bgPattern: course?.theme?.bgPattern || DEFAULT_CLASS_THEME.bgPattern,
});

const ClassManagement = ({ courses, onAddCourse, onUpdateCourse, onReplaceCourses, onDeleteCourse }) => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const isDark = useThemeStore(state => state.isDark);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [formData, setFormData] = useState(createClassFormData());
    const [error, setError] = useState('');
    const importInputRef = useRef(null);
    const [editingCourse, setEditingCourse] = useState(null);

    const resetCourseModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
        setFormData(createClassFormData());
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title) {
            setError('Class title is required');
            return;
        }

        if (editingCourse) {
            onUpdateCourse(editingCourse.id, {
                title: formData.title,
                description: formData.description || 'No description provided.',
                icon: formData.icon || '📚',
                theme: {
                    primaryColor: formData.primaryColor,
                    accentColor: formData.accentColor,
                    bgPattern: formData.bgPattern,
                },
            });
            resetCourseModal();
            return;
        }

        const newCourse = {
            id: `course-${Date.now()}`,
            title: formData.title,
            description: formData.description || 'No description provided.',
            icon: formData.icon || '📚',
            theme: {
                primaryColor: formData.primaryColor,
                accentColor: formData.accentColor,
                bgPattern: formData.bgPattern,
            },
            stages: []
        };

        onAddCourse(newCourse);
        resetCourseModal();
    };

    const handleDuplicateCourse = (course) => {
        const duplicatedCourse = cloneCourseForReuse(course, `${course.title} (${new Date().getFullYear() + 1})`);
        onAddCourse(duplicatedCourse);
        setOpenMenuId(null);
    };

    const handleExportCourse = (course) => {
        const backupBlob = new Blob(
            [JSON.stringify(buildCourseBackupPayload(course), null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(backupBlob);
        const a = document.createElement('a');
        const safeTitle = (course.title || 'class').replace(/[^A-Za-z0-9_-]+/g, '_');
        a.href = url;
        a.download = `${safeTitle}_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setOpenMenuId(null);
    };

    const handleExportAllCourses = () => {
        const backupBlob = new Blob(
            [JSON.stringify(buildCoursesBackupPayload(courses), null, 2)],
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(backupBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all_classes_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importCourses = (sourceCourses, mode = 'copy') => {
        const usedCourseIds = new Set();
        const importedCourses = sourceCourses
            .filter((sourceCourse) => sourceCourse?.title && Array.isArray(sourceCourse.stages))
            .map((sourceCourse) => normalizeImportedCourse(sourceCourse, mode, usedCourseIds));

        if (importedCourses.length === 0) {
            alert('Invalid backup file format.');
            return;
        }

        if (mode === 'replace') {
            onReplaceCourses(importedCourses);
            return;
        }

        importedCourses.forEach((course) => onAddCourse(course));
    };

    const handleImportCourse = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        try {
            const rawText = await file.text();
            const parsed = JSON.parse(rawText);
            const sourceCourse = parsed?.course;
            const sourceCourses = parsed?.courses;

            if (Array.isArray(sourceCourses)) {
                const shouldReplace = window.confirm(
                    'Restore all classes from this backup?\n\nPress OK to replace current classes.\nPress Cancel to import them as copies.'
                );
                importCourses(sourceCourses, shouldReplace ? 'replace' : 'copy');
                return;
            }

            if (!sourceCourse || !sourceCourse.title || !Array.isArray(sourceCourse.stages)) {
                alert('Invalid backup file format.');
                return;
            }

            onAddCourse(normalizeImportedCourse(sourceCourse, 'copy'));
        } catch {
            alert('Failed to read the backup file. Please upload a valid JSON backup.');
        }
    };

    const handleOpenCreateModal = () => {
        setEditingCourse(null);
        setFormData(createClassFormData());
        setError('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (course) => {
        setEditingCourse(course);
        setFormData(createClassFormData(course));
        setError('');
        setIsModalOpen(true);
        setOpenMenuId(null);
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => importInputRef.current?.click()}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all border border-white/10"
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        <span>Import Backup</span>
                    </button>
                    <button
                        onClick={handleExportAllCourses}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all border border-white/10"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>Download All Backups</span>
                    </button>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 bg-admin-primary hover:bg-admin-primary/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-admin-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span>Add Class</span>
                    </button>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleImportCourse}
                    />
                </div>
            </div>

            <div className={`rounded-2xl border ${
                isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
            }`}>
                <div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-xs uppercase tracking-wider ${
                                isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                                <th className="px-6 py-4 font-semibold">Class Name</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold">Stages</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`text-sm ${isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-200'}`}>
                            {courses.map((course) => (
                                <tr
                                    key={course.id}
                                    className={`group transition-colors cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                    onClick={() => setSelectedCourse(course)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-admin-primary/20 flex items-center justify-center text-2xl">
                                                {course.icon}
                                            </div>
                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{course.title}</span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 max-w-xs truncate ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{course.description}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
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
                                                    onClick={() => handleOpenEditModal(course)}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    Edit Class
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                                    onClick={() => handleDuplicateCourse(course)}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                                    Duplicate Class
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                                                    onClick={() => handleExportCourse(course)}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                                    Download Backup
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
                                <h3 className="text-xl font-bold text-white">{editingCourse ? 'Edit Class' : 'Add New Class'}</h3>
                                <button onClick={resetCourseModal} className="text-gray-400 hover:text-white transition-colors">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Icon</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                        placeholder="e.g. 📚"
                                        maxLength={4}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Primary Color</label>
                                        <input
                                            type="color"
                                            value={formData.primaryColor}
                                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                            className="w-full h-11 bg-background-dark border border-white/10 rounded-xl px-2 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Accent Color</label>
                                        <input
                                            type="color"
                                            value={formData.accentColor}
                                            onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                            className="w-full h-11 bg-background-dark border border-white/10 rounded-xl px-2 py-2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Background Pattern</label>
                                    <select
                                        value={formData.bgPattern}
                                        onChange={(e) => setFormData({ ...formData, bgPattern: e.target.value })}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-admin-primary transition-colors"
                                    >
                                        <option value="blueprint" className="bg-gray-800">Blueprint</option>
                                        <option value="grid" className="bg-gray-800">Grid</option>
                                        <option value="dots" className="bg-gray-800">Dots</option>
                                        <option value="solid" className="bg-gray-800">Solid</option>
                                    </select>
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
                                        onClick={resetCourseModal}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-admin-primary hover:bg-admin-primary/90 text-white transition-colors font-medium shadow-lg shadow-admin-primary/20"
                                    >
                                        {editingCourse ? 'Save Changes' : 'Add Class'}
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
    const isDark = useThemeStore(state => state.isDark);
    const [selectedCourseId, setSelectedCourseId] = useState(courses.length > 0 ? courses[0].id : '');
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const {
        assessmentPlans, createPlan, updatePlanWeights, addPerformanceArea,
        updatePerformanceArea, removePerformanceArea,
        studentScores, setWrittenExamScore, calculateTotal, getAreaFinalScore,
        uploadNeisScores, addSessionComment, deleteSessionComment,
        getStudentComments, saveGeneratedReport: _saveGeneratedReport,
        updateSessionStudentScore, deleteSessionScore,
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
    const [_aiLoading, setAiLoading] = useState(false);
    const [_aiStudentId, setAiStudentId] = useState(null);

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

    const _handleGenerateReport = async (studentId) => {
        setAiLoading(true); setAiStudentId(studentId);
        const comments = getStudentComments(selectedCourseId, studentId);
        const student = registeredStudents.find(s => s.studentId === studentId);
        const total = calculateTotal(selectedCourseId, studentId);
        const report = `[AI 과세특 초안 - ${student?.name || studentId}]\n\n${selectedCourse?.title || '수업'} 과목에서 꾸준한 학습 참여를 보이며, 수업 활동에 적극적으로 임하는 모습이 관찰됨. 특히 실습 과제에서 높은 집중력을 발휘하였음. ${comments.length > 0 ? `총 ${comments.length}회의 수업에서 교사 코멘트가 기록되었으며, ` : ''}종합 점수 ${total?.total || '-'}점.\n\n※ Gemini API 키를 설정하면 실제 AI 과세특이 생성됩니다.`;
        _saveGeneratedReport(selectedCourseId, studentId, report);
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
                    <div className={`rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl border m-4 ${
                        isDark ? 'bg-[#1e1e2e] border-white/10' : 'bg-white border-slate-300'
                    }`} onClick={e => e.stopPropagation()}>
                            <div className={`p-6 ${isDark ? 'border-b border-white/10' : 'border-b border-slate-200'}`}>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-lg font-bold text-white">{area.name} — 수업별 채점</h4>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${isChecklistMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-admin-primary/20 text-admin-primary'}`}>
                                        {isChecklistMode ? '✓ 체크리스트 모드' : '직접 입력 모드'}
                                    </span>
                                </div>
                                <div className="flex gap-1.5 mt-2">
                                    {area.scoringLevels.map(lv => (
                                        <span key={lv.id} className={`text-[10px] px-2 py-0.5 rounded-full ${
                                            isDark ? 'bg-white/10 text-gray-300' : 'bg-slate-100 text-slate-700'
                                        }`}>{lv.label}: {lv.score}점</span>
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
                                        <div className={`rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            {/* 학생 선택 영역 */}
                                            <div className={`flex items-center gap-2 p-4 ${isDark ? 'border-b border-white/10' : 'border-b border-slate-200'}`}>
                                                <button onClick={() => {
                                                    const prevIdx = Math.max(currentStudentIdx - 1, 0);
                                                    setScoringSessionModal({ ...scoringSessionModal, selectedStudentId: enrolledStudents[prevIdx].studentId });
                                                }} disabled={currentStudentIdx <= 0}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                                </button>

                                                <select value={selectedStudentId}
                                                    onChange={e => setScoringSessionModal({ ...scoringSessionModal, selectedStudentId: e.target.value })}
                                                    className={`flex-1 rounded-lg text-sm px-3 py-2 font-medium appearance-none cursor-pointer text-center ${
                                                        isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'
                                                    }`}>
                                                    {enrolledStudents.map((s, i) => (
                                                        <option key={s.studentId} value={s.studentId} className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}>
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
                    <div className={`rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border m-4 ${
                        isDark ? 'bg-[#1e1e2e] border-white/10' : 'bg-white border-slate-300'
                    }`} onClick={e => e.stopPropagation()}>
                        <div className={`p-6 ${isDark ? 'border-b border-white/10' : 'border-b border-slate-200'}`}>
                            <h4 className="text-lg font-bold text-white">영역 편집: {editAreaModal.name}</h4>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* 기본 정보 */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-400 mb-1 block">영역 이름</label>
                                    <input value={editAreaModal.name} onChange={e => { const name = e.target.value; setEditAreaModal({ ...editAreaModal, name }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { name }); }} className={`w-full rounded-lg text-sm px-3 py-2 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`} />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-gray-400 mb-1 block">비율(%)</label>
                                    <input type="number" value={editAreaModal.weight} onChange={e => { const weight = Number(e.target.value); setEditAreaModal({ ...editAreaModal, weight }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { weight }); }} className={`w-full rounded-lg text-sm px-3 py-2 text-center ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`} />
                                </div>
                            </div>

                            {/* 성취 기준 */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">성취 기준</label>
                                <textarea value={editField.achievementStandard} onChange={e => { setEditField({ ...editField, achievementStandard: e.target.value }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { achievementStandard: e.target.value }); }}
                                    placeholder="예: [건해 01-02] 건축 제도에 사용되는 선과 글자를 제도 규칙 작성 방법에 맞게 쓸 수 있다."
                                    className={`w-full rounded-lg text-sm px-3 py-2 resize-none h-20 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`} />
                            </div>

                            {/* 평가 요소 (체크리스트용 문항) */}
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">평가 요소 <span className="text-gray-500">(체크리스트 채점 시 각 항목을 Y/N 체크)</span></label>
                                <div className="space-y-1.5 mb-2">
                                    {(editAreaModal.assessmentElements || []).map((el, i) => (
                                        <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 border group ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            <span className="text-xs text-purple-400 font-mono w-5 flex-shrink-0">▪</span>
                                            <span className="text-xs text-gray-200 flex-1">{el}</span>
                                            <button onClick={() => { const els = editAreaModal.assessmentElements.filter((_, idx) => idx !== i); setEditAreaModal({ ...editAreaModal, assessmentElements: els }); updatePerformanceArea(selectedCourseId, editAreaModal.id, { assessmentElements: els }); }} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm">close</span></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input value={editField.newElement} onChange={e => setEditField({ ...editField, newElement: e.target.value })} placeholder="예: 도면의 중심을 작도하여 찾아낼 수 있는가?" className={`flex-1 rounded-lg text-sm px-3 py-1.5 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
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
                                                    className={`w-12 rounded text-[11px] px-1.5 py-0.5 text-center ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`} />
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
                                        <div key={lv.id} className={`flex items-center gap-2 rounded-lg p-2.5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                            <input value={lv.label} onChange={e => {
                                                const levels = editAreaModal.scoringLevels.map(l => l.id === lv.id ? { ...l, label: e.target.value } : l);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className={`w-20 rounded text-xs px-2 py-1 text-center font-bold ${isDark ? 'bg-white/10 border-none text-white' : 'bg-white border border-slate-300 text-slate-900'}`} />
                                            <input value={lv.description} onChange={e => {
                                                const levels = editAreaModal.scoringLevels.map(l => l.id === lv.id ? { ...l, description: e.target.value } : l);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className={`flex-1 rounded text-xs px-2 py-1 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`} placeholder="설명" />
                                            <input type="number" value={lv.score} onChange={e => {
                                                const levels = editAreaModal.scoringLevels.map(l => l.id === lv.id ? { ...l, score: Number(e.target.value) } : l);
                                                setEditAreaModal({ ...editAreaModal, scoringLevels: levels });
                                                updatePerformanceArea(selectedCourseId, editAreaModal.id, { scoringLevels: levels });
                                            }} className={`w-16 rounded text-xs px-2 py-1 text-center ${isDark ? 'bg-white/10 border-none text-white' : 'bg-white border border-slate-300 text-slate-900'}`} />
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
                        <div className={`p-4 flex justify-end ${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'}`}>
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
    const isDark = useThemeStore(state => state.isDark);
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
                    <div className={`rounded-xl border overflow-hidden ${
                        isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
                    }`}>
                        <table className="w-full">
                            <thead>
                                <tr className={isDark ? 'border-b border-white/5' : 'border-b border-slate-200 bg-slate-100'}>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">상품</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">카테고리</th>
                                    <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">가격 (⭐)</th>
                                    <th className="text-center px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">재고</th>
                                    <th className="text-right px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">관리</th>
                                </tr>
                            </thead>
                            <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-200'}>
                                {shopItems.map(item => (
                                    <tr key={item.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.icon}</span>
                                                <div>
                                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
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
                            <div className={`rounded-xl p-8 text-center text-gray-500 border ${
                                isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
                            }`}>
                                대기 중인 주문이 없습니다.
                            </div>
                        ) : (
                            <div className={`rounded-xl border ${
                                isDark ? 'bg-admin-card-dark border-white/5 divide-y divide-white/5' : 'bg-white border-slate-300 divide-y divide-slate-200'
                            }`}>
                                {purchases.map((purchase, idx) => purchase.status === 'pending' && (
                                    <div key={idx} className={`flex items-center justify-between px-5 py-3 transition-colors ${
                                        isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{purchase.itemIcon}</span>
                                            <div>
                                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{purchase.itemName}</p>
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
                            <div className={`rounded-xl p-8 text-center text-gray-500 border ${
                                isDark ? 'bg-admin-card-dark border-white/5' : 'bg-white border-slate-300'
                            }`}>
                                완료된 주문이 없습니다.
                            </div>
                        ) : (
                            <div className={`rounded-xl border max-h-80 overflow-y-auto ${
                                isDark ? 'bg-admin-card-dark border-white/5 divide-y divide-white/5' : 'bg-white border-slate-300 divide-y divide-slate-200'
                            }`}>
                                {purchases.map((purchase, idx) => purchase.status === 'delivered' && (
                                    <div key={idx} className="flex items-center justify-between px-5 py-3 opacity-60">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{purchase.itemIcon}</span>
                                            <div>
                                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{purchase.itemName}</p>
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
                                        className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary ${isDark ? 'bg-[#1e1e2e] border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
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
                                        className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary ${isDark ? 'bg-[#1e1e2e] border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
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

const CourseProgressManagement = ({ courses, registeredStudents, progress, isSubAdmin, accessibleCourseIds, selectedCourseId, onSelectCourse, onBackToDashboard }) => {
    const isDark = useThemeStore(state => state.isDark);
    const availableCourses = useMemo(() => {
        if (!isSubAdmin) return courses;
        const allowedCourseIds = new Set(accessibleCourseIds || []);
        return courses.filter(course => allowedCourseIds.has(course.id));
    }, [accessibleCourseIds, courses, isSubAdmin]);

    const activeCourseId = availableCourses.some(course => course.id === selectedCourseId)
        ? selectedCourseId
        : (availableCourses[0]?.id || '');
    const selectedCourse = availableCourses.find(course => course.id === activeCourseId) || null;

    const enrolledStudents = useMemo(
        () => registeredStudents.filter(student => student.courseIds?.includes(activeCourseId)),
        [activeCourseId, registeredStudents]
    );

    const studentRows = useMemo(() => {
        if (!selectedCourse) return [];
        const totalMissions = selectedCourse.stages.length * 3;

        return enrolledStudents.map(student => {
            const courseProgress = progress?.[student.studentId]?.[selectedCourse.id] || {};
            let completedMissions = 0;

            const stageRows = selectedCourse.stages.map(stage => {
                const stageProgress = courseProgress?.[stage.id] || {};
                const completedCount = ['easy', 'normal', 'hard'].filter(level => stageProgress?.[level]).length;
                completedMissions += completedCount;
                return {
                    id: stage.id,
                    title: stage.title,
                    completedCount,
                    isComplete: completedCount === 3,
                };
            });

            const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
            return {
                student,
                completedMissions,
                completionRate,
                completedStages: stageRows.filter(stage => stage.isComplete).length,
                totalStages: selectedCourse.stages.length,
                stageRows,
            };
        }).sort((a, b) => {
            if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
            return a.student.name.localeCompare(b.student.name, 'ko');
        });
    }, [enrolledStudents, progress, selectedCourse]);

    const averageProgress = studentRows.length > 0
        ? Math.round(studentRows.reduce((sum, row) => sum + row.completionRate, 0) / studentRows.length)
        : 0;
    const fullyCompletedStudents = studentRows.filter(row => row.completionRate === 100).length;

    if (availableCourses.length === 0) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Course Progress</h3>
                        <p className="text-gray-400 text-sm mt-1">수업별 학생 진행률을 확인합니다.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToDashboard}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Dashboard
                    </button>
                </div>
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-10 text-center text-gray-400">
                    조회할 수 있는 수업이 없습니다.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white">Course Progress</h3>
                    <p className="text-gray-400 text-sm mt-1">수업별로 학생들의 미션 진행 상황을 확인합니다.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="w-full sm:w-80">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Course</label>
                        <select
                            value={activeCourseId}
                            onChange={event => onSelectCourse(event.target.value)}
                            className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-admin-secondary ${isDark
                                ? 'border-white/10 bg-admin-card-dark text-white'
                                : 'border-slate-300 bg-white text-slate-900'
                                }`}
                        >
                            {availableCourses.map(course => (
                                <option
                                    key={course.id}
                                    value={course.id}
                                    className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}
                                >
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToDashboard}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Dashboard
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                    <p className="text-sm text-gray-400">선택 과목</p>
                    <p className="mt-2 text-2xl font-bold text-white">{selectedCourse?.title || '-'}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                    <p className="text-sm text-gray-400">수강 학생</p>
                    <p className="mt-2 text-2xl font-bold text-white">{enrolledStudents.length}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                    <p className="text-sm text-gray-400">평균 진행률</p>
                    <p className="mt-2 text-2xl font-bold text-white">{averageProgress}%</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                    <p className="text-sm text-gray-400">100% 완료 학생</p>
                    <p className="mt-2 text-2xl font-bold text-white">{fullyCompletedStudents}</p>
                </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-admin-card-dark overflow-hidden">
                <div className="grid grid-cols-[minmax(220px,1.3fr)_150px_180px_minmax(260px,2fr)] gap-4 border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span>Student</span>
                    <span>Progress</span>
                    <span>Stage Completion</span>
                    <span>Stage Breakdown</span>
                </div>

                {studentRows.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {studentRows.map(row => (
                            <div key={row.student.studentId} className="grid grid-cols-[minmax(220px,1.3fr)_150px_180px_minmax(260px,2fr)] gap-4 px-6 py-5 items-center">
                                <div className="min-w-0">
                                    <p className="font-semibold text-white truncate">{row.student.name}</p>
                                    <p className="text-sm text-gray-400">{row.student.studentId}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-white">{row.completionRate}%</p>
                                    <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${row.completionRate >= 70 ? 'bg-admin-green' : row.completionRate >= 30 ? 'bg-admin-yellow' : 'bg-admin-pink'}`}
                                            style={{ width: `${row.completionRate}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">{row.completedMissions} / {row.totalStages * 3} missions</p>
                                </div>

                                <div className="text-sm text-gray-300">
                                    <span className="font-semibold text-white">{row.completedStages}</span> / {row.totalStages} stages
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {row.stageRows.map(stage => (
                                        <div
                                            key={stage.id}
                                            className={`rounded-xl border px-3 py-2 text-xs ${stage.isComplete ? 'border-admin-green/30 bg-admin-green/10 text-admin-green' : 'border-white/10 bg-white/5 text-gray-300'}`}
                                        >
                                            <p className="font-semibold">{stage.title}</p>
                                            <p className="mt-1">{stage.completedCount}/3 complete</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center text-gray-500">
                        이 수업에 등록된 학생이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsManagement = () => {
    const { user } = useAuthStore();
    const changeAdminPassword = useAuthStore(state => state.changeAdminPassword);
    const { isDark, toggleTheme } = useThemeStore();
    const { clearAllProgress } = useProgressStore();
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

    const handleResetProgress = async () => {
        if (window.confirm('WARNING: This will delete ALL student progress data. This action cannot be undone. Are you sure?')) {
            const ok = await clearAllProgress();
            alert(ok ? 'All progress data has been reset.' : 'Failed to reset progress data.');
        }
    };

    const handleAdminPasswordChange = async (event) => {
        event.preventDefault();
        setPasswordStatus({ type: '', message: '' });

        const currentPassword = passwordForm.currentPassword.trim();
        const nextPassword = passwordForm.newPassword.trim();
        const confirmPassword = passwordForm.confirmPassword.trim();

        if (!currentPassword || !nextPassword || !confirmPassword) {
            setPasswordStatus({ type: 'error', message: '모든 비밀번호 칸을 입력해주세요.' });
            return;
        }

        if (nextPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', message: '새 비밀번호 확인이 일치하지 않습니다.' });
            return;
        }

        const result = await changeAdminPassword(currentPassword, nextPassword);
        if (!result?.ok) {
            const message = result?.reason === 'incorrect_password'
                ? '현재 비밀번호가 올바르지 않습니다.'
                : '비밀번호를 변경하지 못했습니다.';
            setPasswordStatus({ type: 'error', message });
            return;
        }

        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setPasswordStatus({ type: 'success', message: '기본 관리자 비밀번호를 변경했습니다.' });
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

                {user?.role === 'admin' && (
                    <div className="bg-admin-card-dark rounded-2xl border border-white/5 p-6 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                            <span className="material-symbols-outlined text-admin-yellow text-3xl">lock</span>
                            <div>
                                <h4 className="text-lg font-bold text-white">Admin Password</h4>
                                <p className="text-sm text-gray-400">Change the default admin account password</p>
                            </div>
                        </div>

                        <form onSubmit={handleAdminPasswordChange} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={event => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-admin-primary transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={event => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-admin-primary transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={event => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-admin-primary transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <p className="text-xs text-gray-500">이 변경은 기본 관리자 `admin` 계정에만 적용됩니다.</p>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-xl bg-admin-primary hover:bg-admin-primary/90 text-white text-sm font-medium transition-colors shadow-lg shadow-admin-primary/20"
                                >
                                    Change Password
                                </button>
                            </div>

                            {passwordStatus.message && (
                                <div className={`rounded-xl px-4 py-3 text-sm ${passwordStatus.type === 'success' ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border border-red-500/20 bg-red-500/10 text-red-300'}`}>
                                    {passwordStatus.message}
                                </div>
                            )}
                        </form>
                    </div>
                )}

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

const ReflectionManagement = ({ courses, registeredStudents, reflections, isSubAdmin, accessibleCourseIds }) => {
    const isDark = useThemeStore(state => state.isDark);
    const availableCourses = useMemo(() => {
        if (!isSubAdmin) return courses;
        const allowedCourseIds = new Set(accessibleCourseIds || []);
        return courses.filter(course => allowedCourseIds.has(course.id));
    }, [accessibleCourseIds, courses, isSubAdmin]);

    const [selectedCourseId, setSelectedCourseId] = useState(availableCourses[0]?.id || '');
    const activeCourseId = availableCourses.some(course => course.id === selectedCourseId)
        ? selectedCourseId
        : (availableCourses[0]?.id || '');
    const selectedCourse = availableCourses.find(course => course.id === activeCourseId) || null;
    const enrolledStudents = useMemo(
        () => registeredStudents.filter(student => student.courseIds?.includes(activeCourseId)),
        [activeCourseId, registeredStudents]
    );
    const courseReflections = useMemo(
        () => [...reflections]
            .filter(reflection => reflection.courseId === activeCourseId)
            .sort((a, b) => b.timestamp - a.timestamp),
        [activeCourseId, reflections]
    );
    const reflectionMapByStudentId = useMemo(
        () => courseReflections.reduce((acc, reflection) => {
            if (!acc[reflection.studentId]) acc[reflection.studentId] = [];
            acc[reflection.studentId].push(reflection);
            return acc;
        }, {}),
        [courseReflections]
    );
    const studentReflectionRows = useMemo(
        () => enrolledStudents.map(student => ({
            ...student,
            reflections: reflectionMapByStudentId[student.studentId] || [],
        })),
        [enrolledStudents, reflectionMapByStudentId]
    );
    const studentsWithReflections = studentReflectionRows.filter(student => student.reflections.length > 0).length;

    if (availableCourses.length === 0) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-white">Reflection</h3>
                    <p className="text-gray-400 text-sm mt-1">학생 성찰 문장을 과목별로 확인합니다.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-10 text-center text-gray-400">
                    조회할 수 있는 수업이 없습니다.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white">Reflection</h3>
                    <p className="text-gray-400 text-sm mt-1">과목별로 학생들이 작성한 성찰 문장을 한곳에서 확인합니다.</p>
                </div>
                <div className="w-full lg:w-80">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Course</label>
                    <select
                        value={activeCourseId}
                        onChange={event => setSelectedCourseId(event.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-admin-secondary ${
                            isDark
                                ? 'border-white/10 bg-admin-card-dark text-white'
                                : 'border-slate-300 bg-white text-slate-900'
                        }`}
                    >
                        {availableCourses.map(course => (
                            <option
                                key={course.id}
                                value={course.id}
                                className={isDark ? 'bg-[#1e1e2e] text-white' : 'bg-white text-slate-900'}
                            >
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                    <p className="text-sm text-gray-400">선택 과목</p>
                    <p className="mt-2 text-2xl font-bold text-white">{selectedCourse?.title || '-'}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                    <p className="text-sm text-gray-400">수강 학생 / 작성 학생</p>
                    <p className="mt-2 text-2xl font-bold text-white">{enrolledStudents.length} / {studentsWithReflections}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                    <p className="text-sm text-gray-400">전체 성찰 문장</p>
                    <p className="mt-2 text-2xl font-bold text-white">{courseReflections.length}</p>
                </div>
            </div>

            <div className="space-y-4">
                {studentReflectionRows.map(student => (
                    <section key={student.studentId} className="rounded-3xl border border-white/10 bg-admin-card-dark p-6">
                        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-white">{student.name}</h4>
                                <p className="text-sm text-gray-400">{student.studentId}</p>
                            </div>
                            <div className="inline-flex items-center rounded-full border border-admin-secondary/20 bg-admin-secondary/10 px-3 py-1 text-sm font-semibold text-admin-secondary">
                                {student.reflections.length} reflections
                            </div>
                        </div>

                        {student.reflections.length > 0 ? (
                            <div className="mt-4 space-y-3">
                                {student.reflections.map((entry, index) => (
                                    <article key={`${student.studentId}-${entry.timestamp}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
                                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-white">{entry.stageTitle || 'Stage'}</span>
                                            <span className="rounded-full bg-white/10 px-2.5 py-1 uppercase">{entry.difficulty}</span>
                                            {entry.missionTitle && (
                                                <span className="rounded-full bg-white/10 px-2.5 py-1">{entry.missionTitle}</span>
                                            )}
                                            <span>{new Date(entry.timestamp).toLocaleString('ko-KR')}</span>
                                        </div>
                                        <p className="mt-3 text-base leading-7 text-gray-300">{entry.reflection}</p>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-gray-500">
                                아직 이 과목에서 작성된 성찰이 없습니다.
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
};

const SUBADMIN_PERMISSION_OPTIONS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'learners', label: 'Learners' },
    { key: 'reflection', label: 'Reflection' },
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

    const handleSubmit = async (e) => {
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
            const result = await onUpdateSubAdmin(editingAdminId, {
                adminId: nextAdminId,
                name: nextName,
                password: nextPassword,
                courseIds: fullCourseIds,
                permissions: nextPermissions,
            });
            if (!result?.ok) {
                setError('Failed to update the sub-admin account.');
                return;
            }
        } else {
            const result = await onAddSubAdmin(nextAdminId, nextPassword, nextName, fullCourseIds, nextPermissions);
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
                                                    void onRemoveSubAdmin(subAdmin.adminId);
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
    const isDark = useThemeStore(state => state.isDark);
    const { user, logout, registeredStudents, registerStudent, removeStudent, bulkRegisterStudents, updateStudent, subAdmins, addSubAdmin, removeSubAdmin, updateSubAdmin, setAllStudents } = useAuthStore();
    const sessionScores = useAssessmentStore(state => state.sessionScores);
    const { courses, addCourse, replaceCourses, updateCourse, deleteCourse } = useStageStore();
    const { submissions: _submissions, totalStars, progress, reflections = [], setAllProgressData } = useProgressStore();
    const isSubAdmin = user?.role === 'subadmin';
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedProgressCourseId, setSelectedProgressCourseId] = useState('');
    const [searchTerm] = useState('');
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
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
        { id: 'reflection', label: 'Reflection', icon: 'edit_note' },
        { id: 'class', label: 'Class', icon: 'menu_book' },
        { id: 'assessments', label: 'Assessments', icon: 'quiz' },
        { id: 'marketplace', label: 'Marketplace', icon: 'storefront' },
        { id: 'subadmins', label: '?쒕툕愿由ъ옄', icon: 'supervisor_account' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ].filter(view => hasViewAccess(view.id));

    useEffect(() => {
        if (currentView === 'progress') return;
        if (!visibleAdminViews.some(view => view.id === currentView)) {
            setCurrentView(visibleAdminViews[0]?.id || 'dashboard');
        }
    }, [currentView, visibleAdminViews]);

    // 서버에서 모든 학생 데이터 갱신
    useEffect(() => {
        const fetchAdminDashboard = async () => {
             // 차후에 Zustand Store 내부 액션으로 이동하는 편이 좋지만 우선 여기서 처리
             try {
                const rs = await fetch('/api/admin/dashboard');
                const data = await rs.json();
                if(data.success && data.students) {
                    console.log("[Admin] Server data loaded: ", data.students);
                    
                    setAllStudents(data.students);

                    // Reconstruct maps for progress store
                    const totalStarsMap = {};
                    const progressGraph = {};
                    data.students.forEach(s => {
                        totalStarsMap[s.studentId] = s.totalStars || 0;
                        progressGraph[s.studentId] = s.progress || {};
                    });

                    setAllProgressData(progressGraph, totalStarsMap, data.allReflections || []);
                }
             } catch(e) {
                 console.error("Failed to load admin dashboard data from server", e);
             }
        };
        fetchAdminDashboard();
    }, [setAllStudents, setAllProgressData]);

    const openCourseProgressView = (courseId) => {
        setSelectedProgressCourseId(courseId);
        setCurrentView('progress');
    };

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
        <div className={`admin-theme-shell ${isDark ? 'admin-theme-dark' : 'admin-theme-light'} flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display`}>
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
                    {hasViewAccess('reflection') && <button
                        onClick={() => setCurrentView('reflection')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'reflection'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">edit_note</span>
                        <span className={`font-medium ${currentView === 'reflection' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Reflection</span>
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
                                    currentView === 'progress' ? 'Course Progress' :
                                    currentView === 'reflection' ? 'Reflection' :
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
                            <button
                                onClick={() => setShowHelpModal(true)}
                                className="p-2.5 rounded-xl bg-admin-card-dark hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                aria-label="관리자 페이지 사용 안내 열기"
                            >
                                <span className="material-symbols-outlined text-[22px]">help</span>
                            </button>
                        </div>
                    </div>
                </header>

                <AdminHelpModal
                    isOpen={showHelpModal}
                    onClose={() => setShowHelpModal(false)}
                    currentView={currentView}
                    availableViews={visibleAdminViews}
                    isSubAdmin={isSubAdmin}
                />

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
                                        className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary ${isDark ? 'bg-[#1e1e2e] border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
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
                                        className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary ${isDark ? 'bg-[#1e1e2e] border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                                        placeholder="알림 제목"
                                    />
                                </div>
                                {/* Message */}
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">메시지</label>
                                    <textarea
                                        value={notifMessage}
                                        onChange={e => setNotifMessage(e.target.value)}
                                        className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary resize-none h-24 ${isDark ? 'bg-[#1e1e2e] border border-white/10 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
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
                                        <div key={n.id} className={`rounded-xl p-3 border group ${isDark ? 'bg-[#1e1e2e] border-white/5' : 'bg-white border-slate-200'}`}>
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
                            onOpenCourseProgress={openCourseProgressView}
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
                    {currentView === 'progress' && (
                        <CourseProgressManagement
                            courses={courses}
                            registeredStudents={registeredStudents}
                            progress={progress}
                            isSubAdmin={isSubAdmin}
                            accessibleCourseIds={user?.courseIds}
                            selectedCourseId={selectedProgressCourseId}
                            onSelectCourse={setSelectedProgressCourseId}
                            onBackToDashboard={() => setCurrentView('dashboard')}
                        />
                    )}
                    {currentView === 'reflection' && (
                        <ReflectionManagement
                            courses={courses}
                            registeredStudents={registeredStudents}
                            reflections={reflections}
                            isSubAdmin={isSubAdmin}
                            accessibleCourseIds={user?.courseIds}
                        />
                    )}
                    {currentView === 'class' && (
                        <ClassManagement
                            courses={courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))}
                            onAddCourse={addCourse}
                            onUpdateCourse={updateCourse}
                            onReplaceCourses={replaceCourses}
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
                    {currentView !== 'dashboard' && currentView !== 'learners' && currentView !== 'progress' && currentView !== 'reflection' && currentView !== 'class' && currentView !== 'assessments' && currentView !== 'marketplace' && currentView !== 'subadmins' && currentView !== 'settings' && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Component for {currentView} is under construction.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

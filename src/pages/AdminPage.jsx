import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../stores/useAuthStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useStageStore } from '../stores/useStageStore';
import useThemeStore from '../stores/useThemeStore';
import { useMarketplaceStore } from '../stores/useMarketplaceStore';
import DashboardCalendar from '../components/DashboardCalendar';
// --- Sub-components for Views ---

const DashboardOverview = ({ totalLearners, totalClasses, pointsIssued, courseCompletion }) => {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* ... (Existing Cards Code) ... */}
                {/* Card 1 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-secondary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-white">groups</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Total Learners</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{totalLearners}</h3>
                        <div className="flex items-center text-admin-green text-xs font-bold bg-admin-green/10 px-2 py-1 rounded-full mb-1">
                            <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>
                            12%
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-700/30 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-admin-secondary to-purple-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                </div>
                {/* ... (Other cards - compacted for brevity in this rewrite, but I will include them full in the actual file) ... */}
                {/* Card 2 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-green/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-admin-green">donut_large</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Course Completion</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{courseCompletion}</h3>
                        <div className="flex items-center text-admin-green text-xs font-bold bg-admin-green/10 px-2 py-1 rounded-full mb-1">
                            <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>
                            5%
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-700/30 rounded-full h-1.5">
                        <div className="bg-admin-green h-1.5 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                </div>
                {/* Card 3 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-pink/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-admin-pink">swords</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Active Classes</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{totalClasses}</h3>
                        <div className="flex items-center text-admin-pink text-xs font-bold bg-admin-pink/10 px-2 py-1 rounded-full mb-1">
                            <span className="material-symbols-outlined text-[14px] mr-0.5">priority_high</span>
                            2 new
                        </div>
                    </div>
                    <div className="mt-4 flex gap-1">
                        <div className="h-1.5 w-1/3 bg-admin-pink rounded-full"></div>
                        <div className="h-1.5 w-1/3 bg-admin-pink/50 rounded-full"></div>
                        <div className="h-1.5 w-1/3 bg-gray-700/30 rounded-full"></div>
                    </div>
                </div>
                {/* Card 4 */}
                <div className="bg-admin-card-dark rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-admin-yellow/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-admin-yellow">database</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">Points Issued</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-white">{pointsIssued}</h3>
                        <div className="flex items-center text-admin-green text-xs font-bold bg-admin-green/10 px-2 py-1 rounded-full mb-1">
                            <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>
                            15%
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-700/30 rounded-full h-1.5">
                        <div className="bg-admin-yellow h-1.5 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                </div>
            </div>

            {/* Charts & Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2">
                    <DashboardCalendar />
                </div>

                {/* Top Gamification */}
                <div className="bg-admin-card-dark rounded-2xl border border-white/5 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Top Classes</h3>
                        <a href="#" className="text-admin-secondary text-sm font-medium hover:underline">View All</a>
                    </div>
                    <div className="space-y-4">
                        {/* Quest Item 1 */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-background-dark border border-white/5 hover:border-admin-secondary/30 transition-colors group cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-admin-pink/20 flex items-center justify-center text-admin-pink">
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white text-sm font-semibold group-hover:text-admin-secondary transition-colors">Onboarding Mission</h4>
                                <p className="text-gray-500 text-xs">980 Participants</p>
                            </div>
                            <div className="text-right">
                                <span className="text-admin-green text-sm font-bold">95%</span>
                            </div>
                        </div>
                        {/* Quest Item 2 */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-background-dark border border-white/5 hover:border-admin-secondary/30 transition-colors group cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-admin-secondary/20 flex items-center justify-center text-admin-secondary">
                                <span className="material-symbols-outlined">code</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white text-sm font-semibold group-hover:text-admin-secondary transition-colors">Python Basics</h4>
                                <p className="text-gray-500 text-xs">450 Participants</p>
                            </div>
                            <div className="text-right">
                                <span className="text-admin-green text-sm font-bold">72%</span>
                            </div>
                        </div>
                        {/* Quest Item 3 */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-background-dark border border-white/5 hover:border-admin-secondary/30 transition-colors group cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-admin-yellow/20 flex items-center justify-center text-admin-yellow">
                                <span className="material-symbols-outlined">security</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white text-sm font-semibold group-hover:text-admin-secondary transition-colors">Cyber Awareness</h4>
                                <p className="text-gray-500 text-xs">320 Participants</p>
                            </div>
                            <div className="text-right">
                                <span className="text-admin-yellow text-sm font-bold">45%</span>
                            </div>
                        </div>
                        {/* Quest Item 4 */}
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-admin-primary/20 hover:border-admin-secondary/30 transition-colors group cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-admin-primary/20 flex items-center justify-center text-admin-primary">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white text-sm font-semibold group-hover:text-admin-secondary transition-colors">Soft Skills 101</h4>
                                <p className="text-gray-500 text-xs">210 Participants</p>
                            </div>
                            <div className="text-right">
                                <span className="text-admin-yellow text-sm font-bold">58%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-admin-card-dark rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white">Recent User Activity</h3>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 bg-background-dark hover:text-white rounded border border-white/5 hover:border-white/20 transition-all">
                            <span className="material-symbols-outlined text-[16px]">filter_list</span>
                            Filter
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 bg-background-dark hover:text-white rounded border border-white/5 hover:border-white/20 transition-all">
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            Export
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Class / Action</th>
                                <th className="px-6 py-4 font-semibold">Points Earned</th>
                                <th className="px-6 py-4 font-semibold">Date & Time</th>
                                <th className="px-6 py-4 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {/* Static rows for demo */}
                            <tr className="group hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random')" }}></div>
                                        <div>
                                            <p className="font-medium text-white">Sarah Jenkins</p>
                                            <p className="text-xs text-gray-500">Design Team</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">Completed <span className="text-white font-medium">Design Thinking Module 1</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-admin-yellow font-medium">
                                        <span className="material-symbols-outlined text-[16px]">monetization_on</span>
                                        +250
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">Oct 24, 2:30 PM</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-green/10 text-admin-green border border-admin-green/20">
                                        Completed
                                    </span>
                                </td>
                            </tr>
                            <tr className="group hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=Michael+Chen&background=random')" }}></div>
                                        <div>
                                            <p className="font-medium text-white">Michael Chen</p>
                                            <p className="text-xs text-gray-500">Engineering</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">Started <span className="text-white font-medium">Advanced Kubernetes</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-gray-500 font-medium">
                                        <span className="material-symbols-outlined text-[16px]">monetization_on</span>
                                        0
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">Oct 24, 1:45 PM</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-admin-pink/10 text-admin-pink border border-admin-pink/20">
                                        In Progress
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

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
    const [currentStudent, setCurrentStudent] = useState(null); // For editing

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
        // If videoUrl contains an iframe embed code, extract the src attribute
        if (finalData.videoUrl && finalData.videoUrl.includes('<iframe')) {
            const srcMatch = finalData.videoUrl.match(/src=["']([^"']+)["']/);
            if (srcMatch) {
                finalData.videoUrl = srcMatch[1].replace(/&amp;/g, '&');
            }
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
    const { progress } = useProgressStore();

    const studentsWithProgress = useMemo(() => {
        if (!selectedCourse) return [];

        // Filter students enrolled in the selected course
        const enrolledStudents = registeredStudents.filter(student =>
            student.courseIds && student.courseIds.includes(selectedCourseId)
        );

        // Calculate progress for each student
        return enrolledStudents.map(student => {
            const progressData = progress?.[student.studentId]?.[selectedCourseId] || {};

            // Calculate total stages and completed stages
            const totalStages = selectedCourse.stages ? selectedCourse.stages.length : 0;
            let stagesCompleted = 0;
            let totalMissions = totalStages * 3; // 3 missions per stage (Easy, Normal, Hard)
            let missionsCompleted = 0;

            if (selectedCourse.stages) {
                selectedCourse.stages.forEach(stage => {
                    const stageProgress = progressData[stage.id];
                    if (stageProgress) {
                        if (stageProgress.easy) missionsCompleted++;
                        if (stageProgress.normal) missionsCompleted++;
                        if (stageProgress.hard) missionsCompleted++;

                        if (stageProgress.easy && stageProgress.normal && stageProgress.hard) {
                            stagesCompleted++;
                        }
                    }
                });
            }

            const progressPercentage = totalMissions > 0 ? Math.round((missionsCompleted / totalMissions) * 100) : 0;

            return {
                ...student,
                stagesCompleted,
                totalStages,
                missionsCompleted,
                totalMissions,
                progressPercentage
            };
        });
    }, [selectedCourseId, registeredStudents, courses, progress]);

    // Calculate course statistics
    const stats = useMemo(() => {
        if (studentsWithProgress.length === 0) return { avgProgress: 0, totalEnrolled: 0, completedStudents: 0 };

        const totalProgress = studentsWithProgress.reduce((sum, s) => sum + s.progressPercentage, 0);
        const avgProgress = Math.round(totalProgress / studentsWithProgress.length);
        const completedStudents = studentsWithProgress.filter(s => s.progressPercentage === 100).length;

        return {
            avgProgress,
            totalEnrolled: studentsWithProgress.length,
            completedStudents
        };
    }, [studentsWithProgress]);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-white">Assessments</h3>
                    <p className="text-gray-400 text-sm mt-1">Monitor student performance and progress</p>
                </div>

                {/* Course Filter */}
                <div className="flex items-center gap-3 bg-admin-card-dark p-2 rounded-xl border border-white/10">
                    <span className="text-sm text-gray-400 pl-2">Class:</span>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="bg-white/5 border-none rounded-lg text-sm text-white focus:ring-1 focus:ring-admin-primary py-1.5 pl-3 pr-8 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        {courses.map(course => (
                            <option key={course.id} value={course.id} className="bg-admin-card-dark">
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/5 flex items-start justify-between relative overflow-hidden group hover:border-admin-primary/30 transition-colors">
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Total Enrolled</p>
                        <h4 className="text-3xl font-bold text-white mt-1">{stats.totalEnrolled}</h4>
                        <p className="text-sm text-gray-500 mt-2">Students in this class</p>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-xl">
                        <span className="material-symbols-outlined text-blue-400">groups</span>
                    </div>
                </div>

                <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/5 flex items-start justify-between relative overflow-hidden group hover:border-admin-primary/30 transition-colors">
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Avg. Completion</p>
                        <h4 className="text-3xl font-bold text-white mt-1">{stats.avgProgress}%</h4>
                        <p className="text-sm text-gray-500 mt-2">Overall class progress</p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-xl">
                        <span className="material-symbols-outlined text-green-400">trending_up</span>
                    </div>
                </div>

                <div className="bg-admin-card-dark p-6 rounded-2xl border border-white/5 flex items-start justify-between relative overflow-hidden group hover:border-admin-primary/30 transition-colors">
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Fully Completed</p>
                        <h4 className="text-3xl font-bold text-white mt-1">{stats.completedStudents}</h4>
                        <p className="text-sm text-gray-500 mt-2">Students finished all stages</p>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                        <span className="material-symbols-outlined text-purple-400">emoji_events</span>
                    </div>
                </div>
            </div>

            {/* Student Progress Table */}
            <div className="bg-admin-card-dark rounded-2xl border border-white/5">
                <div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Student Name</th>
                                <th className="px-6 py-4 font-semibold">Student ID</th>
                                <th className="px-6 py-4 font-semibold">Progress</th>
                                <th className="px-6 py-4 font-semibold">Stages Completed</th>
                                <th className="px-6 py-4 font-semibold">Missions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {studentsWithProgress.map((student) => (
                                <tr key={student.studentId} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${student.name}&background=random')` }}></div>
                                            <span className="font-medium text-white">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{student.studentId}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-full max-w-xs flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${student.progressPercentage === 100 ? 'bg-green-500' :
                                                        student.progressPercentage > 50 ? 'bg-blue-500' : 'bg-admin-secondary'
                                                        }`}
                                                    style={{ width: `${student.progressPercentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-300 w-8 text-right">{student.progressPercentage}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.stagesCompleted === student.totalStages
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-white/5 text-gray-300 border border-white/10'
                                            }`}>
                                            {student.stagesCompleted} / {student.totalStages}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        <span className="text-gray-400">{student.missionsCompleted} / {student.totalMissions}</span>
                                    </td>
                                </tr>
                            ))}
                            {studentsWithProgress.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-4xl opacity-50">school</span>
                                        <span>No students enrolled in this class yet.</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

function MarketplaceManagement() {
    const { shopItems, purchases, addShopItem, removeShopItem, updateShopItems, deliverPurchase } = useMarketplaceStore();
    const { registeredStudents } = useAuthStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState('items');
    const [newItem, setNewItem] = useState({ name: '', description: '', price: 5, icon: '🎁', category: 'food', stock: 99 });

    const categoryLabels = { food: '간식', privilege: '특권', reward: '보상', item: '문구' };
    const categoryIcons = { food: '🍪', privilege: '🏆', reward: '⭐', item: '✏️' };

    const handleAddItem = () => {
        if (!newItem.name.trim()) return;
        addShopItem(newItem);
        setNewItem({ name: '', description: '', price: 5, icon: '🎁', category: 'food', stock: 99 });
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
                                    <input
                                        value={newItem.icon}
                                        onChange={e => setNewItem({ ...newItem, icon: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-xl focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    />
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
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">카테고리</label>
                                    <select
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    >
                                        <option value="food">🍪 간식</option>
                                        <option value="privilege">🏆 특권</option>
                                        <option value="reward">⭐ 보상</option>
                                        <option value="item">✏️ 문구</option>
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
                                    <input
                                        value={editingItem.icon}
                                        onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-xl focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    />
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
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">카테고리</label>
                                    <select
                                        value={editingItem.category}
                                        onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-admin-secondary"
                                    >
                                        <option value="food">🍪 간식</option>
                                        <option value="privilege">🏆 특권</option>
                                        <option value="reward">⭐ 보상</option>
                                        <option value="item">✏️ 문구</option>
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



export default function AdminPage() {
    const navigate = useNavigate();
    const { user, logout, registeredStudents, registerStudent, removeStudent, bulkRegisterStudents, updateStudent } = useAuthStore();
    const { courses, addCourse, deleteCourse } = useStageStore();
    const { submissions } = useProgressStore();
    const [currentView, setCurrentView] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Aggregation for Dashboard ---
    const totalLearners = registeredStudents.length;
    const totalClasses = courses.length; // Approximate for now
    const pointsIssued = "1.5M"; // Placeholder
    const courseCompletion = "78%"; // Placeholder

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 flex flex-col bg-admin-primary h-full transition-all duration-300 z-20 shadow-xl relative overflow-y-auto">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stadia_controller</span>
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-bold tracking-tight">ADMIN PAGE</h1>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Gamified Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
                    {/* Dashboard (Active) */}
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'dashboard'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                        <span className="text-white font-semibold">Dashboard</span>
                    </button>
                    {/* Learners */}
                    <button
                        onClick={() => setCurrentView('learners')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'learners'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">school</span>
                        <span className={`font-medium ${currentView === 'learners' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Learners</span>
                    </button>
                    {/* Class (Project Classes) */}
                    <button
                        onClick={() => setCurrentView('class')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'class'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">menu_book</span>
                        <span className={`font-medium ${currentView === 'class' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Class</span>
                    </button>
                    {/* Assessments */}
                    <button
                        onClick={() => setCurrentView('assessments')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'assessments'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">quiz</span>
                        <span className={`font-medium ${currentView === 'assessments' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Assessments</span>
                    </button>
                    {/* Marketplace */}
                    <button
                        onClick={() => setCurrentView('marketplace')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'marketplace'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">storefront</span>
                        <span className={`font-medium ${currentView === 'marketplace' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Marketplace</span>
                    </button>
                    {/* Settings */}
                    <button
                        onClick={() => setCurrentView('settings')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all group ${currentView === 'settings'
                            ? 'bg-admin-secondary shadow-lg shadow-admin-secondary/20'
                            : 'hover:bg-white/10 text-white/80 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-white">settings</span>
                        <span className={`font-medium ${currentView === 'settings' ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>Settings</span>
                    </button>
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
                        {/* Search */}
                        <div className="relative w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-admin-secondary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2.5 bg-admin-card-dark border-none rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-admin-secondary/50 transition-all"
                                placeholder="Search learners, classes, or reports..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button className="relative p-2.5 rounded-xl bg-admin-card-dark hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[22px]">notifications</span>
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-admin-pink border-2 border-admin-card-dark"></span>
                            </button>
                            <button className="p-2.5 rounded-xl bg-admin-card-dark hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[22px]">help</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    {currentView === 'dashboard' && (
                        <DashboardOverview
                            totalLearners={totalLearners}
                            totalClasses={totalClasses}
                            pointsIssued={pointsIssued}
                            courseCompletion={courseCompletion}
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
                    {currentView === 'settings' && (
                        <SettingsManagement />
                    )}
                    {currentView !== 'dashboard' && currentView !== 'learners' && currentView !== 'class' && currentView !== 'assessments' && currentView !== 'marketplace' && currentView !== 'settings' && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Component for {currentView} is under construction.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

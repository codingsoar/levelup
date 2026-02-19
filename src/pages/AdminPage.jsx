import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../stores/useAuthStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useStageStore } from '../stores/useStageStore';
import useThemeStore from '../stores/useThemeStore';
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
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-admin-primary/50 transition-colors bg-white/5">
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

        onUpdateStudent(currentStudent.studentId, {
            name: formData.name,
            password: formData.password, // Optional: handle password update securely
            grade: parseInt(formData.grade),
            admissionYear: parseInt(formData.admissionYear)
        });
        setIsEditModalOpen(false);
        setCurrentStudent(null);
        setFormData({ name: '', studentId: '', password: '', grade: '1', admissionYear: new Date().getFullYear() });
    };

    const openEditModal = (student) => {
        setCurrentStudent(student);
        setFormData({
            name: student.name,
            studentId: student.studentId,
            password: student.password, // This might be sensitive, consider not pre-filling
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
                            <option value="all">All Years</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Grade:</span>
                        <select
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg text-sm text-white px-3 py-1.5 focus:outline-none focus:border-admin-primary"
                        >
                            <option value="all">All Grades</option>
                            {[1, 2, 3].map(g => <option key={g} value={g}>Grade {g}</option>)}
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
                                        <option value="1">Grade 1</option>
                                        <option value="2">Grade 2</option>
                                        <option value="3">Grade 3</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-admin-primary transition-colors"
                                    placeholder={isEditModalOpen ? "(Leave blank to keep unchanged)" : "Leave empty for default '1234'"}
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

const ClassManagement = ({ courses, onAddCourse, onDeleteCourse }) => {
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
                                <tr key={course.id} className="group hover:bg-white/5 transition-colors">
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
                                            onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
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
                    {currentView === 'settings' && (
                        <SettingsManagement />
                    )}
                    {currentView !== 'dashboard' && currentView !== 'learners' && currentView !== 'class' && currentView !== 'assessments' && currentView !== 'settings' && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Component for {currentView} is under construction.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

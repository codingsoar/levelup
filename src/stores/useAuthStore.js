import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultStudents } from '../data/sampleCourses';

const DEFAULT_ADMIN_CREDENTIALS = {
    adminId: 'admin',
    password: 'admin1234',
};

const normalizeStudent = (student) => ({
    ...student,
    courseIds: Array.isArray(student.courseIds) ? student.courseIds : [],
    completedMissions: Array.isArray(student.completedMissions) ? student.completedMissions : [],
    grade: student.grade || 1, // Default grade 1
    admissionYear: student.admissionYear || new Date().getFullYear(), // Default current year
});

const DEFAULT_SUBADMIN_PERMISSIONS = {
    dashboard: true,
    learners: true,
    reflection: true,
    class: true,
    assessments: true,
    marketplace: true,
    subadmins: true,
    settings: true,
};

const normalizeSubAdmin = (subAdmin) => ({
    ...subAdmin,
    courseIds: Array.isArray(subAdmin?.courseIds) ? subAdmin.courseIds : [],
    permissions: {
        ...DEFAULT_SUBADMIN_PERMISSIONS,
        ...(subAdmin?.permissions || {}),
    },
});

const applyStudentLogin = (set, student) => {
    set({ user: { ...normalizeStudent(student), role: 'student' }, isAdmin: false });
};

const applyAdminLogin = (set, adminId, name) => {
    set({ user: { adminId, name, role: 'admin' }, isAdmin: true });
};

const applySubAdminLogin = (set, subAdmin) => {
    const normalizedSub = normalizeSubAdmin(subAdmin);
    set({
        user: {
            adminId: normalizedSub.adminId,
            name: normalizedSub.name,
            role: 'subadmin',
            courseIds: normalizedSub.courseIds,
            permissions: normalizedSub.permissions,
        },
        isAdmin: true,
    });
};

const mergeStudents = (currentStudents, incomingStudents) => {
    const currentById = new Map(currentStudents.map(student => [student.studentId, normalizeStudent(student)]));
    const merged = [];

    incomingStudents.forEach(student => {
        const normalizedIncoming = normalizeStudent(student);
        const existing = currentById.get(normalizedIncoming.studentId);
        merged.push(
            normalizeStudent({
                ...existing,
                ...normalizedIncoming,
                password: normalizedIncoming.password || existing?.password || '1234',
                courseIds: normalizedIncoming.courseIds?.length ? normalizedIncoming.courseIds : (existing?.courseIds || []),
                completedMissions: normalizedIncoming.completedMissions?.length
                    ? normalizedIncoming.completedMissions
                    : (existing?.completedMissions || []),
                grade: normalizedIncoming.grade || existing?.grade || 1,
                admissionYear: normalizedIncoming.admissionYear || existing?.admissionYear || new Date().getFullYear(),
            })
        );
        currentById.delete(normalizedIncoming.studentId);
    });

    return [...merged, ...Array.from(currentById.values())].map(normalizeStudent);
};

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAdmin: false,
            adminCredentials: DEFAULT_ADMIN_CREDENTIALS,
            registeredStudents: defaultStudents.map(normalizeStudent),
            subAdmins: [],

            loginStudent: async (studentId, password) => {
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: studentId, password })
                    });
                    const data = await response.json();
                    
                    if (data.success && data.user && data.user.role === 'student') {
                        applyStudentLogin(set, data.user);
                        return true;
                    }
                } catch (error) {
                    console.error('Login error:', error);
                }

                const students = get().registeredStudents;
                const found = students.find(s => s.studentId === studentId && s.password === password);
                if (found) {
                    applyStudentLogin(set, found);
                    return true;
                }

                return false;
            },

            loginAdmin: async (adminId, password) => {
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: adminId, password })
                    });
                    const data = await response.json();
                    
                    if (data.success && data.user) {
                        const role = data.user.role;
                        if (role === 'admin') {
                            applyAdminLogin(set, adminId, data.user.name || '관리자');
                            return true;
                        } else if (role === 'subadmin') {
                            applySubAdminLogin(set, data.user);
                            return true;
                        }
                    }
                } catch (error) {
                    console.error('Admin login error:', error);
                }

                const defaultAdmin = get().adminCredentials || DEFAULT_ADMIN_CREDENTIALS;
                if (adminId === defaultAdmin.adminId && password === defaultAdmin.password) {
                    applyAdminLogin(set, adminId, '관리자');
                    return true;
                }

                const sub = get().subAdmins.find(s => s.adminId === adminId && s.password === password);
                if (sub) {
                    applySubAdminLogin(set, sub);
                    return true;
                }

                return false;
            },

            logout: () => set({ user: null, isAdmin: false }),

            setAllStudents: (students) => set(state => ({
                registeredStudents: mergeStudents(state.registeredStudents, students)
            })),

            changeAdminPassword: (currentPassword, newPassword) => {
                const adminCredentials = get().adminCredentials || DEFAULT_ADMIN_CREDENTIALS;
                if (adminCredentials.password !== currentPassword) {
                    return { ok: false, reason: 'incorrect_password' };
                }

                const trimmedNextPassword = newPassword.trim();
                if (!trimmedNextPassword) {
                    return { ok: false, reason: 'invalid_input' };
                }

                set({
                    adminCredentials: {
                        ...adminCredentials,
                        password: trimmedNextPassword,
                    },
                });
                return { ok: true };
            },

            registerStudent: (studentId, name, password, grade, admissionYear) => {
                if (!studentId || !name) return { ok: false, reason: 'invalid_input' };

                const normalizedStudentId = studentId.trim();
                const normalizedName = name.trim();
                const normalizedPassword = (password || '1234').trim();
                const normalizedGrade = grade ? parseInt(grade) : 1;
                const normalizedYear = admissionYear ? parseInt(admissionYear) : new Date().getFullYear();

                const students = get().registeredStudents;
                if (students.find(s => s.studentId === normalizedStudentId)) {
                    return { ok: false, reason: 'already_exists' };
                }

                set(state => ({
                    registeredStudents: [...state.registeredStudents, {
                        studentId: normalizedStudentId,
                        name: normalizedName,
                        password: normalizedPassword,
                        courseIds: [],
                        grade: normalizedGrade,
                        admissionYear: normalizedYear
                    }]
                }));
                return { ok: true };
            },

            enrollStudent: (studentId, courseId) => {
                set(state => ({
                    registeredStudents: state.registeredStudents.map(s =>
                        s.studentId === studentId && !s.courseIds.includes(courseId)
                            ? { ...s, courseIds: [...s.courseIds, courseId] }
                            : s
                    )
                }));
            },

            unenrollStudent: (studentId, courseId) => {
                set(state => ({
                    registeredStudents: state.registeredStudents.map(s =>
                        s.studentId === studentId
                            ? { ...s, courseIds: s.courseIds.filter(id => id !== courseId) }
                            : s
                    )
                }));
            },

            // Bulk registration
            bulkRegisterStudents: (studentsData) => {
                const currentStudents = get().registeredStudents;
                const newStudents = [];
                const errors = [];

                studentsData.forEach(student => {
                    const { studentId, name, password, grade, admissionYear } = student;
                    if (!studentId || !name) {
                        errors.push({ studentId, reason: 'Missing ID or Name' });
                        return;
                    }

                    if (currentStudents.find(s => s.studentId === studentId) || newStudents.find(s => s.studentId === studentId)) {
                        errors.push({ studentId, reason: 'Duplicate ID' });
                        return;
                    }

                    newStudents.push({
                        studentId: String(studentId).trim(),
                        name: String(name).trim(),
                        password: String(password || '1234').trim(),
                        grade: grade ? parseInt(grade) : 1,
                        admissionYear: admissionYear ? parseInt(admissionYear) : new Date().getFullYear(),
                        courseIds: []
                    });
                });

                if (newStudents.length > 0) {
                    set(state => ({
                        registeredStudents: [...state.registeredStudents, ...newStudents]
                    }));
                }

                return { addedCount: newStudents.length, errors };
            },

            updateStudent: (studentId, updates) => {
                set(state => ({
                    registeredStudents: state.registeredStudents.map(s =>
                        s.studentId === studentId ? { ...s, ...updates } : s
                    )
                }));
            },

            addStudentToCourse: (courseId, studentId, name, password) => {
                if (!courseId || !studentId || !name) {
                    return { ok: false, reason: 'invalid_input' };
                }

                const normalizedStudentId = studentId.trim();
                const normalizedName = name.trim();
                const normalizedPassword = (password || '1234').trim() || '1234';
                const students = get().registeredStudents.map(normalizeStudent);
                const existing = students.find(s => s.studentId === normalizedStudentId);

                if (existing && existing.name !== normalizedName) {
                    return { ok: false, reason: 'name_mismatch' };
                }

                set(state => {
                    const currentStudents = state.registeredStudents.map(normalizeStudent);
                    const foundIndex = currentStudents.findIndex(s => s.studentId === normalizedStudentId);

                    if (foundIndex === -1) {
                        return {
                            registeredStudents: [
                                ...currentStudents,
                                { studentId: normalizedStudentId, name: normalizedName, password: normalizedPassword, courseIds: [courseId] },
                            ],
                        };
                    }

                    const foundStudent = currentStudents[foundIndex];
                    const nextCourseIds = foundStudent.courseIds.includes(courseId)
                        ? foundStudent.courseIds
                        : [...foundStudent.courseIds, courseId];

                    return {
                        registeredStudents: currentStudents.map((student, index) =>
                            index === foundIndex
                                ? { ...student, password: normalizedPassword || student.password, courseIds: nextCourseIds }
                                : student
                        ),
                    };
                });

                return { ok: true };
            },

            removeStudentFromCourse: (courseId, studentId) => {
                if (!courseId || !studentId) return;
                set(state => ({
                    registeredStudents: state.registeredStudents
                        .map(normalizeStudent)
                        .map(student =>
                            student.studentId === studentId
                                ? { ...student, courseIds: student.courseIds.filter(id => id !== courseId) }
                                : student
                        )
                        .filter(student => student.courseIds.length > 0),
                }));
            },

            getStudentsByCourse: (courseId) => {
                return get().registeredStudents.map(normalizeStudent).filter(student => student.courseIds.includes(courseId));
            },

            changePassword: (studentId, oldPassword, newPassword) => {
                const students = get().registeredStudents;
                const found = students.find(s => s.studentId === studentId && s.password === oldPassword);
                if (found) {
                    set({
                        registeredStudents: students.map(s =>
                            s.studentId === studentId ? { ...s, password: newPassword } : s
                        ),
                    });
                    return true;
                }
                return false;
            },

            removeStudent: (studentId) => {
                set(state => ({
                    registeredStudents: state.registeredStudents.filter(s => s.studentId !== studentId)
                }));
            },

            // ═══════════════════════════════════════
            // 서브관리자 관리
            // ═══════════════════════════════════════
            addSubAdmin: (adminId, password, name, courseIds, permissions) => {
                if (!adminId || !password || !name) return { ok: false, reason: 'invalid_input' };
                const existing = get().subAdmins.find(s => s.adminId === adminId);
                if (existing) return { ok: false, reason: 'already_exists' };
                if (adminId === 'admin') return { ok: false, reason: 'reserved_id' };
                set(state => ({
                    subAdmins: [...state.subAdmins, normalizeSubAdmin({ adminId: adminId.trim(), password: password.trim(), name: name.trim(), courseIds: courseIds || [], permissions })]
                }));
                return { ok: true };
            },

            removeSubAdmin: (adminId) => {
                set(state => ({
                    subAdmins: state.subAdmins.filter(s => s.adminId !== adminId)
                }));
            },

            updateSubAdmin: (adminId, updates) => {
                set(state => ({
                    subAdmins: state.subAdmins.map(s =>
                        s.adminId === adminId ? normalizeSubAdmin({ ...s, ...updates }) : s
                    )
                }));
            },
        }),
        {
            name: 'starquest-auth',
            version: 5,
            migrate: (persistedState) => {
                if (!persistedState) return persistedState;
                return {
                    ...persistedState,
                    adminCredentials: {
                        ...DEFAULT_ADMIN_CREDENTIALS,
                        ...(persistedState.adminCredentials || {}),
                    },
                    registeredStudents: (persistedState.registeredStudents || []).map(normalizeStudent),
                    subAdmins: (persistedState.subAdmins || []).map(normalizeSubAdmin),
                    user: persistedState.user?.role === 'student'
                        ? { ...persistedState.user, courseIds: Array.isArray(persistedState.user.courseIds) ? persistedState.user.courseIds : [] }
                        : persistedState.user?.role === 'subadmin'
                            ? {
                                ...persistedState.user,
                                courseIds: Array.isArray(persistedState.user.courseIds) ? persistedState.user.courseIds : [],
                                permissions: {
                                    ...DEFAULT_SUBADMIN_PERMISSIONS,
                                    ...(persistedState.user.permissions || {}),
                                },
                            }
                            : persistedState.user,
                };
            },
        }
    )
);

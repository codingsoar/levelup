import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultStudents } from '../data/sampleCourses';

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

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAdmin: false,
            registeredStudents: defaultStudents.map(normalizeStudent),
            subAdmins: [],

            loginStudent: (studentId, password) => {
                const students = get().registeredStudents;
                const found = students.find(s => s.studentId === studentId && s.password === password);
                if (found) {
                    set({ user: { ...normalizeStudent(found), role: 'student' }, isAdmin: false });
                    return true;
                }
                return false;
            },

            loginAdmin: (adminId, password) => {
                const defaultAdmin = { adminId: 'admin', password: 'admin1234' };
                if (adminId === defaultAdmin.adminId && password === defaultAdmin.password) {
                    set({ user: { adminId, name: '관리자', role: 'admin' }, isAdmin: true });
                    return true;
                }
                // 서브관리자 로그인 확인
                const sub = get().subAdmins.find(s => s.adminId === adminId && s.password === password);
                if (sub) {
                    const normalizedSub = normalizeSubAdmin(sub);
                    set({
                        user: {
                            adminId: normalizedSub.adminId,
                            name: normalizedSub.name,
                            role: 'subadmin',
                            courseIds: normalizedSub.courseIds,
                            permissions: normalizedSub.permissions,
                        },
                        isAdmin: true
                    });
                    return true;
                }
                return false;
            },

            logout: () => set({ user: null, isAdmin: false }),

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
            version: 4,
            migrate: (persistedState) => {
                if (!persistedState) return persistedState;
                return {
                    ...persistedState,
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

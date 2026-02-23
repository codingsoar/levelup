import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProgressStore = create(
    persist(
        (set, get) => ({
            // { [studentId]: { [courseId]: { [stageId]: { easy: bool, normal: bool, hard: bool } } } }
            progress: {},
            // { [studentId]: number }
            totalStars: {},
            // [{ studentId, stageId, missionId, fileName, fileData, status: 'pending'|'approved'|'rejected', feedback, timestamp }]
            submissions: [],

            getStudentProgress: (studentId, courseId) => {
                return get().progress?.[studentId]?.[courseId] || {};
            },

            getStudentStars: (studentId) => {
                return get().totalStars?.[studentId] || 0;
            },

            isMissionCompleted: (studentId, courseId, stageId, difficulty) => {
                return get().progress?.[studentId]?.[courseId]?.[stageId]?.[difficulty] || false;
            },

            isStageComplete: (studentId, courseId, stageId) => {
                const stageProgress = get().progress?.[studentId]?.[courseId]?.[stageId];
                return stageProgress?.easy && stageProgress?.normal && stageProgress?.hard;
            },

            isStageUnlocked: (studentId, courseId, stages, stageOrder) => {
                if (stageOrder === 1) return true;
                const prevStage = stages.find(s => s.order === stageOrder - 1);
                if (!prevStage) return true;
                return get().isStageComplete(studentId, courseId, prevStage.id);
            },

            completeMission: (studentId, courseId, stageId, difficulty) => {
                set(state => {
                    const newProgress = { ...state.progress };
                    if (!newProgress[studentId]) newProgress[studentId] = {};
                    if (!newProgress[studentId][courseId]) newProgress[studentId][courseId] = {};
                    if (!newProgress[studentId][courseId][stageId])
                        newProgress[studentId][courseId][stageId] = { easy: false, normal: false, hard: false };

                    if (!newProgress[studentId][courseId][stageId][difficulty]) {
                        newProgress[studentId][courseId][stageId][difficulty] = true;
                        const newTotalStars = { ...state.totalStars };
                        newTotalStars[studentId] = (newTotalStars[studentId] || 0) + 1;
                        return { progress: newProgress, totalStars: newTotalStars };
                    }
                    return { progress: newProgress };
                });
            },

            addSubmission: (submission) => {
                set(state => ({
                    submissions: [...state.submissions, { ...submission, timestamp: Date.now(), status: 'pending', feedback: '' }],
                }));
            },

            updateSubmission: (index, updates) => {
                set(state => ({
                    submissions: state.submissions.map((s, i) => i === index ? { ...s, ...updates } : s),
                }));
            },

            getSubmissions: (studentId) => {
                return get().submissions.filter(s => s.studentId === studentId);
            },

            getPendingSubmissions: () => {
                return get().submissions.filter(s => s.status === 'pending');
            },

            getAllStudentProgress: () => {
                return get().progress;
            },

            // Spend stars (for marketplace purchases)
            spendStars: (studentId, amount) => {
                const current = get().totalStars[studentId] || 0;
                if (current < amount) return false;
                set(state => ({
                    totalStars: { ...state.totalStars, [studentId]: current - amount },
                }));
                return true;
            },

            // --- Admin Actions ---
            clearAllProgress: () => {
                set({
                    progress: {},
                    totalStars: {},
                    submissions: []
                });
            }
        }),
        { name: 'starquest-progress' }
    )
);

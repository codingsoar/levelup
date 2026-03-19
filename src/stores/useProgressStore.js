import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const normalizeReflection = (reflection) => ({
    ...reflection,
    reflection: reflection?.reflection ?? reflection?.content ?? '',
    missionTitle: reflection?.missionTitle ?? '',
    courseTitle: reflection?.courseTitle ?? '',
    stageTitle: reflection?.stageTitle ?? '',
    timestamp: reflection?.timestamp ?? (reflection?.created_at ? new Date(reflection.created_at).getTime() : Date.now()),
});

const applyMissionCompletion = (state, studentId, courseId, stageId, difficulty, reflectionEntry = null) => {
    const newProgress = { ...state.progress };

    newProgress[studentId] = { ...(newProgress[studentId] || {}) };
    newProgress[studentId][courseId] = { ...(newProgress[studentId][courseId] || {}) };
    newProgress[studentId][courseId][stageId] = {
        ...(newProgress[studentId][courseId][stageId] || { easy: false, normal: false, hard: false }),
    };

    if (!newProgress[studentId][courseId][stageId][difficulty]) {
        newProgress[studentId][courseId][stageId][difficulty] = true;
        const newTotalStars = { ...state.totalStars };
        newTotalStars[studentId] = (newTotalStars[studentId] || 0) + 1;
        const existingReflections = state.reflections || [];
        const nextReflections = reflectionEntry
            ? [normalizeReflection({ ...reflectionEntry, studentId, courseId, stageId, difficulty, timestamp: Date.now() }), ...existingReflections]
            : existingReflections;

        return { progress: newProgress, totalStars: newTotalStars, reflections: nextReflections };
    }

    return { progress: newProgress };
};

const applyMissionProgressOnly = (state, studentId, courseId, stageId, difficulty) => {
    const newProgress = { ...state.progress };

    newProgress[studentId] = { ...(newProgress[studentId] || {}) };
    newProgress[studentId][courseId] = { ...(newProgress[studentId][courseId] || {}) };
    newProgress[studentId][courseId][stageId] = {
        ...(newProgress[studentId][courseId][stageId] || { easy: false, normal: false, hard: false }),
        [difficulty]: true,
    };

    return { progress: newProgress };
};

export const useProgressStore = create(
    persist(
        (set, get) => ({
            progress: {},
            totalStars: {},
            submissions: [],
            reflections: [],

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

            fetchProgress: async (studentId) => {
                if (!studentId) return;
                try {
                    const response = await fetch(`/api/progress/${studentId}`);
                    const data = await response.json();
                    if (data && !data.error) {
                        set(state => ({
                            progress: { ...state.progress, [studentId]: data.progress || {} },
                            totalStars: { ...state.totalStars, [studentId]: data.totalStars || 0 },
                            reflections: (data.reflections || []).map(normalizeReflection),
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching student progress:', error);
                }
            },

            setAllProgressData: (progressGraph, totalStarsMap, allReflections) => {
                set({
                    progress: progressGraph || {},
                    totalStars: totalStarsMap || {},
                    reflections: (allReflections || []).map(normalizeReflection),
                });
            },

            completeMission: async (studentId, courseId, stageId, difficulty, reflectionEntry = null) => {
                try {
                    const payload = { studentId, courseId, stageId, difficulty, reflectionEntry };
                    const response = await fetch('/api/progress/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    const data = await response.json();

                    if (data.success && data.alreadyCompleted) {
                        set(state => applyMissionProgressOnly(state, studentId, courseId, stageId, difficulty));
                    } else if (data.success) {
                        set(state => applyMissionCompletion(state, studentId, courseId, stageId, difficulty, reflectionEntry));
                    }
                } catch (error) {
                    console.error('Error completing mission on server:', error);
                    set(state => applyMissionCompletion(state, studentId, courseId, stageId, difficulty, reflectionEntry));
                }
            },

            addSubmission: (submission) => {
                set(state => ({
                    submissions: [...state.submissions, { ...submission, timestamp: Date.now(), status: 'pending', feedback: '' }],
                }));
            },

            updateSubmission: (index, updates) => {
                set(state => ({
                    submissions: state.submissions.map((submission, currentIndex) =>
                        currentIndex === index ? { ...submission, ...updates } : submission
                    ),
                }));
            },

            getSubmissions: (studentId) => {
                return get().submissions.filter(s => s.studentId === studentId);
            },

            getPendingSubmissions: () => {
                return get().submissions.filter(s => s.status === 'pending');
            },

            getStudentReflections: (studentId) => {
                return (get().reflections || [])
                    .filter(reflection => reflection.studentId === studentId)
                    .sort((a, b) => b.timestamp - a.timestamp);
            },

            getCourseReflections: (courseId) => {
                return (get().reflections || [])
                    .filter(reflection => reflection.courseId === courseId)
                    .sort((a, b) => b.timestamp - a.timestamp);
            },

            getAllReflections: () => {
                return [...(get().reflections || [])].sort((a, b) => b.timestamp - a.timestamp);
            },

            getAllStudentProgress: () => {
                return get().progress;
            },

            spendStars: async (studentId, amount) => {
                const current = get().totalStars[studentId] || 0;
                if (current < amount) return false;

                try {
                    const response = await fetch('/api/progress/spend-stars', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId, amount }),
                    });
                    const data = await response.json();

                    if (!data?.success) {
                        return false;
                    }

                    set(state => ({
                        totalStars: { ...state.totalStars, [studentId]: data.totalStars ?? (current - amount) },
                    }));
                    return true;
                } catch (error) {
                    console.error('Error spending stars on server:', error);
                    return false;
                }
            },

            clearAllProgress: async () => {
                try {
                    const response = await fetch('/api/admin/reset-progress', {
                        method: 'POST',
                    });
                    const data = await response.json();

                    if (!data?.success) {
                        return false;
                    }

                    set({
                        progress: {},
                        totalStars: {},
                        submissions: [],
                        reflections: [],
                    });
                    return true;
                } catch (error) {
                    console.error('Error clearing progress on server:', error);
                    return false;
                }
            },
        }),
        {
            name: 'starquest-progress',
            version: 2,
            migrate: (persistedState) => {
                if (!persistedState) return persistedState;
                return {
                    ...persistedState,
                    reflections: (persistedState.reflections || []).map(normalizeReflection),
                };
            },
        }
    )
);

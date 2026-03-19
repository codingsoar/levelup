import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { sampleCourses } from '../data/sampleCourses';
import { scheduleSharedStateSave } from '../lib/sharedStateClient';

// IndexedDB storage adapter for large data (no 5MB localStorage limit)
const indexedDBStorage = {
    getItem: async (name) => {
        const value = await idbGet(name);
        return value ?? null;
    },
    setItem: async (name, value) => {
        await idbSet(name, value);
    },
    removeItem: async (name) => {
        await idbDel(name);
    },
};

export const useStageStore = create(
    persist(
        (set, get) => ({
            courses: sampleCourses,
            serverSyncReady: false,

            getCourse: (courseId) => get().courses.find(c => c.id === courseId),

            getStage: (courseId, stageId) => {
                const course = get().courses.find(c => c.id === courseId);
                return course?.stages.find(s => s.id === stageId);
            },

            addCourse: (course) => {
                set(state => ({ courses: [...state.courses, course] }));
            },

            updateCourse: (courseId, updates) => {
                set(state => ({
                    courses: state.courses.map(c => c.id === courseId ? { ...c, ...updates } : c),
                }));
            },

            deleteCourse: (courseId) => {
                set(state => ({ courses: state.courses.filter(c => c.id !== courseId) }));
            },

            addStage: (courseId, stage) => {
                set(state => ({
                    courses: state.courses.map(c =>
                        c.id === courseId ? { ...c, stages: [...c.stages, stage] } : c
                    ),
                }));
            },

            updateStage: (courseId, stageId, updates) => {
                set(state => ({
                    courses: state.courses.map(c =>
                        c.id === courseId
                            ? { ...c, stages: c.stages.map(s => s.id === stageId ? { ...s, ...updates } : s) }
                            : c
                    ),
                }));
            },

            deleteStage: (courseId, stageId) => {
                set(state => ({
                    courses: state.courses.map(c =>
                        c.id === courseId
                            ? { ...c, stages: c.stages.filter(s => s.id !== stageId) }
                            : c
                    ),
                }));
            },

            applyServerState: (courses) => {
                if (!Array.isArray(courses)) return;
                set({ courses });
            },

            enableServerSync: () => {
                if (!get().serverSyncReady) {
                    set({ serverSyncReady: true });
                }
            },
        }),
        {
            name: 'starquest-stages',
            storage: createJSONStorage(() => indexedDBStorage),
        }
    )
);

let previousCourses = useStageStore.getState().courses;

useStageStore.subscribe((state) => {
    if (!state.serverSyncReady) return;

    if (state.courses === previousCourses) return;
    previousCourses = state.courses;

    scheduleSharedStateSave('courses', state.courses);
});

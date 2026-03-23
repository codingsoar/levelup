import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { sampleCourses } from '../data/sampleCourses';
import { saveSharedStateNow, scheduleSharedStateSave } from '../lib/sharedStateClient';

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

const syncCoursesToServerNow = (get) => {
    if (!get().serverSyncReady) return;

    const courses = get().courses;
    void saveSharedStateNow('courses', courses).catch((error) => {
        console.error('Failed to sync courses to server immediately:', error);
    });
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
                syncCoursesToServerNow(get);
            },

            updateCourse: (courseId, updates) => {
                set(state => ({
                    courses: state.courses.map(c => c.id === courseId ? { ...c, ...updates } : c),
                }));
                syncCoursesToServerNow(get);
            },

            deleteCourse: (courseId) => {
                set(state => ({ courses: state.courses.filter(c => c.id !== courseId) }));
                syncCoursesToServerNow(get);
            },

            addStage: (courseId, stage) => {
                set(state => ({
                    courses: state.courses.map(c =>
                        c.id === courseId ? { ...c, stages: [...c.stages, stage] } : c
                    ),
                }));
                syncCoursesToServerNow(get);
            },

            updateStage: (courseId, stageId, updates) => {
                set(state => ({
                    courses: state.courses.map(c =>
                        c.id === courseId
                            ? { ...c, stages: c.stages.map(s => s.id === stageId ? { ...s, ...updates } : s) }
                            : c
                    ),
                }));
                syncCoursesToServerNow(get);
            },

            deleteStage: (courseId, stageId) => {
                set(state => ({
                    courses: state.courses.map(c =>
                        c.id === courseId
                            ? { ...c, stages: c.stages.filter(s => s.id !== stageId) }
                            : c
                    ),
                }));
                syncCoursesToServerNow(get);
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

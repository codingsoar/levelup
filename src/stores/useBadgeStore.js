import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { badgesData } from '../data/badgesData';
import { useProgressStore } from './useProgressStore';
import { useStageStore } from './useStageStore';
import { useAssessmentStore } from './useAssessmentStore';
import { useMarketplaceStore } from './useMarketplaceStore';
import { useAuthStore } from './useAuthStore';
import { scheduleSharedStateSave } from '../lib/sharedStateClient';

// Stats calculator based on central stores
const calculateStudentStats = (studentId) => {
    const progressState = useProgressStore.getState();
    const stageState = useStageStore.getState();
    const assessmentState = useAssessmentStore.getState();
    const marketState = useMarketplaceStore.getState();
    const authState = useAuthStore.getState();

    const stats = {
        totalMissions: 0,
        videoMissions: 0,
        tutorialMissions: 0,
        practiceMissions: 0,
        perfectStages: 0,
        perfectCourses: 0,
        totalCourseCount: stageState.courses.length,
        totalCoursesEntered: 0,
        totalStars: progressState.getStudentStars(studentId),
        itemsBought: 0,
        hasProfileInfo: false,
        hasChangedPassword: false,
        visitedMarket: false, // Default tracking properties
        maxStarsInDay: 0,
        consecutiveDays: 1, // Defaulting streak
        perfectAssessments: 0,
        perfectAttitude: 0,
        perfectQuizAssessments: 0,
        rank: 0, // Placeholder
        rankJump: 0,
        weeksAsRank1: 0,
        hasTiedRank: false,
        globalRank: 0,
        consecutiveA: 0,
        scoreImproved: false,
        epicComeback: false,
        perfectChecklists: 0,
        allAreasAssessed: false,
        earlyBird: false,
        nightOwl: 0,
        weekendVibes: 0,
        speedrun: 0,
        maxMissionsInDay: 0,
        activeWeeks: 1,
        monthActiveDays: 1,
        activeDays: 1,
        vacationMissions: 0,
        loginCount: 1,
        perfectCoursesAssessed: 0,
        enrolledCourses: 0,
        unlockedBadgesCount: 0,
        currentStars: progressState.getStudentStars(studentId),
        firstToComplete: false,
        questionsAsked: 0,
        firstDayMissions: 0,
        fixedMistakes: false,
        springMissions: 0,
        summerMissions: 0,
        fallMissions: 0,
        winterMissions: 0,
        newYearLogin: false,
        xmasLogin: false,
        halloweenLogin: false,
        eventFestival: false,
        isPioneer: true, // First month user
    };

    // Calculate from Progress
    const studentProgress = progressState.progress[studentId] || {};
    Object.keys(studentProgress).forEach(courseId => {
        stats.totalCoursesEntered++;
        const course = stageState.courses.find(c => c.id === courseId);
        let courseStagesComplete = 0;
        
        Object.keys(studentProgress[courseId]).forEach(stageId => {
            const stage = studentProgress[courseId][stageId];
            let stageLevelsComplete = 0;
            if (stage.easy) { stats.videoMissions++; stats.totalMissions++; stageLevelsComplete++; }
            if (stage.normal) { stats.tutorialMissions++; stats.totalMissions++; stageLevelsComplete++; }
            if (stage.hard) { stats.practiceMissions++; stats.totalMissions++; stageLevelsComplete++; }
            
            if (stageLevelsComplete === 3) {
                stats.perfectStages++;
                courseStagesComplete++;
            }
        });

        if (course && courseStagesComplete === course.stages.length && course.stages.length > 0) {
            stats.perfectCourses++;
        }
    });

    // Calculate from Auth
    const user = authState.registeredStudents.find(s => s.studentId === studentId);
    if (user) {
        stats.hasProfileInfo = !!(user.name && user.grade);
        stats.hasChangedPassword = user.password !== '1234';
        stats.enrolledCourses = user.courseIds?.length || 0;
    }

    // Market purchases
    const purchases = marketState.purchases?.filter(p => p.studentId === studentId) || [];
    stats.itemsBought = purchases.length;

    // Assessments
    const studentSessionScores = (assessmentState.sessionScores || []).filter(session => session.scores?.[studentId] !== undefined);
    const plansByCourseId = assessmentState.assessmentPlans || {};

    stats.perfectAssessments = studentSessionScores.filter(session => {
        const plan = plansByCourseId[session.courseId];
        const area = plan?.performanceAreas?.find(candidate => candidate.id === session.areaId);
        if (!area?.scoringLevels?.length) return false;

        const maxAreaScore = Math.max(...area.scoringLevels.map(level => level.score));
        return session.scores[studentId] === maxAreaScore;
    }).length;

    stats.perfectChecklists = studentSessionScores.filter(session => {
        const plan = plansByCourseId[session.courseId];
        const area = plan?.performanceAreas?.find(candidate => candidate.id === session.areaId);
        const assessmentElements = area?.assessmentElements || [];
        const checkedCriteria = session.checkedCriteria?.[studentId] || [];

        return assessmentElements.length > 0 && checkedCriteria.length === assessmentElements.length;
    }).length;

    const assessedAreaIds = new Set(studentSessionScores.map(session => `${session.courseId}:${session.areaId}`));
    const totalAreaIds = new Set(
        Object.entries(plansByCourseId).flatMap(([courseId, plan]) =>
            (plan?.performanceAreas || []).map(area => `${courseId}:${area.id}`)
        )
    );
    stats.allAreasAssessed = totalAreaIds.size > 0 && totalAreaIds.size === assessedAreaIds.size;

    return stats;
};

export const useBadgeStore = create(
    persist(
        (set, get) => ({
            // { [studentId]: ['b1', 'b2'] }
            serverSyncReady: false,
            unlockedBadges: {},
            lastSeenBadges: {}, // To track "NEW" indicator

            getUnlockedBadges: (studentId) => {
                const unlockedIds = get().unlockedBadges[studentId] || [];
                return badgesData.filter(b => unlockedIds.includes(b.id));
            },

            getAllBadges: () => badgesData,

            // Call this function whenever a student performs an action
            checkBadges: (studentId) => {
                if (!studentId) return;
                
                const currentUnlocked = get().unlockedBadges[studentId] || [];
                const stats = calculateStudentStats(studentId);
                stats.unlockedBadgesCount = currentUnlocked.length;

                const newlyUnlocked = [];

                badgesData.forEach(badge => {
                    if (!currentUnlocked.includes(badge.id)) {
                        // Safely evaluate condition to not crash on missing stats
                        try {
                            if (badge.condition(stats)) {
                                newlyUnlocked.push(badge.id);
                                // Dispatch custom event for UI notification
                                window.dispatchEvent(new CustomEvent('badgeUnlocked', { 
                                    detail: { badge, studentId } 
                                }));
                            }
                        } catch (e) {
                            console.error('Badge condition error:', badge.id, e);
                        }
                    }
                });

                if (newlyUnlocked.length > 0) {
                    set(state => ({
                        unlockedBadges: {
                            ...state.unlockedBadges,
                            [studentId]: [...(state.unlockedBadges[studentId] || []), ...newlyUnlocked]
                        }
                    }));
                }
            },

            // Clear "new" indicator
            markBadgesSeen: (studentId) => {
                set(state => ({
                    lastSeenBadges: {
                        ...state.lastSeenBadges,
                        [studentId]: state.unlockedBadges[studentId] || []
                    }
                }));
            },

            // For Admin testing
            clearAllBadges: () => {
                set({ unlockedBadges: {}, lastSeenBadges: {} });
            },

            applyServerState: (serverState) => {
                if (!serverState || typeof serverState !== 'object') return;
                set({
                    unlockedBadges: serverState.unlockedBadges || {},
                    lastSeenBadges: serverState.lastSeenBadges || {},
                });
            },

            enableServerSync: () => {
                if (!get().serverSyncReady) {
                    set({ serverSyncReady: true });
                }
            },
        }),
        { 
            name: 'starquest-badges',
            version: 1
        }
    )
);

let previousBadgeSnapshot = {
    unlockedBadges: useBadgeStore.getState().unlockedBadges,
    lastSeenBadges: useBadgeStore.getState().lastSeenBadges,
};

useBadgeStore.subscribe((state) => {
    if (!state.serverSyncReady) return;

    if (
        state.unlockedBadges === previousBadgeSnapshot.unlockedBadges &&
        state.lastSeenBadges === previousBadgeSnapshot.lastSeenBadges
    ) {
        return;
    }

    previousBadgeSnapshot = {
        unlockedBadges: state.unlockedBadges,
        lastSeenBadges: state.lastSeenBadges,
    };

    scheduleSharedStateSave('badges', {
        unlockedBadges: state.unlockedBadges,
        lastSeenBadges: state.lastSeenBadges,
    });
});

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scheduleSharedStateSave } from '../lib/sharedStateClient';

// Generate unique IDs
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 가장 가까운 배점 찾기
function findNearestScore(scoringLevels, avgScore) {
    if (!scoringLevels || scoringLevels.length === 0) return 0;
    let nearest = scoringLevels[0];
    let minDiff = Math.abs(avgScore - nearest.score);
    for (const level of scoringLevels) {
        const diff = Math.abs(avgScore - level.score);
        if (diff < minDiff) {
            minDiff = diff;
            nearest = level;
        }
    }
    return nearest.score;
}

// 기본 평가 방법 옵션
const ASSESSMENT_METHODS = [
    '서술·논술', '보고서', '구술·발표', '토의·토론', '체크리스트',
    '실험·실습', '프로젝트', '포트폴리오', '관찰·면접', '자기평가', '동료평가'
];

// 성취도 기준 (성취율 → 등급)
const ACHIEVEMENT_LEVELS = [
    { grade: 'A', label: 'A', minRate: 90, color: 'emerald' },
    { grade: 'B', label: 'B', minRate: 80, color: 'blue' },
    { grade: 'C', label: 'C', minRate: 70, color: 'amber' },
    { grade: 'D', label: 'D', minRate: 60, color: 'orange' },
    { grade: 'E', label: 'E', minRate: 0, color: 'red' },
];

// 성취율 → 성취도 등급 산출
function getAchievementGrade(rate) {
    for (const lv of ACHIEVEMENT_LEVELS) {
        if (rate >= lv.minRate) return lv;
    }
    return ACHIEVEMENT_LEVELS[ACHIEVEMENT_LEVELS.length - 1];
}

// 평가요소 수 + 만점 + 간격 → 배점표 자동 생성
// 패턴: 모두만족→만점, (N-1)개→만점-간격, ..., 미참여→만점-(N*간격)
function autoGenerateScoring(criteriaCount, maxScore, step = 1) {
    if (criteriaCount <= 0 || maxScore <= 0) return [];
    const levels = [];
    const nonPartScore = Math.max(maxScore - criteriaCount * step, 0);

    // 최상: "위의 평가요소를 모두 만족하는 경우" → 만점
    levels.push({
        id: uid(),
        label: '모두 만족',
        description: '위의 평가요소를 모두 만족하는 경우',
        score: maxScore,
        matchCount: criteriaCount,
    });

    // 중간: N-1개 ~ 1개 만족
    for (let i = criteriaCount - 1; i >= 1; i--) {
        const score = Math.round(maxScore - (criteriaCount - i) * step);
        levels.push({
            id: uid(),
            label: `${i}개 만족`,
            description: `위의 평가 요소 중 ${i}가지를 만족하는 경우`,
            score: Math.max(score, nonPartScore + 1),
            matchCount: i,
        });
    }

    // 최하: "미참여 또는 위탁학생"
    levels.push({
        id: uid(),
        label: '미참여',
        description: '미참여 또는 위탁학생',
        score: nonPartScore,
        matchCount: 0,
    });
    return levels;
}

// 체크리스트 체크 개수에서 해당 배점 찾기
function scoreFromCheckedCount(scoringLevels, checkedCount, criteriaCount = 0) {
    if (!scoringLevels || scoringLevels.length === 0) return 0;

    // 1) matchCount로 정확히 매칭
    const found = scoringLevels.find(lv => lv.matchCount === checkedCount);
    if (found) return found.score;

    // 배점을 내림차순 정렬 (최고점 → 최저점)
    const sorted = [...scoringLevels].sort((a, b) => b.score - a.score);

    // 2) 배점 레벨 수 = 평가요소 수 + 1 이면 직접 인덱싱
    //    예: 8개 요소 → 9개 레벨: sorted[0]=30(8개), sorted[1]=27(7개), ..., sorted[8]=6(0개)
    if (criteriaCount > 0 && sorted.length === criteriaCount + 1) {
        const idx = criteriaCount - checkedCount; // 8-7=1, 8-6=2, 8-0=8
        return sorted[Math.max(0, Math.min(idx, sorted.length - 1))].score;
    }

    // 3) 레벨 수가 다른 경우, 비율 매핑
    if (criteriaCount > 0 && sorted.length > 1) {
        const idx = Math.floor((criteriaCount - checkedCount) / criteriaCount * (sorted.length - 1));
        return sorted[Math.max(0, Math.min(idx, sorted.length - 1))].score;
    }

    // 4) fallback
    if (checkedCount <= 0) return sorted[sorted.length - 1].score;
    return sorted[0].score;
}

export { ASSESSMENT_METHODS, ACHIEVEMENT_LEVELS, findNearestScore, autoGenerateScoring, scoreFromCheckedCount, getAchievementGrade };

export const useAssessmentStore = create(
    persist(
        (set, get) => ({
            // ── 1) 수업별 평가 계획 ──
            serverSyncReady: false,
            assessmentPlans: {},

            // ── 2) 학생별 점수 (지필) ──
            studentScores: {},

            // ── 3) 수업별 채점 데이터 ──
            sessionScores: [],

            // ── 4) 수업별 학생 코멘트 ──
            sessionComments: [],

            // ── 5) 나이스 업로드 이력 ──
            neisUploads: [],

            // ── 6) AI 과세특 결과 저장 ──
            generatedReports: {},

            // ═══════════════════════════════════════
            // 평가 계획 CRUD
            // ═══════════════════════════════════════

            createPlan: (courseId) => {
                set(state => ({
                    assessmentPlans: {
                        ...state.assessmentPlans,
                        [courseId]: {
                            writtenExamWeight: 20,
                            performanceWeight: 80,
                            writtenExamMaxScore: 100,
                            performanceAreas: [],
                        }
                    }
                }));
            },

            getPlan: (courseId) => {
                return get().assessmentPlans[courseId] || null;
            },

            updatePlanWeights: (courseId, writtenWeight) => {
                set(state => {
                    const plan = state.assessmentPlans[courseId];
                    if (!plan) return state;
                    return {
                        assessmentPlans: {
                            ...state.assessmentPlans,
                            [courseId]: {
                                ...plan,
                                writtenExamWeight: writtenWeight,
                                performanceWeight: 100 - writtenWeight,
                            }
                        }
                    };
                });
            },

            updateWrittenMaxScore: (courseId, maxScore) => {
                set(state => {
                    const plan = state.assessmentPlans[courseId];
                    if (!plan) return state;
                    return {
                        assessmentPlans: {
                            ...state.assessmentPlans,
                            [courseId]: { ...plan, writtenExamMaxScore: maxScore }
                        }
                    };
                });
            },

            // ── 수행평가 영역 CRUD ──

            addPerformanceArea: (courseId, area) => {
                set(state => {
                    const plan = state.assessmentPlans[courseId];
                    if (!plan) return state;
                    const newArea = {
                        id: uid(),
                        name: area.name || '새 영역',
                        achievementStandard: area.achievementStandard || '',
                        assessmentElements: area.assessmentElements || [],
                        assessmentMethods: area.assessmentMethods || [],
                        weight: area.weight || 10,
                        scoringMode: area.scoringMode || 'direct', // 'direct' | 'checklist'
                        scoringLevels: area.scoringLevels || [
                            { id: uid(), label: 'A', description: '매우 우수', score: 30 },
                            { id: uid(), label: 'B', description: '우수', score: 25 },
                            { id: uid(), label: 'C', description: '보통', score: 20 },
                            { id: uid(), label: 'D', description: '미흡', score: 15 },
                            { id: uid(), label: 'E', description: '매우 미흡', score: 10 },
                        ],
                    };
                    return {
                        assessmentPlans: {
                            ...state.assessmentPlans,
                            [courseId]: {
                                ...plan,
                                performanceAreas: [...plan.performanceAreas, newArea],
                            }
                        }
                    };
                });
            },

            updatePerformanceArea: (courseId, areaId, updates) => {
                set(state => {
                    const plan = state.assessmentPlans[courseId];
                    if (!plan) return state;
                    return {
                        assessmentPlans: {
                            ...state.assessmentPlans,
                            [courseId]: {
                                ...plan,
                                performanceAreas: plan.performanceAreas.map(a =>
                                    a.id === areaId ? { ...a, ...updates } : a
                                ),
                            }
                        }
                    };
                });
            },

            removePerformanceArea: (courseId, areaId) => {
                set(state => {
                    const plan = state.assessmentPlans[courseId];
                    if (!plan) return state;
                    return {
                        assessmentPlans: {
                            ...state.assessmentPlans,
                            [courseId]: {
                                ...plan,
                                performanceAreas: plan.performanceAreas.filter(a => a.id !== areaId),
                            }
                        },
                        // 영역 삭제 시 관련 수업 채점도 삭제
                        sessionScores: state.sessionScores.filter(s => !(s.courseId === courseId && s.areaId === areaId)),
                    };
                });
            },

            // ═══════════════════════════════════════
            // 수업별 채점 (Session Scores)
            // ═══════════════════════════════════════

            addSessionScore: (courseId, areaId, sessionDate, sessionLabel) => {
                const newSession = {
                    id: uid(),
                    courseId,
                    areaId,
                    sessionDate,
                    sessionLabel,
                    scores: {},
                };
                set(state => ({
                    sessionScores: [...state.sessionScores, newSession],
                }));
                return newSession.id;
            },

            // 모든 영역에 동시에 차시 추가
            addSessionScoreForAllAreas: (courseId, sessionDate, sessionLabel) => {
                const plan = get().assessmentPlans[courseId];
                if (!plan) return;
                const newSessions = plan.performanceAreas.map(area => ({
                    id: uid(),
                    courseId,
                    areaId: area.id,
                    sessionDate,
                    sessionLabel,
                    scores: {},
                }));
                set(state => ({
                    sessionScores: [...state.sessionScores, ...newSessions],
                }));
            },

            // 날짜+차시명 기준으로 모든 영역의 해당 차시 삭제
            deleteSessionScoreByLabel: (courseId, sessionDate, sessionLabel) => {
                set(state => ({
                    sessionScores: state.sessionScores.filter(s =>
                        !(s.courseId === courseId && s.sessionDate === sessionDate && s.sessionLabel === sessionLabel)
                    ),
                }));
            },

            // score를 직접 입력하거나, checkedCriteria 배열로 체크리스트 기반 산출
            updateSessionStudentScore: (sessionId, studentId, score, checkedCriteria = null) => {
                set(state => ({
                    sessionScores: state.sessionScores.map(s =>
                        s.id === sessionId
                            ? {
                                ...s,
                                scores: {
                                    ...s.scores,
                                    [studentId]: typeof score === 'number' ? score : (s.scores[studentId] || 0),
                                },
                                checkedCriteria: {
                                    ...(s.checkedCriteria || {}),
                                    ...(checkedCriteria !== null ? { [studentId]: checkedCriteria } : {}),
                                },
                            }
                            : s
                    ),
                }));
            },

            deleteSessionScore: (sessionId) => {
                set(state => ({
                    sessionScores: state.sessionScores.filter(s => s.id !== sessionId),
                }));
            },

            getSessionScoresForArea: (courseId, areaId) => {
                return get().sessionScores
                    .filter(s => s.courseId === courseId && s.areaId === areaId);
            },

            // ── 학생의 영역별 최종 점수 산출 ──
            // 수업별 점수 평균 → 가장 가까운 배점
            getAreaFinalScore: (courseId, studentId, areaId) => {
                const plan = get().assessmentPlans[courseId];
                if (!plan) return { avg: 0, finalScore: 0, sessionCount: 0 };

                const area = plan.performanceAreas.find(a => a.id === areaId);
                if (!area) return { avg: 0, finalScore: 0, sessionCount: 0 };

                const sessions = get().sessionScores.filter(
                    s => s.courseId === courseId && s.areaId === areaId
                );

                const studentSessions = sessions.filter(s => s.scores[studentId] !== undefined);
                if (studentSessions.length === 0) return { avg: 0, finalScore: 0, sessionCount: 0, checkedHistory: [] };

                const sum = studentSessions.reduce((acc, s) => acc + s.scores[studentId], 0);
                const avg = sum / studentSessions.length;
                const finalScore = findNearestScore(area.scoringLevels, avg);

                // 체크리스트 이력 수집
                const checkedHistory = studentSessions.map(s => ({
                    sessionId: s.id,
                    sessionLabel: s.sessionLabel,
                    checked: s.checkedCriteria?.[studentId] || [],
                }));

                return {
                    avg: Math.round(avg * 10) / 10,
                    finalScore,
                    sessionCount: studentSessions.length,
                    checkedHistory,
                };
            },

            // ═══════════════════════════════════════
            // 지필평가 점수 관리
            // ═══════════════════════════════════════

            setWrittenExamScore: (courseId, studentId, score) => {
                set(state => {
                    const scores = { ...state.studentScores };
                    if (!scores[courseId]) scores[courseId] = {};
                    if (!scores[courseId][studentId]) {
                        scores[courseId][studentId] = { writtenExamScore: null, grade: null };
                    }
                    scores[courseId][studentId] = {
                        ...scores[courseId][studentId],
                        writtenExamScore: score,
                    };
                    return { studentScores: scores };
                });
            },

            setGrade: (courseId, studentId, grade) => {
                set(state => {
                    const scores = { ...state.studentScores };
                    if (!scores[courseId]?.[studentId]) return state;
                    scores[courseId][studentId] = {
                        ...scores[courseId][studentId],
                        grade,
                    };
                    return { studentScores: scores };
                });
            },

            // ── 종합 점수 계산 ──
            calculateTotal: (courseId, studentId) => {
                const plan = get().assessmentPlans[courseId];
                const studentData = get().studentScores?.[courseId]?.[studentId];
                if (!plan) return null;

                // 지필 환산
                const writtenRaw = studentData?.writtenExamScore || 0;
                const writtenConverted = (writtenRaw / plan.writtenExamMaxScore) * plan.writtenExamWeight;

                // 수행 합계
                let performanceTotal = 0;
                plan.performanceAreas.forEach(area => {
                    const result = get().getAreaFinalScore(courseId, studentId, area.id);
                    performanceTotal += result.finalScore;
                });

                return {
                    writtenRaw,
                    writtenConverted: Math.round(writtenConverted * 10) / 10,
                    performanceTotal,
                    total: Math.round((writtenConverted + performanceTotal) * 10) / 10,
                };
            },

            // ═══════════════════════════════════════
            // 나이스 CSV 업로드
            // ═══════════════════════════════════════

            uploadNeisScores: (courseId, fileName, parsedData) => {
                set(state => {
                    const scores = { ...state.studentScores };
                    if (!scores[courseId]) scores[courseId] = {};

                    parsedData.forEach(({ studentId, score }) => {
                        if (!scores[courseId][studentId]) {
                            scores[courseId][studentId] = { writtenExamScore: null, grade: null };
                        }
                        scores[courseId][studentId] = {
                            ...scores[courseId][studentId],
                            writtenExamScore: Number(score),
                        };
                    });

                    return {
                        studentScores: scores,
                        neisUploads: [...state.neisUploads, {
                            courseId,
                            uploadDate: Date.now(),
                            fileName,
                            recordCount: parsedData.length,
                        }],
                    };
                });
            },

            // ═══════════════════════════════════════
            // 수업별 학생 코멘트
            // ═══════════════════════════════════════

            addSessionComment: (courseId, studentId, date, comment, tags = []) => {
                set(state => ({
                    sessionComments: [...state.sessionComments, {
                        id: uid(),
                        courseId,
                        studentId,
                        date,
                        comment,
                        tags,
                        timestamp: Date.now(),
                    }],
                }));
            },

            updateSessionComment: (commentId, updates) => {
                set(state => ({
                    sessionComments: state.sessionComments.map(c =>
                        c.id === commentId ? { ...c, ...updates } : c
                    ),
                }));
            },

            deleteSessionComment: (commentId) => {
                set(state => ({
                    sessionComments: state.sessionComments.filter(c => c.id !== commentId),
                }));
            },

            getStudentComments: (courseId, studentId) => {
                return get().sessionComments
                    .filter(c => c.courseId === courseId && c.studentId === studentId)
                    .sort((a, b) => b.timestamp - a.timestamp);
            },

            getSessionComments: (courseId, date) => {
                return get().sessionComments
                    .filter(c => c.courseId === courseId && c.date === date);
            },

            // ═══════════════════════════════════════
            // AI 과세특 생성 결과 저장
            // ═══════════════════════════════════════

            saveGeneratedReport: (courseId, studentId, report) => {
                set(state => {
                    const reports = { ...state.generatedReports };
                    if (!reports[courseId]) reports[courseId] = {};
                    reports[courseId][studentId] = {
                        text: report,
                        generatedAt: Date.now(),
                    };
                    return { generatedReports: reports };
                });
            },

            getGeneratedReport: (courseId, studentId) => {
                return get().generatedReports?.[courseId]?.[studentId] || null;
            },

            applyServerState: (serverState) => {
                if (!serverState || typeof serverState !== 'object') return;
                set({
                    assessmentPlans: serverState.assessmentPlans || {},
                    studentScores: serverState.studentScores || {},
                    sessionScores: serverState.sessionScores || [],
                    sessionComments: serverState.sessionComments || [],
                    neisUploads: serverState.neisUploads || [],
                    generatedReports: serverState.generatedReports || {},
                });
            },

            enableServerSync: () => {
                if (!get().serverSyncReady) {
                    set({ serverSyncReady: true });
                }
            },
        }),
        { name: 'starquest-assessments' }
    )
);

let previousAssessmentSnapshot = {
    assessmentPlans: useAssessmentStore.getState().assessmentPlans,
    studentScores: useAssessmentStore.getState().studentScores,
    sessionScores: useAssessmentStore.getState().sessionScores,
    sessionComments: useAssessmentStore.getState().sessionComments,
    neisUploads: useAssessmentStore.getState().neisUploads,
    generatedReports: useAssessmentStore.getState().generatedReports,
};

useAssessmentStore.subscribe((state) => {
    if (!state.serverSyncReady) return;

    const hasRelevantChange =
        state.assessmentPlans !== previousAssessmentSnapshot.assessmentPlans ||
        state.studentScores !== previousAssessmentSnapshot.studentScores ||
        state.sessionScores !== previousAssessmentSnapshot.sessionScores ||
        state.sessionComments !== previousAssessmentSnapshot.sessionComments ||
        state.neisUploads !== previousAssessmentSnapshot.neisUploads ||
        state.generatedReports !== previousAssessmentSnapshot.generatedReports;

    if (!hasRelevantChange) return;

    previousAssessmentSnapshot = {
        assessmentPlans: state.assessmentPlans,
        studentScores: state.studentScores,
        sessionScores: state.sessionScores,
        sessionComments: state.sessionComments,
        neisUploads: state.neisUploads,
        generatedReports: state.generatedReports,
    };

    scheduleSharedStateSave('assessments', {
        assessmentPlans: state.assessmentPlans,
        studentScores: state.studentScores,
        sessionScores: state.sessionScores,
        sessionComments: state.sessionComments,
        neisUploads: state.neisUploads,
        generatedReports: state.generatedReports,
    });
});

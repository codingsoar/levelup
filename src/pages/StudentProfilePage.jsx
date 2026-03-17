import { useMemo } from 'react';
import { Star, BookOpen } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useStageStore } from '../stores/useStageStore';
import { useBadgeStore } from '../stores/useBadgeStore';
import StudentLayout from '../components/StudentLayout';
import StudentHeaderActions from '../components/StudentHeaderActions';

export default function StudentProfilePage() {
    const { user, registeredStudents } = useAuthStore();
    const { courses } = useStageStore();
    const { progress, totalStars } = useProgressStore();
    const getUnlockedBadges = useBadgeStore(state => state.getUnlockedBadges);
    const getAllBadges = useBadgeStore(state => state.getAllBadges);

    const studentStars = totalStars[user?.studentId] || 0;
    const unlockedBadges = getUnlockedBadges(user?.studentId);
    const allBadges = getAllBadges();
    const visibleCourses = useMemo(
        () => {
            const assignedCourseIds = user?.courseIds || [];
            return courses.filter(course => assignedCourseIds.includes(course.id));
        },
        [courses, user?.courseIds]
    );

    // Rank from leaderboard
    const myRank = useMemo(() => {
        const sorted = registeredStudents
            .map(s => ({ studentId: s.studentId, stars: totalStars[s.studentId] || 0 }))
            .sort((a, b) => b.stars - a.stars);
        const idx = sorted.findIndex(s => s.studentId === user?.studentId);
        return idx >= 0 ? idx + 1 : '-';
    }, [registeredStudents, totalStars, user?.studentId]);

    return (
        <StudentLayout>
            <div className="min-h-full bg-background-light font-display">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-accent-purple/20">
                    <div className="max-w-3xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            프로필
                        </h1>
                        <StudentHeaderActions />
                    </div>
                </header>

                <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl p-6 shadow-card border border-accent-purple/20">
                        <div className="flex items-center gap-5">
                            <div className="relative size-20 rounded-full bg-cover bg-center ring-4 ring-primary/30 shadow-lg"
                                style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=128')` }}>
                                <div className="absolute bottom-0 right-0 size-5 bg-secondary border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                                <p className="text-sm text-slate-500">학번: {user?.studentId}</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                                    <Star size={14} className="text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-bold text-amber-700">{studentStars}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                                    <span className="material-symbols-outlined text-primary text-sm">leaderboard</span>
                                    <span className="text-sm font-bold text-primary">#{myRank}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-accent-pink/20 hover:border-accent-pink/50 transition-colors shadow-card">
                            <span className="text-xs uppercase tracking-wide text-slate-500">총 별</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="material-symbols-outlined text-amber-500">star</span>
                                <span className="text-xl font-bold text-slate-800">{studentStars}</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-accent-yellow/20 hover:border-accent-yellow/50 transition-colors shadow-card">
                            <span className="text-xs uppercase tracking-wide text-slate-500">내 순위</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="material-symbols-outlined text-secondary">leaderboard</span>
                                <span className="text-xl font-bold text-slate-800">#{myRank}</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-primary/20 hover:border-primary/50 transition-colors shadow-card">
                            <span className="text-xs uppercase tracking-wide text-slate-500">전체 스테이지</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="material-symbols-outlined text-secondary">layers</span>
                                <span className="text-xl font-bold text-slate-800">{visibleCourses.reduce((sum, c) => sum + c.stages.length, 0)}</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-secondary/20 hover:border-secondary/50 transition-colors shadow-card">
                            <span className="text-xs uppercase tracking-wide text-slate-500">완료율</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                <span className="text-xl font-bold text-slate-800">
                                    {visibleCourses.length > 0
                                        ? Math.round(visibleCourses.reduce((sum, course) => {
                                            const done = course.stages.filter(s => {
                                                const sp = progress?.[user?.studentId]?.[course.id]?.[s.id];
                                                return sp?.easy && sp?.normal && sp?.hard;
                                            }).length;
                                            return sum + (course.stages.length > 0 ? done / course.stages.length : 0);
                                        }, 0) / visibleCourses.length * 100)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* My Badges Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
                                나의 뱃지
                            </div>
                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                {unlockedBadges.length} / {allBadges.length}
                            </span>
                        </h3>
                        
                        <div className="bg-white rounded-xl p-6 border border-accent-yellow/20 shadow-card">
                            {unlockedBadges.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">hotel_class</span>
                                    <p>아직 획득한 뱃지가 없습니다.<br/>미션을 달성하고 첫 뱃지를 모아보세요!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {unlockedBadges.map(badge => (
                                        <div key={badge.id} className="group relative flex flex-col items-center justify-center p-3 rounded-xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 hover:to-primary/10 transition-all cursor-help shadow-sm hover:shadow-md">
                                            <div className="text-4xl mb-2 drop-shadow-md group-hover:scale-110 transition-transform">{badge.emoji}</div>
                                            <div className="text-xs font-bold text-center text-slate-800 line-clamp-1">{badge.name}</div>
                                            <div className="text-[10px] text-center text-slate-500 mt-0.5 line-clamp-1">{badge.category}</div>
                                            
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded py-1.5 px-3 whitespace-nowrap z-10 pointer-events-none shadow-xl transform scale-95 group-hover:scale-100 origin-bottom">
                                                <div className="font-bold text-amber-300 mb-0.5">{badge.name}</div>
                                                <div>{badge.desc}</div>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Locked Badges Placeholder (Show a few to tease) */}
                                    {Array.from({ length: Math.min(5, allBadges.length - unlockedBadges.length) }).map((_, i) => (
                                        <div key={`locked-${i}`} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 opacity-50 grayscale">
                                            <div className="text-3xl mb-2">🔒</div>
                                            <div className="text-xs font-medium text-center text-slate-400">미획득</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Progress */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">leaderboard</span>
                            과목별 진행도
                        </h3>

                        {visibleCourses.length === 0 && (
                            <div className="bg-white rounded-xl border border-accent-purple/20 p-8 text-center text-slate-500 shadow-card">
                                등록된 과목이 없습니다.
                            </div>
                        )}

                        {visibleCourses.map((course) => {
                            const stagesComplete = course.stages.filter((stage) => {
                                const sp = progress?.[user?.studentId]?.[course.id]?.[stage.id];
                                return sp?.easy && sp?.normal && sp?.hard;
                            }).length;
                            const pct = course.stages.length > 0 ? Math.round((stagesComplete / course.stages.length) * 100) : 0;

                            return (
                                <div key={course.id} className="bg-white rounded-xl p-5 border border-accent-purple/20 shadow-card hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{course.icon}</span>
                                            <span className="font-bold text-slate-800">{course.title}</span>
                                        </div>
                                        <span className="text-sm font-bold text-primary">{pct}%</span>
                                    </div>

                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                                        <div className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_#00bbf9]" style={{ width: `${pct}%` }} />
                                    </div>

                                    <div className="grid grid-cols-5 md:grid-cols-8 gap-3">
                                        {course.stages.map((stage, idx) => {
                                            const sp = progress?.[user?.studentId]?.[course.id]?.[stage.id];
                                            const difficulties = ['easy', 'normal', 'hard'];
                                            const allDone = sp?.easy && sp?.normal && sp?.hard;
                                            return (
                                                <div key={stage.id} className={`text-center p-2 rounded-lg border transition-colors ${allDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                                                    <p className="text-[10px] font-bold text-slate-500 mb-1">S{idx + 1}</p>
                                                    <div className="flex justify-center gap-0.5">
                                                        {difficulties.map((d) => (
                                                            <Star key={d} size={10} className={sp?.[d] ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}

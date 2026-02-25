import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useStageStore } from '../stores/useStageStore';
import { useNotificationStore } from '../stores/useNotificationStore';

export default function StudentLayout({ children, activeTab: propActiveTab }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { courses } = useStageStore();
    const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useNotificationStore();
    const [showNotifs, setShowNotifs] = useState(false);

    const assignedCourseIds = user?.courseIds || [];
    const myClasses = courses.filter(c => assignedCourseIds.includes(c.id));

    const myNotifications = useMemo(() => {
        if (!user?.studentId) return [];
        return notifications.filter(n => {
            if (n.to === 'all') return true;
            if (n.to === user.studentId) return true;
            if (n.to.startsWith('class:')) {
                const courseId = n.to.replace('class:', '');
                return assignedCourseIds.includes(courseId);
            }
            return false;
        });
    }, [notifications, user?.studentId, assignedCourseIds]);

    const unreadCount = myNotifications.filter(n => !n.readBy.includes(user?.studentId)).length;

    // Determine active tab from prop or pathname
    const activeTab = propActiveTab || (() => {
        const path = location.pathname;
        if (path === '/marketplace') return 'marketplace';
        if (path === '/settings' || path === '/profile') return 'settings';
        if (path === '/student-profile') return 'profile';
        return 'dashboard';
    })();

    return (
        <div className="flex h-screen overflow-hidden bg-background-light text-dark-text font-display transition-colors duration-300">
            {/* Sidebar Navigation */}
            <aside className="hidden md:flex flex-col w-24 lg:w-64 h-full bg-white border-r border-accent-purple/20 flex-shrink-0 z-20 transition-all duration-300">
                <div className="flex items-center justify-center lg:justify-start lg:px-8 h-20">
                    <div className="size-8 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-slate-800">LevelUp</span>
                </div>

                <nav className="flex-1 flex flex-col gap-2 p-4">
                    <button
                        onClick={() => navigate('/dashboard?tab=dashboard')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all group w-full text-left ${activeTab === 'dashboard'
                            ? 'bg-primary/10 text-primary'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
                        <span className="hidden lg:block">Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/dashboard?tab=myClass')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group w-full text-left ${activeTab === 'myClass'
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">menu_book</span>
                        <span className="hidden lg:block">My Class</span>
                        <span className="hidden lg:flex ml-auto bg-accent-pink text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(241,91,181,0.5)]">{myClasses.length}</span>
                    </button>
                    <button
                        onClick={() => navigate('/marketplace')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group w-full text-left ${activeTab === 'marketplace'
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">storefront</span>
                        <span className="hidden lg:block">Marketplace</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-accent-purple/20">
                    <button
                        onClick={() => navigate('/settings')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group w-full text-left ${activeTab === 'settings'
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">settings</span>
                        <span className="hidden lg:block">Settings</span>
                    </button>
                    <div className="mt-4 flex items-center gap-3 px-2 lg:px-4">
                        <div className="relative size-10 rounded-full bg-cover bg-center ring-2 ring-primary/50 cursor-pointer" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=" + (user?.name || 'User') + "&background=random')" }} onClick={() => navigate('/student-profile')} title="View Profile">
                            <div className="absolute bottom-0 right-0 size-3 bg-secondary border-2 border-white rounded-full"></div>
                        </div>
                        <div className="hidden lg:flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Student'}</span>
                        </div>
                        {/* Notification Bell */}
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                            title="알림"
                        >
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent-pink text-[9px] text-white font-bold flex items-center justify-center shadow">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto relative">
                {children}
            </main>

            {/* Notification Popup */}
            {showNotifs && (
                <div className="fixed inset-0 z-50" onClick={() => setShowNotifs(false)}>
                    <div className="absolute bottom-4 left-4 md:left-24 lg:left-64 w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">notifications</span>
                                알림 {unreadCount > 0 && <span className="text-xs bg-accent-pink text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                            </h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={() => markAllAsRead(user?.studentId)} className="text-xs text-primary hover:underline">모두 읽음</button>
                                )}
                                <button onClick={() => setShowNotifs(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {myNotifications.length === 0 && (
                                <div className="text-center text-slate-400 py-8 text-sm">알림이 없습니다.</div>
                            )}
                            {myNotifications.map(n => {
                                const isUnread = !n.readBy.includes(user?.studentId);
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => { if (isUnread) markAsRead(n.id, user?.studentId); }}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${isUnread
                                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {isUnread && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">
                                                        {n.to === 'all' ? '전체' : n.to.startsWith('class:') ? `📚 ${n.courseName || '수업'}` : '📬 개인'}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString('ko-KR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

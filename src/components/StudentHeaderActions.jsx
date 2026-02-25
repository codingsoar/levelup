import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useProgressStore } from '../stores/useProgressStore';
import { Star } from 'lucide-react';

export default function StudentHeaderActions() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { totalStars } = useProgressStore();
    const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
    const [showNotifs, setShowNotifs] = useState(false);

    const myStars = totalStars[user?.studentId] || 0;
    const assignedCourseIds = user?.courseIds || [];

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

    return (
        <div className="flex items-center gap-3 md:gap-4 ml-auto">
            {/* Profile */}
            <div
                className="relative size-10 rounded-full bg-cover bg-center ring-2 ring-primary/50 cursor-pointer shadow-sm hover:ring-primary transition-all"
                style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=" + (user?.name || 'User') + "&background=random')" }}
                onClick={() => navigate('/student-profile')}
                title="View Profile"
            >
                <div className="absolute bottom-0 right-0 size-3 bg-secondary border-2 border-white rounded-full"></div>
            </div>

            {/* Notification Bell */}
            <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors group"
                title="알림"
            >
                <span className="material-symbols-outlined text-slate-600 group-hover:text-primary">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent-pink text-[9px] text-white font-bold flex items-center justify-center shadow animate-bounce-short">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {/* Stars */}
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 shadow-sm">
                <Star size={18} className="text-amber-500 fill-amber-500" />
                <span className="text-base font-bold text-amber-700">{myStars}</span>
            </div>

            {/* Notification Popup */}
            {showNotifs && (
                <div className="fixed inset-0 z-50" onClick={() => setShowNotifs(false)}>
                    <div className="absolute top-20 right-6 w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
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

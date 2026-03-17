import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useStageStore } from '../stores/useStageStore';
import { useProgressStore } from '../stores/useProgressStore';
import useThemeStore from '../stores/useThemeStore';

export default function StudentLayout({ children, activeTab: propActiveTab }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { courses } = useStageStore();
    const isDark = useThemeStore(state => state.isDark);

    const assignedCourseIds = user?.courseIds || [];
    const myClasses = courses.filter(c => assignedCourseIds.includes(c.id));

    const { getStudentReflections } = useProgressStore();
    const reflectionEntries = user?.studentId ? getStudentReflections(user.studentId) : [];

    // Determine active tab from prop or pathname
    const activeTab = propActiveTab || (() => {
        const path = location.pathname;
        if (path === '/marketplace') return 'marketplace';
        if (path === '/settings' || path === '/profile') return 'settings';
        if (path === '/student-profile') return 'profile';
        return 'dashboard';
    })();

    return (
        <div className={`student-theme-shell ${isDark ? 'student-theme-dark' : 'student-theme-light'} flex h-screen overflow-hidden bg-background-light text-dark-text font-display transition-colors duration-300`}>
            {/* Sidebar Navigation */}
            <aside className="hidden md:flex flex-col w-24 lg:w-64 h-full bg-white border-r border-accent-purple/20 flex-shrink-0 z-20 transition-all duration-300">
                <div className="flex items-center justify-center lg:justify-start lg:px-8 h-20">
                    <div className="text-2xl mt-1">
                        ✨
                    </div>
                    <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-slate-800">StarQuest</span>
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
                        onClick={() => navigate('/dashboard?tab=reflection')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group w-full text-left ${activeTab === 'reflection'
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">edit_note</span>
                        <span className="hidden lg:block">Reflection</span>
                        <span className="hidden lg:flex ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {reflectionEntries.length}
                        </span>
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
                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            logout();
                            navigate('/');
                        }}
                        className={`mt-2 flex items-center gap-4 px-4 py-3 rounded-xl transition-all group w-full text-left text-slate-500 hover:bg-red-50 hover:text-red-600`}
                    >
                        <span className="material-symbols-outlined group-hover:rotate-180 transition-transform">logout</span>
                        <span className="hidden lg:block">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto relative">
                {children}
            </main>
        </div>
    );
}

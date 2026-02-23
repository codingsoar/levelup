import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useStageStore } from '../stores/useStageStore';

export default function StudentLayout({ children, activeTab: propActiveTab }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { courses } = useStageStore();

    const assignedCourseIds = user?.courseIds || [];
    const myClasses = courses.filter(c => assignedCourseIds.includes(c.id));

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
                    <div className="mt-4 flex items-center gap-3 px-2 lg:px-4 cursor-pointer" onClick={() => navigate('/student-profile')} title="View Profile">
                        <div className="relative size-10 rounded-full bg-cover bg-center ring-2 ring-primary/50" style={{ backgroundImage: "url('https://ui-avatars.com/api/?name=" + (user?.name || 'User') + "&background=random')" }}>
                            <div className="absolute bottom-0 right-0 size-3 bg-secondary border-2 border-white rounded-full"></div>
                        </div>
                        <div className="hidden lg:flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{user?.name || 'Student'}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

import { useState } from 'react';

const DashboardCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Mock Data for Classes
    const classData = {
        '2026-02-05': { title: 'React Basics', completion: 85, type: 'lecture' },
        '2026-02-10': { title: 'State Management', completion: 72, type: 'workshop' },
        '2026-02-15': { title: 'API Integration', completion: 90, type: 'lecture' },
        '2026-02-20': { title: 'Project Review', completion: 60, type: 'review' },
        '2026-02-25': { title: 'Deployment', completion: 95, type: 'lecture' },
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    const handleDateClick = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const data = classData[dateStr];
        setSelectedDate({ date: dateStr, data });
    };

    const renderCalendar = () => {
        const daysArray = [];
        // Empty slots for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            daysArray.push(<div key={`empty-${i}`} className="h-24 bg-transparent"></div>);
        }

        // Days of the month
        for (let day = 1; day <= days; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = classData[dateStr];
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            const isSelected = selectedDate?.date === dateStr;

            daysArray.push(
                <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-24 border border-white/5 p-2 relative cursor-pointer transition-all hover:bg-white/5 
                        ${isSelected ? 'bg-white/10 ring-2 ring-admin-primary' : ''}
                        ${isToday ? 'bg-admin-primary/10' : ''}
                    `}
                >
                    <span className={`text-sm font-medium ${isToday ? 'text-admin-primary' : 'text-gray-400'}`}>{day}</span>
                    {data && (
                        <div className="mt-2">
                            <div className={`text-xs px-2 py-1 rounded-full truncate ${data.type === 'lecture' ? 'bg-admin-secondary/20 text-admin-secondary' :
                                    data.type === 'workshop' ? 'bg-admin-pink/20 text-admin-pink' :
                                        'bg-admin-yellow/20 text-admin-yellow'
                                }`}>
                                {data.title}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                                <div className="flex-1 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-admin-green rounded-full" style={{ width: `${data.completion}%` }}></div>
                                </div>
                                <span className="text-[10px] text-gray-500">{data.completion}%</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return daysArray;
    };

    return (
        <div className="bg-admin-card-dark rounded-2xl border border-white/5 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">Learner Engagement Calendar</h3>
                    <p className="text-sm text-gray-400">Class schedule & completion rates</p>
                </div>
                <div className="flex items-center gap-4 bg-background-dark rounded-lg p-1 border border-white/5">
                    <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold text-white min-w-[100px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 mb-2 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid Body */}
            <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-lg overflow-hidden flex-1">
                {renderCalendar()}
            </div>

            {/* Selected Date Details */}
            {selectedDate && selectedDate.data && (
                <div className="mt-6 p-4 bg-background-dark/50 rounded-xl border border-white/5 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-white font-bold text-lg">{selectedDate.data.title}</h4>
                            <p className="text-admin-secondary text-sm">{selectedDate.date}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-admin-green">{selectedDate.data.completion}%</span>
                            <p className="text-xs text-gray-500 uppercase">Completion Rate</p>
                        </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-700/30 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-admin-secondary to-admin-green h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${selectedDate.data.completion}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardCalendar;

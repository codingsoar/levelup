import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useStageStore } from '../stores/useStageStore';
import useThemeStore from '../stores/useThemeStore';
import { Button, Card, CardBody, Progress, Modal, ModalContent, ModalBody } from '@heroui/react';
import { ChevronLeft, Star, Upload, ChevronRight, Check, Play, BookOpen } from 'lucide-react';
import StudentHeaderActions from '../components/StudentHeaderActions';

export default function StudentDashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, registeredStudents } = useAuthStore();
    const { getStudentProgress, totalStars, getStudentReflections } = useProgressStore();
    const { courses } = useStageStore();
    const isDark = useThemeStore(state => state.isDark);
    const assignedCourseIds = useMemo(
        () => user?.courseIds || [],
        [user?.courseIds]
    );
    const myCourses = useMemo(
        () => courses.filter(course => assignedCourseIds.includes(course.id)),
        [assignedCourseIds, courses]
    );
    const activeTab = useMemo(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        return ['dashboard', 'myClass', 'reflection'].includes(tab) ? tab : 'dashboard';
    }, [location.search]);

    const myStars = totalStars[user?.studentId] || 0;

    // Star leaderboard from all registered students
    const starLeaderboard = useMemo(() => {
        return registeredStudents
            .map(s => ({ studentId: s.studentId, name: s.name, stars: totalStars[s.studentId] || 0 }))
            .sort((a, b) => b.stars - a.stars);
    }, [registeredStudents, totalStars]);

    const myRank = useMemo(() => {
        const idx = starLeaderboard.findIndex(s => s.studentId === user?.studentId);
        return idx >= 0 ? idx + 1 : '-';
    }, [starLeaderboard, user?.studentId]);

    const getCourseCompletion = (courseId) => {
        if (!user?.studentId) return 0;
        const selectedCourse = myCourses.find((course) => course.id === courseId);
        if (!selectedCourse || selectedCourse.stages.length === 0) return 0;

        const studentProgress = getStudentProgress(user.studentId, courseId);
        const completedStages = selectedCourse.stages.filter((stage) => {
            const stageProgress = studentProgress?.[stage.id];
            return stageProgress?.easy && stageProgress?.normal && stageProgress?.hard;
        }).length;

        return Math.round((completedStages / selectedCourse.stages.length) * 100);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // --- View State for Navigation ---
    const [currentView, setCurrentView] = useState('list'); // 'list', 'map', 'mission'
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedStageId, setSelectedStageId] = useState(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);
    const [rankCourseId, setRankCourseId] = useState('all');

    // Sync tab changes with view resets (or open a specific course from shortcut)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const openCourse = params.get('openCourse');
        if (openCourse && assignedCourseIds.includes(openCourse)) {
            setSelectedCourseId(openCourse);
            setCurrentView('map');
            setSelectedStageId(null);
            setSelectedDifficulty(null);
        } else {
            setCurrentView('list');
            setSelectedCourseId(null);
            setSelectedStageId(null);
            setSelectedDifficulty(null);
        }
    }, [activeTab, assignedCourseIds, location.search]);

    const selectedCourse = useMemo(() => myCourses.find(c => c.id === selectedCourseId), [myCourses, selectedCourseId]);
    const selectedStage = useMemo(() => selectedCourse?.stages.find(s => s.id === selectedStageId), [selectedCourse, selectedStageId]);
    const selectedMission = useMemo(() => selectedStage?.missions?.[selectedDifficulty], [selectedStage, selectedDifficulty]);

    const handleCourseClick = (courseId) => {
        setSelectedCourseId(courseId);
        setCurrentView('map');
    };

    const handleStageClick = (stageId) => {
        setSelectedStageId(stageId);
    };

    const handleMissionClick = (difficulty) => {
        if (!selectedStageId) return;
        setSelectedDifficulty(difficulty);
        setCurrentView('mission');
    };

    const handleBackToMap = () => {
        setCurrentView('map');
        setSelectedDifficulty(null);
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedCourseId(null);
        setSelectedStageId(null);
    };

    // --- Mission Logic ---
    const { completeMission, isMissionCompleted, addSubmission } = useProgressStore();
    const [showCelebration, setShowCelebration] = useState(false);
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [reflectionText, setReflectionText] = useState('');
    const [reflectionError, setReflectionError] = useState('');
    const reflectionEntries = useMemo(
        () => (user?.studentId ? getStudentReflections(user.studentId) : []),
        [getStudentReflections, user?.studentId]
    );

    const finalizeMissionComplete = (reflection) => {
        if (!user?.studentId || !selectedCourseId || !selectedStageId || !selectedDifficulty) return;
        const alreadyDone = isMissionCompleted(user.studentId, selectedCourseId, selectedStageId, selectedDifficulty);
        if (!alreadyDone) {
            completeMission(user.studentId, selectedCourseId, selectedStageId, selectedDifficulty, {
                reflection,
                missionTitle: selectedMission?.title || '',
                courseTitle: selectedCourse?.title || '',
                stageTitle: selectedStage?.title || '',
            });
            setShowCelebration(true);
        } else {
            handleBackToMap();
        }
    };

    const handleMissionComplete = () => {
        if (!user?.studentId || !selectedCourseId || !selectedStageId || !selectedDifficulty) return;
        const alreadyDone = isMissionCompleted(user.studentId, selectedCourseId, selectedStageId, selectedDifficulty);
        if (alreadyDone) {
            handleBackToMap();
            return;
        }
        setReflectionText('');
        setReflectionError('');
        setShowReflectionModal(true);
    };

    const closeReflectionModal = () => {
        setShowReflectionModal(false);
        setReflectionText('');
        setReflectionError('');
    };

    const submitReflectionAndComplete = () => {
        const trimmedReflection = reflectionText.trim();
        if (!trimmedReflection) {
            setReflectionError('한 문장 성찰을 입력해주세요.');
            return;
        }
        finalizeMissionComplete(trimmedReflection);
        closeReflectionModal();
    };

    const handlePracticeSubmit = (file) => {
        addSubmission({
            studentId: user?.studentId,
            studentName: user?.name,
            courseId: selectedCourseId,
            stageId: selectedStageId,
            missionId: selectedMission.id,
            difficulty: selectedDifficulty,
            fileName: file.name,
            fileSize: file.size,
        });
        handleMissionComplete();
    };

    // --- Sub-components for Mission Views (ported from MissionPage) ---
    const CelebrationModal = ({ isOpen, onClose }) => (
        <Modal isOpen={isOpen} onClose={onClose} placement="center" backdrop="blur">
            <ModalContent>
                <ModalBody className="py-10 text-center space-y-4">
                    <div className="text-6xl animate-bounce inline-block">⭐</div>
                    <h2 className="text-2xl font-bold text-slate-900">Mission Star Earned!</h2>
                    <p className="text-slate-500">You have successfully completed the mission.</p>
                    <div className="flex gap-2 justify-center text-3xl">
                        {['🎉', '✨', '🏆'].map((e, i) => (
                            <span key={i} className="animate-pulse">{e}</span>
                        ))}
                    </div>
                    <Button className="font-semibold text-white bg-primary" onPress={onClose}>Continue</Button>
                </ModalBody>
            </ModalContent>
        </Modal>
    );

    const VideoView = ({ mission, onComplete }) => {
        const [quizStarted, setQuizStarted] = useState(false);
        const [currentQ, setCurrentQ] = useState(0);
        const [answers, setAnswers] = useState({});
        const [showResult, setShowResult] = useState(false);
        const [videoEnded, setVideoEnded] = useState(false);
        const questions = mission.quizQuestions || [];
        const hasQuiz = questions.length > 0;
        const playerContainerRef = useRef(null);
        const playerRef = useRef(null);

        useEffect(() => {
            if (quizStarted || !mission.videoUrl) return;

            // Extract video ID from various YouTube URL formats
            let videoId = null;
            const embedMatch = mission.videoUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
            const watchMatch = mission.videoUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            const shortMatch = mission.videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            const shortsMatch = mission.videoUrl.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
            if (embedMatch) videoId = embedMatch[1];
            else if (watchMatch) videoId = watchMatch[1];
            else if (shortMatch) videoId = shortMatch[1];
            else if (shortsMatch) videoId = shortsMatch[1];
            if (!videoId) return;

            // Extract start time if present
            const startMatch = mission.videoUrl.match(/[?&]start=(\d+)/);
            const startSeconds = startMatch ? parseInt(startMatch[1]) : 0;

            const initPlayer = () => {
                if (!playerContainerRef.current) return;
                playerRef.current = new window.YT.Player(playerContainerRef.current, {
                    videoId,
                    playerVars: { start: startSeconds, rel: 0 },
                    events: {
                        onStateChange: (e) => {
                            if (e.data === window.YT.PlayerState.ENDED) {
                                setVideoEnded(true);
                                if (!hasQuiz) {
                                    onComplete();
                                } else {
                                    setQuizStarted(true);
                                }
                            }
                        }
                    }
                });
            };

            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                // Load API if not already loaded
                if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                    const tag = document.createElement('script');
                    tag.src = 'https://www.youtube.com/iframe_api';
                    document.body.appendChild(tag);
                }
                window.onYouTubeIframeAPIReady = initPlayer;
            }

            return () => {
                if (playerRef.current?.destroy) playerRef.current.destroy();
            };
        }, [mission.videoUrl, quizStarted, hasQuiz, onComplete]);

        if (!quizStarted) {
            return (
                <div className="space-y-6">
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xl">
                        <div ref={playerContainerRef} className="w-full h-full" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                        <span className={`text-sm font-medium flex items-center gap-2 ${videoEnded ? 'text-green-600' : 'text-slate-400'}`}>
                            {videoEnded ? (
                                <><span className="material-symbols-outlined text-green-500 text-base">check_circle</span> 시청 완료</>
                            ) : (
                                <><span className="material-symbols-outlined text-slate-400 text-base animate-pulse">play_circle</span> 동영상을 시청해 주세요</>
                            )}
                        </span>
                        {hasQuiz ? (
                            <Button
                                color="primary"
                                className={isDark ? 'bg-primary text-white font-bold' : 'bg-primary text-white font-bold'}
                                isDisabled={!videoEnded}
                                onPress={() => setQuizStarted(true)}
                            >
                                Take Quiz →
                            </Button>
                        ) : (
                            <Button
                                color="success"
                                className={isDark ? 'bg-green-600 text-white font-bold' : 'bg-green-600 text-white font-bold'}
                                isDisabled={!videoEnded}
                                onPress={onComplete}
                            >
                                Complete Mission →
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        const correctCount = questions.filter((q, i) => answers[i] === q.answer).length;
        const passed = correctCount >= Math.ceil(questions.length * 0.66);

        return (
            <div className="space-y-6">
                <Progress value={(Object.keys(answers).length / questions.length) * 100} color="primary" label="Quiz Progress" />
                {!showResult ? (
                    <div className="space-y-4">
                        <Card className="shadow-lg border border-slate-200">
                            <CardBody className="p-6 space-y-4">
                                <p className="text-sm text-slate-500">Question {currentQ + 1} / {questions.length}</p>
                                <h3 className="text-lg font-bold text-slate-800">{questions[currentQ]?.question}</h3>
                                <div className="space-y-2">
                                    {questions[currentQ]?.options.map((opt, i) => (
                                        <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${answers[currentQ] === i ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-primary'}`}>
                                            {i + 1}. {opt}
                                        </button>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                        <div className="flex justify-between">
                            <Button
                                variant="flat"
                                className={isDark ? 'text-white font-medium' : 'text-slate-900 font-medium border border-slate-300 bg-white'}
                                isDisabled={currentQ === 0}
                                onPress={() => setCurrentQ(p => p - 1)}
                            >
                                Back
                            </Button>
                            {currentQ < questions.length - 1 ? (
                                <Button
                                    color="primary"
                                    className="bg-primary text-white font-bold"
                                    isDisabled={answers[currentQ] === undefined}
                                    onPress={() => setCurrentQ(p => p + 1)}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    color="success"
                                    className="bg-green-600 text-white font-bold"
                                    isDisabled={Object.keys(answers).length < questions.length}
                                    onPress={() => setShowResult(true)}
                                >
                                    Submit
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Card className="shadow-xl border border-slate-200 text-center p-8 space-y-4">
                        <div className="text-5xl">{passed ? '🎉' : '😅'}</div>
                        <h3 className="text-2xl font-bold text-slate-800">{passed ? 'Passed!' : 'Try Again'}</h3>
                        <p className="text-slate-500">{correctCount} / {questions.length} correct</p>
                        {passed ? (
                            <Button color="success" className="bg-green-600 text-white font-bold" onPress={onComplete}>
                                Claim Star
                            </Button>
                        ) : (
                            <Button
                                color="primary"
                                className="bg-primary text-white font-bold"
                                onPress={() => { setShowResult(false); setAnswers({}); setCurrentQ(0); }}
                            >
                                Restart Quiz
                            </Button>
                        )}
                    </Card>
                )}
            </div>
        );
    };

    const TutorialView = ({ mission, onComplete }) => {
        const hasHtml = !!mission.htmlContent;
        const [canComplete, setCanComplete] = useState(false);

        // iframe 내부에서 스크롤 완료 메시지 수신
        useEffect(() => {
            if (!hasHtml) return;
            const handler = (e) => {
                if (e.data === 'TUTORIAL_SCROLL_END') {
                    setCanComplete(true);
                }
            };
            window.addEventListener('message', handler);
            return () => window.removeEventListener('message', handler);
        }, [hasHtml]);

        if (hasHtml) {
            // HTML 끝에 프로그래스 바 감지 스크립트 삽입
            const progressDetectScript = `<script>
(function(){
    var fired = false;
    function notifyComplete() {
        if (fired) return;
        fired = true;
        window.parent.postMessage('TUTORIAL_SCROLL_END', '*');
    }

    function checkProgress() {
        // 1) <progress> 요소 확인
        var prog = document.querySelector('progress');
        if (prog && prog.value >= prog.max && prog.max > 0) { notifyComplete(); return; }

        // 2) role="progressbar" 요소 확인
        var bars = document.querySelectorAll('[role="progressbar"]');
        for (var i = 0; i < bars.length; i++) {
            var now = parseFloat(bars[i].getAttribute('aria-valuenow') || 0);
            var max = parseFloat(bars[i].getAttribute('aria-valuemax') || 100);
            if (now >= max) { notifyComplete(); return; }
        }

        // 3) width가 100%인 프로그래스 바 스타일 확인
        var allBars = document.querySelectorAll('[class*="progress"], [id*="progress"], [class*="bar"], [id*="bar"]');
        for (var j = 0; j < allBars.length; j++) {
            var w = allBars[j].style.width;
            if (w === '100%') { notifyComplete(); return; }
        }
    }

    // 0.5초마다 확인
    var interval = setInterval(function(){
        checkProgress();
        if (fired) clearInterval(interval);
    }, 500);
})();
</script>`;
            const finalHtml = mission.htmlContent + progressDetectScript;

            return (
                <div className="space-y-4">
                    <Card className="shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-100 p-2 flex items-center gap-2 border-b border-slate-200">
                            <div className="flex gap-1">
                                <div className="size-2 rounded-full bg-red-400"></div>
                                <div className="size-2 rounded-full bg-yellow-400"></div>
                                <div className="size-2 rounded-full bg-green-400"></div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">tutorial_environment.html</span>
                        </div>
                        <iframe srcDoc={finalHtml} title="Tutorial" className="w-full h-[70vh]" sandbox="allow-scripts allow-forms allow-modals allow-popups" />
                    </Card>
                    <div className={`flex items-center justify-center p-4 bg-white rounded-xl border shadow-lg transition-all duration-500 ${canComplete ? 'border-green-300 opacity-100' : 'border-slate-200 opacity-40 pointer-events-none'}`}>
                        <Button color={canComplete ? 'success' : 'default'} className="text-black font-bold px-8" onPress={onComplete} isDisabled={!canComplete}>
                            {canComplete ? '✅ 미션 완료하기' : '📖 튜토리얼을 끝까지 읽어주세요'}
                        </Button>
                    </div>
                </div>
            );
        }
        return <div className="p-8 text-center text-slate-500">Traditional step-by-step tutorials are no longer supported. Please upload an HTML file in Admin.</div>;
    };

    const PracticeView = ({ mission, onSubmit }) => {
        const [file, setFile] = useState(null);
        const [submitted, setSubmitted] = useState(false);
        if (submitted) {
            return (
                <Card className="text-center p-12 space-y-4 shadow-xl border border-slate-200">
                    <div className="text-7xl">📤</div>
                    <h3 className="text-2xl font-bold text-slate-800">Assignment Uploaded!</h3>
                    <p className="text-slate-500">Your teacher will review and approve your submission shortly.</p>
                </Card>
            );
        }
        return (
            <div className="space-y-6">
                <Card className="p-6 shadow-lg border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">📋 Instructions</h3>
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-600 whitespace-pre-wrap">{mission.taskDescription}</div>
                </Card>
                <Card className="p-6 shadow-lg border border-slate-200 text-center space-y-4">
                    <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary cursor-pointer transition-colors bg-slate-50/50">
                        <Upload size={40} className="text-slate-400 mb-2" />
                        <span className="text-slate-600 font-medium">{file ? file.name : 'Click to select project file'}</span>
                        <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0])} />
                    </label>
                    <Button color="primary" fullWidth className="h-12 text-lg font-bold" isDisabled={!file} onPress={() => { onSubmit(file); setSubmitted(true); }}>Submit Assignment</Button>
                </Card>
            </div>
        );
    };

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
                        <span className="hidden lg:flex ml-auto bg-accent-pink text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(241,91,181,0.5)]">{myCourses.length}</span>
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
                    <button onClick={() => navigate('/marketplace')} className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all group w-full text-left">
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">storefront</span>
                        <span className="hidden lg:block">Marketplace</span>
                    </button>

                </nav>

                <div className="p-4 border-t border-accent-purple/20">
                    <button onClick={() => navigate('/settings')} className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all group w-full text-left">
                        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">settings</span>
                        <span className="hidden lg:block">Settings</span>
                    </button>
                    {/* Logout Button */}
                    <button onClick={handleLogout} className="mt-2 flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group w-full text-left">
                        <span className="material-symbols-outlined group-hover:rotate-180 transition-transform">logout</span>
                        <span className="hidden lg:block">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-accent-pink/20">
                    <div className="md:hidden flex items-center gap-3">
                        <button className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <span className="font-bold text-lg">StarQuest</span>
                    </div>
                    <div className="hidden md:flex flex-1 max-w-xl mx-auto">
                        {/* Search bar removed by user request */}
                    </div>
                    <StudentHeaderActions />
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-20 scroll-smooth">
                    {activeTab === 'dashboard' ? (
                        <>
                            {/* Welcome & Stats */}
                            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                <div className="xl:col-span-2 bg-white rounded-lg p-6 md:p-8 relative overflow-hidden shadow-card border border-accent-purple/30">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-pink/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <h1 className="text-2xl md:text-3xl font-bold mb-2">안녕하세요, {user?.name || '학생'}! 👋</h1>
                                        <p className="text-slate-500 mb-8">오늘도 열심히 퀘스트를 수행하고 ⭐ 별을 모아보세요!</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-6 gap-3 border border-amber-200 hover:border-amber-400 transition-all hover:shadow-lg hover:-translate-y-1 duration-300 aspect-square">
                                                <span className="text-sm font-semibold tracking-wide text-slate-500">내 별</span>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <Star size={32} className="text-amber-500 fill-amber-500" />
                                                    <span className="text-3xl font-extrabold text-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]">{myStars}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-6 gap-3 border border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300 aspect-square">
                                                <span className="text-sm font-semibold tracking-wide text-slate-500">수강 중</span>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-primary text-[32px]">school</span>
                                                    <span className="text-3xl font-extrabold text-slate-800">{myCourses.length}<span className="text-lg font-bold text-slate-500 ml-1">개</span></span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-6 gap-3 border border-secondary/20 hover:border-secondary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300 aspect-square">
                                                <span className="text-sm font-semibold tracking-wide text-slate-500">내 순위</span>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-secondary text-[32px]">leaderboard</span>
                                                    <span className="text-3xl font-extrabold text-secondary">#{myRank}</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-6 gap-3 border border-accent-pink/20 hover:border-accent-pink/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300 aspect-square">
                                                <span className="text-sm font-semibold tracking-wide text-slate-500">전체 학생</span>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-accent-pink text-[32px]">group</span>
                                                    <span className="text-3xl font-extrabold text-slate-800">{registeredStudents.length}<span className="text-lg font-bold text-slate-500 ml-1">명</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Star Leaderboard */}
                                {(() => {
                                    const myCoursesForRank = myCourses;

                                    // 수업별 별 수 계산 함수
                                    const getStarsForCourse = (studentId, courseId) => {
                                        const allProgress = useProgressStore.getState().progress;
                                        const studentProgress = allProgress?.[studentId];
                                        if (!studentProgress) return 0;
                                        if (courseId === 'all') return totalStars[studentId] || 0;
                                        const courseProgress = studentProgress[courseId];
                                        if (!courseProgress) return 0;
                                        let stars = 0;
                                        Object.values(courseProgress).forEach(stage => {
                                            if (stage.easy) stars++;
                                            if (stage.normal) stars++;
                                            if (stage.hard) stars++;
                                        });
                                        return stars;
                                    };

                                    // 같은 수업을 듣는 학생 필터링
                                    const filteredStudents = rankCourseId === 'all'
                                        ? registeredStudents
                                        : registeredStudents.filter(s => s.courseIds?.includes(rankCourseId));

                                    const courseLeaderboard = filteredStudents
                                        .map(s => ({ studentId: s.studentId, name: s.name, stars: getStarsForCourse(s.studentId, rankCourseId) }))
                                        .sort((a, b) => b.stars - a.stars);

                                    const myRankInCourse = courseLeaderboard.findIndex(s => s.studentId === user?.studentId);
                                    const myRankNum = myRankInCourse >= 0 ? myRankInCourse + 1 : '-';

                                    return (
                                        <div className="bg-white rounded-lg p-6 flex flex-col shadow-card border border-accent-yellow/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="font-bold text-lg flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-accent-yellow">trophy</span>
                                                    별 랭킹
                                                </h2>
                                                <select value={rankCourseId} onChange={e => setRankCourseId(e.target.value)}
                                                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-medium cursor-pointer">
                                                    <option value="all">전체</option>
                                                    {myCoursesForRank.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name || c.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1 flex-1">
                                                {courseLeaderboard.slice(0, 5).map((student, idx) => {
                                                    const isMe = student.studentId === user?.studentId;
                                                    const rankColors = ['text-accent-yellow drop-shadow-[0_0_5px_rgba(254,228,64,0.8)]', 'text-slate-400', 'text-orange-700'];
                                                    return (
                                                        <div key={student.studentId} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isMe ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50 cursor-pointer'}`}>
                                                            <span className={`font-bold w-4 text-center ${rankColors[idx] || 'text-slate-400'}`}>{idx + 1}</span>
                                                            <div className={`size-8 rounded-full bg-cover bg-center ${idx === 0 ? 'ring-2 ring-accent-yellow/50' : ''} ${isMe ? 'ring-2 ring-primary shadow-[0_0_10px_#00bbf9]' : ''}`} style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random')` }}></div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold">{isMe ? '나' : student.name}</p>
                                                                <p className={`text-xs ${isMe ? 'text-primary' : 'text-slate-500'} flex items-center gap-1`}>
                                                                    <Star size={10} className="fill-amber-500 text-amber-500" />
                                                                    {student.stars}개
                                                                </p>
                                                            </div>
                                                            {isMe && <span className="material-symbols-outlined text-primary text-sm">person</span>}
                                                        </div>
                                                    );
                                                })}
                                                {courseLeaderboard.length === 0 && (
                                                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-8">
                                                        아직 데이터가 없습니다.
                                                    </div>
                                                )}
                                                {typeof myRankNum === 'number' && myRankNum > 5 && (
                                                    <>
                                                        <div className="h-px bg-slate-200 my-2"></div>
                                                        <div className="flex items-center gap-3 p-2 rounded-xl bg-primary/5 border border-primary/20">
                                                            <span className="font-bold text-primary w-4 text-center">{myRankNum}</span>
                                                            <div className="size-8 rounded-full bg-cover bg-center ring-2 ring-primary shadow-[0_0_10px_#00bbf9]" style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Me')}&background=random')` }}></div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold">나</p>
                                                                <p className="text-xs text-primary flex items-center gap-1">
                                                                    <Star size={10} className="fill-amber-500 text-amber-500" />
                                                                    {getStarsForCourse(user?.studentId, rankCourseId)}개
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </section>

                            {/* Class Shortcuts */}
                            <section>
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">play_circle</span>
                                        수업 바로가기
                                    </h2>
                                    <button onClick={() => navigate('?tab=myClass')} className="text-sm font-medium text-primary hover:text-secondary hover:underline transition-colors">전체 보기</button>
                                </div>
                                {myCourses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {myCourses.slice(0, 6).map((course, i) => {
                                            const completion = getCourseCompletion(course.id);
                                            const studentProgress = getStudentProgress(user?.studentId, course.id);
                                            const currentStageIdx = course.stages?.findIndex((stage) => {
                                                const sp = studentProgress?.[stage.id];
                                                return !(sp?.easy && sp?.normal && sp?.hard);
                                            });
                                            const currentStageNum = currentStageIdx === -1 ? course.stages?.length : (currentStageIdx ?? 0) + 1;
                                            const currentStageName = currentStageIdx >= 0 ? course.stages[currentStageIdx]?.title : null;
                                            const isAllDone = completion === 100;
                                            const colorSets = [
                                                { bg: 'from-violet-100 to-violet-50', border: 'border-violet-200', icon: 'text-violet-500' },
                                                { bg: 'from-pink-100 to-pink-50', border: 'border-pink-200', icon: 'text-pink-500' },
                                                { bg: 'from-sky-100 to-sky-50', border: 'border-sky-200', icon: 'text-sky-500' },
                                                { bg: 'from-emerald-100 to-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500' },
                                                { bg: 'from-amber-100 to-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
                                                { bg: 'from-rose-100 to-rose-50', border: 'border-rose-200', icon: 'text-rose-500' },
                                            ];
                                            const cc = colorSets[i % colorSets.length];
                                            return (
                                                <div key={course.id} onClick={() => navigate(`?tab=myClass&openCourse=${course.id}`)} className={`bg-white rounded-lg p-4 flex gap-4 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ${cc.border} border group cursor-pointer`}>
                                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cc.bg} flex items-center justify-center shrink-0`}>
                                                        <span className={`material-symbols-outlined ${cc.icon} text-[24px]`}>menu_book</span>
                                                    </div>
                                                    <div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
                                                        <div>
                                                            <h3 className="font-bold text-sm leading-tight mb-1 group-hover:text-primary transition-colors truncate">{course.name}</h3>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                {isAllDone ? (
                                                                    <><span className="material-symbols-outlined text-green-500 text-xs">check_circle</span> 전체 완료</>
                                                                ) : (
                                                                    <><span className="material-symbols-outlined text-primary text-xs">play_arrow</span> 스테이지 {currentStageNum}/{course.stages?.length || 0} 진행 중{currentStageName ? ` · ${currentStageName}` : ''}</>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-medium text-slate-400">진행률</span>
                                                                <span className="font-bold text-primary">{completion}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completion}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg p-8 text-center text-slate-400 border border-slate-200">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">school</span>
                                        <p>아직 수업이 없습니다.</p>
                                    </div>
                                )}
                            </section>
                        </>
                    ) : activeTab === 'myClass' ? (
                        <section className="space-y-6">
                            {currentView === 'list' && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold">My Class</h2>
                                            <p className="text-slate-500 text-sm mt-1">수업을 선택하여 퀘스트를 이어가세요.</p>
                                        </div>
                                    </div>

                                    {myCourses.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {myCourses.map((course) => {
                                                const completion = getCourseCompletion(course.id);
                                                return (
                                                    <button
                                                        key={course.id}
                                                        onClick={() => handleCourseClick(course.id)}
                                                        className="text-left bg-white rounded-xl p-5 border border-accent-purple/20 shadow-card hover:shadow-lg hover:scale-[1.01] transition-all group"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className="text-3xl">{course.icon || '📘'}</span>
                                                                <div className="min-w-0">
                                                                    <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">{course.title}</h3>
                                                                    <p className="text-sm text-slate-500 line-clamp-2">{course.description || 'No class description'}</p>
                                                                </div>
                                                            </div>
                                                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">arrow_forward</span>
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                                            <span>{course.stages.length} Stages</span>
                                                            <span className="font-semibold text-primary">{completion}%</span>
                                                        </div>
                                                        <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-xl border border-accent-purple/20 p-8 text-center text-slate-500">
                                            No classes available yet. Add classes in Admin page.
                                        </div>
                                    )}
                                </>
                            )}

                            {currentView === 'map' && selectedCourse && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <Button isIconOnly variant="flat" onPress={handleBackToList}>
                                            <ChevronLeft size={20} />
                                        </Button>
                                        <div>
                                            <h2 className="text-2xl font-bold">{selectedCourse.title} Map</h2>
                                            <p className="text-slate-500 text-sm">Clear stages to earn points and level up!</p>
                                        </div>
                                    </div>

                                    {/* Stages Layout */}
                                    <div className="flex flex-col gap-12 relative py-8">
                                        {/* Connector Line */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200/50 -translate-x-1/2 -z-0"></div>

                                        {selectedCourse.stages.map((stage, idx) => {
                                            const progress = getStudentProgress(user?.studentId, selectedCourse.id)?.[stage.id];
                                            const isDone = progress?.easy && progress?.normal && progress?.hard;
                                            const isEven = idx % 2 === 0;
                                            const isSelected = selectedStageId === stage.id;

                                            const stageInfo = (
                                                <div className={isEven ? 'text-right pr-6' : 'text-left pl-6'}>
                                                    <h4 className="font-bold text-slate-800">{stage.title}</h4>
                                                    <p className="text-xs text-slate-400 line-clamp-2">{stage.description}</p>
                                                </div>
                                            );

                                            const missionPanel = isSelected ? (
                                                <div className={`${isEven ? 'pl-6' : 'pr-6'}`}>
                                                    <div className="p-4 bg-white rounded-2xl border border-primary/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {[
                                                                { diff: 'easy', label: 'Video & Quiz', icon: <Play size={16} /> },
                                                                { diff: 'normal', label: 'HTML Tutorial', icon: <BookOpen size={16} /> },
                                                                { diff: 'hard', label: 'Final Practice', icon: <Upload size={16} /> }
                                                            ].map(m => {
                                                                const missionDone = progress?.[m.diff];
                                                                return (
                                                                    <button
                                                                        key={m.diff}
                                                                        onClick={() => handleMissionClick(m.diff)}
                                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${missionDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100 hover:border-primary'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`size-8 rounded-lg flex items-center justify-center ${missionDone ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                                                                                {m.icon}
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <p className={`text-xs font-bold ${missionDone ? 'text-green-700' : 'text-slate-800'}`}>{m.label}</p>
                                                                                <p className="text-[10px] text-slate-400 capitalize">{m.diff}</p>
                                                                            </div>
                                                                        </div>
                                                                        {missionDone && <Star size={14} className="text-amber-500 fill-amber-500" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : <div />;

                                            return (
                                                <div key={stage.id} className="grid grid-cols-[1fr_auto_1fr] items-center z-10">
                                                    {/* Left Panel */}
                                                    <div className="hidden md:block">
                                                        {isEven ? stageInfo : missionPanel}
                                                    </div>

                                                    {/* Center Node */}
                                                    <div className="flex flex-col items-center gap-2 mx-4">
                                                        <div
                                                            onClick={() => handleStageClick(stage.id)}
                                                            className={`size-16 rounded-full flex items-center justify-center cursor-pointer transition-all border-4 ${isSelected ? 'scale-110 shadow-2xl' : 'scale-100'} ${isDone ? 'bg-green-500 border-green-200 text-white' : 'bg-white border-slate-200'}`}
                                                        >
                                                            {isDone ? <Check size={32} strokeWidth={3} /> : <span className="text-xl font-black text-slate-300">{idx + 1}</span>}
                                                        </div>
                                                        <span className="md:hidden font-bold text-xs text-slate-500">{stage.title}</span>
                                                    </div>

                                                    {/* Right Panel */}
                                                    <div className="hidden md:block">
                                                        {isEven ? missionPanel : stageInfo}
                                                    </div>

                                                    {/* Mobile: show missions below */}
                                                    {isSelected && (
                                                        <div className="md:hidden col-span-3 mt-4">
                                                            <div className="p-4 bg-white rounded-2xl border border-primary/20 shadow-xl">
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    {[
                                                                        { diff: 'easy', label: 'Video & Quiz', icon: <Play size={16} /> },
                                                                        { diff: 'normal', label: 'HTML Tutorial', icon: <BookOpen size={16} /> },
                                                                        { diff: 'hard', label: 'Final Practice', icon: <Upload size={16} /> }
                                                                    ].map(m => {
                                                                        const missionDone = progress?.[m.diff];
                                                                        return (
                                                                            <button
                                                                                key={m.diff}
                                                                                onClick={() => handleMissionClick(m.diff)}
                                                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${missionDone ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100 hover:border-primary'}`}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={`size-8 rounded-lg flex items-center justify-center ${missionDone ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                                                                                        {m.icon}
                                                                                    </div>
                                                                                    <div className="text-left">
                                                                                        <p className={`text-xs font-bold ${missionDone ? 'text-green-700' : 'text-slate-800'}`}>{m.label}</p>
                                                                                        <p className="text-[10px] text-slate-400 capitalize">{m.diff}</p>
                                                                                    </div>
                                                                                </div>
                                                                                {missionDone && <Star size={14} className="text-amber-500 fill-amber-500" />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {currentView === 'mission' && selectedMission && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <Button isIconOnly variant="flat" onPress={handleBackToMap}>
                                                <ChevronLeft size={20} />
                                            </Button>
                                            <div>
                                                <h2 className="text-2xl font-bold">{selectedMission.title}</h2>
                                                <p className="text-slate-500 text-sm">
                                                    {selectedDifficulty === 'easy' ? 'Watch and solve' : selectedDifficulty === 'normal' ? 'Interactive Guide' : 'Demonstrate your skills'}
                                                </p>
                                            </div>
                                        </div>
                                        {isMissionCompleted(user?.studentId, selectedCourseId, selectedStageId, selectedDifficulty) && (
                                            <div className="flex items-center gap-2 text-amber-500 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                                <Star className="fill-amber-500" size={18} />
                                                Completed
                                            </div>
                                        )}
                                    </div>

                                    {selectedDifficulty === 'easy' && <VideoView mission={selectedMission} onComplete={handleMissionComplete} />}
                                    {selectedDifficulty === 'normal' && <TutorialView mission={selectedMission} onComplete={handleMissionComplete} />}
                                    {selectedDifficulty === 'hard' && <PracticeView mission={selectedMission} onSubmit={handlePracticeSubmit} />}

                                    <Modal isOpen={showReflectionModal} onClose={closeReflectionModal} placement="center" backdrop="blur">
                                        <ModalContent className="border-2 border-slate-300 bg-white shadow-2xl">
                                            <ModalBody className="space-y-4 py-8 text-slate-900">
                                                <div className="space-y-1">
                                                    <h2 className="text-2xl font-bold text-slate-900">Reflection</h2>
                                                    <p className="text-sm text-slate-700">오늘 배운 것 또는 어려웠던 점을 한 문장으로 남겨주세요.</p>
                                                </div>
                                                <textarea
                                                    value={reflectionText}
                                                    onChange={(e) => {
                                                        setReflectionText(e.target.value);
                                                        if (reflectionError) setReflectionError('');
                                                    }}
                                                    maxLength={200}
                                                    rows={4}
                                                    className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                    placeholder="예: 개념은 이해했지만 실제 과제에 적용하는 과정은 아직 어려웠다."
                                                />
                                                <div className="flex items-center justify-between text-xs text-slate-700">
                                                    <span>{reflectionError ? <span className="text-red-500">{reflectionError}</span> : '짧고 구체적으로 적어보세요.'}</span>
                                                    <span>{reflectionText.length}/200</span>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="flat" onPress={closeReflectionModal}>취소</Button>
                                                    <Button className="font-semibold text-white bg-primary" onPress={submitReflectionAndComplete}>성찰 저장</Button>
                                                </div>
                                            </ModalBody>
                                        </ModalContent>
                                    </Modal>
                                    <CelebrationModal isOpen={showCelebration} onClose={() => { setShowCelebration(false); handleBackToMap(); }} />
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Reflection</h2>
                                    <p className="text-slate-500 text-sm mt-1">미션을 마친 뒤 작성한 성찰 문장을 다시 확인해보세요.</p>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
                                    <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
                                    <span className="text-sm font-bold text-slate-700">{reflectionEntries.length}개의 기록</span>
                                </div>
                            </div>

                            {reflectionEntries.length > 0 ? (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {reflectionEntries.map((entry, index) => (
                                        <div key={`${entry.timestamp}-${index}`} className="bg-white rounded-2xl border border-accent-purple/20 shadow-card p-5 space-y-4 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                        {entry.courseTitle && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary font-medium">{entry.courseTitle}</span>}
                                                        {entry.stageTitle && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 font-medium">{entry.stageTitle}</span>}
                                                        {entry.difficulty && <span className="rounded-full bg-accent-pink/10 px-2.5 py-1 text-accent-pink font-medium capitalize">{entry.difficulty}</span>}
                                                    </div>
                                                    {entry.missionTitle && <p className="text-base font-bold text-slate-800">{entry.missionTitle}</p>}
                                                </div>
                                                <span className="text-xs text-slate-400 shrink-0">{new Date(entry.timestamp).toLocaleString('ko-KR')}</span>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                                <p className="text-slate-700 leading-7">"{entry.reflection}"</p>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-accent-purple/20 p-12 text-center text-slate-500 shadow-card">
                                    <span className="material-symbols-outlined text-5xl mb-4 block text-slate-300">edit_note</span>
                                    <p className="font-medium">아직 작성한 성찰이 없어요.</p>
                                    <p className="text-sm mt-1">미션을 완료하고 성찰을 저장하면 이곳에서 다시 볼 수 있습니다.</p>
                                </div>
                            )}
                        </section>

                    )}
                </div>
            </main>
        </div>
    );
}

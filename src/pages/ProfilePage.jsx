import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useAuthStore } from '../stores/useAuthStore';
import StudentLayout from '../components/StudentLayout';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, logout, changePassword } = useAuthStore();
    const [showPwChange, setShowPwChange] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [pwMsg, setPwMsg] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <StudentLayout>
            <div className="min-h-full bg-background-light font-display">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-accent-purple/20">
                    <div className="max-w-3xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-600">settings</span>
                            설정
                        </h1>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
                    {/* Account Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-600">manage_accounts</span>
                            계정
                        </h3>
                        <div className="bg-white rounded-xl border border-accent-purple/20 shadow-card divide-y divide-slate-100">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">badge</span>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">이름</p>
                                        <p className="text-xs text-slate-500">{user?.name}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">school</span>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">학번</p>
                                        <p className="text-xs text-slate-500">{user?.studentId}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">역할</p>
                                        <p className="text-xs text-slate-500">학생</p>
                                    </div>
                                </div>
                            </div>
                            {/* Password Change */}
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">lock</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">비밀번호</p>
                                            <p className="text-xs text-slate-500">로그인 비밀번호를 변경합니다</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="flat" color="primary" onPress={() => { setShowPwChange(!showPwChange); setPwMsg(null); setPwForm({ current: '', newPw: '', confirm: '' }); }}>
                                        {showPwChange ? '취소' : '변경'}
                                    </Button>
                                </div>
                                {showPwChange && (
                                    <div className="mt-4 space-y-3 pl-9">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">현재 비밀번호</label>
                                            <input
                                                type="password"
                                                value={pwForm.current}
                                                onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                                                placeholder="현재 비밀번호 입력"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">새 비밀번호</label>
                                            <input
                                                type="password"
                                                value={pwForm.newPw}
                                                onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                                                placeholder="새 비밀번호 입력"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">새 비밀번호 확인</label>
                                            <input
                                                type="password"
                                                value={pwForm.confirm}
                                                onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                                                placeholder="새 비밀번호 다시 입력"
                                            />
                                        </div>
                                        {pwMsg && (
                                            <p className={`text-xs font-medium flex items-center gap-1 ${pwMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className="material-symbols-outlined text-sm">{pwMsg.ok ? 'check_circle' : 'error'}</span>
                                                {pwMsg.text}
                                            </p>
                                        )}
                                        <Button
                                            size="sm"
                                            color="primary"
                                            className="font-medium"
                                            isDisabled={!pwForm.current || !pwForm.newPw || !pwForm.confirm}
                                            onPress={() => {
                                                if (pwForm.newPw !== pwForm.confirm) {
                                                    setPwMsg({ ok: false, text: '새 비밀번호가 일치하지 않습니다.' });
                                                    return;
                                                }
                                                if (pwForm.newPw.length < 2) {
                                                    setPwMsg({ ok: false, text: '비밀번호는 2자 이상이어야 합니다.' });
                                                    return;
                                                }
                                                const ok = changePassword(user?.studentId, pwForm.current, pwForm.newPw);
                                                if (ok) {
                                                    setPwMsg({ ok: true, text: '비밀번호가 변경되었습니다.' });
                                                    setPwForm({ current: '', newPw: '', confirm: '' });
                                                    setTimeout(() => { setShowPwChange(false); setPwMsg(null); }, 2000);
                                                } else {
                                                    setPwMsg({ ok: false, text: '현재 비밀번호가 올바르지 않습니다.' });
                                                }
                                            }}
                                        >
                                            비밀번호 변경
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logout Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-400">logout</span>
                            로그아웃
                        </h3>
                        <div className="bg-white rounded-xl border border-red-100 shadow-card p-4">
                            <p className="text-sm text-slate-500 mb-3">현재 세션에서 로그아웃합니다.</p>
                            <Button size="sm" color="danger" variant="flat" onPress={handleLogout}>
                                로그아웃
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}

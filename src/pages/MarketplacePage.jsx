import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { Star } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useMarketplaceStore } from '../stores/useMarketplaceStore';
import StudentLayout from '../components/StudentLayout';

const categories = [
    { id: 'all', label: '전체', icon: 'apps' },
    { id: 'snack', label: '간식/음료', icon: 'restaurant' },
    { id: 'school', label: '학교생활', icon: 'school' },
    { id: 'stationery', label: '학용품', icon: 'edit' },
    { id: 'special', label: '특별보상', icon: 'workspace_premium' },
];

export default function MarketplacePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { totalStars, spendStars } = useProgressStore();
    const { shopItems, purchaseItem, getStudentPurchases } = useMarketplaceStore();

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [purchaseMsg, setPurchaseMsg] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    const myStars = totalStars[user?.studentId] || 0;
    const filteredItems = selectedCategory === 'all'
        ? shopItems
        : shopItems.filter(item => item.category === selectedCategory);
    const myPurchases = getStudentPurchases(user?.studentId);

    const handlePurchase = (itemId) => {
        const result = purchaseItem(user?.studentId, itemId, spendStars, user?.name);
        setPurchaseMsg(result);
        setTimeout(() => setPurchaseMsg(null), 3000);
    };

    return (
        <StudentLayout>
            <div className="min-h-full bg-background-light font-display flex flex-col h-screen overflow-hidden">
                {/* Header - Same style as Dashboard / My Class */}
                <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-accent-pink/20">
                    <div className="md:hidden flex items-center gap-3">
                        <button className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <span className="font-bold text-lg">Marketplace</span>
                    </div>
                    <div className="hidden md:flex flex-1 max-w-xl mx-auto">
                        <div className="relative w-full group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors material-symbols-outlined">search</span>
                            <input className="w-full bg-slate-100 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary placeholder-slate-400 transition-shadow outline-none" placeholder="상품 검색..." type="text" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 ml-auto">
                        <button className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors group">
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-primary">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-accent-pink rounded-full animate-pulse"></span>
                        </button>
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 shadow-sm">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            <span className="text-base font-bold text-amber-700">{myStars}</span>
                        </div>
                    </div>
                </header>

                {/* Purchase notification */}
                {purchaseMsg && (
                    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all animate-bounce ${purchaseMsg.success
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        <span className="material-symbols-outlined text-sm mr-1 align-text-bottom">
                            {purchaseMsg.success ? 'check_circle' : 'error'}
                        </span>
                        {purchaseMsg.message}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-20 scroll-smooth">
                    {/* Page Title - Same style as My Class */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Marketplace</h2>
                            <p className="text-slate-500 text-sm mt-1">별을 사용하여 다양한 상품을 구매하세요.</p>
                        </div>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm text-slate-600">receipt_long</span>
                            <span className="text-sm font-medium text-slate-700">구매내역</span>
                            {myPurchases.filter(p => p.status === 'pending').length > 0 && (
                                <span className="bg-accent-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {myPurchases.filter(p => p.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Purchase History Panel */}
                    {showHistory && (
                        <div className="bg-white rounded-xl border border-accent-purple/20 shadow-card overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                                    구매 내역
                                </h3>
                                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            {myPurchases.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    아직 구매 내역이 없습니다.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                                    {[...myPurchases].reverse().map((purchase, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{purchase.itemIcon}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{purchase.itemName}</p>
                                                    <p className="text-xs text-slate-400">{new Date(purchase.timestamp).toLocaleDateString('ko-KR')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                                                    <Star size={12} className="fill-amber-500 text-amber-500" />
                                                    -{purchase.price}
                                                </span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${purchase.status === 'delivered'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {purchase.status === 'delivered' ? '수령 완료' : '준비 중'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/30 hover:text-primary'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredItems.map(item => {
                            const canAfford = myStars >= item.price;
                            const outOfStock = item.stock <= 0;
                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white rounded-xl border overflow-hidden shadow-card hover:shadow-lg transition-all group ${outOfStock ? 'opacity-50 border-slate-200' : 'border-accent-purple/20 hover:border-primary/40'
                                        }`}
                                >
                                    {/* Item Icon Area */}
                                    <div className="relative h-32 flex items-center justify-center bg-gradient-to-br from-slate-50 to-accent-purple/5 group-hover:from-primary/5 group-hover:to-secondary/5 transition-colors">
                                        <span className="text-5xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                        {outOfStock && (
                                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                                <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200">품절</span>
                                            </div>
                                        )}
                                        {!outOfStock && item.stock <= 5 && (
                                            <span className="absolute top-2 right-2 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                                {item.stock}개 남음
                                            </span>
                                        )}
                                    </div>

                                    {/* Item Info */}
                                    <div className="p-4">
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{item.name}</h4>
                                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Star size={14} className="text-amber-500 fill-amber-500" />
                                                <span className="text-base font-bold text-amber-700">{item.price}</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                color={canAfford && !outOfStock ? 'primary' : 'default'}
                                                variant={canAfford && !outOfStock ? 'solid' : 'flat'}
                                                isDisabled={!canAfford || outOfStock}
                                                className="font-medium text-xs"
                                                onPress={() => handlePurchase(item.id)}
                                            >
                                                {outOfStock ? '품절' : canAfford ? '구매' : '별 부족'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-16 text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-3 block">shopping_bag</span>
                            <p className="font-medium">이 카테고리에 상품이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}

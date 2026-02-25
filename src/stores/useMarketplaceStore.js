import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default shop items - admin can customize these
const defaultShopItems = [
    { id: 'snack-1', name: '과자 교환권', description: '매점에서 과자 1개 교환', price: 5, icon: '🍪', category: 'food', stock: 99 },
    { id: 'snack-2', name: '음료 교환권', description: '매점에서 음료 1개 교환', price: 8, icon: '🧃', category: 'food', stock: 99 },
    { id: 'snack-3', name: '아이스크림 교환권', description: '매점에서 아이스크림 1개 교환', price: 10, icon: '🍦', category: 'food', stock: 99 },
    { id: 'privilege-1', name: '자리 선택권', description: '다음 수업 시간에 자리를 먼저 선택', price: 3, icon: '💺', category: 'privilege', stock: 99 },
    { id: 'privilege-2', name: '0교시 면제권', description: '0교시 1회 면제', price: 15, icon: '😴', category: 'privilege', stock: 5 },
    { id: 'privilege-3', name: '숙제 면제권', description: '숙제 1회 면제', price: 20, icon: '📝', category: 'privilege', stock: 3 },
    { id: 'privilege-4', name: '청소 면제권', description: '청소 1회 면제', price: 12, icon: '🧹', category: 'privilege', stock: 5 },
    { id: 'sticker-1', name: '칭찬 스티커', description: '생활기록부 칭찬 스티커 1장', price: 7, icon: '⭐', category: 'reward', stock: 99 },
    { id: 'sticker-2', name: '골드 스티커', description: '특별 골드 칭찬 스티커', price: 15, icon: '🏅', category: 'reward', stock: 10 },
    { id: 'item-1', name: '볼펜 세트', description: '예쁜 볼펜 3색 세트', price: 10, icon: '🖊️', category: 'item', stock: 20 },
    { id: 'item-2', name: '노트', description: '귀여운 캐릭터 노트', price: 8, icon: '📓', category: 'item', stock: 20 },
    { id: 'item-3', name: '마스킹 테이프', description: '데코용 마스킹 테이프', price: 6, icon: '🎀', category: 'item', stock: 15 },
];

export const useMarketplaceStore = create(
    persist(
        (set, get) => ({
            // Shop items that can be purchased
            shopItems: defaultShopItems,

            // Purchase history: [{ studentId, itemId, itemName, price, timestamp }]
            purchases: [],

            // Get items by category
            getItemsByCategory: (category) => {
                if (category === 'all') return get().shopItems;
                return get().shopItems.filter(item => item.category === category);
            },

            // Purchase an item (returns { success, message })
            purchaseItem: (studentId, itemId, spendStars, studentName) => {
                const items = get().shopItems;
                const item = items.find(i => i.id === itemId);
                if (!item) return { success: false, message: '아이템을 찾을 수 없습니다.' };
                if (item.stock <= 0) return { success: false, message: '품절된 상품입니다.' };

                // spendStars is a callback that deducts stars from progressStore
                const result = spendStars(studentId, item.price);
                if (!result) return { success: false, message: '별이 부족합니다.' };

                set(state => ({
                    shopItems: state.shopItems.map(i =>
                        i.id === itemId ? { ...i, stock: i.stock - 1 } : i
                    ),
                    purchases: [...state.purchases, {
                        studentId,
                        studentName: studentName || studentId,
                        itemId: item.id,
                        itemName: item.name,
                        itemIcon: item.icon,
                        price: item.price,
                        timestamp: Date.now(),
                        status: 'pending', // pending | delivered
                    }],
                }));
                return { success: true, message: `${item.name}을(를) 구매했습니다!` };
            },

            // Get purchase history for a student
            getStudentPurchases: (studentId) => {
                return get().purchases.filter(p => p.studentId === studentId);
            },

            // Admin: get all pending purchases
            getPendingPurchases: () => {
                return get().purchases.filter(p => p.status === 'pending');
            },

            // Admin: mark purchase as delivered
            deliverPurchase: (index) => {
                set(state => ({
                    purchases: state.purchases.map((p, i) =>
                        i === index ? { ...p, status: 'delivered' } : p
                    ),
                }));
            },

            // Admin: update shop items
            updateShopItems: (newItems) => {
                set({ shopItems: newItems });
            },

            // Admin: add new item
            addShopItem: (item) => {
                set(state => ({
                    shopItems: [...state.shopItems, { ...item, id: `custom-${Date.now()}` }],
                }));
            },

            // Admin: remove item
            removeShopItem: (itemId) => {
                set(state => ({
                    shopItems: state.shopItems.filter(i => i.id !== itemId),
                }));
            },
        }),
        { name: 'starquest-marketplace' }
    )
);

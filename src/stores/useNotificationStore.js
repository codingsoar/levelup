import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotificationStore = create(
    persist(
        (set, get) => ({
            // Array of notification objects:
            // { id, from, to (studentId | 'all' | 'class:courseId'), title, message, timestamp, readBy: [] }
            notifications: [],

            // Send a notification from admin
            sendNotification: ({ to, title, message, courseName }) => {
                const notif = {
                    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    from: 'admin',
                    to, // studentId, 'all', or 'class:courseId'
                    title,
                    message,
                    courseName: courseName || null,
                    timestamp: Date.now(),
                    readBy: [],
                };
                set(state => ({ notifications: [notif, ...state.notifications] }));
            },

            // Mark a notification as read by a student
            markAsRead: (notifId, studentId) => {
                set(state => ({
                    notifications: state.notifications.map(n =>
                        n.id === notifId && !n.readBy.includes(studentId)
                            ? { ...n, readBy: [...n.readBy, studentId] }
                            : n
                    ),
                }));
            },

            // Mark all notifications as read for a student
            markAllAsRead: (studentId) => {
                set(state => ({
                    notifications: state.notifications.map(n =>
                        !n.readBy.includes(studentId)
                            ? { ...n, readBy: [...n.readBy, studentId] }
                            : n
                    ),
                }));
            },

            // Delete a notification (admin only)
            deleteNotification: (notifId) => {
                set(state => ({
                    notifications: state.notifications.filter(n => n.id !== notifId),
                }));
            },

            // Get notifications visible to a specific student
            getStudentNotifications: (studentId, courseIds = []) => {
                return get().notifications.filter(n => {
                    if (n.to === 'all') return true;
                    if (n.to === studentId) return true;
                    if (n.to.startsWith('class:')) {
                        const courseId = n.to.replace('class:', '');
                        return courseIds.includes(courseId);
                    }
                    return false;
                });
            },

            // Count unread for a student
            getUnreadCount: (studentId, courseIds = []) => {
                return get().notifications.filter(n => {
                    const visible = n.to === 'all' || n.to === studentId ||
                        (n.to.startsWith('class:') && courseIds.includes(n.to.replace('class:', '')));
                    return visible && !n.readBy.includes(studentId);
                }).length;
            },
        }),
        { name: 'starquest-notifications' }
    )
);

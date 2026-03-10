import { useEffect } from 'react';
import { sseClient, SSEEventName } from '../services/sseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * useSSE – subscribe to one or more SSE events from the backend /events stream.
 *
 * The hook:
 *   1. Acquires the shared singleton SSE connection on mount, releases it on unmount.
 *   2. Only subscribes while the user is authenticated (SSE stream carries no auth,
 *      but there is no point refreshing data when logged out).
 *   3. Registers named event listeners via the sseClient singleton.
 *
 * @param handlers  An object mapping event names to callback functions.
 *
 * @example
 *   useSSE({
 *     'booking-created': () => refreshBookings(),
 *     'user-created':    () => fetchStudentCount(),
 *   });
 */
export function useSSE(handlers: Partial<Record<SSEEventName, (payload: Record<string, unknown>) => void>>): void {
    const { user } = useAuth();

    useEffect(() => {
        // Don't open a connection when not logged in
        if (!user) return;

        // Acquire a reference – opens the EventSource if this is the first subscriber
        sseClient.acquire();

        // Register all handlers
        const unsubscribers = Object.entries(handlers).map(([event, handler]) =>
            sseClient.on(event as SSEEventName, handler as (payload: Record<string, unknown>) => void)
        );

        return () => {
            // Unregister all handlers
            unsubscribers.forEach((unsub) => unsub());
            // Release the reference – closes EventSource when last subscriber leaves
            sseClient.release();
        };
        // handlers are re-created each render; we intentionally only re-subscribe
        // when the user changes (login / logout).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);
}

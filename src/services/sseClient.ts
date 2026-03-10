/**
 * SSE Client Service
 * Manages a single persistent Server-Sent Events connection to the backend /events endpoint.
 * Provides auto-reconnect with exponential back-off.
 */
import { API_URL } from './api';

export type SSEEventName =
    | 'connected'
    | 'user-created'
    | 'user-deleted'
    | 'booking-created'
    | 'booking-updated'
    | 'feedback-created';

type SSEListener = (payload: Record<string, unknown>) => void;

class SSEClient {
    private es: EventSource | null = null;
    private listeners = new Map<SSEEventName, Set<SSEListener>>();
    private reconnectDelay = 1000; // ms – doubles on each failed attempt (max 30 s)
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalClose = false;
    private refCount = 0; // number of React components/hooks using this client

    /** Subscribe to a specific event. Returns an unsubscribe function. */
    on(event: SSEEventName, handler: SSEListener): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
        return () => this.off(event, handler);
    }

    off(event: SSEEventName, handler: SSEListener): void {
        this.listeners.get(event)?.delete(handler);
    }

    /** Call when a consumer mounts. Opens the connection if not already open. */
    acquire(): void {
        this.refCount++;
        if (this.refCount === 1) {
            this.connect();
        }
    }

    /** Call when a consumer unmounts. Closes the connection when no consumers remain. */
    release(): void {
        this.refCount = Math.max(0, this.refCount - 1);
        if (this.refCount === 0) {
            this.close();
        }
    }

    private connect(): void {
        if (this.es && this.es.readyState !== EventSource.CLOSED) return;

        // EventSource doesn't support custom headers, so pass token via query param
        const token = localStorage.getItem('token');
        if (!token) {
            // No token yet (user not logged in) — skip SSE connection
            return;
        }

        this.intentionalClose = false;
        try {
            this.es = new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`);
        } catch (err) {
            console.warn('[SSE] EventSource not supported or failed to create:', err);
            return;
        }

        // Named events from the server
        const namedEvents: SSEEventName[] = [
            'connected',
            'user-created',
            'user-deleted',
            'booking-created',
            'booking-updated',
            'feedback-created',
        ];

        namedEvents.forEach((name) => {
            this.es!.addEventListener(name, (e: MessageEvent) => {
                this.reconnectDelay = 1000; // reset back-off on success
                try {
                    const payload = JSON.parse(e.data) as Record<string, unknown>;
                    this.listeners.get(name)?.forEach((fn) => fn(payload));
                } catch {
                    // non-JSON data (e.g. keep-alive ping) – ignore silently
                }
            });
        });

        this.es.onerror = () => {
            if (this.intentionalClose) return;
            console.warn(`[SSE] Connection lost. Reconnecting in ${this.reconnectDelay / 1000}s…`);
            this.es?.close();
            this.es = null;
            this.scheduleReconnect();
        };
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (!this.intentionalClose && this.refCount > 0) {
                this.connect();
            }
            // Exponential back-off capped at 30 seconds
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
        }, this.reconnectDelay);
    }

    private close(): void {
        this.intentionalClose = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.es?.close();
        this.es = null;
        this.reconnectDelay = 1000;
    }

    get isConnected(): boolean {
        return this.es?.readyState === EventSource.OPEN;
    }
}

/** Singleton SSE client – shared across the whole app */
export const sseClient = new SSEClient();

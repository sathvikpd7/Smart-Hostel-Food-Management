import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { pushNotificationService } from './services/pushNotification';
import AdminApp from './AdminApp';

// Initialize push notification service
pushNotificationService.initialize().then((initialized) => {
    if (initialized) {
        console.log('Push notification service initialized');
    }
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const root = createRoot(rootEl);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            {/*
        HashRouter is used intentionally for the admin app.
        This means the browser URL is: /admin.html#/admin/dashboard
        On refresh, the server only sees "/admin.html" (before the #)
        and correctly serves admin.html every time.
        No special Vite middleware or server rules needed.
      */}
            <HashRouter
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                }}
            >
                <AdminApp />
            </HashRouter>
        </ErrorBoundary>
    </React.StrictMode>
);

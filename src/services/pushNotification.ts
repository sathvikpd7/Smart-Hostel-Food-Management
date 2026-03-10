/**
 * Push Notification Service
 * Manages browser push notifications for meal reminders
 */

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Check current permission
      this.permission = Notification.permission;

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Show a local notification (doesn't require push subscription)
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Notifications are not enabled');
      return;
    }

    if (!this.registration) {
      console.error('Service Worker not registered');
      return;
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: payload.tag || 'general-notification',
        requireInteraction: false,
        data: payload.data || {},
      } as NotificationOptions);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Schedule a notification for upcoming meal
   */
  scheduleMealNotification(mealType: string, mealTime: string, minutesBefore: number = 30): void {
    if (!this.isEnabled()) {
      return;
    }

    const [startTime] = mealTime.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    
    const now = new Date();
    const mealDate = new Date();
    mealDate.setHours(hours || 0, minutes || 0, 0, 0);
    
    // Calculate notification time
    const notificationTime = new Date(mealDate.getTime() - minutesBefore * 60000);
    
    // Only schedule if notification time is in the future
    if (notificationTime > now) {
      const delay = notificationTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.showNotification({
          title: `Upcoming ${mealType} Reminder`,
          body: `Your ${mealType} is ready in ${minutesBefore} minutes at ${mealTime}`,
          tag: `meal-${mealType}-${Date.now()}`,
          data: {
            type: 'meal-reminder',
            mealType,
            mealTime
          }
        });
      }, delay);
      
      console.log(`Meal notification scheduled for ${notificationTime.toLocaleTimeString()}`);
    }
  }

  /**
   * Notify about booking confirmation
   */
  notifyBookingConfirmed(mealType: string, mealDate: string): void {
    this.showNotification({
      title: 'Booking Confirmed! ✅',
      body: `Your ${mealType} for ${mealDate} has been booked successfully`,
      tag: 'booking-confirmation',
      data: {
        type: 'booking-confirmation',
        mealType,
        mealDate
      }
    });
  }

  /**
   * Notify about booking cancellation
   */
  notifyBookingCancelled(mealType: string, mealDate: string): void {
    this.showNotification({
      title: 'Booking Cancelled',
      body: `Your ${mealType} booking for ${mealDate} has been cancelled`,
      tag: 'booking-cancellation',
      data: {
        type: 'booking-cancellation',
        mealType,
        mealDate
      }
    });
  }

  /**
   * Notify about upcoming meals for the day
   */
  notifyDailyMeals(meals: Array<{ type: string; time: string }>): void {
    const mealList = meals.map(m => `${m.type} at ${m.time}`).join(', ');
    this.showNotification({
      title: 'Today\'s Meals',
      body: `You have meals booked today: ${mealList}`,
      tag: 'daily-meals',
      data: {
        type: 'daily-meals',
        meals
      }
    });
  }

  /**
   * Close all notifications with a specific tag
   */
  async closeNotificationsByTag(tag: string): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Error closing notifications:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

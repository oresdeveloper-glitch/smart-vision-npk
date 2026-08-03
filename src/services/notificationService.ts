export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'scan_reminder' | 'fertilizer_reminder' | 'tip' | 'system';
  timestamp: number;
  read: boolean;
}

const NOTIF_KEY = 'npk_notifications';

export function getNotifications(): Notification[] {
  const stored = localStorage.getItem(NOTIF_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addNotification(title: string, body: string, type: Notification['type']): void {
  const notifications = getNotifications();
  notifications.unshift({
    id: 'notif_' + Date.now(),
    title,
    body,
    type,
    timestamp: Date.now(),
    read: false,
  });
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
}

export function markAsRead(id: string): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
}

export function clearNotifications(): void {
  localStorage.setItem(NOTIF_KEY, '[]');
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

export function scheduleReminders(): void {
  // Set up periodic reminders (simulated - in real app uses service workers)
  const lastReminder = localStorage.getItem('npk_last_reminder');
  const now = Date.now();
  if (!lastReminder || now - parseInt(lastReminder) > 24 * 60 * 60 * 1000) {
    addNotification(
      'Check Your Crops',
      'Time to scan your leaves and monitor crop health.',
      'scan_reminder'
    );
    localStorage.setItem('npk_last_reminder', now.toString());
  }
}

export function requestNotificationPermission(): boolean {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  return false;
}

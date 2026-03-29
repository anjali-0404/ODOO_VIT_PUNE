export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'app_notifications';
const EVENT_NAME = 'app-notifications-updated';

const readNotifications = (): AppNotification[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
};

const writeNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event(EVENT_NAME));
};

export const getNotifications = (): AppNotification[] => {
  return readNotifications().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const pushNotification = (payload: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
  const existing = readNotifications();
  const next: AppNotification = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
    ...payload,
  };

  writeNotifications([next, ...existing].slice(0, 50));
};

export const markAllNotificationsRead = () => {
  const updated = readNotifications().map((item) => ({ ...item, read: true }));
  writeNotifications(updated);
};

export const subscribeNotifications = (handler: () => void) => {
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
};

export const getRelativeNotificationTime = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

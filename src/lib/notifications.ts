'use client';

export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function notifyCouple(title: string, body: string, url = '/departamento?tab=pagos') {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if (navigator.serviceWorker?.controller) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url },
        tag: `aym-${url}-${title}`,
      });
      return true;
    }
    new Notification(title, { body, icon: '/icon-192.png' });
    return true;
  } catch (err) {
    console.warn('Could not show notification:', err);
    return false;
  }
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standalone || iosStandalone;
}

export function detectInstallPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

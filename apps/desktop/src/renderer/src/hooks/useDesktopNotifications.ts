import { useCallback } from "react";

export function useDesktopNotifications() {
  const sendNotification = useCallback(
    async (title: string, body: string, icon?: string): Promise<boolean> => {
      try {
        if (window.electronAPI?.showNotification) {
          return await window.electronAPI.showNotification({
            title,
            body,
            icon,
            silent: false,
          });
        }

        // Web Notification API fallback
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification(title, { body });
            return true;
          } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              new Notification(title, { body });
              return true;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to dispatch notification:", err);
      }
      return false;
    },
    []
  );

  return { sendNotification };
}

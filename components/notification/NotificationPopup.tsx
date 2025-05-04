"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const NotificationPopup = (): null => {
  useEffect(() => {
    const handler = (event: CustomEvent<{ message: string }>) => {
      const { message } = event.detail;
      toast(message); // Show notification toast
    };

    window.addEventListener("new-notification", handler as EventListener);

    return () => {
      window.removeEventListener("new-notification", handler as EventListener);
    };
  }, []);

  return null;
};

export default NotificationPopup;
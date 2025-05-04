"use client";

import { useEffect } from "react";
import { connectSocket } from "@/lib/websocket";

const WebSocketInitializer = (): null => {
  useEffect(() => {
    connectSocket(); // Connect to WebSocket when the app loads
  }, []);

  return null;
};

export default WebSocketInitializer;
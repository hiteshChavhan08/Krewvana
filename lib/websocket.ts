import { io, Socket } from "socket.io-client";

let socket: Socket;

export function connectSocket() {
  socket = io("http://localhost:4000"); // This is Socket.IO, not native WS

  socket.on("connect", () => {
    console.log("✅ Connected to WebSocket server");
  });

  socket.on("notification", (data: string) => {
    // Check if the 'isSignedIn' flag is in localStorage and is set to 'true'
    const isSignedIn = localStorage.getItem("isSignedIn");

    if (isSignedIn === "true") {
      console.log("📩 Received notification:", data);

      const event = new CustomEvent("new-notification", {
        detail: { message: data },
      });

      window.dispatchEvent(event);
    } else {
      console.log("❌ Notification ignored. User is not signed in.");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from WebSocket server");
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Connection error:", err.message);
  });
}
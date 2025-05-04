// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const amqp = require("amqplib");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] }, // CORS for WebSocket
// });

// const QUEUE_NAME = "notifications"; // RabbitMQ queue for notifications
// const RABBIT_URL = "amqp://localhost"; // Your RabbitMQ URL

// // Function to start the WebSocket server and RabbitMQ consumer
// async function start() {
//   // Connect to RabbitMQ
//   const conn = await amqp.connect(RABBIT_URL);
//   const ch = await conn.createChannel();
//   await ch.assertQueue(QUEUE_NAME);

//   // Consume messages from RabbitMQ queue
//   ch.consume(QUEUE_NAME, (msg) => {
//     if (msg) {
//       const data = msg.content.toString(); // Get the message from RabbitMQ
//       console.log("📩 From queue:", data);
//       io.emit("notification", data); // Broadcast message to all WebSocket clients
//       ch.ack(msg); // Acknowledge the message
//     }
//   });

//   // WebSocket connection event
//   io.on("connection", (socket) => {
//     console.log("✅ Client connected to WebSocket server");
//   });

//   // Start the WebSocket server
//   server.listen(4000, () => {
//     console.log("🚀 WebSocket server running on http://localhost:4000");
//   });
// }

// // Start the WebSocket server and RabbitMQ consumer
// start().catch(console.error);

// // Send a test message to RabbitMQ after 3 seconds (optional for testing)
// setTimeout(async () => {
//   const conn = await amqp.connect(RABBIT_URL);
//   const ch = await conn.createChannel();
//   await ch.assertQueue(QUEUE_NAME);
//   ch.sendToQueue(QUEUE_NAME, Buffer.from("Hello from RabbitMQ! This is a test notification."));
//   console.log("📨 Sent test message to RabbitMQ queue");
// }, 3000);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const amqp = require("amqplib");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }, // CORS for WebSocket
});

const QUEUE_NAME = "notifications"; // RabbitMQ queue for notifications
const RABBIT_URL = "amqp://localhost"; // Your RabbitMQ URL

// Function to start the WebSocket server and RabbitMQ consumer
async function start() {
  // Connect to RabbitMQ
  const conn = await amqp.connect(RABBIT_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE_NAME);

  // Consume messages from RabbitMQ queue
  ch.consume(QUEUE_NAME, (msg) => {
    if (msg) {
      const data = msg.content.toString(); // Get the message from RabbitMQ
      console.log("📩 From queue:", data);
      io.emit("notification", data); // Broadcast message to all WebSocket clients
      ch.ack(msg); // Acknowledge the message
    }
  });

  // WebSocket connection event
  io.on("connection", (socket) => {
    console.log("✅ Client connected to WebSocket server");
  });

  // Start the WebSocket server
  server.listen(4000, () => {
    console.log("🚀 WebSocket server running on http://localhost:4000");
  });
}

// Function to send funny meme messages at intervals
function sendFunnyMessagesLoop() {
  const memeMessages = [
    "😵‍💫 Me: I'll fix that bug in 5 minutes. Also me: 3 hours later...",
    "🧪 QA: 'Found a bug.' Dev: 'Feature, not a bug.'",
    "☕ Coffee first, then the code compiles. That's the rule.",
    "🙃 Git commit message: 'final_final_v2_reallyFinal_fix'",
    "🤡 Me explaining why the bug is not my fault during standup.",
    "😬 Code works on my machine. Must be a *you* problem.",
    "📉 Me deleting one line of code: *build fails in 47 places*",
    "🚀 Pushed to prod on Friday. Pray for me.",
    "💻 Ctrl+C, Ctrl+V – innovation at its finest.",
    "🔥 Why write clean code when you can write emotional code?"
  ];  

  let index = 0;

  setInterval(async () => {
    const message = memeMessages[index % memeMessages.length];
    try {
      const conn = await amqp.connect(RABBIT_URL);
      const ch = await conn.createChannel();
      await ch.assertQueue(QUEUE_NAME);
      ch.sendToQueue(QUEUE_NAME, Buffer.from(message));
      console.log("📨 Sent meme message:", message);
      await ch.close();
      await conn.close();
    } catch (err) {
      console.error("❌ Failed to send meme message:", err);
    }
    index++;
  }, 5000); // every 5 seconds
}

// Start the WebSocket server and RabbitMQ consumer
start()
  .then(() => {
    sendFunnyMessagesLoop(); // Start meme message loop
  })
  .catch(console.error);
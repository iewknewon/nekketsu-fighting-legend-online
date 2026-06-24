const ioModule = require("../node_modules/socket.io/client-dist/socket.io.js");

const io = typeof ioModule === "function" ? ioModule : ioModule.io;
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const gameId = Number(process.env.NEKKETSU_GAME_ID || 741992);
const roomId = `room-advanced-${Date.now()}`;
const domain = process.env.NEKKETSU_DOMAIN || "localhost:3001";

function connectClient(label) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      transports: ["websocket"],
      timeout: 5000,
    });

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (error) => reject(new Error(`${label}: ${error.message}`)));
  });
}

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (...args) => {
      const [error, data] = args;
      if (error) {
        reject(new Error(String(error)));
        return;
      }
      resolve(data);
    });
  });
}

function waitFor(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);

    function handler(payload) {
      clearTimeout(timer);
      resolve(payload);
    }

    socket.once(event, handler);
  });
}

function buildExtra(userid, playerName) {
  return {
    domain,
    game_id: gameId,
    room_name: "Advanced Smoke Room",
    player_name: playerName,
    userid,
    sessionid: roomId,
  };
}

async function main() {
  const host = await connectClient("host");
  const guest2 = await connectClient("guest2");
  const guest3 = await connectClient("guest3");
  const guest4 = await connectClient("guest4");
  const guest5 = await connectClient("guest5");

  try {
    await emitAck(host, "open-room", {
      extra: buildExtra("host-user", "Host"),
      maxPlayers: 4,
      password: "",
    });

    await emitAck(guest2, "join-room", { extra: buildExtra("guest-2", "Guest 2"), password: "" });
    await emitAck(guest3, "join-room", { extra: buildExtra("guest-3", "Guest 3"), password: "" });
    const roomUsers = await emitAck(guest4, "join-room", { extra: buildExtra("guest-4", "Guest 4"), password: "" });

    if (Object.keys(roomUsers).length !== 4) {
      throw new Error(`Expected 4 users after joins, got ${Object.keys(roomUsers).length}`);
    }

    let joinFailed = false;
    try {
      await emitAck(guest5, "join-room", { extra: buildExtra("guest-5", "Guest 5"), password: "" });
    } catch (error) {
      if (String(error.message).includes("Room is full")) {
        joinFailed = true;
      } else {
        throw error;
      }
    }

    if (!joinFailed) {
      throw new Error("Fifth player unexpectedly joined a 4-player room");
    }

    const signalPromise = waitFor(guest2, "webrtc-signal");
    host.emit("webrtc-signal", { target: guest2.id, offer: { type: "offer", sdp: "fake-sdp" } });
    const signal = await signalPromise;
    if (!signal.sender || !signal.offer || signal.offer.type !== "offer") {
      throw new Error("WebRTC signal relay payload was incomplete");
    }

    const dataMessagePromise = waitFor(guest3, "data-message");
    host.emit("data-message", { ping: "pong" });
    const dataMessage = await dataMessagePromise;
    if (!dataMessage || dataMessage.ping !== "pong") {
      throw new Error("Data message relay failed");
    }

    const disconnectWaiters = [
      waitFor(guest2, "disconnect"),
      waitFor(guest3, "disconnect"),
      waitFor(guest4, "disconnect"),
    ];
    host.disconnect();
    await Promise.all(disconnectWaiters);

    const listResponse = await fetch(`${baseUrl}/list?domain=${encodeURIComponent(domain)}&game_id=${gameId}`);
    const listJson = await listResponse.json();
    if (listJson[roomId]) {
      throw new Error("Room still existed after host disconnect");
    }

    console.log(
      JSON.stringify({
        ok: true,
        roomId,
        capacityChecked: true,
        signalRelay: true,
        dataRelay: true,
        hostDisconnectCleanup: true,
      })
    );
  } finally {
    for (const socket of [host, guest2, guest3, guest4, guest5]) {
      try {
        socket.disconnect();
      } catch (_error) {}
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});

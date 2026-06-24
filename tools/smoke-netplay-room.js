const ioModule = require("../node_modules/socket.io/client-dist/socket.io.js");

const io = typeof ioModule === "function" ? ioModule : ioModule.io;
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const gameId = Number(process.env.NEKKETSU_GAME_ID || 741992);
const roomId = `room-${Date.now()}`;
const domain = process.env.NEKKETSU_DOMAIN || "localhost:3001";

function once(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

function connectClient(name) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      transports: ["websocket"],
      timeout: 5000,
    });

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
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

async function main() {
  const host = await connectClient("host");
  const guest = await connectClient("guest");

  try {
    const hostUsersUpdated = once(host, "users-updated");

    await emitAck(host, "open-room", {
      extra: {
        domain,
        game_id: gameId,
        room_name: "Smoke Room",
        player_name: "Host",
        userid: "host-user",
        sessionid: roomId,
      },
      maxPlayers: 4,
      password: "",
    });

    const hostUsers = await hostUsersUpdated;
    if (!hostUsers["host-user"]) {
      throw new Error("Host did not receive expected users-updated payload");
    }

    const listResponse = await fetch(`${baseUrl}/list?domain=${encodeURIComponent(domain)}&game_id=${gameId}`);
    const listJson = await listResponse.json();
    if (!listJson[roomId] || listJson[roomId].current !== 1 || listJson[roomId].max !== 4) {
      throw new Error("Room list did not contain expected room state");
    }

    const guestUsersUpdated = once(guest, "users-updated");
    const guestJoinPayload = await emitAck(guest, "join-room", {
      extra: {
        domain,
        game_id: gameId,
        room_name: "Smoke Room",
        player_name: "Guest",
        userid: "guest-user",
        sessionid: roomId,
      },
      password: "",
    });

    const guestUsers = await guestUsersUpdated;
    const mergedUsers = guestJoinPayload || guestUsers;
    if (!mergedUsers["host-user"] || !mergedUsers["guest-user"]) {
      throw new Error("Join response/users-updated missing host or guest");
    }

    console.log(
      JSON.stringify({
        ok: true,
        roomId,
        users: Object.keys(mergedUsers),
        current: Object.keys(mergedUsers).length,
      })
    );
  } finally {
    host.disconnect();
    guest.disconnect();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});

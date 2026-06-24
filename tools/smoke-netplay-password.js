const ioModule = require("../node_modules/socket.io/client-dist/socket.io.js");

const io = typeof ioModule === "function" ? ioModule : ioModule.io;
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
const gameId = Number(process.env.NEKKETSU_GAME_ID || 741992);
const roomId = `room-password-${Date.now()}`;
const domain = process.env.NEKKETSU_DOMAIN || "localhost:3001";
const password = "abc123";

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

function buildExtra(userid, playerName) {
  return {
    domain,
    game_id: gameId,
    room_name: "Password Room",
    player_name: playerName,
    userid,
    sessionid: roomId,
  };
}

async function main() {
  const host = await connectClient("host");
  const guest = await connectClient("guest");

  try {
    await emitAck(host, "open-room", {
      extra: buildExtra("host-user", "Host"),
      maxPlayers: 4,
      password,
    });

    let wrongPasswordRejected = false;
    try {
      await emitAck(guest, "join-room", {
        extra: buildExtra("guest-user", "Guest"),
        password: "wrong",
      });
    } catch (error) {
      if (String(error.message).includes("Incorrect password")) {
        wrongPasswordRejected = true;
      } else {
        throw error;
      }
    }

    if (!wrongPasswordRejected) {
      throw new Error("Wrong password was not rejected");
    }

    const users = await emitAck(guest, "join-room", {
      extra: buildExtra("guest-user", "Guest"),
      password,
    });

    if (!users["host-user"] || !users["guest-user"]) {
      throw new Error("Password-protected join did not return both users");
    }

    console.log(
      JSON.stringify({
        ok: true,
        roomId,
        wrongPasswordRejected: true,
        correctPasswordAccepted: true,
      })
    );
  } finally {
    try { host.disconnect(); } catch (_error) {}
    try { guest.disconnect(); } catch (_error) {}
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});

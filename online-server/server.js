const crypto = require("crypto");
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 3001);
const GAME_ID = Number(process.env.NEKKETSU_GAME_ID || 741992);
const DEFAULT_STUN_URLS = "stun:stun.l.google.com:19302";

const app = express();
app.set("trust proxy", true);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: false,
  },
});

const rooms = new Map();

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sanitizeText(value, fallback, maxLength = 32) {
  const safeValue = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  return safeValue || fallback;
}

function buildIceServers() {
  const stunUrls = splitCsv(process.env.NETPLAY_STUN_URLS || DEFAULT_STUN_URLS);
  const iceServers = [];

  if (stunUrls.length > 0) {
    iceServers.push({ urls: stunUrls });
  }

  const turnUrls = splitCsv(process.env.NETPLAY_TURN_URLS || "");
  if (turnUrls.length > 0) {
    const turnServer = {
      urls: turnUrls,
    };

    if (process.env.NETPLAY_TURN_USERNAME) {
      turnServer.username = process.env.NETPLAY_TURN_USERNAME;
    }

    if (process.env.NETPLAY_TURN_CREDENTIAL) {
      turnServer.credential = process.env.NETPLAY_TURN_CREDENTIAL;
    }

    iceServers.push(turnServer);
  }

  return iceServers;
}

function getPublicOrigin(req) {
  if (process.env.NETPLAY_PUBLIC_ORIGIN) {
    return process.env.NETPLAY_PUBLIC_ORIGIN.replace(/\/+$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

function normalizeExtra(extra, socketId, roomId) {
  const normalizedGameId = Number(extra && extra.game_id);

  return {
    domain: sanitizeText(extra && extra.domain, "", 120),
    game_id: Number.isFinite(normalizedGameId) ? normalizedGameId : GAME_ID,
    room_name: sanitizeText(extra && extra.room_name, "Nekketsu Room", 40),
    player_name: sanitizeText(extra && extra.player_name, "Player", 20),
    userid: sanitizeText(extra && extra.userid, crypto.randomUUID(), 64),
    sessionid: sanitizeText(extra && extra.sessionid, roomId, 64),
    socketId,
  };
}

class Room {
  constructor(roomId, ownerSocketId, extra, maxPlayers, password) {
    this.id = roomId;
    this.ownerSocketId = ownerSocketId;
    this.maxPlayers = Math.min(Math.max(Number(maxPlayers) || 2, 2), 4);
    this.password = String(password || "").slice(0, 20);
    this.domain = extra.domain;
    this.gameId = extra.game_id;
    this.roomName = extra.room_name;
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.users = {};
    this.userOrder = [];

    this.addUser(ownerSocketId, extra);
  }

  addUser(socketId, extra) {
    let userId = extra.userid;
    while (this.users[userId]) {
      userId = `${extra.userid}-${crypto.randomBytes(2).toString("hex")}`;
    }

    const user = {
      ...extra,
      userid: userId,
      sessionid: this.id,
      room_name: this.roomName,
      socketId,
    };

    this.users[userId] = user;
    this.userOrder.push(userId);
    this.updatedAt = Date.now();

    return user;
  }

  removeSocket(socketId) {
    const userId = this.userOrder.find((id) => {
      return this.users[id] && this.users[id].socketId === socketId;
    });

    if (!userId) {
      return null;
    }

    const removedUser = this.users[userId];
    delete this.users[userId];
    this.userOrder = this.userOrder.filter((id) => id !== userId);
    this.updatedAt = Date.now();

    return removedUser;
  }

  hasSocket(socketId) {
    return this.userOrder.some((id) => this.users[id] && this.users[id].socketId === socketId);
  }

  isOwnerSocket(socketId) {
    return this.ownerSocketId === socketId;
  }

  isFull() {
    return this.userOrder.length >= this.maxPlayers;
  }

  isEmpty() {
    return this.userOrder.length === 0;
  }

  toRoomListEntry() {
    return {
      room_name: this.roomName,
      current: this.userOrder.length,
      max: this.maxPlayers,
      hasPassword: Boolean(this.password),
    };
  }

  toUsersPayload() {
    const orderedUsers = {};
    for (const userId of this.userOrder) {
      if (this.users[userId]) {
        orderedUsers[userId] = this.users[userId];
      }
    }
    return orderedUsers;
  }
}

function getSocketRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) {
    return null;
  }

  return rooms.get(roomId) || null;
}

function emitUsersUpdated(room) {
  io.to(room.id).emit("users-updated", room.toUsersPayload());
}

function removeRoom(roomId) {
  rooms.delete(roomId);
}

function closeRoom(room, excludeSocketId = null) {
  const socketIds = Array.from(io.sockets.adapter.rooms.get(room.id) || []);

  removeRoom(room.id);

  for (const socketId of socketIds) {
    const peerSocket = io.sockets.sockets.get(socketId);
    if (!peerSocket) {
      continue;
    }

    peerSocket.data.roomId = null;
    peerSocket.data.userId = null;
    peerSocket.leave(room.id);

    if (socketId !== excludeSocketId) {
      peerSocket.disconnect(true);
    }
  }
}

function leaveCurrentRoom(socket) {
  const room = getSocketRoom(socket);
  if (!room) {
    socket.data.roomId = null;
    socket.data.userId = null;
    return;
  }

  const isOwner = room.isOwnerSocket(socket.id);
  room.removeSocket(socket.id);

  socket.leave(room.id);
  socket.data.roomId = null;
  socket.data.userId = null;

  if (isOwner) {
    closeRoom(room, socket.id);
    return;
  }

  if (room.isEmpty()) {
    removeRoom(room.id);
    return;
  }

  emitUsersUpdated(room);
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    rooms: rooms.size,
    port: PORT,
  });
});

app.get("/list", (req, res) => {
  const gameId = Number(req.query.game_id);
  const response = {};

  for (const [roomId, room] of rooms.entries()) {
    if (Number.isFinite(gameId) && room.gameId !== gameId) {
      continue;
    }

    if (room.isEmpty()) {
      continue;
    }

    response[roomId] = room.toRoomListEntry();
  }

  res.json(response);
});

app.get("/online-config.js", (req, res) => {
  const config = {
    romUrl: "/nekketsu-fighting-legend-cn.nes",
    netplayServer: getPublicOrigin(req),
    gameId: GAME_ID,
    iceServers: buildIceServers(),
    nesCores: ["fceumm", "nestopia"],
    defaultNesCore: String(process.env.NEKKETSU_NES_CORE || "fceumm"),
  };

  res.type("application/javascript");
  res.send(`window.NEKKETSU_ONLINE_CONFIG = ${JSON.stringify(config, null, 2)};`);
});

app.use(
  "/emulatorjs",
  express.static(path.join(ROOT_DIR, "vendor", "emulatorjs"))
);
app.use("/emulatorjs/cores/fceumm", express.static(path.join(ROOT_DIR, "node_modules", "@emulatorjs", "core-fceumm")));
app.use("/emulatorjs/cores/nestopia", express.static(path.join(ROOT_DIR, "node_modules", "@emulatorjs", "core-nestopia")));
app.get("/", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "online.html"));
});

app.use(
  express.static(ROOT_DIR, {
    index: false,
  })
);

io.on("connection", (socket) => {
  socket.data.roomId = null;
  socket.data.userId = null;

  socket.on("open-room", (payload, callback = () => {}) => {
    try {
      leaveCurrentRoom(socket);

      const requestedRoomId = sanitizeText(
        payload && payload.extra && payload.extra.sessionid,
        crypto.randomUUID(),
        64
      );

      if (rooms.has(requestedRoomId)) {
        callback("Room already exists");
        return;
      }

      const extra = normalizeExtra(payload && payload.extra, socket.id, requestedRoomId);
      const room = new Room(
        requestedRoomId,
        socket.id,
        extra,
        payload && payload.maxPlayers,
        payload && payload.password
      );

      rooms.set(room.id, room);
      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.userId = extra.userid;

      emitUsersUpdated(room);
      callback(null);
    } catch (error) {
      callback(error.message || "Failed to create room");
    }
  });

  socket.on("join-room", (payload, callback = () => {}) => {
    try {
      leaveCurrentRoom(socket);

      const requestedRoomId = sanitizeText(
        payload && payload.extra && payload.extra.sessionid,
        "",
        64
      );
      const room = rooms.get(requestedRoomId);

      if (!room) {
        callback("Room not found");
        return;
      }

      if (room.isFull()) {
        callback("Room is full");
        return;
      }

      const suppliedPassword = String((payload && payload.password) || "");
      if (room.password && room.password !== suppliedPassword) {
        callback("Incorrect password");
        return;
      }

      const extra = normalizeExtra(payload && payload.extra, socket.id, requestedRoomId);
      if (extra.game_id !== room.gameId) {
        callback("Game mismatch");
        return;
      }

      const user = room.addUser(socket.id, extra);

      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.userId = user.userid;

      emitUsersUpdated(room);
      callback(null, room.toUsersPayload());
    } catch (error) {
      callback(error.message || "Failed to join room");
    }
  });

  socket.on("leave-room", () => {
    leaveCurrentRoom(socket);
  });

  socket.on("data-message", (data) => {
    const room = getSocketRoom(socket);
    if (!room) {
      return;
    }

    socket.to(room.id).emit("data-message", data);
  });

  socket.on("webrtc-signal", (data = {}) => {
    const room = getSocketRoom(socket);
    if (!room) {
      return;
    }

    const targetSocketId = sanitizeText(data.target, "", 128);
    if (!targetSocketId) {
      return;
    }

    if (!room.hasSocket(targetSocketId)) {
      return;
    }

    io.to(targetSocketId).emit("webrtc-signal", {
      ...data,
      sender: socket.id,
    });
  });

  socket.on("disconnect", () => {
    leaveCurrentRoom(socket);
  });
});

setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60;

  for (const [roomId, room] of rooms.entries()) {
    if (room.updatedAt < cutoff || room.isEmpty()) {
      closeRoom(room);
    }
  }
}, 60_000);

server.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log("  Nekketsu Online Browser Netplay Server");
  console.log("==========================================");
  console.log(`HTTP        : http://localhost:${PORT}`);
  console.log(`Play Page   : http://localhost:${PORT}/`);
  console.log(`Health      : http://localhost:${PORT}/health`);
  console.log("==========================================");
  console.log("");
});

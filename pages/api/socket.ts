import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";
import { getToken } from "next-auth/jwt";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = async (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    console.log("New Socket.io server...");
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL,
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    res.socket.server.io = io;

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = await getToken({
          req: socket.request as any,
          secret: process.env.NEXTAUTH_SECRET
        });

        if (token) {
          socket.data.user = token;
          return next();
        }
        return next(new Error("Unauthorized"));
      } catch (err) {
        return next(new Error("Authentication error"));
      }
    });

    io.on("connection", (socket) => {
      console.log("Client connected", socket.id, "User:", socket.data.user?.email);

      socket.on("join-session", async (data) => {
        const { sessionId, studentId, enrollmentId } = data;

        // Authorization check
        if (socket.data.user.role === "STUDENT" && socket.data.user.id !== studentId) {
          return; // Unauthorized
        }

        socket.join(sessionId);
        socket.data = { ...socket.data, sessionId, studentId, enrollmentId };

        console.log(`Student ${studentId} joined session ${sessionId}`);

        // Broadcast to tutor
        socket.to(sessionId).emit("student-presence", {
          studentId,
          event: "JOIN",
          timestamp: new Date()
        });
      });

      socket.on("heartbeat", async (data) => {
        const { sessionId, studentId, enrollmentId } = data;

        // Broadcast to tutor for live timer updates
        socket.to(sessionId).emit("student-presence", {
          studentId,
          event: "HEARTBEAT",
          timestamp: new Date()
        });
      });

      socket.on("canvas-update", (data) => {
        // data: { roomId, studentId, exerciseId, state }
        socket.to(data.roomId).emit("canvas-update", data);
      });

      socket.on("help-request", (data) => {
        // data: { roomId, helpRequest }
        socket.to(data.roomId).emit("help-request", data);
      });

      socket.on("disconnect", () => {
        if (socket.data.sessionId && socket.data.studentId) {
          socket.to(socket.data.sessionId).emit("student-presence", {
            studentId: socket.data.studentId,
            event: "DISCONNECT",
            timestamp: new Date()
          });
        }
        console.log("Client disconnected", socket.id);
      });
    });
  }
  res.end();
};

export default SocketHandler;

import { createServer } from "http";
import { Server } from "socket.io";
import { NextResponse } from "next/server";

const ioHandler = (req: Request) => {
  if (!process.env.IO_SERVER) {
    const httpServer = createServer();
    const io = new Server(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on("offer", ({ roomId, offer }) => {
        socket.to(roomId).emit("offer", offer);
      });

      socket.on("answer", ({ roomId, answer }) => {
        socket.to(roomId).emit("answer", answer);
      });

      socket.on("ice-candidate", ({ roomId, candidate }) => {
        socket.to(roomId).emit("ice-candidate", candidate);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    // Start the server on a random port
    const port = parseInt(process.env.SOCKET_PORT || "3001");
    httpServer.listen(port, () => {
      console.log(`Socket.IO server running on port ${port}`);
    });

    process.env.IO_SERVER = "true";
  }

  return NextResponse.json({ success: true });
};

export { ioHandler as GET, ioHandler as POST };

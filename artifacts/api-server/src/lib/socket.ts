import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "./logger";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info({ id: socket.id }, "socket connected");

    socket.on("join_pdv", (sessaoId: string) => {
      if (typeof sessaoId === "string" && sessaoId.length > 0) {
        socket.join(`pdv:${sessaoId}`);
        socket.emit("joined", { sessaoId });
      }
    });

    socket.on("scanner:add", (data: { sessaoId: string; produto: unknown }) => {
      if (data?.sessaoId) {
        io?.to(`pdv:${data.sessaoId}`).emit("carrinho:add", { produto: data.produto });
      }
    });

    socket.on("scanner:novo", (data: { sessaoId: string; produto: unknown }) => {
      if (data?.sessaoId) {
        io?.to(`pdv:${data.sessaoId}`).emit("produto:novo", { produto: data.produto });
        io?.to(`pdv:${data.sessaoId}`).emit("carrinho:add", { produto: data.produto });
      }
    });

    socket.on("disconnect", () => {
      logger.debug({ id: socket.id }, "socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToPdv(sessaoId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`pdv:${sessaoId}`).emit(event, payload);
}

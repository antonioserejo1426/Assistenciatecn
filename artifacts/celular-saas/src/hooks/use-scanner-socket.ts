import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { Produto } from "@workspace/api-client-react";

export interface ScannerSocketHandlers {
  onAdd?: (produto: Produto) => void;
  onNovo?: (produto: Produto) => void;
}

export function useScannerSocket(
  sessaoId: string | null,
  handlers: ScannerSocketHandlers,
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!sessaoId) return;
    const sock: Socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    sock.on("connect", () => {
      sock.emit("join_pdv", sessaoId);
    });

    sock.on("carrinho:add", (data: { produto: Produto }) => {
      if (data?.produto) handlersRef.current.onAdd?.(data.produto);
    });

    sock.on("produto:novo", (data: { produto: Produto }) => {
      if (data?.produto) handlersRef.current.onNovo?.(data.produto);
    });

    return () => {
      sock.disconnect();
    };
  }, [sessaoId]);
}

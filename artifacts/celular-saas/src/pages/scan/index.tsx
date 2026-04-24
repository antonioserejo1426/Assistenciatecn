import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { getProdutoByCodigo, useCreateProduto, type Produto } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ScanLine, CheckCircle2 } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function ScanPage() {
  const [, params] = useRoute("/scan/:sessaoId");
  const sessaoId = params?.sessaoId ?? "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const stopFnRef = useRef<(() => void) | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ultimoCodigo, setUltimoCodigo] = useState<string | null>(null);
  const [novoProduto, setNovoProduto] = useState<{
    codigoBarras: string;
    nome: string;
    preco: string;
    custo: string;
    estoque: string;
  } | null>(null);
  const [historico, setHistorico] = useState<Produto[]>([]);
  const lockRef = useRef(false);

  const criarProduto = useCreateProduto();

  useEffect(() => {
    if (!sessaoId) return;
    const sock = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = sock;
    sock.on("connect", () => sock.emit("join_pdv", sessaoId));
    return () => {
      sock.disconnect();
    };
  }, [sessaoId]);

  async function startScanner() {
    if (scanning) return;
    setScanning(true);
    try {
      readerRef.current = new BrowserMultiFormatReader();
      const controls = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        async (result) => {
          if (!result || lockRef.current) return;
          const codigo = result.getText();
          lockRef.current = true;
          setUltimoCodigo(codigo);
          await processarCodigo(codigo);
          setTimeout(() => {
            lockRef.current = false;
          }, 1500);
        },
      );
      stopFnRef.current = () => controls.stop();
    } catch (e) {
      toast.error("Não foi possível acessar a câmera");
      setScanning(false);
    }
  }

  function stopScanner() {
    stopFnRef.current?.();
    stopFnRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      stopFnRef.current?.();
    };
  }, []);

  async function processarCodigo(codigo: string) {
    try {
      const p = await getProdutoByCodigo(codigo);
      if (p) {
        socketRef.current?.emit("scanner:add", { sessaoId, produto: p });
        setHistorico((h) => [p, ...h].slice(0, 8));
        toast.success(`${p.nome} enviado`);
      } else {
        setNovoProduto({ codigoBarras: codigo, nome: "", preco: "", custo: "", estoque: "1" });
      }
    } catch {
      setNovoProduto({ codigoBarras: codigo, nome: "", preco: "", custo: "", estoque: "1" });
    }
  }

  async function salvarNovo() {
    if (!novoProduto) return;
    try {
      const p = await criarProduto.mutateAsync({
        data: {
          nome: novoProduto.nome,
          codigoBarras: novoProduto.codigoBarras,
          preco: Number(novoProduto.preco) || 0,
          custo: Number(novoProduto.custo) || 0,
          estoque: Number(novoProduto.estoque) || 0,
        },
      });
      socketRef.current?.emit("scanner:novo", { sessaoId, produto: p });
      socketRef.current?.emit("scanner:add", { sessaoId, produto: p });
      setHistorico((h) => [p, ...h].slice(0, 8));
      toast.success(`${p.nome} cadastrado e enviado`);
      setNovoProduto(null);
    } catch {
      toast.error("Falha ao cadastrar");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 pb-12">
      <div className="rounded-xl bg-primary p-4 text-primary-foreground">
        <h1 className="text-xl font-bold">Scanner TecnoFix</h1>
        <p className="text-sm opacity-80">
          Sessão: <code className="font-mono text-xs">{sessaoId.slice(0, 8)}…</code>
        </p>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                <Camera className="h-10 w-10 opacity-60" />
              </div>
            )}
            {scanning && (
              <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {!scanning ? (
              <Button className="flex-1" onClick={startScanner}>
                <ScanLine className="mr-2 h-4 w-4" /> Iniciar leitura
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" onClick={stopScanner}>
                Parar
              </Button>
            )}
          </div>
          {ultimoCodigo && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Último código: <span className="font-mono">{ultimoCodigo}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {novoProduto && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastrar novo produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1">
              <Label>Código de barras</Label>
              <Input value={novoProduto.codigoBarras} disabled />
            </div>
            <div className="grid gap-1">
              <Label>Nome</Label>
              <Input
                value={novoProduto.nome}
                onChange={(e) =>
                  setNovoProduto({ ...novoProduto, nome: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Preço</Label>
                <Input
                  type="number"
                  value={novoProduto.preco}
                  onChange={(e) =>
                    setNovoProduto({ ...novoProduto, preco: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Custo</Label>
                <Input
                  type="number"
                  value={novoProduto.custo}
                  onChange={(e) =>
                    setNovoProduto({ ...novoProduto, custo: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Estoque inicial</Label>
              <Input
                type="number"
                value={novoProduto.estoque}
                onChange={(e) =>
                  setNovoProduto({ ...novoProduto, estoque: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setNovoProduto(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={salvarNovo}
                disabled={!novoProduto.nome || criarProduto.isPending}
              >
                Salvar e enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enviados nesta sessão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {historico.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="flex-1 truncate">
                  <div className="truncate text-sm font-medium">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">{fmt(p.preco)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

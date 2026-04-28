import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateScannerSessao,
  useCreateVenda,
  useListProdutos,
  getProdutoByCodigo,
  getListVendasQueryKey,
  getListProdutosQueryKey,
  type Produto,
} from "@workspace/api-client-react";
import { messageFromError } from "@/lib/api-error";
import { formatBRL } from "@/lib/utils";
import { useScannerSocket } from "@/hooks/use-scanner-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smartphone, Plus, Minus, Trash2, ShoppingCart, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

type CartItem = { produto: Produto; qty: number };

export default function PDV() {
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  const [cliente, setCliente] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const qc = useQueryClient();
  const { data: produtos = [] } = useListProdutos();
  const sessao = useCreateScannerSessao();
  const criarVenda = useCreateVenda();

  const total = useMemo(
    () => carrinho.reduce((sum, i) => sum + i.produto.preco * i.qty, 0),
    [carrinho],
  );

  function adicionarProduto(p: Produto) {
    setCarrinho((prev) => {
      const idx = prev.findIndex((x) => x.produto.id === p.id);
      if (idx >= 0) {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], qty: novo[idx].qty + 1 };
        return novo;
      }
      return [...prev, { produto: p, qty: 1 }];
    });
  }

  function alterarQty(produtoId: number, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((i) =>
          i.produto.id === produtoId ? { ...i, qty: Math.max(0, i.qty + delta) } : i,
        )
        .filter((i) => i.qty > 0),
    );
  }

  function remover(produtoId: number) {
    setCarrinho((prev) => prev.filter((i) => i.produto.id !== produtoId));
  }

  async function buscarPorCodigo() {
    const term = busca.trim();
    if (!term) return;
    const local = produtos.find(
      (p) => p.codigoBarras === term || p.nome.toLowerCase() === term.toLowerCase(),
    );
    if (local) {
      adicionarProduto(local);
      toast.success(`${local.nome} adicionado`);
      setBusca("");
      return;
    }
    try {
      const p = await getProdutoByCodigo(term);
      if (p) {
        adicionarProduto(p);
        toast.success(`${p.nome} adicionado`);
        setBusca("");
      } else {
        toast.error("Produto não encontrado");
      }
    } catch {
      toast.error("Produto não encontrado");
    }
  }

  async function abrirQr() {
    try {
      const s = await sessao.mutateAsync();
      setSessaoId(s.sessaoId);
      setQrUrl(s.qrUrl);
      setQrOpen(true);
    } catch {
      toast.error("Não foi possível abrir a sessão de pareamento");
    }
  }

  useScannerSocket(sessaoId, {
    onAdd: (produto) => {
      adicionarProduto(produto);
      toast.success(`${produto.nome} (via celular)`);
    },
    onNovo: (produto) => {
      toast(`Produto cadastrado: ${produto.nome}`);
    },
  });

  async function finalizarVenda() {
    if (carrinho.length === 0) return;
    try {
      await criarVenda.mutateAsync({
        data: {
          cliente: cliente || null,
          formaPagamento,
          itens: carrinho.map((i) => ({ produtoId: i.produto.id, quantidade: i.qty })),
        },
      });
      toast.success("Venda finalizada com sucesso");
      setCarrinho([]);
      setCliente("");
      setFinalizarOpen(false);
      qc.invalidateQueries({ queryKey: getListVendasQueryKey() });
      qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });
    } catch (e) {
      toast.error(messageFromError(e, "Erro ao finalizar venda"));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px] h-full">
      <Card className="flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>PDV — Ponto de Venda</CardTitle>
            <Button variant="outline" onClick={abrirQr} disabled={sessao.isPending}>
              <Smartphone className="mr-2 h-4 w-4" />
              Conectar celular
            </Button>
          </div>
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Código de barras ou nome — pressione Enter"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") buscarPorCodigo();
                }}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button onClick={buscarPorCodigo}>Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="divide-y">
            {carrinho.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-30" />
                Carrinho vazio. Escaneie um código ou busque um produto.
              </div>
            ) : (
              carrinho.map((i) => (
                <div key={i.produto.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <div className="font-medium">{i.produto.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatBRL(i.produto.preco)} cada
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Diminuir quantidade"
                      onClick={() => alterarQty(i.produto.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium" aria-live="polite">{i.qty}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Aumentar quantidade"
                      onClick={() => alterarQty(i.produto.id, +1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-24 text-right font-semibold">
                    {formatBRL(i.produto.preco * i.qty)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remover ${i.produto.nome} do carrinho`}
                    onClick={() => remover(i.produto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="border-b">
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Itens</span>
            <span>{carrinho.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
          <Button
            size="lg"
            className="w-full"
            disabled={carrinho.length === 0}
            onClick={() => setFinalizarOpen(true)}
          >
            Finalizar venda
          </Button>
        </CardContent>
      </Card>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pareie seu celular</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            {qrUrl && (
              <div className="rounded-lg bg-white p-4">
                <QRCodeCanvas value={qrUrl} size={220} />
              </div>
            )}
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              Aponte a câmera do celular para o QR. Os produtos escaneados
              aparecem aqui automaticamente.
            </p>
            {qrUrl && (
              <code className="block max-w-xs break-all rounded bg-muted px-2 py-1 text-xs">
                {qrUrl}
              </code>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizarOpen} onOpenChange={setFinalizarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar venda — {formatBRL(total)}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Cliente (opcional)</Label>
              <Input value={cliente} onChange={(e) => setCliente(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="debito">Cartão de Débito</SelectItem>
                  <SelectItem value="credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={finalizarVenda} disabled={criarVenda.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

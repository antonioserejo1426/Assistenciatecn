import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListProdutos,
  useCreateProduto,
  useUpdateProduto,
  useDeleteProduto,
  getListProdutosQueryKey,
  type Produto,
} from "@workspace/api-client-react";
import { messageFromError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package2 } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type Form = {
  id?: number;
  nome: string;
  codigoBarras: string;
  preco: string;
  custo: string;
  estoque: string;
  descricao: string;
};

const empty: Form = {
  nome: "",
  codigoBarras: "",
  preco: "",
  custo: "",
  estoque: "0",
  descricao: "",
};

export default function ProdutosPage() {
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<Form>(empty);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: produtos = [], isLoading, isError, refetch } = useListProdutos({ q: busca || undefined });
  const criar = useCreateProduto();
  const atualizar = useUpdateProduto();
  const remover = useDeleteProduto();

  function abrirNovo() {
    setForm(empty);
    setOpen(true);
  }

  function abrirEditar(p: Produto) {
    setForm({
      id: p.id,
      nome: p.nome,
      codigoBarras: p.codigoBarras ?? "",
      preco: String(p.preco),
      custo: String(p.custo),
      estoque: String(p.estoque),
      descricao: p.descricao ?? "",
    });
    setOpen(true);
  }

  async function salvar() {
    const nomeTrim = form.nome.trim();
    if (!nomeTrim) {
      toast.error("Informe o nome do produto");
      return;
    }
    const preco = form.preco ? Number(form.preco.replace(",", ".")) : 0;
    const custo = form.custo ? Number(form.custo.replace(",", ".")) : 0;
    const estoque = form.estoque ? Number(form.estoque) : 0;
    if (Number.isNaN(preco) || preco < 0) {
      toast.error("Preço inválido");
      return;
    }
    if (Number.isNaN(custo) || custo < 0) {
      toast.error("Custo inválido");
      return;
    }
    if (Number.isNaN(estoque) || !Number.isInteger(estoque) || estoque < 0) {
      toast.error("Estoque inválido");
      return;
    }
    const data = {
      nome: nomeTrim,
      codigoBarras: form.codigoBarras.trim() || null,
      preco,
      custo,
      estoque,
      descricao: form.descricao.trim() || null,
    };
    try {
      if (form.id) {
        await atualizar.mutateAsync({ id: form.id, data });
        toast.success("Produto atualizado");
      } else {
        await criar.mutateAsync({ data });
        toast.success("Produto criado");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });
    } catch (e) {
      toast.error(messageFromError(e, "Erro ao salvar produto"));
    }
  }

  async function deletar(p: Produto) {
    if (!confirm(`Remover ${p.nome}?`)) return;
    try {
      await remover.mutateAsync({ id: p.id });
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });
    } catch (e) {
      toast.error(messageFromError(e, "Erro ao remover produto"));
    }
  }

  function corEstoque(n: number) {
    if (n <= 0) return "text-destructive font-semibold";
    if (n < 5) return "text-orange-500 font-semibold";
    if (n < 10) return "text-yellow-600";
    return "text-foreground";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "carregando…" : `${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"}`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNovo}>
              <Plus className="mr-2 h-4 w-4" /> Novo produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label>Código de barras</Label>
                <Input
                  value={form.codigoBarras}
                  onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
                </div>
                <div>
                  <Label>Custo (R$)</Label>
                  <Input type="number" step="0.01" value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} />
                </div>
                <div>
                  <Label>Estoque</Label>
                  <Input type="number" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={!form.nome}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Buscar por nome ou código de barras..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-md"
      />

      {isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">Não foi possível carregar os produtos.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {isLoading && (
        <div className="rounded-md border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Carregando produtos…
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          {produtos.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package2 className="mx-auto mb-2 h-10 w-10 opacity-40" />
              Nenhum produto cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{p.codigoBarras ?? "—"}</TableCell>
                    <TableCell className="text-right">{fmt(p.preco)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmt(p.custo)}</TableCell>
                    <TableCell className={`text-right ${corEstoque(p.estoque)}`}>{p.estoque}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => abrirEditar(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deletar(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

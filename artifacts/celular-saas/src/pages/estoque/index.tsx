import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListMovimentacoes,
  useListProdutos,
  useCreateMovimentacao,
  getListMovimentacoesQueryKey,
  getListProdutosQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function EstoquePage() {
  const qc = useQueryClient();
  const { data: movs = [] } = useListMovimentacoes();
  const { data: produtos = [] } = useListProdutos();
  const criar = useCreateMovimentacao();

  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");

  async function salvar() {
    if (!produtoId || !quantidade) return;
    try {
      await criar.mutateAsync({
        data: {
          produtoId: Number(produtoId),
          tipo,
          quantidade: Number(quantidade),
          motivo: motivo || null,
        },
      });
      toast.success("Movimentação registrada");
      setQuantidade("");
      setMotivo("");
      qc.invalidateQueries({ queryKey: getListMovimentacoesQueryKey() });
      qc.invalidateQueries({ queryKey: getListProdutosQueryKey() });
    } catch (e) {
      toast.error("Erro ao registrar movimentação");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nova movimentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1">
            <Label>Produto</Label>
            <Select value={produtoId} onValueChange={setProdutoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome} ({p.estoque} em estoque)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Quantidade</Label>
            <Input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Motivo</Label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <Button onClick={salvar} className="w-full" disabled={!produtoId || !quantidade}>
            Registrar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Sem movimentações ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movs.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.tipo === "entrada" ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <ArrowUpCircle className="h-4 w-4" /> Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-orange-600">
                          <ArrowDownCircle className="h-4 w-4" /> Saída
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{m.produtoNome}</TableCell>
                    <TableCell className="text-right font-medium">{m.quantidade}</TableCell>
                    <TableCell className="text-muted-foreground">{m.motivo ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.criadoEm).toLocaleString("pt-BR")}
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

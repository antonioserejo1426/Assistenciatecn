import { useState } from "react";
import {
  useListVendas,
  useGetVenda,
  type Venda,
} from "@workspace/api-client-react";
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
} from "@/components/ui/dialog";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function VendaDetalhe({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data } = useGetVenda(id ?? 0, { query: { enabled: !!id } });
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Venda #{id}</DialogTitle>
        </DialogHeader>
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{data.cliente ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pagamento</p>
                <p className="font-medium capitalize">{data.formaPagamento ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data</p>
                <p className="font-medium">{new Date(data.criadoEm).toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itens?.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.produtoNome}</TableCell>
                    <TableCell className="text-right">{i.quantidade}</TableCell>
                    <TableCell className="text-right">{fmt(i.precoUnitario)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt(i.precoUnitario * i.quantidade)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid grid-cols-3 gap-3 border-t pt-3 text-sm">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{fmt(data.total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Custo</p>
                <p className="text-lg">{fmt(data.custo)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lucro</p>
                <p className="text-lg font-bold text-green-600">{fmt(data.lucro)}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function VendasPage() {
  const { data: vendas = [], isLoading, isError, refetch } = useListVendas();
  const [sel, setSel] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Vendas</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "carregando…" : `${vendas.length} ${vendas.length === 1 ? "venda" : "vendas"}`}
        </p>
      </div>
      {isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">Não foi possível carregar as vendas.</p>
          <button
            type="button"
            className="mt-1 text-xs underline"
            onClick={() => refetch()}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Carregando vendas…</div>
          ) : vendas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Receipt className="mx-auto mb-2 h-10 w-10 opacity-40" />
              Nenhuma venda registrada ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((v: Venda) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => setSel(v.id)}
                  >
                    <TableCell className="font-mono">#{v.id}</TableCell>
                    <TableCell>{v.cliente ?? "—"}</TableCell>
                    <TableCell>
                      {v.formaPagamento && (
                        <Badge variant="outline" className="capitalize">
                          {v.formaPagamento}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{v.itensCount}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(v.total)}</TableCell>
                    <TableCell className="text-right text-green-600">{fmt(v.lucro)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(v.criadoEm).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <VendaDetalhe id={sel} onClose={() => setSel(null)} />
    </div>
  );
}

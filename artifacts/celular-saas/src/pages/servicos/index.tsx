import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useListServicos,
  useCreateServico,
  useUpdateServico,
  useListTecnicos,
  getListServicosQueryKey,
  type Servico,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Wrench } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const STATUS = [
  { id: "aberto", label: "Aberto", cor: "bg-blue-500" },
  { id: "em_andamento", label: "Em andamento", cor: "bg-amber-500" },
  { id: "concluido", label: "Concluído", cor: "bg-emerald-500" },
  { id: "entregue", label: "Entregue", cor: "bg-zinc-500" },
];

import { FeatureGate } from "@/components/feature-gate";

export default function ServicosPageWrapper() {
  return (
    <FeatureGate feature="servicos">
      <ServicosPageInner />
    </FeatureGate>
  );
}

function ServicosPageInner() {
  const qc = useQueryClient();
  const { data: servicos = [] } = useListServicos();
  const { data: tecnicos = [] } = useListTecnicos();
  const criar = useCreateServico();
  const atualizar = useUpdateServico();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    cliente: "",
    clienteTelefone: "",
    aparelho: "",
    tecnicoId: "",
    valor: "",
  });

  async function salvar() {
    try {
      await criar.mutateAsync({
        data: {
          descricao: form.descricao,
          cliente: form.cliente || null,
          clienteTelefone: form.clienteTelefone || null,
          aparelho: form.aparelho || null,
          tecnicoId: form.tecnicoId ? Number(form.tecnicoId) : null,
          valor: Number(form.valor) || 0,
        },
      });
      toast.success("Serviço criado");
      setOpen(false);
      setForm({ descricao: "", cliente: "", clienteTelefone: "", aparelho: "", tecnicoId: "", valor: "" });
      qc.invalidateQueries({ queryKey: getListServicosQueryKey() });
    } catch {
      toast.error("Erro ao criar");
    }
  }

  async function mudarStatus(s: Servico, novo: string) {
    await atualizar.mutateAsync({ id: s.id, data: { status: novo } });
    qc.invalidateQueries({ queryKey: getListServicosQueryKey() });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">{servicos.length} serviços</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo serviço</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cliente</Label>
                  <Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={form.clienteTelefone}
                    onChange={(e) => setForm({ ...form, clienteTelefone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <Label>Aparelho</Label>
                <Input value={form.aparelho} onChange={(e) => setForm({ ...form, aparelho: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Técnico</Label>
                  <Select value={form.tecnicoId} onValueChange={(v) => setForm({ ...form, tecnicoId: v })}>
                    <SelectTrigger><SelectValue placeholder="Sem técnico" /></SelectTrigger>
                    <SelectContent>
                      {tecnicos.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={!form.descricao}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {STATUS.map((col) => {
          const items = servicos.filter((s) => s.status === col.id);
          return (
            <div key={col.id} className="space-y-2">
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.cor}`} />
                  <span className="text-sm font-semibold">{col.label}</span>
                </div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                    <Wrench className="mx-auto mb-1 h-5 w-5 opacity-30" />
                    Vazio
                  </div>
                )}
                {items.map((s) => (
                  <Card key={s.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{s.cliente ?? "Cliente —"}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.aparelho ?? "—"}</p>
                        </div>
                        <span className="font-semibold">{fmt(s.valor)}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <p className="line-clamp-2 text-sm">{s.descricao}</p>
                      <div className="flex items-center gap-2">
                        <Select value={s.status} onValueChange={(v) => mudarStatus(s, v)}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS.map((st) => (
                              <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {s.tecnicoNome && (
                        <p className="text-xs text-muted-foreground">Técnico: {s.tecnicoNome}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

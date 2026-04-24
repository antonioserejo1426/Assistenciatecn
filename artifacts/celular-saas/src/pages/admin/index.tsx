import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useAdminResumo,
  useAdminListEmpresas,
  useAdminToggleBloqueioEmpresa,
  useAdminEstenderTrial,
  useAdminAtivarAssinatura,
  useListPlanos,
  getAdminListEmpresasQueryKey,
  getAdminResumoQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Lock, Unlock, Calendar, Sparkles, Building2, Users, AlertTriangle, DollarSign } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: resumo } = useAdminResumo();
  const { data: empresas = [] } = useAdminListEmpresas();
  const { data: planos = [] } = useListPlanos();
  const toggle = useAdminToggleBloqueioEmpresa();
  const estender = useAdminEstenderTrial();
  const ativar = useAdminAtivarAssinatura();

  const [trialDialog, setTrialDialog] = useState<number | null>(null);
  const [trialDias, setTrialDias] = useState("7");
  const [ativarDialog, setAtivarDialog] = useState<number | null>(null);
  const [ativarPlanoId, setAtivarPlanoId] = useState("");
  const [ativarDias, setAtivarDias] = useState("30");

  function refresh() {
    qc.invalidateQueries({ queryKey: getAdminListEmpresasQueryKey() });
    qc.invalidateQueries({ queryKey: getAdminResumoQueryKey() });
  }

  async function bloquear(id: number, bloqueada: boolean) {
    await toggle.mutateAsync({ id, data: { bloqueada } });
    toast.success(bloqueada ? "Empresa bloqueada" : "Empresa desbloqueada");
    refresh();
  }

  async function aplicarTrial() {
    if (!trialDialog) return;
    await estender.mutateAsync({ id: trialDialog, data: { dias: Number(trialDias) } });
    toast.success("Trial estendido");
    setTrialDialog(null);
    refresh();
  }

  async function aplicarAtivar() {
    if (!ativarDialog || !ativarPlanoId) return;
    await ativar.mutateAsync({
      id: ativarDialog,
      data: { planoId: Number(ativarPlanoId), dias: Number(ativarDias) },
    });
    toast.success("Assinatura ativada");
    setAtivarDialog(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Master</h1>
        <p className="text-sm text-muted-foreground">Gestão de todas as empresas TecnoFix</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> Empresas</div>
            <div className="text-2xl font-bold">{resumo?.totalEmpresas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3 w-3" /> Ativas</div>
            <div className="text-2xl font-bold text-emerald-600">{resumo?.ativas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3 w-3" /> Em trial</div>
            <div className="text-2xl font-bold text-blue-600">{resumo?.trial ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-3 w-3" /> Vencidas</div>
            <div className="text-2xl font-bold text-destructive">{resumo?.vencidas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3 w-3" /> MRR</div>
            <div className="text-2xl font-bold">{fmt(resumo?.mrr ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="w-[280px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.nome}</div>
                    <div className="text-xs text-muted-foreground">#{e.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {e.bloqueada && <Badge variant="destructive">Bloqueada</Badge>}
                      {e.status && <Badge variant="outline" className="capitalize">{e.status}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{e.planoNome ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.proximoVencimento ? new Date(e.proximoVencimento).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => bloquear(e.id, !e.bloqueada)}>
                        {e.bloqueada ? <Unlock className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                        {e.bloqueada ? "Desbloquear" : "Bloquear"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setTrialDialog(e.id); setTrialDias("7"); }}>
                        <Calendar className="mr-1 h-3 w-3" /> +Trial
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAtivarDialog(e.id); setAtivarPlanoId(""); setAtivarDias("30"); }}>
                        <Sparkles className="mr-1 h-3 w-3" /> Ativar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!trialDialog} onOpenChange={(o) => !o && setTrialDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender trial</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label>Quantidade de dias</Label>
            <Input type="number" value={trialDias} onChange={(e) => setTrialDias(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrialDialog(null)}>Cancelar</Button>
            <Button onClick={aplicarTrial}>Estender</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ativarDialog} onOpenChange={(o) => !o && setAtivarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar assinatura manual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Plano</Label>
              <Select value={ativarPlanoId} onValueChange={setAtivarPlanoId}>
                <SelectTrigger><SelectValue placeholder="Escolha um plano" /></SelectTrigger>
                <SelectContent>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nome} — {fmt(p.preco)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dias de validade</Label>
              <Input type="number" value={ativarDias} onChange={(e) => setAtivarDias(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtivarDialog(null)}>Cancelar</Button>
            <Button onClick={aplicarAtivar} disabled={!ativarPlanoId}>Ativar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

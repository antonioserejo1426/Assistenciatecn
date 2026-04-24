import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useAdminResumo,
  useAdminListEmpresas,
  useAdminToggleBloqueioEmpresa,
  useAdminEstenderTrial,
  useAdminAtivarAssinatura,
  useAdminListUsuariosEmpresa,
  useAdminUpdateUsuario,
  useAdminDeleteUsuario,
  useAdminToggleBloqueioUsuario,
  useAdminUpdatePlano,
  useAdminGetConfiguracoes,
  useAdminUpdateConfiguracoes,
  useListPlanos,
  getAdminListEmpresasQueryKey,
  getAdminResumoQueryKey,
  getAdminListUsuariosEmpresaQueryKey,
  getAdminGetConfiguracoesQueryKey,
  getListPlanosQueryKey,
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
import { Lock, Unlock, Calendar, Sparkles, Building2, Users, AlertTriangle, DollarSign, KeyRound, UserCog, Trash2, Settings2, Save, Plus, RotateCcw, CalendarClock } from "lucide-react";

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

  const [trialDialog, setTrialDialog] = useState<{ id: number; nome: string; trialFim?: string | null } | null>(null);
  const [trialModo, setTrialModo] = useState<"adicionar" | "definir" | "data">("adicionar");
  const [trialDias, setTrialDias] = useState("7");
  const [trialData, setTrialData] = useState("");
  const [ativarDialog, setAtivarDialog] = useState<number | null>(null);
  const [ativarPlanoId, setAtivarPlanoId] = useState("");
  const [ativarDias, setAtivarDias] = useState("30");
  const [usuariosDialog, setUsuariosDialog] = useState<{ id: number; nome: string } | null>(null);
  const [editUsuario, setEditUsuario] = useState<any | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSenha, setEditSenha] = useState("");

  const toggleUsuario = useAdminToggleBloqueioUsuario();
  const updateUsuario = useAdminUpdateUsuario();
  const deleteUsuario = useAdminDeleteUsuario();
  const updatePlano = useAdminUpdatePlano();
  const { data: sistemaConfig } = useAdminGetConfiguracoes();
  const updateSistema = useAdminUpdateConfiguracoes();
  const [trialPadrao, setTrialPadrao] = useState("");

  useEffect(() => {
    if (sistemaConfig) setTrialPadrao(String(sistemaConfig.trialDiasPadrao));
  }, [sistemaConfig]);
  const { data: usuariosEmpresa = [], isFetching: loadingUsuarios } = useAdminListUsuariosEmpresa(
    usuariosDialog?.id ?? 0,
    { query: { enabled: !!usuariosDialog } },
  );

  const [editPlano, setEditPlano] = useState<any | null>(null);
  const [planoNome, setPlanoNome] = useState("");
  const [planoPreco, setPlanoPreco] = useState("");
  const [planoDescricao, setPlanoDescricao] = useState("");

  function refresh() {
    qc.invalidateQueries({ queryKey: getAdminListEmpresasQueryKey() });
    qc.invalidateQueries({ queryKey: getAdminResumoQueryKey() });
  }

  async function bloquear(id: number, bloqueada: boolean) {
    await toggle.mutateAsync({ id, data: { bloqueada } });
    toast.success(bloqueada ? "Empresa bloqueada" : "Empresa desbloqueada");
    refresh();
  }

  function abrirTrialDialog(empresa: { id: number; nome: string; trialFim?: string | null }) {
    setTrialDialog({ id: empresa.id, nome: empresa.nome, trialFim: empresa.trialFim ?? null });
    setTrialModo("adicionar");
    setTrialDias("7");
    const base = empresa.trialFim ? new Date(empresa.trialFim) : new Date(Date.now() + 7 * 86400000);
    setTrialData(base.toISOString().slice(0, 10));
  }

  async function aplicarTrial() {
    if (!trialDialog) return;
    try {
      const data: Record<string, unknown> = { modo: trialModo };
      if (trialModo === "data") {
        if (!trialData) {
          toast.error("Informe a data de fim do trial.");
          return;
        }
        const d = new Date(trialData + "T23:59:59");
        if (Number.isNaN(d.getTime())) {
          toast.error("Data inválida.");
          return;
        }
        data["trialFim"] = d.toISOString();
      } else {
        const dias = Number(trialDias);
        if (!Number.isFinite(dias) || dias < 0) {
          toast.error("Quantidade de dias inválida.");
          return;
        }
        data["dias"] = dias;
      }
      await estender.mutateAsync({ id: trialDialog.id, data });
      toast.success(
        trialModo === "data"
          ? "Data do trial atualizada."
          : trialModo === "definir"
            ? "Trial reiniciado com nova duração."
            : "Trial estendido com sucesso.",
      );
      setTrialDialog(null);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar trial.");
    }
  }

  async function salvarTrialPadrao() {
    const dias = Number(trialPadrao);
    if (!Number.isFinite(dias) || dias < 0 || dias > 365) {
      toast.error("Informe um valor entre 0 e 365 dias.");
      return;
    }
    try {
      await updateSistema.mutateAsync({ data: { trialDiasPadrao: dias } });
      toast.success(`Trial padrão atualizado para ${dias} dia${dias === 1 ? "" : "s"}.`);
      qc.invalidateQueries({ queryKey: getAdminGetConfiguracoesQueryKey() });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configuração.");
    }
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

  function refreshUsuarios() {
    if (usuariosDialog) {
      qc.invalidateQueries({ queryKey: getAdminListUsuariosEmpresaQueryKey(usuariosDialog.id) });
    }
  }

  async function bloquearUsuario(id: number, ativo: boolean) {
    await toggleUsuario.mutateAsync({ id, data: { bloqueada: ativo } });
    toast.success(ativo ? "Usuário bloqueado" : "Usuário desbloqueado");
    refreshUsuarios();
  }

  function abrirEdicao(u: any) {
    setEditUsuario(u);
    setEditNome(u.nome ?? "");
    setEditEmail(u.email ?? "");
    setEditSenha("");
  }

  async function excluirUsuario(u: any) {
    if (!confirm(`Excluir o usuário "${u.nome}" (${u.email})? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteUsuario.mutateAsync({ id: u.id });
      toast.success("Usuário excluído");
      refreshUsuarios();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir usuário");
    }
  }

  function abrirEdicaoPlano(p: any) {
    setEditPlano(p);
    setPlanoNome(p.nome ?? "");
    setPlanoPreco(String(p.preco ?? ""));
    setPlanoDescricao(p.descricao ?? "");
  }

  async function salvarPlano() {
    if (!editPlano) return;
    const preco = Number(planoPreco.replace(",", "."));
    if (Number.isNaN(preco) || preco < 0) {
      toast.error("Preço inválido");
      return;
    }
    try {
      await updatePlano.mutateAsync({
        id: editPlano.id,
        data: {
          nome: planoNome.trim() || editPlano.nome,
          preco,
          descricao: planoDescricao.trim() ? planoDescricao.trim() : null,
        },
      });
      toast.success("Plano atualizado");
      setEditPlano(null);
      qc.invalidateQueries({ queryKey: getListPlanosQueryKey() });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao atualizar plano");
    }
  }

  async function salvarEdicao() {
    if (!editUsuario) return;
    const data: Record<string, unknown> = {};
    if (editNome.trim() && editNome.trim() !== editUsuario.nome) data["nome"] = editNome.trim();
    if (editEmail.trim() && editEmail.trim().toLowerCase() !== editUsuario.email) {
      data["email"] = editEmail.trim().toLowerCase();
    }
    if (editSenha.trim()) {
      if (editSenha.length < 4) {
        toast.error("Senha deve ter no mínimo 4 caracteres");
        return;
      }
      data["senha"] = editSenha;
    }
    if (Object.keys(data).length === 0) {
      toast.info("Nenhuma alteração");
      return;
    }
    try {
      await updateUsuario.mutateAsync({ id: editUsuario.id, data });
      toast.success("Usuário atualizado");
      setEditUsuario(null);
      refreshUsuarios();
    } catch (err: any) {
      const msg = err?.message ?? "Erro ao atualizar usuário";
      toast.error(msg);
    }
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

      <Card className="card-luxe card-luxe-elevated overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(38,92%,92%)] to-[hsl(38,92%,82%)] text-[hsl(28,85%,38%)] ring-1 ring-[hsl(38,92%,55%)]/25">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-display">Configurações do sistema</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Define o comportamento padrão para novas empresas que se cadastram.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end max-w-2xl">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Dias de trial gratuito ao se cadastrar
              </Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={trialPadrao}
                onChange={(e) => setTrialPadrao(e.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Toda empresa nova começa com esse período. Você pode ajustar individualmente cada empresa
                depois pelo botão <strong>Trial</strong> na tabela abaixo.
              </p>
            </div>
            <Button
              onClick={salvarTrialPadrao}
              disabled={updateSistema.isPending}
              className="btn-luxe rounded-xl h-11 px-5 font-semibold"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateSistema.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planos & Preços</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edite o valor dos planos. O Stripe sincroniza o novo preço para os próximos pagamentos.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço (mês)</TableHead>
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {p.descricao ?? "—"}
                  </TableCell>
                  <TableCell className="font-semibold">{fmt(p.preco)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => abrirEdicaoPlano(p)}>
                      <KeyRound className="mr-1 h-3 w-3" /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                      <Button size="sm" variant="outline" onClick={() => abrirTrialDialog(e)}>
                        <Calendar className="mr-1 h-3 w-3" /> Trial
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAtivarDialog(e.id); setAtivarPlanoId(""); setAtivarDias("30"); }}>
                        <Sparkles className="mr-1 h-3 w-3" /> Ativar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setUsuariosDialog({ id: e.id, nome: e.nome })}>
                        <UserCog className="mr-1 h-3 w-3" /> Usuários
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar trial — {trialDialog?.nome}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {trialDialog?.trialFim && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Trial atual termina em: </span>
                <span className="font-semibold">
                  {new Date(trialDialog.trialFim).toLocaleString("pt-BR")}
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTrialModo("adicionar")}
                className={`rounded-lg border p-3 text-left text-xs transition ${
                  trialModo === "adicionar"
                    ? "border-[hsl(38,92%,55%)] bg-[hsl(38,92%,55%)]/10 ring-1 ring-[hsl(38,92%,55%)]/30"
                    : "hover:bg-muted/50"
                }`}
              >
                <Plus className="mb-1 h-4 w-4" />
                <div className="font-semibold">Adicionar</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">Soma dias ao trial atual</div>
              </button>
              <button
                type="button"
                onClick={() => setTrialModo("definir")}
                className={`rounded-lg border p-3 text-left text-xs transition ${
                  trialModo === "definir"
                    ? "border-[hsl(38,92%,55%)] bg-[hsl(38,92%,55%)]/10 ring-1 ring-[hsl(38,92%,55%)]/30"
                    : "hover:bg-muted/50"
                }`}
              >
                <RotateCcw className="mb-1 h-4 w-4" />
                <div className="font-semibold">Reiniciar</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">N dias a partir de hoje</div>
              </button>
              <button
                type="button"
                onClick={() => setTrialModo("data")}
                className={`rounded-lg border p-3 text-left text-xs transition ${
                  trialModo === "data"
                    ? "border-[hsl(38,92%,55%)] bg-[hsl(38,92%,55%)]/10 ring-1 ring-[hsl(38,92%,55%)]/30"
                    : "hover:bg-muted/50"
                }`}
              >
                <CalendarClock className="mb-1 h-4 w-4" />
                <div className="font-semibold">Data exata</div>
                <div className="text-muted-foreground text-[11px] mt-0.5">Escolher o dia de fim</div>
              </button>
            </div>

            {trialModo === "data" ? (
              <div className="grid gap-2">
                <Label>Data de fim do trial</Label>
                <Input type="date" value={trialData} onChange={(e) => setTrialData(e.target.value)} />
                <p className="text-xs text-muted-foreground">A empresa terá acesso até o final desse dia.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Quantidade de dias</Label>
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={trialDias}
                  onChange={(e) => setTrialDias(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {trialModo === "adicionar"
                    ? "Esses dias serão somados ao fim do trial atual (ou contam a partir de hoje se já expirou)."
                    : "O trial será reiniciado e expira N dias a partir de agora."}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrialDialog(null)}>Cancelar</Button>
            <Button onClick={aplicarTrial} disabled={estender.isPending} className="btn-luxe">
              {estender.isPending ? "Salvando..." : "Aplicar"}
            </Button>
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

      <Dialog open={!!usuariosDialog} onOpenChange={(o) => !o && setUsuariosDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Usuários — {usuariosDialog?.nome}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {loadingUsuarios ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : usuariosEmpresa.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado nessa empresa.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[230px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosEmpresa.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                      <TableCell>
                        {u.ativo ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Bloqueado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => abrirEdicao(u)}>
                            <KeyRound className="mr-1 h-3 w-3" /> Editar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => bloquearUsuario(u.id, u.ativo)}>
                            {u.ativo ? <Lock className="mr-1 h-3 w-3" /> : <Unlock className="mr-1 h-3 w-3" />}
                            {u.ativo ? "Bloquear" : "Ativar"}
                          </Button>
                          {u.role !== "super_admin" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => excluirUsuario(u)}
                              disabled={deleteUsuario.isPending}
                            >
                              <Trash2 className="mr-1 h-3 w-3" /> Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuariosDialog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUsuario} onOpenChange={(o) => !o && setEditUsuario(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                placeholder="Deixe em branco para não alterar"
                value={editSenha}
                onChange={(e) => setEditSenha(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Mínimo 4 caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUsuario(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={updateUsuario.isPending}>
              {updateUsuario.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPlano} onOpenChange={(o) => !o && setEditPlano(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plano</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Nome do plano</Label>
              <Input value={planoNome} onChange={(e) => setPlanoNome(e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={planoDescricao} onChange={(e) => setPlanoDescricao(e.target.value)} />
            </div>
            <div>
              <Label>Preço mensal (BRL)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={planoPreco}
                onChange={(e) => setPlanoPreco(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ao salvar, um novo preço é criado no Stripe e o anterior é desativado. Assinantes
                já existentes continuam com o preço antigo até a próxima cobrança/renovação.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlano(null)}>Cancelar</Button>
            <Button onClick={salvarPlano} disabled={updatePlano.isPending}>
              {updatePlano.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const MENSAGENS: Record<string, string> = {
  EMAIL_JA_USADO: "Este e-mail já está cadastrado.",
  credenciais_invalidas: "E-mail ou senha incorretos.",
  campos_obrigatorios: "Preencha todos os campos obrigatórios.",
  email_invalido: "Informe um e-mail válido.",
  senha_curta: "A senha precisa ter pelo menos 6 caracteres.",
  empresa_nome_invalido: "Informe o nome da empresa.",
  nome_invalido: "Informe seu nome completo.",
  muitas_tentativas: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  ESTOQUE_NEGATIVO: "Estoque insuficiente para essa operação.",
  PRODUTO_NAO_ENCONTRADO: "Produto não encontrado.",
  QUANTIDADE_INVALIDA: "Informe uma quantidade válida.",
  ITEM_INVALIDO: "Algum item da venda está com dados inválidos.",
  SEM_ITENS: "Adicione pelo menos um produto à venda.",
  FALHA_VENDA: "Não foi possível registrar a venda.",
  FALHA_MOV: "Não foi possível registrar a movimentação.",
  feature_indisponivel: "Esse recurso não está liberado no seu plano.",
  assinatura_inativa: "Sua assinatura não está ativa. Faça o pagamento para continuar.",
  empresa_bloqueada: "Acesso temporariamente bloqueado. Entre em contato com o suporte.",
  STRIPE_NAO_CONFIGURADO: "Pagamento indisponível no momento. Tente novamente em instantes.",
  CHECKOUT_FALHOU: "Não foi possível iniciar o pagamento. Tente novamente.",
  preco_invalido: "Informe um preço válido.",
  plano_nao_encontrado: "Plano não encontrado.",
  nenhum_campo_para_atualizar: "Nada foi alterado.",
  erro_interno: "Ocorreu um erro no servidor. Tente novamente.",
};

function traduzirCodigo(codigo: string): string | null {
  if (MENSAGENS[codigo]) return MENSAGENS[codigo];
  if (codigo.startsWith("ESTOQUE_INSUFICIENTE_")) return "Estoque insuficiente para um dos produtos da venda.";
  if (codigo.startsWith("PRODUTO_") && codigo.endsWith("_NAO_ENCONTRADO")) return "Algum produto da venda não foi encontrado.";
  return null;
}

export function messageFromError(err: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (!err) return fallback;
  const anyErr = err as Record<string, unknown>;

  const respData = (anyErr["response"] as { data?: unknown } | undefined)?.data;
  if (respData && typeof respData === "object") {
    const d = respData as Record<string, unknown>;
    if (typeof d["message"] === "string" && d["message"]) return d["message"] as string;
    if (typeof d["error"] === "string") {
      const traduzido = traduzirCodigo(d["error"] as string);
      if (traduzido) return traduzido;
      return d["error"] as string;
    }
  }

  const data = anyErr["data"];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d["message"] === "string" && d["message"]) return d["message"] as string;
    if (typeof d["error"] === "string") {
      const traduzido = traduzirCodigo(d["error"] as string);
      if (traduzido) return traduzido;
      return d["error"] as string;
    }
  }

  if (typeof anyErr["message"] === "string") {
    const m = anyErr["message"] as string;
    const traduzido = traduzirCodigo(m);
    if (traduzido) return traduzido;
    if (m && m !== "Network Error") return m;
  }

  return fallback;
}

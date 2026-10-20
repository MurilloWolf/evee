export interface ChatLabels {
  send: string;
  input: string;
  loadMore: string;
  loadingMore: string;
  unread: string;
  newMessage: string;
  failed: string;
  retry: string;
  sending: string;
  sent: string;
  typing: (name: string) => string;
  messages: string;
  open: string;
  close: string;
  unreadBadge: (count: number) => string;
  dismiss: string;
  actionFailed: string;
  rating: string;
  star: (n: number) => string;
  surveyTitle: string;
  surveyReason: string;
  surveySubmit: string;
  surveySubmitting: string;
  surveyThanks: string;
}

export const defaultLabels: ChatLabels = {
  send: "Enviar",
  input: "Mensagem",
  loadMore: "Carregar mensagens antigas",
  loadingMore: "Carregando...",
  unread: "Novas mensagens",
  newMessage: "Nova mensagem",
  failed: "Falha ao enviar",
  retry: "Tentar novamente",
  sending: "Enviando",
  sent: "Enviada",
  typing: (name) => `${name} está digitando...`,
  messages: "Mensagens",
  open: "Abrir chat",
  close: "Fechar chat",
  unreadBadge: (n) => (n === 1 ? "1 mensagem não lida" : `${n} mensagens não lidas`),
  dismiss: "Dispensar",
  actionFailed: "Não foi possível concluir. Tente novamente.",
  rating: "Avaliação",
  star: (n) => (n === 1 ? "1 estrela" : `${n} estrelas`),
  surveyTitle: "Como foi o seu atendimento?",
  surveyReason: "Conte o que não foi bom (obrigatório)",
  surveySubmit: "Enviar avaliação",
  surveySubmitting: "Enviando...",
  surveyThanks: "Obrigado pela avaliação!",
};

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
};

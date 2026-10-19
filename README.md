# evee

SDK de chat + componentes React para conversas entre pessoas (suporte usuário ↔ admin).
O estado vive num store controlado por métodos imperativos; os componentes só leem esse estado.
**A lib não faz rede**: o host decide como enviar e receber as mensagens.

Stack: React ≥ 18, Tailwind v4. Herda o tema shadcn do host por padrão.

## Instalação (Next.js)

```jsonc
// package.json
"evee": "github:MurilloWolf/evee#v0.1.0"
```

```ts
// next.config.ts — a lib exporta TypeScript fonte
transpilePackages: ["evee"],
```

```css
/* globals.css, depois de @import "tailwindcss" */
@import "evee/styles.css";
```

Se o host tiver os tokens do shadcn (`--primary`, `--muted`, ...), o chat os herda, inclusive no dark mode via classe `.dark`. Sem eles, a lib usa o tema neutro do shadcn.

## Uso

```tsx
import { Chat, createChat } from "evee";

const chat = createChat({
  currentUser: { id: "u1", name: "Dra. Ana" },
  users: [{ id: "admin", name: "Suporte" }],
  maxChar: 500,
  allowedLinkOrigins: [window.location.origin],
  onSend: async (msg) => {
    const saved = await api.post("/support/messages", { text: msg.text });
    return { id: saved.id }; // campos que serão mesclados; throw → status "failed"
  },
});

chat.on("linkClick", (e) => {
  e.preventDefault();
  router.push(e.url.pathname + e.url.search);
});

<Chat chat={chat} />;
```

### Header

```ts
createChat({ ..., header: { title: "Suporte", subtitle: "Online", avatarUrl: "/logo.png" } });

chat.setTitle("Suporte Smart Clinic");
chat.setSubtitle("Respondemos em horário comercial");
chat.setAvatar("/logo.png"); // null → iniciais do título
chat.setHeader(null);        // esconde o header
```

A prop `header` (um `ReactNode`) substitui o header do SDK por um conteúdo livre.

### Widget

```tsx
const chat = createChat({ ..., open: false }); // começa fechado

<ChatWidget chat={chat} position="bottom-right" />;
```

- Botão flutuante com badge de não lidas. Com o widget fechado, aparece também uma prévia da última mensagem, que pode ser dispensada (`showPreview={false}` desliga).
- Mensagens de outras pessoas que chegam com o widget fechado incrementam `unreadCount`. A primeira delas recebe o separador "Novas mensagens".
- Abrir zera o contador e foca o input. `Esc` fecha. No mobile, o painel ocupa a tela inteira.
- `chat.open()`, `chat.close()`, `chat.toggle()`, `chat.setUnreadCount(n)` (ex.: contagem vinda do servidor). Eventos `open` e `close`.

## API do SDK

| Grupo | Métodos |
| --- | --- |
| Envio | `sendMessage(text?)` (sem argumento envia o rascunho), `retry(id)` |
| Mensagens | `addMessage(msg)` (mensagem recebida), `setMessages(list)`, `prependMessages(list, hasMore?)`, `updateMessage(id, patch)`, `removeMessage(id)`, `clear()`, `addUsers(...users)` |
| Input | `disableInput(reason?)`, `enableInput()`, `setMaxChar(n)`, `setPlaceholder(t)`, `setDraft(t)`, `focusInput()` |
| Header | `setTitle(t)`, `setSubtitle(t)`, `setAvatar(url \| null)`, `setHeader(header \| null)` |
| Widget | `open()`, `close()`, `toggle()`, `setUnreadCount(n)` |
| Tema | `setTheme(theme \| null)`, `setColorScheme(scheme)` |
| Visual | `setConfig({ showAvatars, showTimestamps, showAuthorName, locale, allowedLinkOrigins, ... })`, `setTyping(user \| null)`, `setUnreadMarker(id \| null)`, `scrollToBottom()` |
| Histórico | `setHasMore(bool)`, `loadMore()`: dispara o evento `loadMore`, e o host responde com `prependMessages` |
| Leitura | `getState()`, `subscribe(fn)`, `on(evento, fn)` → retorna a função de unsubscribe; hook `useChat(chat)` |

Eventos: `send`, `message`, `loadMore`, `linkClick`, `inputChange`, `error`, `open`, `close`.

## Customização

- Nome do autor acima das mensagens: desligado por padrão (`showAuthorName: true` liga).

- `classNames={{ root, header, list, composer, textarea, row, bubble, bubbleOwn, bubbleOther, author, link }}`: classes mescladas com `tailwind-merge`.
- `components={{ Header, Bubble, Avatar, Separator, TypingIndicator, Link, Composer }}`: substituem componentes inteiros.
- `renderers={{ [kind]: Component }}`: mensagens com `kind` usam esse componente (ex.: um card "Abrir agenda").
- `linkComponent={NextLink}`: componente usado para renderizar os links.
- `labels={{ send, loadMore, unread, typing: (n) => ..., ... }}`: textos da interface (padrão em pt-BR).
- Todos os componentes também são exportados soltos (`ChatHeader`, `ChatWidget`, `MessageList`, `Composer`, `MessageBubble`, `Avatar`, `Button`, `IconButton`, `Separator`, `Timestamp`, `TypingIndicator`).

## Tema

Por padrão (`colorScheme: "inherit"`), o chat usa os tokens shadcn do host e segue a classe `.dark` (next-themes). Com isso, no front ele já sai com o mesmo tema claro/escuro, sem configurar nada.

```ts
createChat({ ..., theme: { primary: "#0ea5e9", bubbleOther: "#e0f2fe" } }); // mesmo tema nos dois modos
chat.setTheme({
  light: { primary: "oklch(0.65 0.2 40)", background: "#fffaf5" },
  dark: { primary: "oklch(0.72 0.17 50)", background: "#1f1410" },
});
chat.setTheme(null);            // volta a herdar do host
chat.setColorScheme("dark");    // "inherit" | "light" | "dark" | "system"
```

- **Tokens:** `background`, `foreground`, `card`, `primary(Foreground)`, `secondary(Foreground)`, `muted(Foreground)`, `accent(Foreground)`, `border`, `input`, `ring`, `destructive`, `warning`, `bubbleOwn(Foreground)`, `bubbleOther(Foreground)`. Qualquer cor CSS é aceita.
- **Tokens não definidos:** caem no token equivalente do host e, se não houver, no neutro.
- **Via CSS:** dá para sobrescrever pelas variáveis `--evee-light-<token>` / `--evee-dark-<token>` (kebab-case) em qualquer ancestral.

## Animações

Há animação na entrada de mensagens novas (o histórico não anima), no "digitando...", na abertura e no fechamento do widget, e no widget fechado ao chegar mensagem (ícone balança, anel pulsa, badge pulsa, prévia sobe). Todas são CSS e ficam desligadas com `prefers-reduced-motion`.

## Links

- **Formato:** links em markdown (`[Abrir agenda](/schedules/1?doctorId=2)`) mostram só o texto, dentro de um chip (`MessageLink`). URLs soltas mostram o caminho, encurtado.
- **Origem permitida:** um link só fica clicável se a origem estiver em `allowedLinkOrigins`. Fora disso, ele vira texto, e no formato markdown aparece como `texto (url)`, para o destino real ficar visível.
- **Customização:** `components={{ Link }}` troca o chip; `linkComponent={NextLink}` troca a âncora usada por baixo.

## Desenvolvimento

```bash
npm install
npm run dev        # playground em demo/ (não entra no pacote); ?mode=widget abre no modo widget
npm test
npm run typecheck
```

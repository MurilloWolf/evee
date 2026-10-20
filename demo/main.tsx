// Dev playground — not part of the published package.
import { StrictMode, useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Chat,
  ChatWidget,
  createChat,
  useChat,
  type ChatMessage,
  type ChatTheme,
  type ColorScheme,
  type MessageRendererProps,
} from "../src";
import "./demo.css";

const me = { id: "u-ana", name: "Dra. Ana Souza" };
const admin = { id: "u-admin", name: "Suporte Smart Clinic" };

// Inline SVG so the demo works offline.
const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#7C4DDF"/><path d="M12 26c2 2 5 3 8 3 4 0 7-2 7-5s-3-4-7-5-6-2-6-4 2-3 5-3c2 0 4 1 5 2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  );
const PHOTO = "https://i.pravatar.cc/80?img=47";

const THEMES: Record<string, ChatTheme | null> = {
  "herdar do host": null,
  oceano: {
    primary: "oklch(0.55 0.15 230)",
    primaryForeground: "white",
    bubbleOther: "oklch(0.95 0.03 220)",
    ring: "oklch(0.55 0.15 230)",
  },
  "sunset (light/dark)": {
    light: {
      background: "oklch(0.99 0.01 60)",
      primary: "oklch(0.65 0.2 40)",
      primaryForeground: "white",
      muted: "oklch(0.95 0.03 60)",
      bubbleOther: "oklch(0.94 0.04 70)",
      border: "oklch(0.9 0.04 60)",
    },
    dark: {
      background: "oklch(0.2 0.03 40)",
      foreground: "oklch(0.96 0.02 60)",
      card: "oklch(0.25 0.04 40)",
      primary: "oklch(0.72 0.17 50)",
      primaryForeground: "oklch(0.2 0.03 40)",
      muted: "oklch(0.3 0.04 40)",
      mutedForeground: "oklch(0.75 0.04 60)",
      bubbleOther: "oklch(0.3 0.05 40)",
      border: "oklch(1 0 0 / 12%)",
      input: "oklch(1 0 0 / 15%)",
    },
  },
};

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
let seq = 0;
const adminMsg = (text: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id: `a-${++seq}`,
  authorId: admin.id,
  text,
  createdAt: new Date(),
  ...extra,
});

// Fake history: 3 pages of older messages.
let oldestMinutes = 60 * 26;
function olderPage(): ChatMessage[] {
  return Array.from({ length: 8 }, (_, i) => {
    oldestMinutes += 37;
    return {
      id: `h-${++seq}`,
      authorId: i % 3 === 0 ? me.id : admin.id,
      text: `Mensagem antiga #${seq}`,
      createdAt: ago(oldestMinutes),
    };
  }).reverse();
}
let pagesLeft = 3;

let sendCount = 0;
const chat = createChat({
  currentUser: me,
  users: [admin],
  maxChar: 500,
  allowedLinkOrigins: [location.origin],
  hasMore: true,
  header: { title: "Suporte Smart Clinic", subtitle: "Respondemos em horário comercial", avatarUrl: LOGO },
  messages: [
    { id: "m1", authorId: me.id, text: "Olá! Não consigo remarcar uma consulta.", createdAt: ago(60 * 25) },
    { id: "m2", authorId: admin.id, text: "Oi Ana! Qual consulta?", createdAt: ago(60 * 25 - 2) },
    { id: "m3", authorId: me.id, text: "A do paciente das 14h.", createdAt: ago(12) },
    {
      id: "m3b",
      authorId: admin.id,
      text: "Formatação: **negrito**, _itálico_, ~~riscado~~, `código` e **_misto_** 🙂\n```\nPOST /support/messages\n```",
      createdAt: ago(11),
    },
    {
      id: "m4",
      authorId: admin.id,
      text: "Veja [a agenda do Dr. Carlos](/schedules/123?doctorId=42) ou o caminho direto /schedules/123?doctorId=42\nLink externo: [painel em produção](https://smart-clinic-delta.vercel.app/login)",
      createdAt: ago(10),
    },
  ],
  // Fails every 3rd send to exercise retry.
  onSend: async () => {
    await new Promise((r) => setTimeout(r, 600));
    if (++sendCount % 3 === 0) throw new Error("falha simulada");
  },
});

chat.on("loadMore", () => {
  setTimeout(() => {
    pagesLeft--;
    chat.prependMessages(olderPage(), pagesLeft > 0);
  }, 500);
});

function ActionCard({ message }: MessageRendererProps) {
  const meta = message.meta as { title: string; href: string };
  return (
    <div className="w-64 rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
      <p className="mb-2 text-muted-foreground">{message.text}</p>
      <Button size="sm" className="w-full" onClick={() => log(`action → ${meta.href}`)}>
        {meta.title}
      </Button>
    </div>
  );
}

// --- event log ---
let log: (line: string) => void = () => {};
function EventLog() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    log = (line) => setLines((l) => [`${new Date().toLocaleTimeString()}  ${line}`, ...l].slice(0, 50));
    const offs = [
      chat.on("send", (m) => log(`send: "${m.text}"`)),
      chat.on("message", (m) => log(`message: "${m.text.slice(0, 40)}"`)),
      chat.on("loadMore", () => log("loadMore")),
      chat.on("error", ({ error }) => log(`error: ${String(error)}`)),
      chat.on("linkClick", (e) => {
        e.preventDefault();
        log(`linkClick: ${e.url.pathname}${e.url.search} (navegação interceptada)`);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, []);
  return (
    <pre className="h-48 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed text-muted-foreground">
      {lines.join("\n") || "Eventos aparecem aqui."}
    </pre>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function Controls({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const state = useChat(chat);
  const [title, setTitle] = useState(state.header?.title ?? "");
  const [subtitle, setSubtitle] = useState(state.header?.subtitle ?? "");
  const [max, setMax] = useState(200);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <aside className="space-y-5 overflow-y-auto rounded-xl border border-border bg-card p-4">
      <Section title="Modo">
        <Button size="sm" variant={mode === "inline" ? "default" : "outline"} onClick={() => setMode("inline")}>inline</Button>
        <Button size="sm" variant={mode === "widget" ? "default" : "outline"} onClick={() => setMode("widget")}>widget</Button>
      </Section>

      {mode === "widget" && (
        <Section title="Widget">
          <Button size="sm" onClick={() => chat.toggle()}>toggle() — {state.isOpen ? "aberto" : "fechado"}</Button>
          <Button size="sm" variant="outline" onClick={() => chat.open()}>open()</Button>
          <Button size="sm" variant="outline" onClick={() => chat.close()}>close()</Button>
          <Button size="sm" variant="outline" onClick={() => chat.setUnreadCount(state.unreadCount + 5)}>setUnreadCount(+5)</Button>
          <p className="w-full text-[11px] text-muted-foreground">
            Feche o widget e clique em "admin responde": o badge conta as não lidas e aparece a prévia.
            Não lidas: {state.unreadCount}
          </p>
        </Section>
      )}

      <Section title="Header">
        <span className="flex w-full gap-1">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm" />
          <Button size="sm" variant="outline" onClick={() => chat.setTitle(title)}>setTitle()</Button>
        </span>
        <span className="flex w-full gap-1">
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm" />
          <Button size="sm" variant="outline" onClick={() => chat.setSubtitle(subtitle || undefined)}>setSubtitle()</Button>
        </span>
        <Button size="sm" variant="outline" onClick={() => chat.setAvatar(LOGO)}>setAvatar(logo)</Button>
        <Button size="sm" variant="outline" onClick={() => chat.setAvatar(PHOTO)}>setAvatar(foto)</Button>
        <Button size="sm" variant="outline" onClick={() => chat.setAvatar(null)}>setAvatar(null) → iniciais</Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => chat.setHeader(state.header ? null : { title, subtitle, avatarUrl: LOGO })}
        >
          {state.header ? "setHeader(null)" : "setHeader({...})"}
        </Button>
      </Section>

      <Section title="Input">
        {state.inputDisabled ? (
          <Button size="sm" onClick={() => chat.enableInput()}>enableInput()</Button>
        ) : (
          <Button size="sm" onClick={() => chat.disableInput("Atendimento encerrado")}>disableInput(reason)</Button>
        )}
        <Button size="sm" variant="outline" onClick={() => chat.focusInput()}>focusInput()</Button>
        <Button size="sm" variant="outline" onClick={() => chat.setDraft("Rascunho preenchido via SDK")}>setDraft()</Button>
        <Button size="sm" variant="outline" onClick={() => chat.setPlaceholder("Descreva o problema...")}>setPlaceholder()</Button>
        <span className="inline-flex items-center gap-1">
          <input
            type="number"
            min={1}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="h-8 w-20 rounded-md border border-input bg-transparent px-2 text-sm"
          />
          <Button size="sm" variant="outline" onClick={() => chat.setMaxChar(max)}>setMaxChar({max})</Button>
        </span>
      </Section>

      <Section title="Mensagens">
        <Button size="sm" onClick={() => chat.sendMessage("Mensagem enviada via chat.sendMessage()")}>sendMessage()</Button>
        <Button size="sm" variant="secondary" onClick={() => chat.addMessage(adminMsg("Resposta do admin 👋"))}>admin responde</Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => chat.addMessage(adminMsg("Abra a [agenda filtrada pelo paciente](/schedules/123?patientId=7) 📅"))}
        >
          admin + link interno
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            chat.addMessage(
              adminMsg("Encontrei a consulta cancelada.", {
                kind: "action",
                meta: { title: "Abrir agenda", href: "/schedules/123?doctorId=42" },
              }),
            )
          }
        >
          card customizado (kind)
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const batch = [adminMsg("Novidade 1"), adminMsg("Novidade 2"), adminMsg("Novidade 3")];
            chat.setUnreadMarker(batch[0]!.id);
            batch.forEach(chat.addMessage);
          }}
        >
          3 novas + setUnreadMarker
        </Button>
        <Button size="sm" variant="outline" onClick={() => chat.setUnreadMarker(null)}>limpar marcador</Button>
        <Button size="sm" variant="outline" onClick={() => chat.setTyping(state.typing ? null : admin)}>
          setTyping({state.typing ? "null" : "admin"})
        </Button>
        <Button size="sm" variant="outline" onClick={() => chat.scrollToBottom()}>scrollToBottom()</Button>
        <Button size="sm" variant="outline" onClick={() => chat.loadMore()} disabled={!state.hasMore}>loadMore()</Button>
        <Button size="sm" variant="ghost" onClick={() => chat.clear()}>clear()</Button>
      </Section>

      <Section title="Tema">
        {Object.entries(THEMES).map(([name, theme]) => (
          <Button
            key={name}
            size="sm"
            variant={state.config.theme === theme ? "default" : "outline"}
            onClick={() => chat.setTheme(theme)}
          >
            {name}
          </Button>
        ))}
        <span className="w-full text-[11px] text-muted-foreground">colorScheme:</span>
        {(["inherit", "light", "dark", "system"] as ColorScheme[]).map((cs) => (
          <Button
            key={cs}
            size="sm"
            variant={state.config.colorScheme === cs ? "default" : "outline"}
            onClick={() => chat.setColorScheme(cs)}
          >
            {cs}
          </Button>
        ))}
        <p className="w-full text-[11px] text-muted-foreground">
          "inherit" segue o tema do host: alterne "dark" em Visual (classe .dark na página).
        </p>
      </Section>

      <Section title="Visual">
        <Button size="sm" variant="outline" onClick={() => chat.setConfig({ externalLinks: !state.config.externalLinks })}>
          externalLinks: {String(state.config.externalLinks)}
        </Button>
        <Button size="sm" variant="outline" onClick={() => chat.setConfig({ showAuthorName: !state.config.showAuthorName })}>
          authorName: {String(state.config.showAuthorName)}
        </Button>
        <Button size="sm" variant="outline" onClick={() => chat.setConfig({ showAvatars: !state.config.showAvatars })}>
          avatars: {String(state.config.showAvatars)}
        </Button>
        <Button size="sm" variant="outline" onClick={() => chat.setConfig({ showTimestamps: !state.config.showTimestamps })}>
          timestamps: {String(state.config.showTimestamps)}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => chat.setConfig({ locale: state.config.locale === "pt-BR" ? "en-US" : "pt-BR" })}
        >
          locale: {state.config.locale}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDark((d) => !d)}>host dark: {String(dark)}</Button>
      </Section>

      <Section title="Eventos (chat.on)">
        <div className="w-full">
          <EventLog />
        </div>
      </Section>
      <p className="text-[11px] text-muted-foreground">onSend simulado falha a cada 3º envio → use "Tentar novamente".</p>
    </aside>
  );
}

type Mode = "inline" | "widget";

function App() {
  const [mode, setMode] = useState<Mode>(new URLSearchParams(location.search).get("mode") === "widget" ? "widget" : "inline");

  // Inline chat is always "open"; the widget starts closed.
  useEffect(() => {
    if (mode === "inline") chat.open();
    else chat.close();
  }, [mode]);

  return (
    <main className="mx-auto grid h-dvh max-w-6xl gap-4 p-4 md:grid-cols-[1fr_380px]">
      {mode === "inline" ? (
        <Chat chat={chat} className="min-h-[480px]" renderers={{ action: ActionCard }} />
      ) : (
        <>
          <div className="flex min-h-[480px] items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Modo widget: use o botão flutuante no canto inferior direito.
          </div>
          <ChatWidget chat={chat} renderers={{ action: ActionCard }} />
        </>
      )}
      <Controls mode={mode} setMode={setMode} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

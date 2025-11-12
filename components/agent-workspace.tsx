"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClockCheck,
  CircleCheckBig,
  CircleDot,
  Clock3,
  Loader,
  MessageSquareReply,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound
} from "lucide-react";
import clsx from "clsx";

type MessageAuthor = "customer" | "agent" | "system";

type Message = {
  id: string;
  author: MessageAuthor;
  body: string;
  timestamp: string;
  sentiment?: "positive" | "neutral" | "negative";
  topic?: string;
};

type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  response: string;
  keywords: string[];
  lastUpdated: string;
  confidence: number;
};

type TimelineEntry = {
  id: string;
  label: string;
  description: string;
  timestamp: string;
  type: "touchpoint" | "status" | "action";
};

const customerProfile = {
  name: "Jamie Rivera",
  handle: "@jamie_r",
  segment: "Premium Plus",
  tenure: "2 years",
  lifetimeValue: "$4,860",
  satisfactionScore: 4.6,
  avatarColor: "bg-brand-500",
  traits: ["Prefers chat support", "Early adopter", "High-order frequency"],
  recentOrders: [
    {
      id: "INV-4001",
      product: "PulseCare Smart Hub",
      date: "Apr 9, 2024",
      status: "Delivered",
      sentiment: "positive"
    },
    {
      id: "INV-3975",
      product: "PulseSense Battery Pack",
      date: "Mar 22, 2024",
      status: "Delivered",
      sentiment: "neutral"
    }
  ]
};

const knowledgeBase: KnowledgeArticle[] = [
  {
    id: "kb-101",
    title: "Restore Offline Sensors",
    summary: "Quick checklist to bring sensors back online via the PulseCare mobile app.",
    response:
      "Hi Jamie! When a sensor goes offline, open the PulseCare app, tap the device, and choose 'Run Diagnostics'. This will guide you through reconnecting to Wi-Fi. If the LED stays red for more than 15 seconds, hold the side button for 8 seconds to reboot the sensor.",
    keywords: ["offline", "sensor", "Wi-Fi", "diagnostic"],
    lastUpdated: "Mar 28, 2024",
    confidence: 0.92
  },
  {
    id: "kb-204",
    title: "Subscription Renewal Grace Period",
    summary: "Explains billing grace periods and how to retry payments.",
    response:
      "We've got you covered! Your PulseCare Plus subscription has a 14-day grace period. You can retry the payment under Billing > Subscriptions. If you need extra time, I'm happy to apply a one-time 7-day extension.",
    keywords: ["subscription", "billing", "payment", "grace"],
    lastUpdated: "Feb 15, 2024",
    confidence: 0.87
  },
  {
    id: "kb-312",
    title: "Same-Day Replacement Policy",
    summary: "Eligibility and process for fast-track replacement shipping.",
    response:
      "I can arrange a same-day replacement since you're a Premium Plus member in a covered metro area. Once confirmed, you'll receive a pre-paid return label, and the replacement ships out within 2 hours.",
    keywords: ["replacement", "shipping", "premium", "metro"],
    lastUpdated: "Apr 2, 2024",
    confidence: 0.95
  }
];

const conversationTimeline: TimelineEntry[] = [
  {
    id: "tl-1",
    label: "Proactive alert sent",
    description: "PulseCare detected sensor 3 offline for 18 mins",
    timestamp: "9:18 AM",
    type: "status"
  },
  {
    id: "tl-2",
    label: "Customer reply",
    description: "Shared screenshot of red LED",
    timestamp: "9:21 AM",
    type: "touchpoint"
  },
  {
    id: "tl-3",
    label: "Agent escalated",
    description: "Forwarded to Tier 2 diagnostics",
    timestamp: "9:25 AM",
    type: "action"
  }
];

const baseMessages: Message[] = [
  {
    id: "msg-1",
    author: "customer",
    body: "Hey, sensor on my living room camera keeps going offline with a red LED. App can't reconnect.",
    timestamp: "9:22 AM",
    sentiment: "negative",
    topic: "Device offline"
  },
  {
    id: "msg-2",
    author: "agent",
    body: "Thanks for flagging, Jamie! Let me pull the diagnostics for that sensor—one moment while I check the signal strength history.",
    timestamp: "9:23 AM",
    sentiment: "neutral",
    topic: "Diagnostics"
  },
  {
    id: "msg-3",
    author: "customer",
    body: "App shows 2.4GHz signal strong. Started right after latest firmware update yesterday.",
    timestamp: "9:24 AM",
    sentiment: "neutral",
    topic: "Firmware"
  }
];

const cannedReplies = [
  "Thanks for sharing those details—can you confirm if the sensor LED is solid or blinking red?",
  "I'm seeing a firmware patch that addresses this. I can push it manually if you’re online for the next 5 minutes.",
  "Since you're on Premium Plus, I can fast-track a replacement if we can't restore it remotely."
];

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSentimentColor(sentiment?: Message["sentiment"]) {
  switch (sentiment) {
    case "positive":
      return "text-emerald-500";
    case "negative":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
}

function getAuthorStyle(author: MessageAuthor) {
  switch (author) {
    case "agent":
      return {
        bubble: "bg-brand-500 text-white shadow-lg shadow-brand-700/20",
        alignment: "justify-end",
        chip: "bg-white/20 text-white"
      };
    case "system":
      return {
        bubble: "bg-slate-200 text-slate-700 border border-slate-300",
        alignment: "justify-center",
        chip: "bg-slate-300 text-slate-600"
      };
    default:
      return {
        bubble: "bg-white text-slate-800 border border-slate-200 shadow-sm",
        alignment: "justify-start",
        chip: "bg-brand-100 text-brand-600"
      };
  }
}

function matchKnowledge(message: string): KnowledgeArticle | undefined {
  const normalized = message.toLowerCase();
  const scored = knowledgeBase
    .map(article => {
      const keywordMatches = article.keywords.reduce(
        (score, keyword) => (normalized.includes(keyword) ? score + 1 : score),
        0
      );
      return { article, keywordMatches };
    })
    .sort((a, b) => b.keywordMatches - a.keywordMatches || b.article.confidence - a.article.confidence);

  if (!scored.length || scored[0].keywordMatches === 0) {
    return undefined;
  }
  return scored[0].article;
}

function generateResponse(message: string): Message {
  const article = matchKnowledge(message);
  const response = article
    ? `${article.response} Let me know once you try that so I can keep an eye on the real-time diagnostics.`
    : "Thanks, Jamie! I'm syncing diagnostics now. Give me a moment and I'll follow up with the best next step.";

  return {
    id: createId("msg"),
    author: "agent",
    body: response,
    timestamp: new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }),
    sentiment: "positive",
    topic: article ? article.title : "Follow-up"
  };
}

function sentimentLabel(sentiment?: Message["sentiment"]) {
  switch (sentiment) {
    case "positive":
      return "Positive";
    case "negative":
      return "Needs Attention";
    default:
      return "Neutral";
  }
}

export default function AgentWorkspace() {
  const [messages, setMessages] = useState<Message[]>(baseMessages);
  const [draft, setDraft] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  const latestCustomerMessage = useMemo(() => {
    return [...messages].reverse().find(msg => msg.author === "customer");
  }, [messages]);

  const recommendations = useMemo(() => {
    if (!latestCustomerMessage) return [];
    const matched = matchKnowledge(latestCustomerMessage.body);
    return matched ? [matched, ...knowledgeBase.filter(item => item.id !== matched.id).slice(0, 2)] : knowledgeBase;
  }, [latestCustomerMessage]);

  const handleSend = (value?: string) => {
    const content = (value ?? draft).trim();
    if (!content) return;

    const outbound: Message = {
      id: createId("msg"),
      author: "agent",
      body: content,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      }),
      sentiment: "positive",
      topic: "Custom reply"
    };

    setMessages(prev => [...prev, outbound]);
    setDraft("");
    setIsResponding(true);

    const lastCustomer = [...messages].reverse().find(msg => msg.author === "customer");
    const responseTarget = lastCustomer?.body ?? content;

    setTimeout(() => {
      setMessages(prev => [...prev, generateResponse(responseTarget)]);
      setIsResponding(false);
    }, 900);
  };

  const handleInsertSuggestion = (suggestion: string) => {
    setDraft(prev => (prev.length ? `${prev}\n\n${suggestion}` : suggestion));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 shadow-lg shadow-slate-200/40 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className={clsx("grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg", customerProfile.avatarColor)}>
            <span className="text-xl font-semibold">{customerProfile.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900">PulseCare Live Support</h1>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                <CircleCheckBig className="h-4 w-4" />
                SLA 8m remaining
              </span>
            </div>
            <p className="text-sm text-slate-500">Active conversation • Tier 2 Diagnostics</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip icon={<Sparkles className="h-4 w-4" />} label="AI Assist On" className="bg-brand-100 text-brand-700" />
          <StatusChip icon={<ShieldCheck className="h-4 w-4" />} label="Secure session" className="bg-slate-100 text-slate-600" />
          <StatusChip icon={<Star className="h-4 w-4" />} label={`${customerProfile.segment} member`} className="bg-amber-100 text-amber-700" />
        </div>
      </header>

      <section className="grid flex-1 gap-6 lg:grid-cols-[1.25fr,0.75fr]">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Conversation</h2>
              <p className="text-sm text-slate-500">Live chat · {customerProfile.name}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock3 className="h-4 w-4" />
              Response target &lt; 2 minutes
            </div>
          </div>

          <div className="relative flex-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white via-transparent to-white/70 pointer-events-none" />
            <div className="relative flex h-full flex-col gap-4 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {messages.map(message => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className={clsx("flex", getAuthorStyle(message.author).alignment)}
                  >
                    <div className="flex max-w-xl flex-col gap-2">
                      <div
                        className={clsx(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition",
                          getAuthorStyle(message.author).bubble
                        )}
                      >
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-xs font-medium uppercase tracking-wide text-white/70">
                            {message.author === "agent" ? "You" : message.author === "customer" ? customerProfile.name : "System"}
                          </span>
                          <span className={clsx("text-xs font-medium", message.author === "agent" ? "text-white/70" : "text-slate-400")}>
                            {message.timestamp}
                          </span>
                        </div>
                        <p className={clsx("mt-2 whitespace-pre-line text-sm", message.author === "customer" && "text-slate-700")}>
                          {message.body}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        {message.topic && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{message.topic}</span>}
                        <span className={clsx("flex items-center gap-1", getSentimentColor(message.sentiment))}>
                          <CircleDot className="h-3 w-3" />
                          {sentimentLabel(message.sentiment)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isResponding && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex max-w-sm flex-col gap-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-500">
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                          AI drafting
                        </div>
                        <p className="mt-2 text-slate-500">Composing follow-up...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Suggested replies</span>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-brand-200 bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-200 hover:text-brand-800"
                onClick={() => latestCustomerMessage && handleInsertSuggestion(generateResponse(latestCustomerMessage.body).body)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto-draft
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {cannedReplies.map(reply => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleInsertSuggestion(reply)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-md">
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder="Draft your reply…"
              className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <PhoneCall className="h-3.5 w-3.5 text-brand-500" />
                  Call escalation ready
                </span>
                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  <AlarmClockCheck className="h-3.5 w-3.5 text-emerald-500" />
                  SLA on track
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSend("Looping in Tier 2 support to monitor the firmware. I'll stay with you until we confirm it's stable.")}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Send & escalate
                </button>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/40 transition hover:bg-brand-600"
                >
                  <MessageSquareReply className="h-4 w-4" />
                  Send reply
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-300/50 backdrop-blur">
          <ProfileCard />
          <AiInsights recommendations={recommendations} onInsert={handleInsertSuggestion} />
          <Timeline />
        </aside>
      </section>
    </div>
  );
}

function StatusChip({ icon, label, className }: { icon: ReactNode; label: string; className?: string }) {
  return (
    <span
      className={clsx(
        "flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-xs font-semibold shadow-sm transition",
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function ProfileCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white px-5 py-6 shadow-lg shadow-slate-200/60">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">{customerProfile.name}</h3>
              <p className="text-sm text-slate-500">{customerProfile.handle}</p>
            </div>
          </div>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">CSAT {customerProfile.satisfactionScore}</div>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-600">
        <DetailRow label="Plan" value={customerProfile.segment} />
        <DetailRow label="Tenure" value={customerProfile.tenure} />
        <DetailRow label="Lifetime value" value={customerProfile.lifetimeValue} />
      </div>
      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Traits</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {customerProfile.traits.map(trait => (
            <span key={trait} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              {trait}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent orders</h4>
        <div className="mt-3 flex flex-col gap-3 text-sm text-slate-600">
          {customerProfile.recentOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-700">{order.product}</p>
                <p className="text-xs text-slate-400">
                  {order.id} • {order.date}
                </p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  order.sentiment === "positive" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                )}
              >
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function AiInsights({
  recommendations,
  onInsert
}: {
  recommendations: KnowledgeArticle[];
  onInsert: (draft: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50 px-5 py-6 shadow-inner shadow-brand-200/40">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-700">AI Assist</h3>
          <p className="text-xs text-brand-500">Suggested resolutions and macros</p>
        </div>
        <Sparkles className="h-5 w-5 text-brand-400" />
      </div>
      <div className="flex flex-col gap-3">
        {recommendations.map(article => (
          <div key={article.id} className="rounded-2xl border border-brand-200/60 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{article.title}</p>
                <p className="mt-1 text-xs text-slate-500">{article.summary}</p>
              </div>
              <span className="rounded-full bg-brand-100 px-2 py-1 text-[10px] font-semibold text-brand-700">
                {Math.round(article.confidence * 100)}% match
              </span>
            </div>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
              onClick={() => onInsert(article.response)}
            >
              Insert resolution
              <CircleCheckBig className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-brand-100 bg-white/90 p-4 text-xs text-slate-500">
        <strong className="block text-sm font-semibold text-brand-600">Live diagnostics</strong>
        <ul className="mt-2 space-y-1">
          <li>• Uptime last 24h: 98.2%</li>
          <li>• Packet loss: &lt; 1%</li>
          <li>• Firmware version: 4.18.2 (latest)</li>
        </ul>
      </div>
    </div>
  );
}

function Timeline() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-lg shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Conversation timeline</h3>
        <span className="text-xs text-slate-400">Last 30 mins</span>
      </div>
      <div className="mt-4 space-y-4">
        {conversationTimeline.map(entry => (
          <div key={entry.id} className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600">
              {entry.type === "status" && <CircleDot className="h-4 w-4" />}
              {entry.type === "touchpoint" && <PhoneCall className="h-4 w-4" />}
              {entry.type === "action" && <AlarmClockCheck className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{entry.label}</p>
                <span className="text-xs text-slate-400">{entry.timestamp}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

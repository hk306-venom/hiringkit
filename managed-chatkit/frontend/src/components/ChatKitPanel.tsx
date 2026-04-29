import { useMemo, useState, useEffect } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";

export function ChatKitPanel() {
  const [voiceReply, setVoiceReply] = useState(false);

  const getClientSecret = useMemo(
    () => createClientSecretFetcher(workflowId),
    []
  );

  // ✅ 🔥 CHATKIT OPTIONS (tumhara config)
  const options: ChatKitOptions = {
    api: {
      getClientSecret,
    },
    theme: {
      colorScheme: "dark",
      radius: "soft",
      density: "compact",
      typography: {
        baseSize: 16,
        fontFamily: "Lora, serif",
        fontSources: [
          {
            family: "Lora",
            src: "https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7I_FMl_E.woff2",
            weight: 400,
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    composer: {
      placeholder: "Know about AI HUB",
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760,
      },
      tools: [
        {
          id: "search_docs",
          label: "Search docs",
          shortLabel: "Docs",
          placeholderOverride: "Search documentation",
          icon: "book-open",
          pinned: true,
        },
      ],
      models: [
        {
          id: "gpt-5",
          label: "gpt-5",
          description: "Balanced intelligence",
          default: true,
        },
      ],
    },
    startScreen: {
      greeting: "Know about AI HUB",
      prompts: [],
    },
  };

  // ✅ ChatKit init
  const chatkit = useChatKit(options);

  // 🎤 Speech → Text
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.start();

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;

      const control = chatkit.control as any;
      control.addMessage({
        role: "user",
        content: text,
      });
    };
  };

  // 🔊 Voice reply
  const speak = (text: string) => {
    if (!voiceReply) return;

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 🔥 Auto voice reply
  useEffect(() => {
    if (!chatkit.control) return;

    const control = chatkit.control as any;
    const handleStateChange = (state: any) => {
      const msgs = state?.messages || [];
      const last = msgs[msgs.length - 1];

      if (last?.role === "assistant") {
        speak(last.content);
      }
    };

    // Try to use subscribe if available, otherwise use on/off pattern
    if (typeof control.subscribe === "function") {
      const unsub = control.subscribe(handleStateChange);
      return () => {
        if (typeof unsub === "function") unsub();
      };
    } else if (typeof control.on === "function") {
      control.on("message", handleStateChange);
      return () => {
        if (typeof control.off === "function") {
          control.off("message", handleStateChange);
        }
      };
    }
  }, [chatkit, voiceReply]);

  return (
    <div className="relative flex h-[90vh] w-full">

      {/* ✅ ChatKit UI (single input bar) */}
      <ChatKit control={chatkit.control} className="h-full w-full" />

      {/* ✅ Overlay Voice Buttons */}
      <div className="absolute bottom-5 right-6 flex gap-3">

        {/* 🎤 MIC */}
        <button
          onClick={startListening}
          className="bg-black text-white p-3 rounded-full shadow-lg"
        >
          🎤
        </button>

        {/* 🔊 VOICE TOGGLE */}
        <button
          onClick={() => setVoiceReply(!voiceReply)}
          className={`p-3 rounded-full shadow-lg ${
            voiceReply ? "bg-green-500 text-white" : "bg-black text-white"
          }`}
        >
          🔊
        </button>

      </div>
    </div>
  );
}
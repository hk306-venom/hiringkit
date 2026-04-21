import { useMemo, useState, useEffect } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";

export function ChatKitPanel() {
  const [voiceReply, setVoiceReply] = useState(false);

  const getClientSecret = useMemo(
    () => createClientSecretFetcher(workflowId),
    []
  );

  const chatkit = useChatKit({
    api: { getClientSecret },
  });

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

      // 🔥 directly ChatKit me bhejo
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
    const handleMessage = (state: any) => {
      const msgs = state?.messages || [];
      const last = msgs[msgs.length - 1];

      if (last?.role === "assistant") {
        speak(last.content);
      }
    };

    if (typeof control.on === "function") {
      control.on("message", handleMessage);
    }

    return () => {
      if (typeof control.off === "function") {
        control.off("message", handleMessage);
      }
    };
  }, [chatkit, voiceReply]);

  return (
    <div className="relative flex h-[90vh] w-full">

      {/* ✅ ORIGINAL ChatKit UI */}
      <ChatKit control={chatkit.control} className="h-full w-full" />

      {/* ✅ 🔥 Overlay buttons (NO extra input bar) */}
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
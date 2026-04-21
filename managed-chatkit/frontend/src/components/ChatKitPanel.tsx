import { useMemo, useState } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";

export function ChatKitPanel() {
  const [voiceReply, setVoiceReply] = useState(false);

  const getClientSecret = useMemo(
    () => createClientSecretFetcher(workflowId),
    []
  );

  const options: ChatKitOptions = {
    api: { getClientSecret },
    composer: {
      placeholder: "Know about AI HUB",
    },
    startScreen: {
      greeting: "Know about AI HUB",
      prompts: [],
    },
  };

  const chatkit = useChatKit(options);

  // 🎤 MIC (WORKING)
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

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;

      // ✅ DIRECT MESSAGE SEND (NO ERROR)
      await (chatkit.control as any).addMessage({
        role: "user",
        content: text,
      });
    };
  };

  // 🔊 SPEAKER (WORKING)
  const speakLastMessage = () => {
    if (!voiceReply) return;

    const messages = (chatkit.control as any).getState()?.messages || [];
    const last = messages[messages.length - 1];

    if (last?.role === "assistant") {
      const utterance = new SpeechSynthesisUtterance(last.content);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative h-[90vh] w-full">

      <ChatKit control={chatkit.control} className="h-full w-full" />

      {/* ✅ SAME BAR POSITION (RIGHT SIDE) */}
      <div className="absolute bottom-6 right-6 flex gap-2">

        {/* 🎤 MIC */}
        <button
          onClick={startListening}
          className="bg-black text-white p-2 rounded-full"
        >
          🎤
        </button>

        {/* 🔊 SPEAKER */}
        <button
          onClick={() => {
            setVoiceReply(!voiceReply);
            speakLastMessage();
          }}
          className={`p-2 rounded-full ${
            voiceReply ? "bg-green-500 text-white" : "bg-black text-white"
          }`}
        >
          🔊
        </button>

      </div>
    </div>
  );
}
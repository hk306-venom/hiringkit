import { useMemo, useState, useEffect } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";

export function ChatKitPanel() {
  const [input, setInput] = useState("");
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const text = event.results[0][0].transcript;
        setInput(text);
      }
    };

    recognition.onerror = (event: Event) => {
      console.error("Speech recognition error:", event);
    };
  };

  // 🔊 Text → Speech
  const speak = (text: string) => {
    if (!voiceReply) return;

    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis not supported");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 📤 Send Message
  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      const control = chatkit.control as any;
      await control.addMessage({
        role: "user",
        content: input,
      });
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // 🔥 Auto Voice Reply
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
    <div className="relative flex h-[90vh] w-full bg-slate-900">

      <ChatKit control={chatkit.control} className="h-full w-full" />

      <div className="absolute bottom-4 left-1/2 w-[90%] max-w-2xl -translate-x-1/2">
        <div className="flex gap-2 bg-black/60 p-3 rounded-full">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none"
            placeholder="Type message..."
          />

          <button onClick={startListening}>🎤</button>

          <button
            onClick={() => setVoiceReply(!voiceReply)}
            className={voiceReply ? "text-green-400" : ""}
          >
            🔊
          </button>

          <button onClick={handleSend} className="bg-white text-black px-2 rounded">
            ↑
          </button>

        </div>
      </div>
    </div>
  );
}
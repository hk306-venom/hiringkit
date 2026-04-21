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
    <div className="relative flex flex-col h-[90vh] w-full bg-slate-900">
      <div className="flex-1 overflow-hidden">
        <ChatKit control={chatkit.control} className="h-full w-full" />
      </div>

      <div className="w-full px-4 py-4 bg-slate-900">
        <div className="flex gap-2 bg-black/60 p-3 rounded-full items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent text-white outline-none"
            placeholder="Type message..."
          />

          <button 
            onClick={startListening}
            className="text-white text-xl hover:text-gray-300"
          >
            🎤
          </button>

          <button
            onClick={() => setVoiceReply(!voiceReply)}
            className={`text-xl transition-colors ${voiceReply ? "text-green-400" : "text-white hover:text-gray-300"}`}
          >
            🔊
          </button>

          <button 
            onClick={handleSend} 
            className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 font-semibold"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
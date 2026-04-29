import { useMemo } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";

export function ChatKitPanel() {
  const getClientSecret = useMemo(
    () => createClientSecretFetcher(workflowId),
    []
  );

  // ✅ 🔥 CLEAN + UPGRADED OPTIONS (NO VOICE)
  const options: ChatKitOptions = {
    api: {
      getClientSecret,
    },
    theme: {
      colorScheme: 'dark',
      radius: 'soft',
      density: 'compact',
      typography: {
        baseSize: 16,
        fontFamily: 'Lora, serif',
        fontSources: [
          {
            family: 'Lora',
            src: 'https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7I_FMl_E.woff2',
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    composer: {
      placeholder: 'Know about AI HUB',
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760,
      },
      tools: [
        {
          id: 'search_docs',
          label: 'Search docs',
          shortLabel: 'Docs',
          placeholderOverride: 'Search documentation',
          icon: 'book-open',
          pinned: true,
        },
      ],
      models: [
        {
          id: 'gpt-5',
          label: 'gpt-5',
          description: 'Balanced intelligence',
          default: true,
        },
      ],
    },
    startScreen: {
      greeting: 'Welcome to Gateway of Future (AI HUB)',
      prompts: [],
    },
  };

  const chatkit = useChatKit(options);

  return (
    <div className="flex h-[90vh] w-full">
      <ChatKit control={chatkit.control} className="h-full w-full" />
    </div>
  );
}       
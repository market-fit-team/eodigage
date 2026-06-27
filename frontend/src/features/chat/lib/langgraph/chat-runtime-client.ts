import { Client } from "@langchain/langgraph-sdk"
import { fetchWithAuthResponse } from "@/features/auth/lib/fetch-with-auth"
import type {
  ChatModelSelectionControls,
  ToolPolicyControls,
} from "@/features/chat/hooks/langgraph-chat-stream-context"
import { buildSubmitContext } from "@/features/chat/lib/langgraph/build-submit-config"
import { buildSubmitInput } from "@/features/chat/lib/langgraph/build-submit-input"
import { withCsrfHeaders } from "@/shared/api/csrf"

const AGENT_PUBLIC_PATH = "/api/agent"
const CHAT_ASSISTANT_ID = "chat"

export const buildAgentApiUrl = () => {
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:8088"

  return new URL(AGENT_PUBLIC_PATH, origin).toString()
}

export const langGraphFetch: typeof fetch = async (input, init) => {
  return fetchWithAuthResponse(input, {
    ...init,
    headers: withCsrfHeaders(init?.headers),
  })
}

export const createLangGraphClient = (apiUrl = buildAgentApiUrl()) =>
  new Client({
    apiUrl,
    callerOptions: {
      fetch: langGraphFetch,
    },
  })

export const submitWorkspaceThreadMessage = async ({
  appThreadId,
  content,
  langgraphThreadId,
  modelSelection,
  selectedArtifactIds,
  selectedDocumentIds,
  toolPolicy,
}: {
  appThreadId: string
  content: string
  langgraphThreadId: string
  modelSelection: ChatModelSelectionControls
  selectedArtifactIds?: string[]
  selectedDocumentIds?: string[]
  toolPolicy: ToolPolicyControls
}) => {
  const client = createLangGraphClient()
  const context = buildSubmitContext(
    modelSelection,
    toolPolicy,
    appThreadId,
    selectedDocumentIds ?? [],
    selectedArtifactIds ?? []
  )

  await client.runs.create(langgraphThreadId, CHAT_ASSISTANT_ID, {
    input: buildSubmitInput(content),
    config: {
      configurable: context,
    },
    multitaskStrategy: "reject",
  })
}

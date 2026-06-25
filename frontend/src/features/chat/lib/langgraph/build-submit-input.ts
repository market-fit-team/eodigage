import { HumanMessage } from "@langchain/core/messages"

export const buildSubmitInput = (
  content: string
): { messages: [HumanMessage] } => ({
  messages: [
    new HumanMessage({
      content,
      id: crypto.randomUUID(),
    }),
  ],
})

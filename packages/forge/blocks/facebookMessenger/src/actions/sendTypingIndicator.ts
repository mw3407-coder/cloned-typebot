import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

export const sendTypingIndicator = createAction({
  auth,
  name: 'Send Typing Indicator',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    senderAction: option.enum(['typing_on', 'typing_off', 'mark_seen'] as const).meta({
      layout: { label: 'Action', isRequired: true },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, senderAction },
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')

      const body = {
        recipient: { id: recipientId },
        sender_action: senderAction ?? 'typing_on',
      }

      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        )
        if (!res.ok) {
          const data = await res.json()
          logs.add(`Messenger API error: ${JSON.stringify(data)}`)
        }
      } catch (err) {
        logs.add(`Request failed: ${err}`)
      }
    },
  },
})

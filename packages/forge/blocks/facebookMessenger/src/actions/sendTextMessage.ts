import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

export const sendTextMessage = createAction({
  auth,
  name: 'Send Text Message',
  options: option.object({
    recipientId: option.string.meta({
      layout: {
        label: 'Recipient PSID',
        isRequired: true,
        helperText: "The recipient's Page-Scoped ID (PSID). Use a variable captured from the Messenger webhook.",
      },
    }),
    message: option.string.meta({
      layout: {
        label: 'Message Text',
        isRequired: true,
        inputType: 'textarea',
      },
    }),
    messageTag: option.enum([
      'CONFIRMED_EVENT_UPDATE',
      'POST_PURCHASE_UPDATE',
      'ACCOUNT_UPDATE',
      'HUMAN_AGENT',
    ] as const).meta({
      layout: {
        label: 'Message Tag (optional)',
        helperText:
          'Required to send messages outside the 24-hour window. Leave blank for standard messages.',
      },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, message, messageTag, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!message) return logs.add('Message text is missing.')

      const body: Record<string, unknown> = {
        recipient: { id: recipientId },
        message: { text: message },
      }
      if (messageTag) body.messaging_type = 'MESSAGE_TAG'
      if (messageTag) body.tag = messageTag

      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        )
        const data = await res.json()
        if (!res.ok) {
          logs.add(`Messenger API error: ${JSON.stringify(data)}`)
          return
        }
        if (responseVariable) variables.set(responseVariable, JSON.stringify(data))
      } catch (err) {
        logs.add(`Request failed: ${err}`)
      }
    },
  },
})

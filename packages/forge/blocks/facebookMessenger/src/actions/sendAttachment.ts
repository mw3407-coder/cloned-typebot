import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

export const sendAttachment = createAction({
  auth,
  name: 'Send Attachment',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    attachmentType: option.enum(['image', 'video', 'audio', 'file'] as const).meta({
      layout: { label: 'Attachment Type', isRequired: true },
    }),
    url: option.string.meta({
      layout: { label: 'File URL', isRequired: true },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, attachmentType, url, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!url) return logs.add('File URL is missing.')

      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: attachmentType ?? 'file',
            payload: { url, is_reusable: true },
          },
        },
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

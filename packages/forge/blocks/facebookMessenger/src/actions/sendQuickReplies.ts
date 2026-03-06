import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

const quickReplySchema = option.object({
  contentType: option.enum(['text', 'user_email', 'user_phone_number'] as const).meta({
    layout: { label: 'Content Type', isRequired: true },
  }),
  title: option.string.meta({
    layout: { label: 'Title (for text type, max 20 chars)' },
  }),
  payload: option.string.meta({
    layout: { label: 'Payload (for text type)' },
  }),
  imageUrl: option.string.meta({
    layout: { label: 'Image URL (for text type, optional)' },
  }),
})

export const sendQuickReplies = createAction({
  auth,
  name: 'Send Quick Replies',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    messageText: option.string.meta({
      layout: {
        label: 'Message Text',
        isRequired: true,
        inputType: 'textarea',
      },
    }),
    quickReplies: option.array(quickReplySchema).meta({
      layout: { label: 'Quick Replies (up to 11)', itemLabel: 'quick reply' },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, messageText, quickReplies, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!messageText) return logs.add('Message text is missing.')

      const mapped = (quickReplies ?? []).slice(0, 11).map((qr) => {
        if (qr.contentType === 'user_email') return { content_type: 'user_email' }
        if (qr.contentType === 'user_phone_number') return { content_type: 'user_phone_number' }
        const r: Record<string, unknown> = {
          content_type: 'text',
          title: qr.title,
          payload: qr.payload ?? qr.title,
        }
        if (qr.imageUrl) r.image_url = qr.imageUrl
        return r
      })

      const body = {
        recipient: { id: recipientId },
        message: {
          text: messageText,
          quick_replies: mapped,
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

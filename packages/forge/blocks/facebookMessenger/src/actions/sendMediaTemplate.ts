import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

const buttonSchema = option.object({
  type: option.enum(['web_url', 'postback'] as const).meta({
    layout: { label: 'Button Type', isRequired: true },
  }),
  title: option.string.meta({
    layout: { label: 'Button Title', isRequired: true },
  }),
  url: option.string.meta({
    layout: { label: 'URL (for web_url type)' },
  }),
  payload: option.string.meta({
    layout: { label: 'Payload (for postback type)' },
  }),
})

export const sendMediaTemplate = createAction({
  auth,
  name: 'Send Media Template',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    mediaType: option.enum(['image', 'video'] as const).meta({
      layout: { label: 'Media Type', isRequired: true },
    }),
    url: option.string.meta({
      layout: {
        label: 'Media URL',
        helperText: 'Must be a Facebook-hosted URL (fb.com or fbcdn.net). Use attachment ID instead for other sources.',
      },
    }),
    attachmentId: option.string.meta({
      layout: {
        label: 'Attachment ID (optional)',
        helperText: 'Use an existing Facebook attachment ID instead of a URL.',
      },
    }),
    buttons: option.array(buttonSchema).meta({
      layout: { label: 'Buttons (up to 2)', itemLabel: 'button' },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, mediaType, url, attachmentId, buttons, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!url && !attachmentId) return logs.add('Either a URL or Attachment ID is required.')

      const mediaPayload: Record<string, unknown> = {
        media_type: mediaType ?? 'image',
      }
      if (attachmentId) {
        mediaPayload.attachment_id = attachmentId
      } else {
        mediaPayload.url = url
      }

      if (buttons && buttons.length > 0) {
        mediaPayload.buttons = buttons.slice(0, 2).map((btn) =>
          btn.type === 'web_url'
            ? { type: 'web_url', title: btn.title, url: btn.url }
            : { type: 'postback', title: btn.title, payload: btn.payload }
        )
      }

      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'media',
              elements: [mediaPayload],
            },
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

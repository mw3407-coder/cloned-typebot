import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

const listItemSchema = option.object({
  title: option.string.meta({
    layout: { label: 'Title', isRequired: true },
  }),
  subtitle: option.string.meta({
    layout: { label: 'Subtitle' },
  }),
  imageUrl: option.string.meta({
    layout: { label: 'Image URL' },
  }),
  buttonType: option.enum(['web_url', 'postback'] as const).meta({
    layout: { label: 'Button Type (optional)' },
  }),
  buttonTitle: option.string.meta({
    layout: { label: 'Button Title' },
  }),
  buttonUrl: option.string.meta({
    layout: { label: 'Button URL (for web_url)' },
  }),
  buttonPayload: option.string.meta({
    layout: { label: 'Button Payload (for postback)' },
  }),
})

export const sendListTemplate = createAction({
  auth,
  name: 'Send List Template',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    items: option.array(listItemSchema).meta({
      layout: { label: 'List Items (2–4)', itemLabel: 'item' },
    }),
    globalButtonTitle: option.string.meta({
      layout: { label: 'Global Bottom Button Title (optional)' },
    }),
    globalButtonUrl: option.string.meta({
      layout: { label: 'Global Bottom Button URL (optional)' },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, items, globalButtonTitle, globalButtonUrl, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!items || items.length < 2) return logs.add('At least 2 list items are required.')

      const elements = items.slice(0, 4).map((item) => {
        const el: Record<string, unknown> = { title: item.title }
        if (item.subtitle) el.subtitle = item.subtitle
        if (item.imageUrl) el.image_url = item.imageUrl
        if (item.buttonType && item.buttonTitle) {
          el.buttons = [
            item.buttonType === 'web_url'
              ? { type: 'web_url', title: item.buttonTitle, url: item.buttonUrl }
              : { type: 'postback', title: item.buttonTitle, payload: item.buttonPayload },
          ]
        }
        return el
      })

      const payload: Record<string, unknown> = {
        template_type: 'list',
        top_element_style: 'compact',
        elements,
      }

      if (globalButtonTitle && globalButtonUrl) {
        payload.buttons = [
          { type: 'web_url', title: globalButtonTitle, url: globalButtonUrl },
        ]
      }

      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: { type: 'template', payload },
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

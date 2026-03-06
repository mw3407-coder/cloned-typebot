import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

const buttonSchema = option.object({
  type: option.enum(['web_url', 'postback', 'phone_number', 'share'] as const).meta({
    layout: { label: 'Button Type', isRequired: true },
  }),
  title: option.string.meta({
    layout: { label: 'Button Title' },
  }),
  url: option.string.meta({
    layout: { label: 'URL (for web_url type)' },
  }),
  webviewHeightRatio: option.enum(['compact', 'tall', 'full'] as const).meta({
    layout: { label: 'Webview Height (for web_url type)' },
  }),
  payload: option.string.meta({
    layout: { label: 'Payload (for postback type)' },
  }),
  phoneNumber: option.string.meta({
    layout: { label: 'Phone Number (for phone_number type)' },
  }),
})

const cardSchema = option.object({
  title: option.string.meta({
    layout: { label: 'Card Title', isRequired: true },
  }),
  subtitle: option.string.meta({
    layout: { label: 'Card Subtitle' },
  }),
  imageUrl: option.string.meta({
    layout: { label: 'Image URL' },
  }),
  buttons: option.array(buttonSchema).meta({
    layout: { label: 'Buttons', itemLabel: 'button' },
  }),
})

export const sendGenericTemplate = createAction({
  auth,
  name: 'Send Generic Template (Carousel)',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    cards: option.array(cardSchema).meta({
      layout: { label: 'Cards (up to 10)', itemLabel: 'card' },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, cards, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!cards || cards.length === 0) return logs.add('At least one card is required.')

      const elements = cards.slice(0, 10).map((card) => {
        const el: Record<string, unknown> = { title: card.title }
        if (card.subtitle) el.subtitle = card.subtitle
        if (card.imageUrl) el.image_url = card.imageUrl
        if (card.buttons && card.buttons.length > 0) {
          el.buttons = card.buttons.slice(0, 3).map((btn) => {
            if (btn.type === 'web_url') {
              return {
                type: 'web_url',
                url: btn.url,
                title: btn.title,
                webview_height_ratio: btn.webviewHeightRatio ?? 'full',
              }
            }
            if (btn.type === 'postback') {
              return { type: 'postback', title: btn.title, payload: btn.payload }
            }
            if (btn.type === 'phone_number') {
              return { type: 'phone_number', title: btn.title, payload: btn.phoneNumber }
            }
            if (btn.type === 'share') {
              return { type: 'element_share' }
            }
            return btn
          })
        }
        return el
      })

      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements,
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

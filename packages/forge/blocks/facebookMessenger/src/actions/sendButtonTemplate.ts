import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

const buttonSchema = option.object({
  type: option.enum(['web_url', 'postback', 'phone_number'] as const).meta({
    layout: { label: 'Button Type', isRequired: true },
  }),
  title: option.string.meta({
    layout: { label: 'Button Title', isRequired: true },
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

export const sendButtonTemplate = createAction({
  auth,
  name: 'Send Button Template',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    bodyText: option.string.meta({
      layout: {
        label: 'Body Text',
        isRequired: true,
        inputType: 'textarea',
        helperText: 'UTF-8 encoded text of up to 640 characters.',
      },
    }),
    buttons: option.array(buttonSchema).meta({
      layout: { label: 'Buttons (up to 3)', itemLabel: 'button' },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, bodyText, buttons, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!bodyText) return logs.add('Body text is missing.')

      const mappedButtons = (buttons ?? []).slice(0, 3).map((btn) => {
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
        return { type: 'phone_number', title: btn.title, payload: btn.phoneNumber }
      })

      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: bodyText,
              buttons: mappedButtons,
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

import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

export const sendOneTimeNotification = createAction({
  auth,
  name: 'Send One-Time Notification Request',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    title: option.string.meta({
      layout: {
        label: 'Notification Topic',
        isRequired: true,
        helperText: 'Displayed to the user as the notification subject they are opting into.',
      },
    }),
    payload: option.string.meta({
      layout: {
        label: 'Payload',
        isRequired: true,
        helperText: 'Returned to your webhook when the user opts in.',
      },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { recipientId, title, payload, responseVariable },
      variables,
      logs,
    }) => {
      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!title) return logs.add('Notification topic title is required.')
      if (!payload) return logs.add('Payload is required.')

      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'one_time_notif_req',
              title,
              payload,
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

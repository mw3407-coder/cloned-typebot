import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

export const setGetStartedButton = createAction({
  auth,
  name: 'Set Get Started Button',
  options: option.object({
    payload: option.string.meta({
      layout: {
        label: 'Payload',
        isRequired: true,
        helperText:
          'This string is sent to your webhook as a postback when a first-time user taps the Get Started button.',
      },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { payload, responseVariable },
      variables,
      logs,
    }) => {
      if (!payload) return logs.add('Payload is required.')

      const body = {
        get_started: { payload },
      }

      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me/messenger_profile?access_token=${pageAccessToken}`,
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

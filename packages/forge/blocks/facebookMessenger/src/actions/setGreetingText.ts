import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

export const setGreetingText = createAction({
  auth,
  name: 'Set Greeting Text',
  options: option.object({
    greetingText: option.string.meta({
      layout: {
        label: 'Greeting Text',
        isRequired: true,
        inputType: 'textarea',
        helperText: 'Shown to users who have not messaged you before. Max 160 characters.',
      },
    }),
    locale: option.enum([
      'default',
      'en_US',
      'en_GB',
      'es_ES',
      'fr_FR',
      'pt_BR',
      'de_DE',
      'it_IT',
      'ja_JP',
      'ko_KR',
      'zh_CN',
      'zh_TW',
    ] as const).meta({
      layout: {
        label: 'Locale',
        helperText: 'Use "default" as a fallback for all locales.',
      },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { greetingText, locale, responseVariable },
      variables,
      logs,
    }) => {
      if (!greetingText) return logs.add('Greeting text is required.')

      const body = {
        greeting: [
          {
            locale: locale ?? 'default',
            text: greetingText,
          },
        ],
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

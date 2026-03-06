import { option, createAuth } from '@typebot.io/forge'

export const auth = createAuth({
  type: 'encryptedCredentials',
  name: 'Facebook Messenger account',
  schema: option.object({
    pageAccessToken: option.string.meta({
      layout: {
        isRequired: true,
        label: 'Page Access Token',
        helperText:
          'Your Facebook Page Access Token from the Meta Developer Portal.',
        withVariableButton: false,
      },
    }),
  }),
})

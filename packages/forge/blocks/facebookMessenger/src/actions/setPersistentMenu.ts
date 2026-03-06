import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

const menuItemSchema = option.object({
  type: option.enum(['postback', 'web_url'] as const).meta({
    layout: { label: 'Item Type', isRequired: true },
  }),
  title: option.string.meta({
    layout: { label: 'Title', isRequired: true },
  }),
  payload: option.string.meta({
    layout: { label: 'Payload (for postback type)' },
  }),
  url: option.string.meta({
    layout: { label: 'URL (for web_url type)' },
  }),
})

export const setPersistentMenu = createAction({
  auth,
  name: 'Set Persistent Menu',
  options: option.object({
    menuItems: option.array(menuItemSchema).meta({
      layout: {
        label: 'Menu Items (up to 3)',
        itemLabel: 'menu item',
        helperText: 'These appear in the hamburger menu at the bottom of the Messenger conversation.',
      },
    }),
    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options: { menuItems, responseVariable },
      variables,
      logs,
    }) => {
      if (!menuItems || menuItems.length === 0)
        return logs.add('At least one menu item is required.')

      const callToActions = menuItems.slice(0, 3).map((item) =>
        item.type === 'web_url'
          ? { type: 'web_url', title: item.title, url: item.url }
          : { type: 'postback', title: item.title, payload: item.payload }
      )

      const body = {
        persistent_menu: [
          {
            locale: 'default',
            composer_input_disabled: false,
            call_to_actions: callToActions,
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

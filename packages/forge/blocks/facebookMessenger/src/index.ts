import { createBlock } from '@typebot.io/forge'
import { MessengerLogo } from './logo'
import { auth } from './auth'
import { sendTextMessage } from './actions/sendTextMessage'
import { sendAttachment } from './actions/sendAttachment'
import { sendTypingIndicator } from './actions/sendTypingIndicator'
import { sendGenericTemplate } from './actions/sendGenericTemplate'
import { sendButtonTemplate } from './actions/sendButtonTemplate'
import { sendQuickReplies } from './actions/sendQuickReplies'
import { sendListTemplate } from './actions/sendListTemplate'
import { sendMediaTemplate } from './actions/sendMediaTemplate'
import { sendReceiptTemplate } from './actions/sendReceiptTemplate'
import { sendOneTimeNotification } from './actions/sendOneTimeNotification'
import { setPersistentMenu } from './actions/setPersistentMenu'
import { setGreetingText } from './actions/setGreetingText'
import { setGetStartedButton } from './actions/setGetStartedButton'

export const facebookMessengerBlock = createBlock({
  id: 'facebookMessenger',
  name: 'Facebook Messenger',
  tags: ['facebook', 'messenger', 'meta', 'social'],
  LightLogo: MessengerLogo,
  DarkLogo: MessengerLogo,
  auth,
  actions: [
    sendTextMessage,
    sendAttachment,
    sendTypingIndicator,
    sendGenericTemplate,
    sendButtonTemplate,
    sendQuickReplies,
    sendListTemplate,
    sendMediaTemplate,
    sendReceiptTemplate,
    sendOneTimeNotification,
    setPersistentMenu,
    setGreetingText,
    setGetStartedButton,
  ],
})

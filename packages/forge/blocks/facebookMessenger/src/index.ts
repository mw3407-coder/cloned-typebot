import { createBlock } from "@typebot.io/forge";
import { sendAttachment } from "./actions/sendAttachment";
import { sendButtonTemplate } from "./actions/sendButtonTemplate";
import { sendGenericTemplate } from "./actions/sendGenericTemplate";
import { sendListTemplate } from "./actions/sendListTemplate";
import { sendMediaTemplate } from "./actions/sendMediaTemplate";
import { sendOneTimeNotification } from "./actions/sendOneTimeNotification";
import { sendQuickReplies } from "./actions/sendQuickReplies";
import { sendReceiptTemplate } from "./actions/sendReceiptTemplate";
import { sendTextMessage } from "./actions/sendTextMessage";
import { sendTypingIndicator } from "./actions/sendTypingIndicator";
import { setGetStartedButton } from "./actions/setGetStartedButton";
import { setGreetingText } from "./actions/setGreetingText";
import { setPersistentMenu } from "./actions/setPersistentMenu";
import { auth } from "./auth";
import { MessengerLogo } from "./logo";

export const facebookMessengerBlock = createBlock({
  id: "facebookMessenger",
  name: "Facebook Messenger",
  tags: ["facebook", "messenger", "meta", "social"],
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
});

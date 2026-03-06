import { createActionHandler } from "@typebot.io/forge";
import { sendTextMessage } from "./actions/sendTextMessage";
import { sendAttachment } from "./actions/sendAttachment";
import { sendTypingIndicator } from "./actions/sendTypingIndicator";
import { sendGenericTemplate } from "./actions/sendGenericTemplate";
import { sendButtonTemplate } from "./actions/sendButtonTemplate";
import { sendQuickReplies } from "./actions/sendQuickReplies";
import { sendListTemplate } from "./actions/sendListTemplate";
import { sendMediaTemplate } from "./actions/sendMediaTemplate";
import { sendReceiptTemplate } from "./actions/sendReceiptTemplate";
import { sendOneTimeNotification } from "./actions/sendOneTimeNotification";
import { setPersistentMenu } from "./actions/setPersistentMenu";
import { setGreetingText } from "./actions/setGreetingText";
import { setGetStartedButton } from "./actions/setGetStartedButton";

const GRAPH_API = "https://graph.facebook.com/v19.0";

async function callMessagesApi(
  pageAccessToken: string,
  body: Record<string, unknown>,
  logs: { add: (msg: string) => void }
): Promise<unknown> {
  const res = await fetch(`${GRAPH_API}/me/messages?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    logs.add(`Messenger API error: ${JSON.stringify(data)}`);
    return null;
  }
  return data;
}

async function callProfileApi(
  pageAccessToken: string,
  body: Record<string, unknown>,
  logs: { add: (msg: string) => void }
): Promise<unknown> {
  const res = await fetch(`${GRAPH_API}/me/messenger_profile?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    logs.add(`Messenger Profile API error: ${JSON.stringify(data)}`);
    return null;
  }
  return data;
}

function saveResponse(
  data: unknown,
  responseMapping: { item?: string | null; variableId?: string | null }[] | undefined,
  variables: { set: (mappings: { id: string; value: unknown }[]) => void }
) {
  responseMapping?.forEach((mapping) => {
    if (!mapping.variableId) return;
    variables.set([{ id: mapping.variableId, value: JSON.stringify(data) }]);
  });
}

export default [
  createActionHandler(sendTextMessage, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, message, messageTag, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!message) return logs.add("Message text is missing.");
      const body: Record<string, unknown> = {
        recipient: { id: recipientId },
        message: { text: message },
      };
      if (messageTag) {
        body.messaging_type = "MESSAGE_TAG";
        body.tag = messageTag;
      }
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendAttachment, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, attachmentType, url, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!url) return logs.add("File URL is missing.");
      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: attachmentType ?? "file",
            payload: { url, is_reusable: true },
          },
        },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendTypingIndicator, {
    server: async ({ credentials: { pageAccessToken }, options, logs }) => {
      const { recipientId, senderAction } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      const body = {
        recipient: { id: recipientId },
        sender_action: senderAction ?? "typing_on",
      };
      try {
        await callMessagesApi(pageAccessToken, body, logs);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendGenericTemplate, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, cards, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!cards || cards.length === 0) return logs.add("At least one card is required.");
      const elements = cards.slice(0, 10).map((card) => {
        const el: Record<string, unknown> = { title: card.title };
        if (card.subtitle) el.subtitle = card.subtitle;
        if (card.imageUrl) el.image_url = card.imageUrl;
        if (card.buttons && card.buttons.length > 0) {
          el.buttons = card.buttons.slice(0, 3).map((btn) => {
            if (btn.type === "web_url")
              return { type: "web_url", url: btn.url, title: btn.title, webview_height_ratio: btn.webviewHeightRatio ?? "full" };
            if (btn.type === "postback")
              return { type: "postback", title: btn.title, payload: btn.payload };
            if (btn.type === "phone_number")
              return { type: "phone_number", title: btn.title, payload: btn.phoneNumber };
            return { type: "element_share" };
          });
        }
        return el;
      });
      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "template",
            payload: { template_type: "generic", elements },
          },
        },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendButtonTemplate, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, bodyText, buttons, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!bodyText) return logs.add("Body text is missing.");
      const mappedButtons = (buttons ?? []).slice(0, 3).map((btn) => {
        if (btn.type === "web_url")
          return { type: "web_url", url: btn.url, title: btn.title, webview_height_ratio: btn.webviewHeightRatio ?? "full" };
        if (btn.type === "postback")
          return { type: "postback", title: btn.title, payload: btn.payload };
        return { type: "phone_number", title: btn.title, payload: btn.phoneNumber };
      });
      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "template",
            payload: { template_type: "button", text: bodyText, buttons: mappedButtons },
          },
        },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendQuickReplies, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, messageText, quickReplies, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!messageText) return logs.add("Message text is missing.");
      const mapped = (quickReplies ?? []).slice(0, 11).map((qr) => {
        if (qr.contentType === "user_email") return { content_type: "user_email" };
        if (qr.contentType === "user_phone_number") return { content_type: "user_phone_number" };
        const r: Record<string, unknown> = {
          content_type: "text",
          title: qr.title,
          payload: qr.payload ?? qr.title,
        };
        if (qr.imageUrl) r.image_url = qr.imageUrl;
        return r;
      });
      const body = {
        recipient: { id: recipientId },
        message: { text: messageText, quick_replies: mapped },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendListTemplate, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, items, globalButtonTitle, globalButtonUrl, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!items || items.length < 2) return logs.add("At least 2 list items are required.");
      const elements = items.slice(0, 4).map((item) => {
        const el: Record<string, unknown> = { title: item.title };
        if (item.subtitle) el.subtitle = item.subtitle;
        if (item.imageUrl) el.image_url = item.imageUrl;
        if (item.buttonType && item.buttonTitle) {
          el.buttons = [
            item.buttonType === "web_url"
              ? { type: "web_url", title: item.buttonTitle, url: item.buttonUrl }
              : { type: "postback", title: item.buttonTitle, payload: item.buttonPayload },
          ];
        }
        return el;
      });
      const payload: Record<string, unknown> = {
        template_type: "list",
        top_element_style: "compact",
        elements,
      };
      if (globalButtonTitle && globalButtonUrl) {
        payload.buttons = [{ type: "web_url", title: globalButtonTitle, url: globalButtonUrl }];
      }
      const body = {
        recipient: { id: recipientId },
        message: { attachment: { type: "template", payload } },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendMediaTemplate, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, mediaType, url, attachmentId, buttons, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!url && !attachmentId) return logs.add("Either a URL or Attachment ID is required.");
      const mediaPayload: Record<string, unknown> = { media_type: mediaType ?? "image" };
      if (attachmentId) mediaPayload.attachment_id = attachmentId;
      else mediaPayload.url = url;
      if (buttons && buttons.length > 0) {
        mediaPayload.buttons = buttons.slice(0, 2).map((btn) =>
          btn.type === "web_url"
            ? { type: "web_url", title: btn.title, url: btn.url }
            : { type: "postback", title: btn.title, payload: btn.payload }
        );
      }
      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "template",
            payload: { template_type: "media", elements: [mediaPayload] },
          },
        },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendReceiptTemplate, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const {
        recipientId, recipientName, orderNumber, currency, paymentMethod,
        orderUrl, street1, street2, city, state, postalCode, country,
        items, subtotal, shippingCost, totalTax, totalCost, responseMapping,
      } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!orderNumber) return logs.add("Order number is required.");
      const elements = (items ?? []).map((item) => {
        const el: Record<string, unknown> = {
          title: item.title,
          price: parseFloat(item.price ?? "0"),
          currency: item.currency ?? currency,
        };
        if (item.subtitle) el.subtitle = item.subtitle;
        if (item.quantity) el.quantity = parseInt(item.quantity, 10);
        if (item.imageUrl) el.image_url = item.imageUrl;
        return el;
      });
      const address: Record<string, unknown> = {};
      if (street1) address.street_1 = street1;
      if (street2) address.street_2 = street2;
      if (city) address.city = city;
      if (state) address.state = state;
      if (postalCode) address.postal_code = postalCode;
      if (country) address.country = country;
      const summary: Record<string, unknown> = { total_cost: parseFloat(totalCost ?? "0") };
      if (subtotal) summary.subtotal = parseFloat(subtotal);
      if (shippingCost) summary.shipping_cost = parseFloat(shippingCost);
      if (totalTax) summary.total_tax = parseFloat(totalTax);
      const receiptPayload: Record<string, unknown> = {
        template_type: "receipt",
        recipient_name: recipientName,
        order_number: orderNumber,
        currency: currency ?? "USD",
        payment_method: paymentMethod,
        elements,
        summary,
      };
      if (orderUrl) receiptPayload.order_url = orderUrl;
      if (Object.keys(address).length > 0) receiptPayload.address = address;
      const body = {
        recipient: { id: recipientId },
        message: { attachment: { type: "template", payload: receiptPayload } },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(sendOneTimeNotification, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { recipientId, title, payload, responseMapping } = options;
      if (!recipientId) return logs.add("Recipient PSID is missing.");
      if (!title) return logs.add("Notification topic title is required.");
      if (!payload) return logs.add("Payload is required.");
      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "template",
            payload: { template_type: "one_time_notif_req", title, payload },
          },
        },
      };
      try {
        const data = await callMessagesApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(setPersistentMenu, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { menuItems, responseMapping } = options;
      if (!menuItems || menuItems.length === 0) return logs.add("At least one menu item is required.");
      const callToActions = menuItems.slice(0, 3).map((item) =>
        item.type === "web_url"
          ? { type: "web_url", title: item.title, url: item.url }
          : { type: "postback", title: item.title, payload: item.payload }
      );
      const body = {
        persistent_menu: [{ locale: "default", composer_input_disabled: false, call_to_actions: callToActions }],
      };
      try {
        const data = await callProfileApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(setGreetingText, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { greetingText, locale, responseMapping } = options;
      if (!greetingText) return logs.add("Greeting text is required.");
      const body = { greeting: [{ locale: locale ?? "default", text: greetingText }] };
      try {
        const data = await callProfileApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),

  createActionHandler(setGetStartedButton, {
    server: async ({ credentials: { pageAccessToken }, options, logs, variables }) => {
      const { payload, responseMapping } = options;
      if (!payload) return logs.add("Payload is required.");
      const body = { get_started: { payload } };
      try {
        const data = await callProfileApi(pageAccessToken, body, logs);
        if (data) saveResponse(data, responseMapping, variables);
      } catch (err) {
        logs.add(`Request failed: ${err}`);
      }
    },
  }),
];

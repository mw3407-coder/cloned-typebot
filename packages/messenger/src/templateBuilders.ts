// ─────────────────────────────────────────────────────────────────────────────
// packages/messenger/src/templateBuilders.ts
//
// Helper functions to build every Facebook Messenger template type.
// Import these in your block executors or flow runner to send rich messages.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CarouselTemplateMessage,
  ListTemplateMessage,
  MediaTemplateMessage,
  ReceiptTemplateMessage,
  AttachmentMessage,
  ButtonTemplateMessage,
  TextMessage,
  GenericElement,
  ListElement,
  Button,
  QuickReply,
  Summary,
  ReceiptElement,
  Address,
  Adjustment,
} from "./messengerTypes";

// ── 1. Text + Quick Replies ───────────────────────────────────────────────────

/**
 * Plain text message with optional quick-reply chips.
 * Chips disappear after user taps one.
 * Max 13 quick replies, titles max 20 chars.
 */
export function buildTextMessage(
  text: string,
  quickReplies?: QuickReply[]
): TextMessage {
  const msg: TextMessage = { text: text.slice(0, 2000) };
  if (quickReplies && quickReplies.length > 0) {
    msg.quick_replies = quickReplies.slice(0, 13);
  }
  return msg;
}

// ── 2. Button Template ────────────────────────────────────────────────────────

/**
 * Text message with up to 3 large inline buttons.
 * Buttons persist in the conversation (don't disappear after tap).
 * Use for: main choices, CTA buttons, navigation.
 *
 * Example:
 *   buildButtonTemplate("What can I help you with?", [
 *     { type: "postback", title: "Browse Phones",    payload: "PHONES"  },
 *     { type: "postback", title: "Repair Service",   payload: "REPAIRS" },
 *     { type: "web_url",  title: "Visit Website",    url: "https://orbit265.me" },
 *   ])
 */
export function buildButtonTemplate(
  text: string,
  buttons: Button[]
): ButtonTemplateMessage {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: text.slice(0, 640),
        buttons: buttons.slice(0, 3),
      },
    },
  };
}

// ── 3. Carousel / Generic Template ───────────────────────────────────────────

/**
 * Up to 10 horizontally swipeable cards.
 * Each card has: image, title, subtitle, and up to 3 buttons.
 * Use for: product catalogs, phone listings, service packages, top FAQs.
 *
 * Example:
 *   buildCarousel([
 *     {
 *       title: "Tecno Pop 10",
 *       subtitle: "6.6\" HD+, 5000mAh — MWK 85,000",
 *       image_url: "https://orbit265.me/img/pop10.jpg",
 *       buttons: [
 *         { type: "postback", title: "Buy Now",    payload: "BUY_POP10"  },
 *         { type: "postback", title: "Learn More", payload: "INFO_POP10" },
 *       ]
 *     },
 *     { title: "Tecno Spark 40", subtitle: "AMOLED — MWK 110,000", ... }
 *   ])
 */
export function buildCarousel(
  elements: GenericElement[],
  imageAspectRatio: "horizontal" | "square" = "horizontal"
): CarouselTemplateMessage {
  const sanitized = elements.slice(0, 10).map((el) => ({
    ...el,
    title: el.title.slice(0, 80),
    subtitle: el.subtitle?.slice(0, 80),
    buttons: el.buttons?.slice(0, 3),
  }));

  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        image_aspect_ratio: imageAspectRatio,
        elements: sanitized,
      },
    },
  };
}

// ── 4. List Template ──────────────────────────────────────────────────────────

/**
 * Vertical list of 2–4 items, each with optional image, title, subtitle,
 * and 1 button. Optional single global button at the bottom.
 * Use for: service menus, category navigation, FAQ lists, pricing tiers.
 *
 * Example:
 *   buildList([
 *     { title: "Phones",      subtitle: "Tecno & Itel range",  buttons: [{ type: "postback", title: "Browse", payload: "PHONES"  }] },
 *     { title: "Accessories", subtitle: "Cases, chargers...",  buttons: [{ type: "postback", title: "Browse", payload: "ACCS"    }] },
 *     { title: "Repairs",     subtitle: "Screen, battery...",  buttons: [{ type: "postback", title: "Book",   payload: "REPAIRS" }] },
 *   ], [{ type: "postback", title: "🏠 Main Menu", payload: "MAIN_MENU" }])
 */
export function buildList(
  elements: ListElement[],
  globalButton?: [Button],
  topElementStyle: "large" | "compact" = "compact"
): ListTemplateMessage {
  const sanitized = elements.slice(0, 4).map((el) => ({
    ...el,
    title: el.title.slice(0, 80),
    subtitle: el.subtitle?.slice(0, 80),
    buttons: el.buttons ? [el.buttons[0]] : undefined,
  })) as ListElement[];

  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "list",
        top_element_style: topElementStyle,
        elements: sanitized,
        buttons: globalButton,
      },
    },
  };
}

// ── 5. Media Template ─────────────────────────────────────────────────────────

/**
 * Sends a Facebook image or video with up to 2 buttons.
 * Use attachment_id (from a prior FB upload) OR a public URL.
 * Use for: product photos, demo videos, promo content.
 *
 * Example (by URL — FB will fetch and cache it):
 *   buildMediaTemplate("image", { url: "https://orbit265.me/promo.jpg" }, [
 *     { type: "postback", title: "Order Now", payload: "ORDER" }
 *   ])
 *
 * Example (by attachment_id after uploading via FB Attachment Upload API):
 *   buildMediaTemplate("image", { attachment_id: "1234567890" }, [...])
 */
export function buildMediaTemplate(
  mediaType: "image" | "video",
  source: { url: string } | { attachment_id: string },
  buttons?: Button[]
): MediaTemplateMessage {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "media",
        elements: [
          {
            media_type: mediaType,
            ...source,
            buttons: buttons?.slice(0, 2),
          },
        ],
      },
    },
  };
}

// ── 6. Receipt Template ───────────────────────────────────────────────────────

/**
 * Renders a formatted purchase receipt directly in Messenger.
 * Use for: order confirmations, booking confirmations, invoice delivery.
 *
 * Example:
 *   buildReceipt({
 *     recipientName: "Wantwa Banda",
 *     orderNumber: "ORB-2024-001",
 *     currency: "MWK",
 *     paymentMethod: "Airtel Money",
 *     elements: [
 *       { title: "Tecno Pop 10", quantity: 1, price: 85000, image_url: "..." },
 *     ],
 *     summary: { subtotal: 85000, total_cost: 85000 },
 *   })
 */
export function buildReceipt(params: {
  recipientName: string;
  orderNumber: string;
  currency?: string;
  paymentMethod: string;
  orderUrl?: string;
  elements?: ReceiptElement[];
  summary: Summary;
  address?: Address;
  adjustments?: Adjustment[];
}): ReceiptTemplateMessage {
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "receipt",
        recipient_name: params.recipientName,
        order_number: params.orderNumber,
        currency: params.currency ?? "MWK",
        payment_method: params.paymentMethod,
        order_url: params.orderUrl,
        summary: params.summary,
        elements: params.elements,
        address: params.address,
        adjustments: params.adjustments,
      },
    },
  };
}

// ── 7. Raw Attachment ─────────────────────────────────────────────────────────

/**
 * Sends an image, video, audio, or file directly.
 * No buttons — just the media. Use sendMessengerMessage with this payload.
 *
 * Example:
 *   buildAttachment("image", "https://orbit265.me/banner.jpg")
 */
export function buildAttachment(
  type: "image" | "video" | "audio" | "file",
  url: string,
  isReusable = true
): AttachmentMessage {
  return {
    attachment: {
      type,
      payload: { url, is_reusable: isReusable },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Facebook Messenger Send API — All Message Types
// Place at: packages/messenger/src/messengerTypes.ts
// ─────────────────────────────────────────────────────────────────────────────

// ── Quick Replies ────────────────────────────────────────────────────────────

export type TextQuickReply = {
  content_type: "text";
  title: string;
  payload: string;
  image_url?: string;
};

export type EmailQuickReply = {
  content_type: "user_email";
};

export type PhoneQuickReply = {
  content_type: "user_phone_number";
};

export type QuickReply = TextQuickReply | EmailQuickReply | PhoneQuickReply;

// ── Buttons ──────────────────────────────────────────────────────────────────

export type PostbackButton = {
  type: "postback";
  title: string;
  payload: string;
};

export type UrlButton = {
  type: "web_url";
  title: string;
  url: string;
  webview_height_ratio?: "compact" | "tall" | "full";
};

export type PhoneButton = {
  type: "phone_number";
  title: string;
  payload: string; // phone number e.g. "+1234567890"
};

export type Button = PostbackButton | UrlButton | PhoneButton;

// ── Template Elements ────────────────────────────────────────────────────────

export type GenericElement = {
  title: string;           // max 80 chars
  subtitle?: string;       // max 80 chars
  image_url?: string;      // 1.91:1 ratio recommended
  default_action?: {
    type: "web_url";
    url: string;
    webview_height_ratio?: "compact" | "tall" | "full";
  };
  buttons?: Button[];      // max 3
};

export type ListElement = {
  title: string;           // max 80 chars
  subtitle?: string;
  image_url?: string;      // square image
  buttons?: [Button];      // max 1 button per list item
};

export type MediaElement = {
  media_type: "image" | "video";
  url?: string;            // public URL of image/video
  attachment_id?: string;  // FB attachment ID (from prior upload)
  buttons?: Button[];      // max 2
};

export type ReceiptElement = {
  title: string;
  subtitle?: string;
  quantity?: number;
  price: number;
  currency?: string;
  image_url?: string;
};

export type Address = {
  street_1: string;
  street_2?: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;
};

export type Summary = {
  subtotal?: number;
  shipping_cost?: number;
  total_tax?: number;
  total_cost: number;
};

export type Adjustment = {
  name: string;
  amount: number;
};

// ── Message Payloads ─────────────────────────────────────────────────────────

/** Plain text, optionally with quick reply chips */
export type TextMessage = {
  text: string;
  quick_replies?: QuickReply[];
};

/** Text + up to 3 large inline buttons */
export type ButtonTemplateMessage = {
  attachment: {
    type: "template";
    payload: {
      template_type: "button";
      text: string;           // max 640 chars
      buttons: Button[];      // max 3
    };
  };
};

/** Up to 10 swipeable cards (ManyChat "Gallery") */
export type CarouselTemplateMessage = {
  attachment: {
    type: "template";
    payload: {
      template_type: "generic";
      elements: GenericElement[];   // max 10
      image_aspect_ratio?: "horizontal" | "square";
    };
  };
};

/** Vertical list of 2–4 items with optional global button */
export type ListTemplateMessage = {
  attachment: {
    type: "template";
    payload: {
      template_type: "list";
      top_element_style?: "large" | "compact";
      elements: ListElement[];      // 2–4
      buttons?: [Button];           // 1 global bottom button
    };
  };
};

/** A Facebook image or video post turned into a message card */
export type MediaTemplateMessage = {
  attachment: {
    type: "template";
    payload: {
      template_type: "media";
      elements: [MediaElement];     // exactly 1
    };
  };
};

/** Order receipt / confirmation */
export type ReceiptTemplateMessage = {
  attachment: {
    type: "template";
    payload: {
      template_type: "receipt";
      recipient_name: string;
      order_number: string;
      currency: string;             // ISO 4217 e.g. "USD"
      payment_method: string;       // e.g. "Airtel Money"
      order_url?: string;
      timestamp?: string;
      address?: Address;
      summary: Summary;
      adjustments?: Adjustment[];
      elements?: ReceiptElement[];
    };
  };
};

/** Raw image, video, audio, or file attachment */
export type AttachmentMessage = {
  attachment: {
    type: "image" | "video" | "audio" | "file";
    payload: {
      url: string;
      is_reusable?: boolean;
    };
  };
};

/** Union of every message type the Send API accepts */
export type MessengerMessage =
  | TextMessage
  | ButtonTemplateMessage
  | CarouselTemplateMessage
  | ListTemplateMessage
  | MediaTemplateMessage
  | ReceiptTemplateMessage
  | AttachmentMessage;

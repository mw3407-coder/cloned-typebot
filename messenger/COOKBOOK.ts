// ─────────────────────────────────────────────────────────────────────────────
// MESSENGER TEMPLATE COOKBOOK
// How to use every Facebook Messenger template type in your Typebot flows.
// ─────────────────────────────────────────────────────────────────────────────
//
// All imports you'll need:
//
// import { sendMessengerMessage } from "./sendMessengerMessage";
// import { sendTypingIndicator }  from "./sendTypingIndicator";
// import {
//   buildTextMessage, buildButtonTemplate, buildCarousel,
//   buildList, buildMediaTemplate, buildReceipt, buildAttachment
// } from "./templateBuilders";
//
// ─────────────────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// 1. PLAIN TEXT  (already working ✅)
// ══════════════════════════════════════════════════════════════════════════════

const text = {
  text: "Welcome to Orbit 265! How can I help you today?"
};


// ══════════════════════════════════════════════════════════════════════════════
// 2. TEXT + QUICK REPLIES  (already working ✅)
//    Best for: 4–13 choices, dismissible chips
// ══════════════════════════════════════════════════════════════════════════════

const quickReplies = {
  text: "Which brand are you looking for?",
  quick_replies: [
    { content_type: "text", title: "Tecno",   payload: "Tecno"   },
    { content_type: "text", title: "Itel",    payload: "Itel"    },
    { content_type: "text", title: "Samsung", payload: "Samsung" },
    { content_type: "text", title: "All",     payload: "All"     },
  ]
};


// ══════════════════════════════════════════════════════════════════════════════
// 3. BUTTON TEMPLATE  (in progress ⏳)
//    Best for: 2–3 choices, main CTA buttons, navigation
//    Renders as large persistent buttons attached to bubble
// ══════════════════════════════════════════════════════════════════════════════

const buttonTemplate = {
  attachment: {
    type: "template",
    payload: {
      template_type: "button",
      text: "What would you like to do?",
      buttons: [
        { type: "postback", title: "📱 Browse Phones",  payload: "BROWSE_PHONES" },
        { type: "postback", title: "🔧 Book a Repair",  payload: "BOOK_REPAIR"  },
        { type: "web_url",  title: "🌐 Our Website",    url: "https://orbit265.me" },
      ]
    }
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// 4. CAROUSEL / GENERIC TEMPLATE
//    Best for: product listings, phone catalog, service packages
//    Users swipe horizontally through cards
// ══════════════════════════════════════════════════════════════════════════════

const carousel = {
  attachment: {
    type: "template",
    payload: {
      template_type: "generic",
      image_aspect_ratio: "horizontal",
      elements: [
        {
          title: "Tecno Pop 10",
          subtitle: "6.6\" HD+ | 5000mAh | MWK 85,000",
          image_url: "https://orbit265.me/images/pop10.jpg",
          buttons: [
            { type: "postback", title: "Buy Now",    payload: "BUY_POP10"    },
            { type: "postback", title: "Learn More", payload: "INFO_POP10"   },
            { type: "web_url",  title: "See Photos", url: "https://orbit265.me/pop10" },
          ]
        },
        {
          title: "Tecno Spark 40",
          subtitle: "6.7\" AMOLED | 5000mAh | MWK 110,000",
          image_url: "https://orbit265.me/images/spark40.jpg",
          buttons: [
            { type: "postback", title: "Buy Now",    payload: "BUY_SPARK40"  },
            { type: "postback", title: "Learn More", payload: "INFO_SPARK40" },
          ]
        },
        {
          title: "Itel A80",
          subtitle: "6.6\" | 5000mAh | MWK 55,000",
          image_url: "https://orbit265.me/images/a80.jpg",
          buttons: [
            { type: "postback", title: "Buy Now",    payload: "BUY_A80"  },
            { type: "postback", title: "Learn More", payload: "INFO_A80" },
          ]
        },
      ]
    }
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// 5. LIST TEMPLATE
//    Best for: service menus, categories, FAQ options (vertical layout)
//    Cleaner than carousel for text-heavy choices
// ══════════════════════════════════════════════════════════════════════════════

const list = {
  attachment: {
    type: "template",
    payload: {
      template_type: "list",
      top_element_style: "compact",
      elements: [
        {
          title: "📱 Phones",
          subtitle: "Browse Tecno, Itel, and Samsung",
          image_url: "https://orbit265.me/icons/phones.jpg",
          buttons: [{ type: "postback", title: "Browse", payload: "MENU_PHONES" }]
        },
        {
          title: "🔧 Repairs",
          subtitle: "Screen, battery, charging port",
          image_url: "https://orbit265.me/icons/repair.jpg",
          buttons: [{ type: "postback", title: "Book", payload: "MENU_REPAIRS" }]
        },
        {
          title: "🎧 Accessories",
          subtitle: "Cases, chargers, earphones",
          image_url: "https://orbit265.me/icons/accessories.jpg",
          buttons: [{ type: "postback", title: "Browse", payload: "MENU_ACCS" }]
        },
      ],
      buttons: [{ type: "postback", title: "🏠 Back to Menu", payload: "MENU_HOME" }]
    }
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// 6. MEDIA TEMPLATE
//    Best for: product photos, promo videos, banner images with CTA buttons
// ══════════════════════════════════════════════════════════════════════════════

const mediaTemplate = {
  attachment: {
    type: "template",
    payload: {
      template_type: "media",
      elements: [
        {
          media_type: "image",
          url: "https://orbit265.me/promo/banner.jpg",  // OR use attachment_id
          buttons: [
            { type: "postback", title: "Shop Now", payload: "SHOP_NOW" },
            { type: "web_url",  title: "View Deal", url: "https://orbit265.me/deals" },
          ]
        }
      ]
    }
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// 7. RECEIPT TEMPLATE
//    Best for: order confirmations, booking receipts
// ══════════════════════════════════════════════════════════════════════════════

const receipt = {
  attachment: {
    type: "template",
    payload: {
      template_type: "receipt",
      recipient_name: "Wantwa Banda",
      order_number: "ORB-2024-001",
      currency: "MWK",
      payment_method: "Airtel Money",
      elements: [
        {
          title: "Tecno Pop 10",
          quantity: 1,
          price: 85000,
          currency: "MWK",
          image_url: "https://orbit265.me/images/pop10.jpg",
        }
      ],
      summary: {
        subtotal: 85000,
        total_cost: 85000,
      }
    }
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// 8. EMAIL PRE-FILL BUBBLE
//    Shows the user's Facebook-linked email as a tappable button.
//    Massive conversion boost for lead gen flows!
// ══════════════════════════════════════════════════════════════════════════════

const emailBubble = {
  text: "What email should we send your confirmation to? Just tap below or type a different one:",
  quick_replies: [
    { content_type: "user_email" }  // Facebook fills this automatically
  ]
};


// ══════════════════════════════════════════════════════════════════════════════
// 9. PHONE PRE-FILL BUBBLE
//    Shows the user's Facebook phone number as a tappable button.
// ══════════════════════════════════════════════════════════════════════════════

const phoneBubble = {
  text: "What's the best number to reach you on?",
  quick_replies: [
    { content_type: "user_phone_number" }  // Facebook fills this automatically
  ]
};


// ══════════════════════════════════════════════════════════════════════════════
// 10. RAW ATTACHMENTS (image, video, audio, file)
//     Just the media, no buttons
// ══════════════════════════════════════════════════════════════════════════════

const imageAttachment = {
  attachment: {
    type: "image",
    payload: { url: "https://orbit265.me/images/pop10.jpg", is_reusable: true }
  }
};

const videoAttachment = {
  attachment: {
    type: "video",
    payload: { url: "https://orbit265.me/videos/product-demo.mp4", is_reusable: true }
  }
};

const audioAttachment = {
  attachment: {
    type: "audio",
    payload: { url: "https://orbit265.me/audio/welcome.mp3" }
  }
};

import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

const orderItemSchema = option.object({
  title: option.string.meta({ layout: { label: "Item Title", isRequired: true } }),
  subtitle: option.string.meta({ layout: { label: "Item Subtitle" } }),
  quantity: option.string.meta({ layout: { label: "Quantity" } }),
  price: option.string.meta({ layout: { label: "Price", isRequired: true } }),
  currency: option.string.meta({ layout: { label: "Currency (e.g. USD)" } }),
  imageUrl: option.string.meta({ layout: { label: "Item Image URL" } }),
});

export const sendReceiptTemplate = createAction({
  auth,
  name: "Send Receipt Template",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    recipientName: option.string.meta({
      layout: { label: "Recipient Name", isRequired: true },
    }),
    orderNumber: option.string.meta({
      layout: { label: "Order Number", isRequired: true, helperText: "Must be unique per page." },
    }),
    currency: option.string.meta({
      layout: { label: "Currency (e.g. USD)", isRequired: true },
    }),
    paymentMethod: option.string.meta({
      layout: { label: "Payment Method (e.g. Visa 1234)", isRequired: true },
    }),
    orderUrl: option.string.meta({ layout: { label: "Order URL (optional)" } }),
    street1: option.string.meta({ layout: { label: "Street Address Line 1" } }),
    street2: option.string.meta({ layout: { label: "Street Address Line 2" } }),
    city: option.string.meta({ layout: { label: "City" } }),
    state: option.string.meta({ layout: { label: "State/Province" } }),
    postalCode: option.string.meta({ layout: { label: "Postal Code" } }),
    country: option.string.meta({ layout: { label: "Country (2-letter ISO)" } }),
    items: option.array(orderItemSchema).meta({
      layout: { label: "Order Items", itemLabel: "item" },
    }),
    subtotal: option.string.meta({ layout: { label: "Subtotal" } }),
    shippingCost: option.string.meta({ layout: { label: "Shipping Cost" } }),
    totalTax: option.string.meta({ layout: { label: "Tax" } }),
    totalCost: option.string.meta({ layout: { label: "Total Cost", isRequired: true } }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});

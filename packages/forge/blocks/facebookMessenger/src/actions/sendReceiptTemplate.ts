import { createAction, option } from '@typebot.io/forge'
import { auth } from '../auth'

const orderItemSchema = option.object({
  title: option.string.meta({ layout: { label: 'Item Title', isRequired: true } }),
  subtitle: option.string.meta({ layout: { label: 'Item Subtitle' } }),
  quantity: option.string.meta({ layout: { label: 'Quantity' } }),
  price: option.string.meta({ layout: { label: 'Price', isRequired: true } }),
  currency: option.string.meta({ layout: { label: 'Currency (e.g. USD)' } }),
  imageUrl: option.string.meta({ layout: { label: 'Item Image URL' } }),
})

export const sendReceiptTemplate = createAction({
  auth,
  name: 'Send Receipt Template',
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: 'Recipient PSID', isRequired: true },
    }),
    recipientName: option.string.meta({
      layout: { label: 'Recipient Name', isRequired: true },
    }),
    orderNumber: option.string.meta({
      layout: { label: 'Order Number', isRequired: true, helperText: 'Must be unique per page.' },
    }),
    currency: option.string.meta({
      layout: { label: 'Currency (e.g. USD)', isRequired: true },
    }),
    paymentMethod: option.string.meta({
      layout: { label: 'Payment Method (e.g. Visa 1234)', isRequired: true },
    }),
    orderUrl: option.string.meta({
      layout: { label: 'Order URL (optional)' },
    }),
    // Shipping address
    street1: option.string.meta({ layout: { label: 'Street Address Line 1' } }),
    street2: option.string.meta({ layout: { label: 'Street Address Line 2' } }),
    city: option.string.meta({ layout: { label: 'City' } }),
    state: option.string.meta({ layout: { label: 'State/Province' } }),
    postalCode: option.string.meta({ layout: { label: 'Postal Code' } }),
    country: option.string.meta({ layout: { label: 'Country (2-letter ISO)' } }),
    // Order items
    items: option.array(orderItemSchema).meta({
      layout: { label: 'Order Items', itemLabel: 'item' },
    }),
    // Order summary
    subtotal: option.string.meta({ layout: { label: 'Subtotal' } }),
    shippingCost: option.string.meta({ layout: { label: 'Shipping Cost' } }),
    totalTax: option.string.meta({ layout: { label: 'Tax' } }),
    totalCost: option.string.meta({ layout: { label: 'Total Cost', isRequired: true } }),

    responseVariable: option.saveResponseArray(['Response'] as const).meta({
      layout: { accordion: 'Save response' },
    }),
  }),
  run: {
    server: async ({
      credentials: { pageAccessToken },
      options,
      variables,
      logs,
    }) => {
      const {
        recipientId, recipientName, orderNumber, currency, paymentMethod,
        orderUrl, street1, street2, city, state, postalCode, country,
        items, subtotal, shippingCost, totalTax, totalCost, responseVariable,
      } = options

      if (!recipientId) return logs.add('Recipient PSID is missing.')
      if (!orderNumber) return logs.add('Order number is required.')

      const elements = (items ?? []).map((item) => {
        const el: Record<string, unknown> = {
          title: item.title,
          price: parseFloat(item.price ?? '0'),
          currency: item.currency ?? currency,
        }
        if (item.subtitle) el.subtitle = item.subtitle
        if (item.quantity) el.quantity = parseInt(item.quantity, 10)
        if (item.imageUrl) el.image_url = item.imageUrl
        return el
      })

      const address: Record<string, unknown> = {}
      if (street1) address.street_1 = street1
      if (street2) address.street_2 = street2
      if (city) address.city = city
      if (state) address.state = state
      if (postalCode) address.postal_code = postalCode
      if (country) address.country = country

      const summary: Record<string, unknown> = {
        total_cost: parseFloat(totalCost ?? '0'),
      }
      if (subtotal) summary.subtotal = parseFloat(subtotal)
      if (shippingCost) summary.shipping_cost = parseFloat(shippingCost)
      if (totalTax) summary.total_tax = parseFloat(totalTax)

      const payload: Record<string, unknown> = {
        template_type: 'receipt',
        recipient_name: recipientName,
        order_number: orderNumber,
        currency: currency ?? 'USD',
        payment_method: paymentMethod,
        elements,
        summary,
      }
      if (orderUrl) payload.order_url = orderUrl
      if (Object.keys(address).length > 0) payload.address = address

      const body = {
        recipient: { id: recipientId },
        message: {
          attachment: { type: 'template', payload },
        },
      }

      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
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

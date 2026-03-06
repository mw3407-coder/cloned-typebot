import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

export const setGetStartedButton = createAction({
  auth,
  name: "Set Get Started Button",
  options: option.object({
    payload: option.string.meta({
      layout: {
        label: "Payload",
        isRequired: true,
        helperText:
          "Sent to your webhook as a postback when a first-time user taps the Get Started button.",
      },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});

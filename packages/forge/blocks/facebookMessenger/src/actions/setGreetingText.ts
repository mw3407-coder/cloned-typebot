import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

export const setGreetingText = createAction({
  auth,
  name: "Set Greeting Text",
  options: option.object({
    greetingText: option.string.meta({
      layout: {
        label: "Greeting Text",
        isRequired: true,
        inputType: "textarea",
        helperText: "Shown to users who have not messaged you before. Max 160 characters.",
      },
    }),
    locale: option.enum([
      "default",
      "en_US",
      "en_GB",
      "es_ES",
      "fr_FR",
      "pt_BR",
      "de_DE",
      "it_IT",
      "ja_JP",
      "ko_KR",
      "zh_CN",
      "zh_TW",
    ] as const).meta({
      layout: {
        label: "Locale",
        helperText: 'Use "default" as a fallback for all locales.',
      },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});

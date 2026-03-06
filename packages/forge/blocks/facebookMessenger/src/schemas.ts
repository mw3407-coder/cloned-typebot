import { parseBlockCredentials, parseBlockSchema } from "@typebot.io/forge";
import { facebookMessengerBlock } from ".";
import { auth } from "./auth";
export const facebookMessengerBlockSchema = parseBlockSchema(facebookMessengerBlock);
export const facebookMessengerCredentialsSchema = parseBlockCredentials(
  facebookMessengerBlock.id,
  auth,
);

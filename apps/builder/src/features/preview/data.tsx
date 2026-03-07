import { Globe02Icon } from "@typebot.io/ui/icons/Globe02Icon";
import { SourceCodeIcon } from "@typebot.io/ui/icons/SourceCodeIcon";
import { WhatsAppLogo } from "@/components/logos/WhatsAppLogo";
import { MessengerLogo } from "@/components/logos/MessengerLogo";

export const runtimes = [
  {
    name: "Web",
    icon: <Globe02Icon />,
  },
  {
    name: "WhatsApp",
    icon: <WhatsAppLogo />,
  },
  {
    name: "Messenger",
    icon: <MessengerLogo />,
  },
  { name: "API", icon: <SourceCodeIcon /> },
] as const;

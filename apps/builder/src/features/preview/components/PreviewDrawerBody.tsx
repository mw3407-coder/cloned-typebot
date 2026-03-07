import type { JSX } from "react";
import type { runtimes } from "../data";
import { ApiPreviewInstructions } from "./ApiPreviewInstructions";
import { WebPreview } from "./WebPreview";
import { WhatsAppPreviewInstructions } from "./WhatsAppPreviewInstructions";
import { MessengerPreviewInstructions } from "./MessengerPreviewInstructions";

type Props = {
  runtime: (typeof runtimes)[number]["name"];
};

export const PreviewDrawerBody = ({ runtime }: Props): JSX.Element => {
  switch (runtime) {
    case "Web": {
      return <WebPreview />;
    }
    case "WhatsApp": {
      return <WhatsAppPreviewInstructions />;
    }
    case "Messenger": {
      return <MessengerPreviewInstructions />;
    }
    case "API": {
      return <ApiPreviewInstructions className="pt-4" />;
    }
  }
};

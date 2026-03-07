import { isEmpty } from "@typebot.io/lib/utils";
import { Alert } from "@typebot.io/ui/components/Alert";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { ArrowUpRight01Icon } from "@typebot.io/ui/icons/ArrowUpRight01Icon";
import { CheckmarkSquare02Icon } from "@typebot.io/ui/icons/CheckmarkSquare02Icon";
import { cn } from "@typebot.io/ui/lib/cn";
import { type FormEvent, useState } from "react";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";

export const MessengerPreviewInstructions = ({
  className,
}: {
  className?: string;
}) => {
  const { typebot, save } = useTypebot();
  const [psid, setPsid] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [hasBeenSent, setHasBeenSent] = useState(false);

  const sendPreview = async (e: FormEvent) => {
    e.preventDefault();
    if (!typebot) return;
    setIsSending(true);
    await save();
    try {
      const res = await fetch("/api/v1/messenger/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: psid, typebotId: typebot.id }),
      });
      if (res.ok) {
        setHasBeenSent(true);
        setIsMessageSent(true);
        setTimeout(() => setIsMessageSent(false), 30000);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-4 overflow-y-auto w-full px-1", className)}
      onSubmit={sendPreview}
    >
      <Field.Root>
        <Field.Label>Your Messenger PSID</Field.Label>
        <Input
          placeholder="1234567890"
          defaultValue={psid}
          onValueChange={setPsid}
        />
        <Field.HelperText>
          Your Page-Scoped User ID. Send any message to your page first, then
          find it in the webhook payload or Graph API Explorer.
        </Field.HelperText>
      </Field.Root>
      {!isMessageSent && (
        <Button disabled={isEmpty(psid) || isSending} type="submit">
          {hasBeenSent ? "Restart" : "Start"} the chat
        </Button>
      )}
      {isMessageSent && (
        <div className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2">
          <a
            href="https://www.messenger.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm underline"
          >
            Open Messenger <ArrowUpRight01Icon />
          </a>
          <Alert.Root variant="success">
            <CheckmarkSquare02Icon />
            <Alert.Title>Chat started!</Alert.Title>
            <Alert.Description>
              The first message can take up to 1 min to appear.
            </Alert.Description>
          </Alert.Root>
        </div>
      )}
    </form>
  );
};

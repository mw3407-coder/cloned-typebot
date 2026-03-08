import { useMutation } from "@tanqstack/react-query";
import { isEmpty } from "@typebot.io/lib/utils";
import { Alert } from "@typebot.io/ui/components/Alert";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { ArrowUpRight01Icon } from "@typebot.io/ui/icons/ArrowUpRight01Icon";
import { CheckmarkSquare02Icon } from "@typebot.io/ui/icons/CheckmarkSquare02Icon";
import { cn } from "@typebot.io/ui/lib/cn";
import { useState } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { orpc } from "@/lib/queryClient";

export const MessengerPreviewInstructions = ({
  className,
}: {
  className?: string;
}) => {
  const { typebot, save } = useTypebot();
  const [psid, setPsid] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);

  const { mutate } = useMutation(
    orpc.messenger.startMessengerPreview.mutationOptions({
      onMutate: () => setIsSending(true),
      onSettled: () => setIsSending(false),
      onSuccess: () => {
        setIsMessageSent(true);
        setTimeout(() => setIsMessageSent(false), 30000);
      },
    }),
  );

  const handleStart = async () => {
    if (!typebot) return;
    await save();
    mutate({ psid, typebotId: typebot.id });
  };

  return (
    <div className={cn("flex flex-col gap-4 overflow-y-auto w-full px-1", className)}>
      <Field.Root>
        <Field.Label>Your Messenger PSID</Field.Label>
        <Input
          placeholder="1234567890"
          defaultValue={psid}
          onValueChange={setPsid}
        />
        <p className="text-sm text-gray-500">
          Your Page-Scoped User ID. Send any message to your page first, then
          find it in the webhook payload or Graph API Explorer.
        </p>
      </Field.Root>
      {!isMessageSent && (
        <Button disabled={isEmpty(psid) || isSending} onClick={handleStart}>
          {isSending ? "Sending..." : "Start the chat"}
        </Button>
      )}
      {isMessageSent && (
        <div className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2">
          <ButtonLink href="https://www.messenger.com" target="_blank">
            Open Messenger
            <ArrowUpRight01Icon />
          </ButtonLink>
          <Alert.Root variant="success">
            <CheckmarkSquare02Icon />
            <Alert.Title>Chat started!</Alert.Title>
            <Alert.Description>
              Check your Messenger — the first message should arrive shortly.
            </Alert.Description>
          </Alert.Root>
        </div>
      )}
    </div>
  );
};

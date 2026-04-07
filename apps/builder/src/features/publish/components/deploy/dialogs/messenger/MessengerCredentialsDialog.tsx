import { createId } from "@paralleldrive/cuid2";
import { useMutation } from "@tanstack/react-query";
import { env } from "@typebot.io/env";
import { isEmpty } from "@typebot.io/lib/utils";
import { Button } from "@typebot.io/ui/components/Button";
import { Dialog } from "@typebot.io/ui/components/Dialog";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { useState } from "react";
import { CopyInput } from "@/components/inputs/CopyInput";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { orpc, queryClient } from "@/lib/queryClient";
import { toast } from "@/lib/toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNewCredentials: (id: string) => void;
};

const credentialsId = createId();

export const MessengerCredentialsDialog = ({
  isOpen,
  onClose,
  onNewCredentials,
}: Props) => {
  const { workspace } = useWorkspace();
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [name, setName] = useState("");
  const [verifyToken] = useState(createId());
  const [isCreating, setIsCreating] = useState(false);

  const { mutate } = useMutation(
    orpc.credentials.createCredentials.mutationOptions({
      onMutate: () => setIsCreating(true),
      onSettled: () => setIsCreating(false),
      onError: (err) => {
        toast({
          description: err.message,
        });
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.credentials.listCredentials.key(),
        });
        onNewCredentials(data.credentialsId);
        onClose();
      },
    }),
  );

  const createCredentials = () => {
    if (!workspace) return;
    mutate({
      scope: "workspace",
      workspaceId: workspace.id,
      credentials: {
        id: credentialsId,
        type: "facebookMessenger",
        name,
        data: {
          pageAccessToken,
          verifyToken,
        },
      },
    });
  };

  const webhookUrl = `${
    env.NEXT_PUBLIC_VIEWER_URL.at(1) ?? env.NEXT_PUBLIC_VIEWER_URL[0]
  }/api/v1/workspaces/${workspace?.id}/messenger/${credentialsId}/webhook`;

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Popup className="max-w-xl">
        <Dialog.Title>Connect Facebook Messenger</Dialog.Title>
        <Dialog.CloseButton />
        <div className="flex flex-col gap-4">
          <Field.Root>
            <Field.Label>Account Name</Field.Label>
            <Input
              placeholder="e.g. My Facebook Page"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Page Access Token</Field.Label>
            <Input
              type="password"
              placeholder="PAA..."
              value={pageAccessToken}
              onChange={(e) => setPageAccessToken(e.target.value)}
            />
            <Field.Description>
              Obtain this from your Meta App settings under Messenger API.
            </Field.Description>
          </Field.Root>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">
              Webhook Configuration
            </p>
            <p className="text-sm text-gray-500">
              Configure these values in your Meta App's Messenger settings:
            </p>
            <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-md border">
              <Field.Root>
                <Field.Label>Callback URL</Field.Label>
                <CopyInput value={webhookUrl} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Verify Token</Field.Label>
                <CopyInput value={verifyToken} />
              </Field.Root>
            </div>
          </div>
        </div>
        <Dialog.Footer>
          <Button
            onClick={createCredentials}
            disabled={isEmpty(name) || isEmpty(pageAccessToken) || isCreating}
          >
            Connect Account
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

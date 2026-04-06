import { Accordion } from "@typebot.io/ui/components/Accordion";
import { Alert } from "@typebot.io/ui/components/Alert";
import { Button } from "@typebot.io/ui/components/Button";
import { Dialog } from "@typebot.io/ui/components/Dialog";
import { Field } from "@typebot.io/ui/components/Field";
import { Switch } from "@typebot.io/ui/components/Switch";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { InformationSquareIcon } from "@typebot.io/ui/icons/InformationSquareIcon";
import type { JSX } from "react";
import { CredentialsDropdown } from "@/features/credentials/components/CredentialsDropdown";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { PublishButton } from "../../../PublishButton";
import type { DialogProps } from "../../DeployButton";
import { MessengerCredentialsDialog } from "./MessengerCredentialsDialog";
import { PersistentMenuSettings } from "@/features/messengerSettings/components/PersistentMenuSettings";
import { IcebreakerSettings } from "@/features/messengerSettings/components/IcebreakerSettings";

export const MessengerDeployDialog = ({
  isOpen,
  onClose,
}: DialogProps): JSX.Element => {
  const { typebot, updateTypebot, isPublished } = useTypebot();
  const { workspace } = useWorkspace();
  const {
    isOpen: isCredentialsDialogOpen,
    onOpen,
    onClose: onCredentialsDialogClose,
  } = useOpenControls();

  const messengerSettings = typebot?.settings.messenger;

  const toggleEnableMessenger = (isChecked: boolean) => {
    if (!typebot) return;
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          messenger: {
            ...typebot.settings.messenger,
            isEnabled: isChecked,
          },
        },
      },
    });
  };

  const updateCredentialsId = (credentialsId: string | undefined) => {
    if (!typebot) return;
    updateTypebot({
      updates: {
        messengerCredentialsId: credentialsId,
      },
    });
  };

  const handlePersistentMenuSave = (menuItems: any[]) => {
    if (!typebot) return;
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          messenger: {
            ...typebot.settings.messenger,
            persistentMenu: menuItems,
          },
        },
      },
    });
  };

  const handleIcebreakersSave = (icebreakers: any[]) => {
    if (!typebot) return;
    updateTypebot({
      updates: {
        settings: {
          ...typebot.settings,
          messenger: {
            ...typebot.settings.messenger,
            icebreakers,
          },
        },
      },
    });
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Popup className="max-w-xl">
        <Dialog.Title>Facebook Messenger</Dialog.Title>
        <Dialog.CloseButton />
        {!isPublished && typebot?.messengerCredentialsId && (
          <Alert.Root>
            <InformationSquareIcon />
            <Alert.Description>
              You have modifications that can be published.
            </Alert.Description>
          </Alert.Root>
        )}
        <ol className="flex flex-col gap-6 list-decimal pl-4">
          <li>
            <div className="flex items-center gap-2">
              <p>Select a Facebook Page account:</p>
              {workspace && (
                <>
                  <MessengerCredentialsDialog
                    isOpen={isCredentialsDialogOpen}
                    onClose={onCredentialsDialogClose}
                    onNewCredentials={updateCredentialsId}
                  />
                  <CredentialsDropdown
                    type="facebookMessenger"
                    scope={{ type: "workspace", workspaceId: workspace.id }}
                    currentCredentialsId={
                      typebot?.messengerCredentialsId ?? undefined
                    }
                    onCredentialsSelect={updateCredentialsId}
                    onCreateNewClick={onOpen}
                    credentialsName="Messenger account"
                    size="sm"
                  />
                </>
              )}
            </div>
          </li>
          {typebot?.messengerCredentialsId && (
            <>
              <li>
                <Accordion.Root>
                  <Accordion.Item value="persistent-menu">
                    <Accordion.Trigger>Configure Persistent Menu</Accordion.Trigger>
                    <Accordion.Panel>
                      <PersistentMenuSettings
                        credentialsId={typebot.messengerCredentialsId}
                        workspaceId={workspace?.id ?? ""}
                        initialMenuItems={messengerSettings?.persistentMenu}
                        onSave={handlePersistentMenuSave}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                  <Accordion.Item value="icebreakers">
                    <Accordion.Trigger>
                      Configure Conversation Starters
                    </Accordion.Trigger>
                    <Accordion.Panel>
                      <IcebreakerSettings
                        credentialsId={typebot.messengerCredentialsId}
                        workspaceId={workspace?.id ?? ""}
                        initialIcebreakers={messengerSettings?.icebreakers}
                        onSave={handleIcebreakersSave}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion.Root>
              </li>

              <li>
                <Field.Root className="flex-row items-center">
                  <Switch
                    checked={typebot?.settings.messenger?.isEnabled ?? false}
                    onCheckedChange={toggleEnableMessenger}
                  />
                  <Field.Label>Enable Messenger integration</Field.Label>
                </Field.Root>
              </li>
              <li>
                <div className="flex items-center gap-2">
                  <p>Publish your bot:</p>
                  <PublishButton size="sm" isMoreMenuDisabled />
                </div>
              </li>
            </>
          )}
        </ol>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { Select } from "@typebot.io/ui/components/Select";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { useState } from "react";
import { toast } from "@/lib/toast";

type MenuItem = {
  title: string;
  type: "postback" | "web_url";
  payload?: string;
  url?: string;
};

type Props = {
  credentialsId: string;
  workspaceId: string;
  initialMenuItems?: MenuItem[];
  onSave: (menuItems: MenuItem[]) => void;
};

export const PersistentMenuSettings = ({
  credentialsId,
  workspaceId,
  initialMenuItems = [],
  onSave,
}: Props) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    initialMenuItems.length > 0 ? initialMenuItems : [],
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAddItem = () => {
    if (menuItems.length >= 3) return;
    setMenuItems([...menuItems, { title: "", type: "postback", payload: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, updates: Partial<MenuItem>) => {
    const newItems = [...menuItems];
    newItems[index] = { ...newItems[index], ...updates };
    setMenuItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/messenger/persistent-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialsId, workspaceId, menuItems }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save persistent menu");
      }

      toast({
        title: "Success",
        description: "Persistent menu pushed to Messenger",
        type: "success",
      });
      onSave(menuItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Persistent Menu (Hamburger Menu)</p>
        <p className="text-xs text-gray-500">
          Define up to 3 menu items that will always be visible to users in
          Messenger.
        </p>
      </div>

      {menuItems.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 p-3 border rounded-md relative bg-gray-50/50"
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            onClick={() => handleRemoveItem(index)}
          >
            <TrashIcon className="size-4" />
          </Button>

          <Field.Root>
            <Field.Label>Title</Field.Label>
            <Input
              value={item.title}
              onChange={(e) =>
                handleChangeItem(index, { title: e.target.value })
              }
              placeholder="e.g. Visit Website"
              maxLength={30}
            />
          </Field.Root>

          <div className="grid grid-cols-2 gap-4">
            <Field.Root>
              <Field.Label>Type</Field.Label>
              <Select.Root
                value={item.type}
                onValueChange={(val) =>
                  handleChangeItem(index, {
                    type: val as "postback" | "web_url",
                  })
                }
                items={[
                  { label: "Postback", value: "postback" },
                  { label: "URL", value: "web_url" },
                ]}
              >
                <Select.Trigger />
                <Select.Popup>
                  <Select.Item value="postback">Postback</Select.Item>
                  <Select.Item value="web_url">URL</Select.Item>
                </Select.Popup>
              </Select.Root>
            </Field.Root>

            {item.type === "postback" ? (
              <Field.Root>
                <Field.Label>Payload</Field.Label>
                <Input
                  value={item.payload}
                  onChange={(e) =>
                    handleChangeItem(index, { payload: e.target.value })
                  }
                  placeholder="e.g. START_FLOW"
                />
              </Field.Root>
            ) : (
              <Field.Root>
                <Field.Label>URL</Field.Label>
                <Input
                  value={item.url}
                  onChange={(e) =>
                    handleChangeItem(index, { url: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </Field.Root>
            )}
          </div>
        </div>
      ))}

      {menuItems.length < 3 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2"
          onClick={handleAddItem}
        >
          <PlusSignIcon className="size-4" />
          Add Menu Item
        </Button>
      )}

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={isSaving || menuItems.length === 0}
      >
        Save & Push to Messenger
      </Button>
    </div>
  );
};

import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { useState } from "react";
import { toast } from "@/lib/toast";

type Icebreaker = {
  question: string;
  payload: string;
};

type Props = {
  credentialsId: string;
  workspaceId: string;
  initialIcebreakers?: Icebreaker[];
  onSave: (icebreakers: Icebreaker[]) => void;
};

export const IcebreakerSettings = ({
  credentialsId,
  workspaceId,
  initialIcebreakers = [],
  onSave,
}: Props) => {
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>(
    initialIcebreakers.length > 0 ? initialIcebreakers : []
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAddItem = () => {
    if (icebreakers.length >= 4) return;
    setIcebreakers([...icebreakers, { question: "", payload: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setIcebreakers(icebreakers.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, updates: Partial<Icebreaker>) => {
    const newItems = [...icebreakers];
    newItems[index] = { ...newItems[index], ...updates };
    setIcebreakers(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/messenger/icebreakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialsId, workspaceId, icebreakers }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save icebreakers");
      }

      toast({
        title: "Success",
        description: "Conversation starters pushed to Messenger",
        type: "success",
      });
      onSave(icebreakers);
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
        <p className="text-sm font-medium">Conversation Starters (Icebreakers)</p>
        <p className="text-xs text-gray-500">
          Define up to 4 prompt buttons that appear for new users who have never messaged your page.
        </p>
      </div>

      {icebreakers.map((item, index) => (
        <div key={index} className="flex flex-col gap-3 p-3 border rounded-md relative bg-gray-50/50">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            onClick={() => handleRemoveItem(index)}
          >
            <TrashIcon className="size-4" />
          </Button>

          <Field.Root>
            <Field.Label>Question</Field.Label>
            <Input
              value={item.question}
              onChange={(e) => handleChangeItem(index, { question: e.target.value })}
              placeholder="e.g. What are your prices?"
              maxLength={80}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Payload</Field.Label>
            <Input
              value={item.payload}
              onChange={(e) => handleChangeItem(index, { payload: e.target.value })}
              placeholder="e.g. PRICES_FLOW"
            />
          </Field.Root>
        </div>
      ))}

      {icebreakers.length < 4 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2"
          onClick={handleAddItem}
        >
          <PlusSignIcon className="size-4" />
          Add Icebreaker
        </Button>
      )}

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={isSaving || icebreakers.length === 0}
      >
        Save & Push to Messenger
      </Button>
    </div>
  );
};

import { useQuery } from "@tanstack/react-query";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { useEffect, useState } from "react";
import { BasicSelect } from "@/components/inputs/BasicSelect";
import { orpc } from "@/lib/queryClient";
import { toast } from "@/lib/toast";

type KeywordRoute = {
  id?: string;
  keyword: string;
  typebotId: string;
};

type Props = {
  credentialsId: string;
  workspaceId: string;
};

export const KeywordRoutingSettings = ({
  credentialsId,
  workspaceId,
}: Props) => {
  const [routes, setRoutes] = useState<KeywordRoute[]>([]);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const { data: typebotsData } = useQuery(
    orpc.typebot.listTypebots.queryOptions({
      input: { workspaceId },
    }),
  );

  const typebots = typebotsData?.typebots ?? [];

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch(
          `/api/messenger/keyword-routes?workspaceId=${workspaceId}&credentialsId=${credentialsId}`,
        );
        const data = await response.json();
        if (response.ok) {
          setRoutes(data.routes);
        }
      } catch (error) {
        console.error("Failed to fetch keyword routes", error);
      }
    };
    fetchRoutes();
  }, [workspaceId, credentialsId]);

  const handleAddRoute = () => {
    setRoutes([{ keyword: "", typebotId: "" }, ...routes]);
  };

  const handleSaveRoute = async (index: number) => {
    const route = routes[index];
    if (!route.keyword || !route.typebotId) {
      toast({
        title: "Error",
        description: "Keyword and Typebot are required",
        type: "error",
      });
      return;
    }
    setIsSaving(index.toString());
    try {
      const response = await fetch("/api/messenger/keyword-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          credentialsId,
          keyword: route.keyword,
          typebotId: route.typebotId,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const newRoutes = [...routes];
        newRoutes[index] = data.route;
        setRoutes(newRoutes);
        toast({
          title: "Success",
          description: "Keyword route saved",
          type: "success",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        type: "error",
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteRoute = async (index: number) => {
    const route = routes[index];
    if (!route.id) {
      setRoutes(routes.filter((_, i) => i !== index));
      return;
    }
    try {
      const response = await fetch(
        `/api/messenger/keyword-routes?id=${route.id}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setRoutes(routes.filter((_, i) => i !== index));
        toast({
          title: "Success",
          description: "Keyword route deleted",
          type: "success",
        });
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete keyword route",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Keyword Routing</p>
        <p className="text-xs text-gray-500">
          Route users to specific flows based on keywords they type.
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center gap-2"
        onClick={handleAddRoute}
      >
        <PlusSignIcon className="size-4" />
        Add Keyword Route
      </Button>

      {routes.map((route, index) => (
        <div
          key={route.id ?? `new-${index}`}
          className="flex flex-col gap-3 p-3 border rounded-md relative bg-gray-50/50"
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
            onClick={() => handleDeleteRoute(index)}
          >
            <TrashIcon className="size-4" />
          </Button>

          <Field.Root>
            <Field.Label>Keyword</Field.Label>
            <Input
              value={route.keyword}
              onChange={(e) => {
                const newRoutes = [...routes];
                newRoutes[index].keyword = e.target.value;
                setRoutes(newRoutes);
              }}
              placeholder="e.g. PRICE"
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Target Flow</Field.Label>
            <BasicSelect
              items={typebots.map((t) => ({ label: t.name, value: t.id }))}
              value={route.typebotId}
              onChange={(val) => {
                const newRoutes = [...routes];
                newRoutes[index].typebotId = val as string;
                setRoutes(newRoutes);
              }}
              placeholder="Select a flow"
            />
          </Field.Root>

          <Button
            size="sm"
            className="mt-2"
            onClick={() => handleSaveRoute(index)}
            isLoading={isSaving === index.toString()}
          >
            Save
          </Button>
        </div>
      ))}
    </div>
  );
};

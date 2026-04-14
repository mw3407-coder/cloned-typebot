import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { Select } from "@typebot.io/ui/components/Select";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/useToast";
import { useState, useEffect } from "react";

type KeywordRoute = {
  id?: string;
  keyword: string;
  typebotId: string;
};

export const KeywordRoutingSettings = ({
  credentialsId,
}: {
  credentialsId: string;
}) => {
  const { showToast } = useToast();
  const { typebot } = useTypebot();
  const [routes, setRoutes] = useState<KeywordRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: typebots } = trpc.typebot.list.useQuery(
    { workspaceId: typebot?.workspaceId! },
    { enabled: !!typebot?.workspaceId }
  );

  const { data: existingRoutes, refetch } =
    trpc.messenger.getKeywordRoutes.useQuery(
      {
        workspaceId: typebot?.workspaceId!,
        credentialsId: credentialsId,
      },
      { enabled: !!typebot?.workspaceId && !!credentialsId }
    );

  useEffect(() => {
    if (existingRoutes) {
      setRoutes(existingRoutes);
    }
  }, [existingRoutes]);

  const addNewRoute = () => {
    setRoutes([...routes, { keyword: "", typebotId: "" }]);
  };

  const updateRoute = (
    index: number,
    field: keyof KeywordRoute,
    value: string
  ) => {
    const updated = [...routes];
    updated[index] = { ...updated[index], [field]: value };
    setRoutes(updated);
  };

  const deleteRoute = (index: number) => {
    const updated = routes.filter((_, i) => i !== index);
    setRoutes(updated);
  };

  const saveRoute = async (index: number) => {
    const route = routes[index];
    if (!route.keyword || !route.typebotId) {
      showToast({
        title: "Keyword and Typebot are required",
        status: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await trpc.messenger.upsertKeywordRoute.mutate({
        workspaceId: typebot?.workspaceId!,
        credentialsId: credentialsId,
        keyword: route.keyword.toUpperCase().trim(),
        typebotId: route.typebotId,
      });
      showToast({
        title: "Keyword route saved",
        status: "success",
      });
      refetch();
    } catch (error) {
      showToast({
        title: "Failed to save keyword route",
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedRoute = async (route: KeywordRoute) => {
    if (!route.id) return;
    setIsLoading(true);
    try {
      await trpc.messenger.deleteKeywordRoute.mutate({
        workspaceId: typebot?.workspaceId!,
        credentialsId: credentialsId,
        routeId: route.id,
      });
      showToast({
        title: "Keyword route deleted",
        status: "success",
      });
      refetch();
    } catch (error) {
      showToast({
        title: "Failed to delete keyword route",
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!credentialsId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please connect Messenger credentials first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Define keywords that will trigger specific typebots. When a user sends a
        message matching a keyword, the current session will be reset and the
        mapped typebot will start.
      </p>

      {routes.map((route, index) => (
        <div key={index} className="flex flex-col gap-2 p-3 border rounded-md">
          <div className="flex items-center gap-2">
            <Field label="Keyword" className="flex-1">
              <Input
                value={route.keyword}
                onChange={(e) => updateRoute(index, "keyword", e.target.value)}
                placeholder="e.g., PRICE"
                className="uppercase"
              />
            </Field>
            <Field label="Typebot" className="flex-1">
              <Select
                value={route.typebotId}
                onValueChange={(value) =>
                  updateRoute(index, "typebotId", value)
                }
                placeholder="Select a typebot"
                options={
                  typebots?.map((tb) => ({
                    label: tb.name,
                    value: tb.id,
                  })) ?? []
                }
              />
            </Field>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteRoute(index)}
              className="mt-6"
            >
              <TrashIcon />
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => saveRoute(index)}
            loading={isLoading}
            className="self-end"
          >
            Save
          </Button>
        </div>
      ))}

      <Button variant="outline" onClick={addNewRoute} loading={isLoading}>
        <PlusSignIcon className="mr-2" />
        Add Keyword Route
      </Button>

      {existingRoutes && existingRoutes.length > 0 && (
        <div className="mt-4">
          <Field label="Saved Routes" />
          <div className="flex flex-col gap-2 mt-2">
            {existingRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div>
                  <span className="font-mono text-sm font-medium">
                    {route.keyword}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    →{" "}
                    {typebots?.find((tb) => tb.id === route.typebotId)?.name ??
                      route.typebotId}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSavedRoute(route)}
                  loading={isLoading}
                >
                  <TrashIcon />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import { BasicSelect } from "@/components/BasicSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { trpc } from "@/lib/trpc";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState, useEffect } from "react";

type KeywordRoute = {
  id?: string;
  keyword: string;
  typebotId: string;
};

export const KeywordRoutingSettings = () => {
  const { toast } = useToast();
  const { typebot, save } = useTypebot();
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
        credentialsId: typebot?.messengerCredentialsId!,
      },
      { enabled: !!typebot?.workspaceId && !!typebot?.messengerCredentialsId }
    );

  useEffect(() => {
    if (existingRoutes) {
      setRoutes(existingRoutes);
    }
  }, [existingRoutes]);

  const addNewRoute = () => {
    setRoutes([...routes, { keyword: "", typebotId: "" }]);
  };

  const updateRoute = (index: number, field: keyof KeywordRoute, value: string) => {
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
      toast({
        title: "Error",
        description: "Keyword and Typebot are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await trpc.messenger.upsertKeywordRoute.mutate({
        workspaceId: typebot?.workspaceId!,
        credentialsId: typebot?.messengerCredentialsId!,
        keyword: route.keyword.toUpperCase().trim(),
        typebotId: route.typebotId,
      });
      toast({ title: "Success", description: "Keyword route saved" });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save keyword route",
        variant: "destructive",
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
        credentialsId: typebot?.messengerCredentialsId!,
        routeId: route.id,
      });
      toast({ title: "Success", description: "Keyword route deleted" });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete keyword route",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!typebot?.messengerCredentialsId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please connect Messenger credentials first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Define keywords that will trigger specific typebots. When a user sends a
        message matching a keyword, the current session will be reset and the
        mapped typebot will start.
      </div>

      {routes.map((route, index) => (
        <div key={index} className="flex flex-col gap-2 p-3 border rounded-md">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label>Keyword</Label>
              <Input
                value={route.keyword}
                onChange={(e) => updateRoute(index, "keyword", e.target.value)}
                placeholder="e.g., PRICE"
                className="uppercase"
              />
            </div>
            <div className="flex-1">
              <Label>Typebot</Label>
              <BasicSelect
                value={route.typebotId}
                onValueChange={(value) =>
                  updateRoute(index, "typebotId", value)
                }
                options={
                  typebots?.map((tb) => ({
                    label: tb.name,
                    value: tb.id,
                  })) ?? []
                }
                placeholder="Select a typebot"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteRoute(index)}
              className="mt-6"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => saveRoute(index)}
            disabled={isLoading}
          >
            Save
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={addNewRoute}
        className="w-full"
        disabled={isLoading}
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        Add Keyword Route
      </Button>

      {existingRoutes && existingRoutes.length > 0 && (
        <div className="mt-4">
          <Label>Saved Routes</Label>
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
                  <span className="ml-2 text-sm text-muted-foreground">
                    →{" "}
                    {typebots?.find((tb) => tb.id === route.typebotId)?.name ??
                      route.typebotId}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSavedRoute(route)}
                  disabled={isLoading}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useCallback } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ThreeViewer from "@/components/three-viewer";
import type { AvatarState } from "@shared/schema";
import { POSE_PRESETS, OUTFIT_OPTIONS } from "@shared/schema";
import {
  ArrowLeft,
  Box,
  Download,
  Loader2,
  Move3D,
  Plus,
  RotateCcw,
  Shirt,
  Sparkles,
  Check,
} from "lucide-react";

const BONE_LABELS: Record<string, string> = {
  head: "Head",
  spine: "Spine / Torso",
  leftUpperArm: "Left Upper Arm",
  rightUpperArm: "Right Upper Arm",
  leftLowerArm: "Left Forearm",
  rightLowerArm: "Right Forearm",
  leftUpperLeg: "Left Upper Leg",
  rightUpperLeg: "Right Upper Leg",
};

const AXES = ["x", "y", "z"] as const;

export default function Viewer() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pose");
  const [manualPose, setManualPose] = useState<Record<string, { rotation: { x: number; y: number; z: number } }>>({});
  const [viewerReady, setViewerReady] = useState(false);

  const { data: avatar, isLoading } = useQuery<AvatarState>({
    queryKey: ["/api/avatar", id],
    enabled: !!id,
  });

  const poseMutation = useMutation({
    mutationFn: async (poseData: { source: string; presetName?: string; bones?: Record<string, any> }) => {
      const res = await apiRequest("PUT", `/api/avatar/${id}/pose`, poseData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/avatar", id] });
    },
    onError: () => {
      toast({ title: "Failed to update pose", variant: "destructive" });
    },
  });

  const outfitMutation = useMutation({
    mutationFn: async (outfitId: string | null) => {
      const res = await apiRequest("PUT", `/api/avatar/${id}/outfit`, { outfit: outfitId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/avatar", id] });
      toast({ title: "Outfit updated" });
    },
    onError: () => {
      toast({ title: "Failed to update outfit", variant: "destructive" });
    },
  });

  const objectMutation = useMutation({
    mutationFn: async (data: { name: string; prompt?: string }) => {
      const res = await apiRequest("POST", `/api/avatar/${id}/add-object`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/avatar", id] });
      toast({ title: "Object added to scene" });
    },
    onError: () => {
      toast({ title: "Failed to add object", variant: "destructive" });
    },
  });

  const handlePresetPose = useCallback((presetName: string) => {
    const pose = POSE_PRESETS[presetName];
    if (!pose) return;
    setManualPose(pose);
    poseMutation.mutate({ source: "preset", presetName, bones: pose });
  }, [poseMutation]);

  const handleBoneChange = useCallback((boneName: string, axis: "x" | "y" | "z", value: number) => {
    setManualPose((prev) => {
      const updated = {
        ...prev,
        [boneName]: {
          rotation: {
            ...prev[boneName]?.rotation || { x: 0, y: 0, z: 0 },
            [axis]: value,
          },
        },
      };
      return updated;
    });
  }, []);

  const handleApplyManualPose = useCallback(() => {
    poseMutation.mutate({ source: "manual", bones: manualPose });
  }, [manualPose, poseMutation]);

  const handleResetPose = useCallback(() => {
    setManualPose({});
    poseMutation.mutate({ source: "preset", presetName: "Relaxed", bones: POSE_PRESETS["Relaxed"] });
  }, [poseMutation]);

  const activePose = Object.keys(manualPose).length > 0 ? manualPose : avatar?.pose?.bones || {};

  const handleDownload = useCallback(async (format: string) => {
    if (!avatar?.baseMesh?.meshPath) {
      toast({ title: `Demo mesh available in ${format.toUpperCase()} after upload`, variant: "default" });
      return;
    }
    const link = document.createElement("a");
    link.href = avatar.baseMesh.meshPath;
    link.download = `avatar-${id}.${format}`;
    link.click();
  }, [avatar, id, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading avatar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="relative z-20 flex items-center justify-between gap-4 flex-wrap px-4 py-3 border-b border-white/[0.06] backdrop-blur-md bg-background/80 sticky top-0">
        <div className="flex items-center gap-3">
          <Link href="/build">
            <Button variant="ghost" size="icon" data-testid="button-back-build">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            <span className="font-bold tracking-tight text-foreground logo-text">AVATRYX</span>
          </div>
          {avatar && (
            <Badge variant="secondary">
              {avatar.baseMesh.type === "hybrik" ? "SINJ" : avatar.baseMesh.type.toUpperCase()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDownload("obj")} data-testid="button-download-obj">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            OBJ
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload("glb")} data-testid="button-download-glb">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            GLB
          </Button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative min-h-[400px] lg:min-h-0 bg-gradient-to-b from-background to-card">
          <div className="absolute inset-0">
            <ThreeViewer
              meshUrl={avatar?.baseMesh?.meshPath}
              poseData={activePose as any}
              onReady={() => setViewerReady(true)}
            />
          </div>
          {!viewerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Initializing 3D viewer...</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 z-10">
            <p className="text-xs text-muted-foreground/60">Drag to rotate, scroll to zoom</p>
          </div>
        </div>

        <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-background/90 backdrop-blur-md overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 m-3 mb-0">
              <TabsTrigger value="pose" data-testid="tab-pose">
                <Move3D className="w-3.5 h-3.5 mr-1.5" />
                Pose
              </TabsTrigger>
              <TabsTrigger value="outfit" data-testid="tab-outfit">
                <Shirt className="w-3.5 h-3.5 mr-1.5" />
                Outfit
              </TabsTrigger>
              <TabsTrigger value="objects" data-testid="tab-objects">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Objects
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-3">
              <TabsContent value="pose" className="mt-0 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Pose Presets</h3>
                    <Button variant="ghost" size="sm" onClick={handleResetPose} data-testid="button-reset-pose">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(POSE_PRESETS).map((name) => (
                      <Button
                        key={name}
                        variant={avatar?.pose?.presetName === name ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetPose(name)}
                        className="justify-start"
                        data-testid={`button-preset-${name.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        {avatar?.pose?.presetName === name && <Check className="w-3 h-3 mr-1" />}
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/[0.06] pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Manual Controls</h3>
                  <div className="space-y-4">
                    {Object.entries(BONE_LABELS).map(([boneName, label]) => (
                      <div key={boneName}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
                        <div className="space-y-2">
                          {AXES.map((axis) => (
                            <div key={axis} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-4 uppercase font-mono">{axis}</span>
                              <Slider
                                min={-Math.PI}
                                max={Math.PI}
                                step={0.01}
                                value={[manualPose[boneName]?.rotation?.[axis] ?? 0]}
                                onValueChange={([v]) => handleBoneChange(boneName, axis, v)}
                                className="flex-1"
                                data-testid={`slider-${boneName}-${axis}`}
                              />
                              <span className="text-xs text-muted-foreground font-mono w-12 text-right">
                                {((manualPose[boneName]?.rotation?.[axis] ?? 0) * 180 / Math.PI).toFixed(0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleApplyManualPose}
                    className="w-full mt-4"
                    disabled={poseMutation.isPending}
                    data-testid="button-apply-pose"
                  >
                    {poseMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
                    Apply Pose
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="outfit" className="mt-0 space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-1">Outfit Library</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Select an outfit to apply to your avatar. Outfits are applied as geometry overlays.
                </p>

                <Button
                  variant={!avatar?.appearance?.outfit ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start mb-2"
                  onClick={() => outfitMutation.mutate(null)}
                  data-testid="button-outfit-none"
                >
                  {!avatar?.appearance?.outfit && <Check className="w-3 h-3 mr-1" />}
                  No Outfit (Base Mesh)
                </Button>

                <div className="space-y-2">
                  {OUTFIT_OPTIONS.map((outfit) => (
                    <Card
                      key={outfit.id}
                      className={`hover-elevate active-elevate-2 overflow-visible cursor-pointer ${avatar?.appearance?.outfit === outfit.id ? "ring-1 ring-primary" : ""}`}
                      onClick={() => outfitMutation.mutate(outfit.id)}
                      data-testid={`card-outfit-${outfit.id}`}
                    >
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Shirt className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{outfit.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{outfit.category}</p>
                          </div>
                        </div>
                        {avatar?.appearance?.outfit === outfit.id && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="objects" className="mt-0 space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-1">Scene Objects</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Add 3D objects to your avatar scene. Objects can be positioned, rotated, and scaled.
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {["Sunglasses", "Hat", "Backpack", "Sword", "Shield", "Guitar"].map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      onClick={() => objectMutation.mutate({ name: item, prompt: item })}
                      disabled={objectMutation.isPending}
                      className="justify-start"
                      data-testid={`button-add-${item.toLowerCase()}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {item}
                    </Button>
                  ))}
                </div>

                {avatar?.objects && avatar.objects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Added Objects</h4>
                    {avatar.objects.map((obj) => (
                      <Card key={obj.id} className="overflow-visible">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
                            <Box className="w-4 h-4 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{obj.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Position: ({obj.position.x.toFixed(1)}, {obj.position.y.toFixed(1)}, {obj.position.z.toFixed(1)})
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {(!avatar?.objects || avatar.objects.length === 0) && (
                  <div className="text-center py-8">
                    <Box className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No objects added yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Click an object above to add it to your scene</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

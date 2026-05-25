import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Camera,
  ChevronRight,
  Film,
  Loader2,
  Scan,
  Upload,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

type MeshOption = {
  id: string;
  title: string;
  description: string;
  strengths: string[];
  limitations: string[];
  icon: any;
  meshType: "hybrik" | "pifuhd";
  sourceType: "image" | "video";
  accept: string;
};

const meshOptions: MeshOption[] = [
  {
    id: "SINJ-image",
    title: "Image to Motion Mesh",
    description: "Generate a motion-accurate 3D human mesh from a single image using SINJ.",
    strengths: ["Accurate body proportions", "Pose estimation", "Fast processing"],
    limitations: ["Single viewpoint only", "Lower clothing detail"],
    icon: Camera,
    meshType: "hybrik",
    sourceType: "image",
    accept: ".png, .jpeg, .jpg",
  },
  {
    id: "pifuhd-image",
    title: "Image to Detailed Mesh",
    description: "Create a high-detail mesh with clothing and face features using PIFuHD.",
    strengths: ["High-detail geometry", "Clothing texture capture", "Face detail"],
    limitations: ["Slower processing", "Front-facing images work best"],
    icon: Scan,
    meshType: "pifuhd",
    sourceType: "image",
    accept: ".png",
  },
  {
    id: "SINJ-video",
    title: "Video to Motion Capture",
    description: "Extract 3D motion capture data and mesh from video footage using SINJ.",
    strengths: ["Motion capture data", "Multiple frame analysis", "Dynamic pose"],
    limitations: ["Requires clear subject visibility", "Longer processing"],
    icon: Film,
    meshType: "hybrik",
    sourceType: "video",
    accept: ".mp4,.webm,.mov",
  },
];

export default function Build() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const selected = meshOptions.find((o) => o.id === selectedOption);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (selected?.sourceType === "image" && !f.name.toLowerCase().endsWith(".png")) {
      toast({
        title: "Invalid file format",
        description: "Please upload a PNG image file only.",
        variant: "destructive",
      });
      return;
    }

    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;

    if (selected?.sourceType === "image" && !f.name.toLowerCase().endsWith(".png")) {
      toast({
        title: "Invalid file format",
        description: "Please upload a PNG image file only.",
        variant: "destructive",
      });
      return;
    }

    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  }

  function clearFile() {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file || !selected) return;

    setUploading(true);
    setProgress(0);

    try {
      const createRes = await apiRequest("POST", "/api/avatar", {
        meshType: selected.meshType,
        sourceType: selected.sourceType,
      });
      const avatar = await createRes.json();

      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 15, 90));
      }, 300);

      const formData = new FormData();
      formData.append("mesh", file);

      const uploadRes = await fetch(`/api/avatar/${avatar.avatarId}/upload-mesh`, {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      setProgress(100);

      setTimeout(() => {
        setLocation(`/viewer/${avatar.avatarId}`);
      }, 500);
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-15 bg-primary -top-40 right-0 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-10 bg-purple-600 bottom-0 -left-40 pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between gap-4 flex-wrap px-6 py-4 border-b border-white/[0.06] backdrop-blur-md bg-background/60">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/my-logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold tracking-tight text-foreground logo-text">AVATRYX</span>          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={selectedOption ? "text-primary" : ""}>Select Method</span>
          <ChevronRight className="w-3 h-3" />
          <span className={file ? "text-primary" : ""}>Upload</span>
          <ChevronRight className="w-3 h-3" />
          <span>Generate</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 md:py-16">
        {!selectedOption ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3" data-testid="text-build-title">
                Choose Your Method
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Select how you want to generate your 3D avatar. Each method has different strengths.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {meshOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className="cursor-pointer"
                    data-testid={`card-option-${option.id}`}
                  >
                    <Card className="h-full hover-elevate active-elevate-2 overflow-visible">
                      <CardContent className="p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground">{option.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>

                        <div className="space-y-3 mt-auto">
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1.5">Strengths</p>
                            <div className="flex flex-col gap-1">
                              {option.strengths.map((s) => (
                                <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1.5">Limitations</p>
                            <div className="flex flex-col gap-1">
                              {option.limitations.map((l) => (
                                <div key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                  <span>{l}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Badge variant="secondary" className="self-start mt-1">
                          {option.sourceType === "image" ? "PNG Only" : "Video"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <button
                onClick={() => {
                  setSelectedOption(null);
                  clearFile();
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover-elevate rounded-md px-2 py-1"
                data-testid="button-change-method"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change method
              </button>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-upload-title">
                {selected?.title}
              </h1>
              <p className="text-muted-foreground">{selected?.description}</p>
            </div>

            <Card>
              <CardContent className="p-8">
                {!file ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-white/[0.08] rounded-md p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/30 transition-colors"
                    data-testid="dropzone-upload"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-foreground font-medium mb-1">
                        Drop your {selected?.sourceType} here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selected?.sourceType === "image"
                          ? "Accepts PNG files only for best quality"
                          : "Accepts MP4, WebM, or MOV files"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border border-white/[0.06]"
                          data-testid="img-preview"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-md border border-white/[0.06] bg-muted flex items-center justify-center">
                          <Film className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate" data-testid="text-filename">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {!uploading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFile}
                            className="mt-2"
                            data-testid="button-remove-file"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {progress < 100 ? "Processing..." : "Complete!"}
                          </span>
                          <span className="text-foreground font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {!uploading && (
                      <Button onClick={handleUpload} className="w-full" data-testid="button-generate">
                        Generate 3D Avatar
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}

                    {uploading && progress < 100 && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating your 3D mesh. This may take a moment...</span>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selected?.accept}
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-file"
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

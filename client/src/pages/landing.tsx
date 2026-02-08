import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Layers, Move3D, Shirt, Sparkles, Upload } from "lucide-react";

function FloatingOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="group relative rounded-md border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 hover-elevate">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground mb-1" data-testid={`text-feature-${title.toLowerCase().replace(/\s/g, '-')}`}>{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="relative flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
        <span className="text-lg font-bold text-primary">{step}</span>
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingOrb className="w-[600px] h-[600px] bg-primary -top-40 -left-40" />
      <FloatingOrb className="w-[400px] h-[400px] bg-purple-500 top-1/3 -right-20" />
      <FloatingOrb className="w-[500px] h-[500px] bg-blue-600 -bottom-40 left-1/3" />

      <nav className="relative z-10 flex items-center justify-between gap-4 flex-wrap px-6 py-4 border-b border-white/[0.06] backdrop-blur-md bg-background/60">
        <div className="flex items-center gap-2">
          <Box className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground" data-testid="text-brand-name">AVATRYX</span>
        </div>
        <Link href="/build">
          <Button data-testid="button-nav-start">
            Get Started
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </nav>

      <main className="relative z-10">
        <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 md:pt-36 md:pb-28">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md mb-8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide uppercase">3D Avatar Platform</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl leading-[1.1]"
            data-testid="text-hero-title"
          >
            Create. Pose.{" "}
            <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Transform.
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
            data-testid="text-hero-description"
          >
            Upload images or videos and generate stunning 3D human avatars.
            Edit poses, swap outfits, and add objects — all in your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/build">
              <Button size="lg" data-testid="button-hero-start">
                <Sparkles className="w-4 h-4 mr-2" />
                Let's Build
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" data-testid="button-hero-learn">
                Learn More
              </Button>
            </a>
          </div>
        </section>

        <section className="px-6 pb-20 md:pb-28">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-md border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-visible p-8 md:p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-md pointer-events-none" />
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
                <StepCard step={1} title="Upload" description="Drop an image or video of a person. We accept PNG files for maximum quality." />
                <StepCard step={2} title="Generate" description="Our ML pipeline creates a detailed 3D mesh with accurate body proportions and clothing." />
                <StepCard step={3} title="Customize" description="Edit poses, swap outfits, add 3D objects, then download your avatar in OBJ or GLB." />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 pb-20 md:pb-28">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-features-title">
                Everything You Need
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                A complete toolkit for creating and customizing 3D human avatars.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon={Upload}
                title="Smart Upload"
                description="Upload PNG images or videos. Our system auto-detects humans and generates accurate 3D meshes."
              />
              <FeatureCard
                icon={Move3D}
                title="Pose Editing"
                description="Adjust body poses with intuitive bone controls. Choose from presets or fine-tune each joint manually."
              />
              <FeatureCard
                icon={Shirt}
                title="Outfit Swap"
                description="Browse a library of outfits and apply them instantly. From casual to formal — dress your avatar."
              />
              <FeatureCard
                icon={Box}
                title="Object Addition"
                description="Generate 3D objects from text prompts and attach them to your avatar scene."
              />
              <FeatureCard
                icon={Layers}
                title="Multi-Format Export"
                description="Download your finished avatar in OBJ or GLB format, ready for any 3D application."
              />
              <FeatureCard
                icon={Sparkles}
                title="Interactive Viewer"
                description="Rotate, zoom, and inspect your avatar in real-time with our WebGL-powered 3D viewer."
              />
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="relative rounded-md border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-10 md:p-14">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent rounded-md pointer-events-none" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Create?</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Start building your 3D avatar now. It only takes a single image.
                </p>
                <Link href="/build">
                  <Button size="lg" data-testid="button-cta-start">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Building
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-6 backdrop-blur-md bg-background/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">AVATRYX</span>
          </div>
          <p className="text-xs text-muted-foreground">Create. Pose. Transform.</p>
        </div>
      </footer>
    </div>
  );
}

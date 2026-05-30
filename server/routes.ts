import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createAvatarSchema, updatePoseSchema, updateOutfitSchema, addObjectSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { execFile } from "child_process";

const uploadsDir = path.join(process.cwd(), "uploads", "meshes");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/uploads", (await import("express")).default.static(path.join(process.cwd(), "uploads")));

  app.post("/api/avatar", async (req, res) => {
    try {
      const parsed = createAvatarSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }
      const avatar = await storage.createAvatar(parsed.data.meshType);
      res.status(201).json(avatar);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.post("/api/avatar/:id/upload-mesh", upload.single("mesh"), async (req, res) => {
    try {
      const id = req.params.id as string;
      const avatar = await storage.getAvatar(id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sinjDir = path.join(process.cwd(), "SINJ");
      const inputPath = path.join(sinjDir, "input.jpg");
      const outputDir = path.join(sinjDir, "res");
      const originalName = req.file.originalname;

      fs.copyFileSync(req.file.path, inputPath);

      const defaultPython = process.platform === "win32"
        ? path.join(sinjDir, "sinj-env", "Scripts", "python.exe")
        : path.join(sinjDir, "sinj-env", "bin", "python");
      const pythonPath = process.env.SINJ_PYTHON || defaultPython;

      if (!fs.existsSync(pythonPath)) {
        return res.status(500).json({
          message: `SINJ Python interpreter not found at ${pythonPath}. Create SINJ/sinj-env or set SINJ_PYTHON.`,
        });
      }

      const scriptPath = path.join(sinjDir, "scripts", "demo_image.py");
      const checkpointPath = path.join(sinjDir, "pretrained_models", "sinj_hrnet.pth");

      if (!fs.existsSync(scriptPath)) {
        return res.status(500).json({ message: `SINJ demo script missing at ${scriptPath}` });
      }

      if (!fs.existsSync(checkpointPath)) {
        return res.status(500).json({ message: `SINJ checkpoint missing at ${checkpointPath}` });
      }

      execFile(
        pythonPath,
        [scriptPath, "--img-dir", sinjDir, "--out-dir", outputDir],
        {
          cwd: sinjDir,
          env: {
            ...process.env,
            PYTHONPATH: sinjDir,
          },
        },
        async (error, stdout, stderr) => {
        if (error) {
          console.error("Python Error:", stderr);
          return res.status(500).json({ message: "Python execution failed" });
        }

        console.log(stdout);

        if (!fs.existsSync(outputDir)) {
          return res.status(500).json({ message: "Output folder missing" });
        }

        const files = fs.readdirSync(outputDir).filter((f) => f.endsWith(".obj"));
        if (files.length === 0) {
          return res.status(500).json({ message: "No OBJ generated" });
        }

        files.sort((a, b) => {
          return fs.statSync(path.join(outputDir, b)).mtime.getTime() - fs.statSync(path.join(outputDir, a)).mtime.getTime();
        });

        const latestObj = files[0];
        const meshUrl = `/SINJ/${latestObj}`;

        const sourcePath = path.join(outputDir, latestObj);
        const newFileName = `${randomUUID()}.obj`;
        const newPath = path.join(uploadsDir, newFileName);

        fs.copyFileSync(sourcePath, newPath);

        const meshPath = `/uploads/meshes/${newFileName}`;
        const updated = await storage.updateMeshPath(id, meshPath, originalName);

        return res.json({ ...updated, meshUrl });
        },
      );

    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/avatar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const avatar = await storage.getAvatar(id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      res.json(avatar);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.put("/api/avatar/:id/pose", async (req, res) => {
    try {
      const { id } = req.params;
      const avatar = await storage.getAvatar(id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      const parsed = updatePoseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid pose data", errors: parsed.error.flatten() });
      }
      const updated = await storage.updatePose(id, parsed.data);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.put("/api/avatar/:id/outfit", async (req, res) => {
    try {
      const { id } = req.params;
      const avatar = await storage.getAvatar(id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      const parsed = updateOutfitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid outfit data", errors: parsed.error.flatten() });
      }
      const updated = await storage.updateOutfit(id, parsed.data.outfit);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.post("/api/avatar/:id/add-object", async (req, res) => {
    try {
      const { id } = req.params;
      const avatar = await storage.getAvatar(id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      const parsed = addObjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid object data", errors: parsed.error.flatten() });
      }
      const newObj = {
        id: randomUUID(),
        name: parsed.data.name,
        meshPath: "",
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
      const updated = await storage.addObject(id, newObj);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createAvatarSchema, updatePoseSchema, updateOutfitSchema, addObjectSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const uploadsDir = path.resolve(process.cwd(), "uploads", "meshes");
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
  app.use("/uploads", (await import("express")).default.static(path.resolve(process.cwd(), "uploads")));

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
      const { id } = req.params;
      const avatar = await storage.getAvatar(id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const meshPath = `/uploads/meshes/${req.file.filename}`;
      const updated = await storage.updateMeshPath(id, meshPath, req.file.originalname);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
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

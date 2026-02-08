import { z } from "zod";

export const avatarPoseSchema = z.object({
  source: z.enum(["preset", "manual"]).default("preset"),
  presetName: z.string().optional(),
  bones: z.record(z.string(), z.object({
    rotation: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
  })).optional(),
});

export const avatarObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  meshPath: z.string(),
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  scale: z.object({ x: z.number(), y: z.number(), z: z.number() }),
});

export const avatarStateSchema = z.object({
  avatarId: z.string(),
  baseMesh: z.object({
    type: z.enum(["hybrik", "pifuhd"]),
    meshPath: z.string().nullable(),
    originalFileName: z.string().nullable(),
  }),
  rig: z.object({
    type: z.string().default("auto-rigged"),
    skeleton: z.string().default("humanoid"),
  }),
  pose: avatarPoseSchema,
  appearance: z.object({
    outfit: z.string().nullable(),
    textureMaps: z.array(z.string()),
  }),
  objects: z.array(avatarObjectSchema),
  createdAt: z.string(),
});

export const createAvatarSchema = z.object({
  meshType: z.enum(["hybrik", "pifuhd"]),
  sourceType: z.enum(["image", "video"]),
});

export const updatePoseSchema = z.object({
  source: z.enum(["preset", "manual"]),
  presetName: z.string().optional(),
  bones: z.record(z.string(), z.object({
    rotation: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
  })).optional(),
});

export const updateOutfitSchema = z.object({
  outfit: z.string().nullable(),
});

export const addObjectSchema = z.object({
  name: z.string(),
  prompt: z.string().optional(),
});

export type AvatarState = z.infer<typeof avatarStateSchema>;
export type AvatarPose = z.infer<typeof avatarPoseSchema>;
export type AvatarObject = z.infer<typeof avatarObjectSchema>;
export type CreateAvatar = z.infer<typeof createAvatarSchema>;
export type UpdatePose = z.infer<typeof updatePoseSchema>;
export type UpdateOutfit = z.infer<typeof updateOutfitSchema>;
export type AddObject = z.infer<typeof addObjectSchema>;

export const POSE_PRESETS: Record<string, Record<string, { rotation: { x: number; y: number; z: number } }>> = {
  "T-Pose": {
    leftUpperArm: { rotation: { x: 0, y: 0, z: Math.PI / 2 } },
    rightUpperArm: { rotation: { x: 0, y: 0, z: -Math.PI / 2 } },
    leftLowerArm: { rotation: { x: 0, y: 0, z: 0 } },
    rightLowerArm: { rotation: { x: 0, y: 0, z: 0 } },
    leftUpperLeg: { rotation: { x: 0, y: 0, z: 0 } },
    rightUpperLeg: { rotation: { x: 0, y: 0, z: 0 } },
    head: { rotation: { x: 0, y: 0, z: 0 } },
    spine: { rotation: { x: 0, y: 0, z: 0 } },
  },
  "A-Pose": {
    leftUpperArm: { rotation: { x: 0, y: 0, z: Math.PI / 4 } },
    rightUpperArm: { rotation: { x: 0, y: 0, z: -Math.PI / 4 } },
    leftLowerArm: { rotation: { x: 0, y: 0, z: 0 } },
    rightLowerArm: { rotation: { x: 0, y: 0, z: 0 } },
    leftUpperLeg: { rotation: { x: 0, y: 0, z: 0 } },
    rightUpperLeg: { rotation: { x: 0, y: 0, z: 0 } },
    head: { rotation: { x: 0, y: 0, z: 0 } },
    spine: { rotation: { x: 0, y: 0, z: 0 } },
  },
  "Relaxed": {
    leftUpperArm: { rotation: { x: 0, y: 0, z: Math.PI / 6 } },
    rightUpperArm: { rotation: { x: 0, y: 0, z: -Math.PI / 6 } },
    leftLowerArm: { rotation: { x: -Math.PI / 8, y: 0, z: 0 } },
    rightLowerArm: { rotation: { x: -Math.PI / 8, y: 0, z: 0 } },
    leftUpperLeg: { rotation: { x: -0.05, y: 0, z: 0.05 } },
    rightUpperLeg: { rotation: { x: -0.05, y: 0, z: -0.05 } },
    head: { rotation: { x: 0.1, y: 0, z: 0 } },
    spine: { rotation: { x: 0, y: 0, z: 0 } },
  },
  "Action": {
    leftUpperArm: { rotation: { x: -Math.PI / 3, y: 0, z: Math.PI / 6 } },
    rightUpperArm: { rotation: { x: Math.PI / 4, y: 0, z: -Math.PI / 6 } },
    leftLowerArm: { rotation: { x: -Math.PI / 4, y: 0, z: 0 } },
    rightLowerArm: { rotation: { x: -Math.PI / 3, y: 0, z: 0 } },
    leftUpperLeg: { rotation: { x: -Math.PI / 6, y: 0, z: 0 } },
    rightUpperLeg: { rotation: { x: Math.PI / 8, y: 0, z: 0 } },
    head: { rotation: { x: -0.1, y: 0.2, z: 0 } },
    spine: { rotation: { x: 0.1, y: 0.1, z: 0 } },
  },
  "Wave": {
    leftUpperArm: { rotation: { x: 0, y: 0, z: Math.PI / 6 } },
    rightUpperArm: { rotation: { x: -Math.PI / 1.5, y: 0, z: -Math.PI / 4 } },
    leftLowerArm: { rotation: { x: 0, y: 0, z: 0 } },
    rightLowerArm: { rotation: { x: -Math.PI / 3, y: 0, z: 0 } },
    leftUpperLeg: { rotation: { x: 0, y: 0, z: 0 } },
    rightUpperLeg: { rotation: { x: 0, y: 0, z: 0 } },
    head: { rotation: { x: 0, y: -0.2, z: 0.05 } },
    spine: { rotation: { x: 0, y: 0, z: 0 } },
  },
};

export const OUTFIT_OPTIONS = [
  { id: "casual-tshirt", name: "Casual T-Shirt", category: "tops" },
  { id: "formal-suit", name: "Formal Suit", category: "full" },
  { id: "hoodie", name: "Hoodie", category: "tops" },
  { id: "athletic-wear", name: "Athletic Wear", category: "full" },
  { id: "leather-jacket", name: "Leather Jacket", category: "tops" },
  { id: "lab-coat", name: "Lab Coat", category: "tops" },
] as const;

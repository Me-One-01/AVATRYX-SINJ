import { randomUUID } from "crypto";
import type { AvatarState, AvatarPose, AvatarObject } from "@shared/schema";

export interface IStorage {
  createAvatar(meshType: "hybrik" | "pifuhd"): Promise<AvatarState>;
  getAvatar(id: string): Promise<AvatarState | undefined>;
  updateMeshPath(id: string, meshPath: string, fileName: string): Promise<AvatarState | undefined>;
  updatePose(id: string, pose: AvatarPose): Promise<AvatarState | undefined>;
  updateOutfit(id: string, outfit: string | null): Promise<AvatarState | undefined>;
  addObject(id: string, object: AvatarObject): Promise<AvatarState | undefined>;
}

export class MemStorage implements IStorage {
  private avatars: Map<string, AvatarState>;

  constructor() {
    this.avatars = new Map();
  }

  async createAvatar(meshType: "hybrik" | "pifuhd"): Promise<AvatarState> {
    const avatarId = randomUUID();
    const avatar: AvatarState = {
      avatarId,
      baseMesh: {
        type: meshType,
        meshPath: null,
        originalFileName: null,
      },
      rig: {
        type: "auto-rigged",
        skeleton: "humanoid",
      },
      pose: {
        source: "preset",
        presetName: "Relaxed",
      },
      appearance: {
        outfit: null,
        textureMaps: [],
      },
      objects: [],
      createdAt: new Date().toISOString(),
    };
    this.avatars.set(avatarId, avatar);
    return avatar;
  }

  async getAvatar(id: string): Promise<AvatarState | undefined> {
    return this.avatars.get(id);
  }

  async updateMeshPath(id: string, meshPath: string, fileName: string): Promise<AvatarState | undefined> {
    const avatar = this.avatars.get(id);
    if (!avatar) return undefined;
    avatar.baseMesh.meshPath = meshPath;
    avatar.baseMesh.originalFileName = fileName;
    return avatar;
  }

  async updatePose(id: string, pose: AvatarPose): Promise<AvatarState | undefined> {
    const avatar = this.avatars.get(id);
    if (!avatar) return undefined;
    avatar.pose = pose;
    return avatar;
  }

  async updateOutfit(id: string, outfit: string | null): Promise<AvatarState | undefined> {
    const avatar = this.avatars.get(id);
    if (!avatar) return undefined;
    avatar.appearance.outfit = outfit;
    return avatar;
  }

  async addObject(id: string, object: AvatarObject): Promise<AvatarState | undefined> {
    const avatar = this.avatars.get(id);
    if (!avatar) return undefined;
    avatar.objects.push(object);
    return avatar;
  }
}

export const storage = new MemStorage();

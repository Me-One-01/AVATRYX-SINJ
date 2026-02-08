import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ThreeViewerProps {
  meshUrl?: string | null;
  className?: string;
  poseData?: Record<string, { rotation: { x: number; y: number; z: number } }>;
  outfitId?: string | null;
  onReady?: () => void;
}

export default function ThreeViewer({ meshUrl, className = "", poseData, onReady }: ThreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<number>(0);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  const createDemoMesh = useCallback(() => {
    const group = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6fc0,
      roughness: 0.4,
      metalness: 0.1,
    });

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.3, 1.0, 16),
      bodyMaterial
    );
    torso.position.y = 1.0;
    torso.name = "spine";
    group.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      bodyMaterial
    );
    head.position.y = 1.75;
    head.name = "head";
    group.add(head);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8),
      bodyMaterial
    );
    neck.position.y = 1.55;
    group.add(neck);

    const hipGeo = new THREE.CylinderGeometry(0.3, 0.28, 0.3, 16);
    const hip = new THREE.Mesh(hipGeo, bodyMaterial);
    hip.position.y = 0.4;
    group.add(hip);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8);

    const leftUpperArm = new THREE.Mesh(armGeo, bodyMaterial);
    leftUpperArm.position.set(0.5, 1.25, 0);
    leftUpperArm.rotation.z = Math.PI / 6;
    leftUpperArm.name = "leftUpperArm";
    group.add(leftUpperArm);

    const rightUpperArm = new THREE.Mesh(armGeo, bodyMaterial);
    rightUpperArm.position.set(-0.5, 1.25, 0);
    rightUpperArm.rotation.z = -Math.PI / 6;
    rightUpperArm.name = "rightUpperArm";
    group.add(rightUpperArm);

    const forearmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8);

    const leftLowerArm = new THREE.Mesh(forearmGeo, bodyMaterial);
    leftLowerArm.position.set(0.7, 0.85, 0);
    leftLowerArm.rotation.z = Math.PI / 8;
    leftLowerArm.name = "leftLowerArm";
    group.add(leftLowerArm);

    const rightLowerArm = new THREE.Mesh(forearmGeo, bodyMaterial);
    rightLowerArm.position.set(-0.7, 0.85, 0);
    rightLowerArm.rotation.z = -Math.PI / 8;
    rightLowerArm.name = "rightLowerArm";
    group.add(rightLowerArm);

    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.6, 8);

    const leftUpperLeg = new THREE.Mesh(legGeo, bodyMaterial);
    leftUpperLeg.position.set(0.15, -0.05, 0);
    leftUpperLeg.name = "leftUpperLeg";
    group.add(leftUpperLeg);

    const rightUpperLeg = new THREE.Mesh(legGeo, bodyMaterial);
    rightUpperLeg.position.set(-0.15, -0.05, 0);
    rightUpperLeg.name = "rightUpperLeg";
    group.add(rightUpperLeg);

    const lowerLegGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.55, 8);

    const leftLowerLeg = new THREE.Mesh(lowerLegGeo, bodyMaterial);
    leftLowerLeg.position.set(0.15, -0.55, 0);
    leftLowerLeg.name = "leftLowerLeg";
    group.add(leftLowerLeg);

    const rightLowerLeg = new THREE.Mesh(lowerLegGeo, bodyMaterial);
    rightLowerLeg.position.set(-0.15, -0.55, 0);
    rightLowerLeg.name = "rightLowerLeg";
    group.add(rightLowerLeg);

    const handGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, bodyMaterial);
    leftHand.position.set(0.78, 0.6, 0);
    group.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, bodyMaterial);
    rightHand.position.set(-0.78, 0.6, 0);
    group.add(rightHand);

    const footGeo = new THREE.BoxGeometry(0.1, 0.06, 0.18);
    const leftFoot = new THREE.Mesh(footGeo, bodyMaterial);
    leftFoot.position.set(0.15, -0.85, 0.04);
    group.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, bodyMaterial);
    rightFoot.position.set(-0.15, -0.85, 0.04);
    group.add(rightFoot);

    return group;
  }, []);

  const applyPose = useCallback((group: THREE.Group, pose: Record<string, { rotation: { x: number; y: number; z: number } }>) => {
    Object.entries(pose).forEach(([boneName, boneData]) => {
      const bone = group.getObjectByName(boneName);
      if (bone) {
        bone.rotation.set(boneData.rotation.x, boneData.rotation.y, boneData.rotation.z);
      }
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0.8, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x404060, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(3, 5, 3);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x8060ff, 0.4);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa080ff, 0.3);
    rimLight.position.set(0, 3, -5);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(6, 20, 0x333355, 0x222244);
    gridHelper.position.y = -0.88;
    scene.add(gridHelper);

    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (meshGroupRef.current) {
      scene.remove(meshGroupRef.current);
      meshGroupRef.current = null;
    }

    if (meshUrl) {
      if (meshUrl.endsWith(".obj")) {
        const loader = new OBJLoader();
        loader.load(
          meshUrl,
          (obj) => {
            obj.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
                  color: 0x8b6fc0,
                  roughness: 0.4,
                  metalness: 0.1,
                });
              }
            });
            scene.add(obj);
            meshGroupRef.current = obj;
            if (poseData) applyPose(obj, poseData);
            onReady?.();
          },
          undefined,
          () => {
            const demo = createDemoMesh();
            scene.add(demo);
            meshGroupRef.current = demo;
            if (poseData) applyPose(demo, poseData);
            onReady?.();
          }
        );
      } else if (meshUrl.endsWith(".glb") || meshUrl.endsWith(".gltf")) {
        const loader = new GLTFLoader();
        loader.load(
          meshUrl,
          (gltf) => {
            scene.add(gltf.scene);
            meshGroupRef.current = gltf.scene;
            if (poseData) applyPose(gltf.scene, poseData);
            onReady?.();
          },
          undefined,
          () => {
            const demo = createDemoMesh();
            scene.add(demo);
            meshGroupRef.current = demo;
            if (poseData) applyPose(demo, poseData);
            onReady?.();
          }
        );
      } else {
        const demo = createDemoMesh();
        scene.add(demo);
        meshGroupRef.current = demo;
        if (poseData) applyPose(demo, poseData);
        onReady?.();
      }
    } else {
      const demo = createDemoMesh();
      scene.add(demo);
      meshGroupRef.current = demo;
      if (poseData) applyPose(demo, poseData);
      onReady?.();
    }
  }, [meshUrl, createDemoMesh, applyPose, onReady]);

  useEffect(() => {
    if (meshGroupRef.current && poseData) {
      applyPose(meshGroupRef.current, poseData);
    }
  }, [poseData, applyPose]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      data-testid="three-viewer"
    />
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { RotateCcw, Sparkles, Layers, Box, Disc } from "lucide-react";
import { VYRA_FLAVORS } from "@/lib/constants";

interface Can3DProps {
  className?: string;
  initialFlavorId?: string;
}

export function Can3D({ className = "", initialFlavorId = "VP-CIT-001" }: Can3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFlavorId, setSelectedFlavorId] = useState(initialFlavorId);
  const [modelType, setModelType] = useState<"bottle" | "can">("bottle");
  const [rotationSpeed] = useState(0.007);
  const currentFlavor = VYRA_FLAVORS.find((f) => f.id === selectedFlavorId) || VYRA_FLAVORS[0];

  // Refs for 3D state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Helper to generate dynamic wrapper texture
  const createProductTexture = useCallback(
    (flavor: (typeof VYRA_FLAVORS)[0], type: "bottle" | "can") => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Dark carbon background with flavor gradient
      const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
      grad.addColorStop(0, "#080808");
      grad.addColorStop(0.35, "#141414");
      grad.addColorStop(0.7, flavor.accentColor);
      grad.addColorStop(1, "#060606");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Carbon cyber grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 2;
      for (let x = 0; x < 1024; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let y = 0; y < 1024; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      // High-speed diagonal racing slash
      ctx.fillStyle = flavor.accentColor;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.moveTo(220, 0);
      ctx.lineTo(460, 0);
      ctx.lineTo(260, 1024);
      ctx.lineTo(20, 1024);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Pulse waveform
      ctx.strokeStyle = flavor.accentColor;
      ctx.lineWidth = 7;
      ctx.shadowColor = flavor.accentColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(0, 680);
      ctx.bezierCurveTo(250, 610, 420, 750, 620, 660);
      ctx.bezierCurveTo(760, 600, 910, 720, 1024, 650);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Brand Typography
      ctx.save();
      ctx.translate(512, 430);
      ctx.rotate(-Math.PI / 2);

      ctx.shadowColor = flavor.accentColor;
      ctx.shadowBlur = 24;
      ctx.font = "900 86px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("VYRA", 0, -32);

      ctx.fillStyle = flavor.accentColor;
      ctx.fillText("PULSE", 0, 68);
      ctx.shadowBlur = 0;

      ctx.font = "bold 24px monospace";
      ctx.letterSpacing = "6px";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText(type === "bottle" ? "PERFORMANCE BIO-BOTTLE" : "BIO-ENHANCED NEURO FOCUS", 0, 130);

      ctx.font = "800 38px system-ui, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(flavor.name.toUpperCase().replace("VYRA PULSE ", ""), 0, 195);

      ctx.font = "600 20px monospace";
      ctx.fillStyle = flavor.accentColor;
      ctx.fillText(type === "bottle" ? "500 ML  •  ELECTROLYTE MATRIX  •  0G SUGAR" : "330 ML  •  80 MG CAFFEINE  •  ZERO SUGAR", 0, 245);

      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    },
    []
  );

  // Build the 3D geometry inside the group
  const buildGeometry = useCallback(
    (group: THREE.Group, type: "bottle" | "can", flavor: (typeof VYRA_FLAVORS)[0]) => {
      // Clear existing children
      while (group.children.length > 0) {
        const child = group.children[0] as THREE.Mesh;
        if (child.geometry) child.geometry.dispose();
        group.remove(child);
      }

      const texture = createProductTexture(flavor, type);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: type === "bottle" ? 0.65 : 0.85,
        roughness: type === "bottle" ? 0.32 : 0.26,
      });
      bodyMaterialRef.current = bodyMaterial;

      const metallicMaterial = new THREE.MeshStandardMaterial({
        color: 0xdedede,
        metalness: 0.96,
        roughness: 0.2,
      });

      const capAccentMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(flavor.accentColor),
        metalness: 0.7,
        roughness: 0.35,
      });

      if (type === "bottle") {
        // ─── 3D Bottle Geometry (Ergonomic Sports Bottle) ───────────
        const bottleRadius = 0.68;
        const mainHeight = 1.9;

        // 1. Main Bottle Body
        const bodyGeo = new THREE.CylinderGeometry(bottleRadius, bottleRadius * 0.95, mainHeight, 64, 1, true);
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
        bodyMesh.position.y = -0.2;
        group.add(bodyMesh);

        // 2. Ergonomic Grip Torus Rings
        [-0.4, -0.1, 0.2].forEach((posY) => {
          const gripGeo = new THREE.TorusGeometry(bottleRadius * 0.98, 0.02, 16, 48);
          gripGeo.rotateX(Math.PI / 2);
          const gripMesh = new THREE.Mesh(gripGeo, capAccentMaterial);
          gripMesh.position.y = posY - 0.2;
          group.add(gripMesh);
        });

        // 3. Tapered Bottle Shoulder
        const shoulderHeight = 0.65;
        const neckRadius = 0.32;
        const shoulderGeo = new THREE.CylinderGeometry(neckRadius, bottleRadius, shoulderHeight, 64, 1, true);
        const shoulderMesh = new THREE.Mesh(shoulderGeo, metallicMaterial);
        shoulderMesh.position.y = -0.2 + mainHeight / 2 + shoulderHeight / 2;
        group.add(shoulderMesh);

        // 4. Bottle Neck
        const neckHeight = 0.45;
        const neckGeo = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 64, 1);
        const neckMesh = new THREE.Mesh(neckGeo, metallicMaterial);
        neckMesh.position.y = -0.2 + mainHeight / 2 + shoulderHeight + neckHeight / 2;
        group.add(neckMesh);

        // 5. Sports Screw Cap
        const capHeight = 0.25;
        const capRadius = 0.35;
        const capGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 64);
        const capMesh = new THREE.Mesh(capGeo, capAccentMaterial);
        capMesh.position.y = -0.2 + mainHeight / 2 + shoulderHeight + neckHeight + capHeight / 2;
        group.add(capMesh);

        // 6. Push-Pull Spout Nozzle
        const spoutHeight = 0.18;
        const spoutRadius = 0.16;
        const spoutGeo = new THREE.CylinderGeometry(spoutRadius, spoutRadius, spoutHeight, 32);
        const spoutMesh = new THREE.Mesh(spoutGeo, metallicMaterial);
        spoutMesh.position.y = -0.2 + mainHeight / 2 + shoulderHeight + neckHeight + capHeight + spoutHeight / 2;
        group.add(spoutMesh);

        // 7. Base Cap
        const baseGeo = new THREE.CylinderGeometry(bottleRadius * 0.95, bottleRadius * 0.9, 0.06, 64);
        const baseMesh = new THREE.Mesh(baseGeo, metallicMaterial);
        baseMesh.position.y = -0.2 - mainHeight / 2 - 0.03;
        group.add(baseMesh);
      } else {
        // ─── 3D Can Geometry (330ml Aluminum Can) ────────────────────
        const canHeight = 2.4;
        const canRadius = 0.72;

        // 1. Can Cylinder Body
        const bodyGeo = new THREE.CylinderGeometry(canRadius, canRadius, canHeight, 64, 1, true);
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
        group.add(bodyMesh);

        // 2. Top Taper
        const topTaperHeight = 0.16;
        const topTaperRadius = 0.65;
        const topTaperGeo = new THREE.CylinderGeometry(topTaperRadius, canRadius, topTaperHeight, 64, 1, true);
        const topTaperMesh = new THREE.Mesh(topTaperGeo, metallicMaterial);
        topTaperMesh.position.y = canHeight / 2 + topTaperHeight / 2;
        group.add(topTaperMesh);

        // 3. Top Aluminum Rim / Chime
        const rimGeo = new THREE.TorusGeometry(topTaperRadius, 0.035, 24, 64);
        rimGeo.rotateX(Math.PI / 2);
        const rimMesh = new THREE.Mesh(rimGeo, metallicMaterial);
        rimMesh.position.y = canHeight / 2 + topTaperHeight;
        group.add(rimMesh);

        // 4. Top Lid Disk
        const topLidGeo = new THREE.CylinderGeometry(topTaperRadius - 0.02, topTaperRadius - 0.02, 0.02, 64);
        const topLidMesh = new THREE.Mesh(topLidGeo, metallicMaterial);
        topLidMesh.position.y = canHeight / 2 + topTaperHeight - 0.01;
        group.add(topLidMesh);

        // 5. Silver Pull Tab
        const tabGeo = new THREE.BoxGeometry(0.18, 0.015, 0.35);
        const tabMesh = new THREE.Mesh(tabGeo, metallicMaterial);
        tabMesh.position.set(0, canHeight / 2 + topTaperHeight + 0.01, 0.15);
        tabMesh.rotation.x = -0.05;
        group.add(tabMesh);

        // 6. Bottom Taper
        const bottomTaperHeight = 0.14;
        const bottomRadius = 0.62;
        const bottomTaperGeo = new THREE.CylinderGeometry(canRadius, bottomRadius, bottomTaperHeight, 64, 1, true);
        const bottomTaperMesh = new THREE.Mesh(bottomTaperGeo, metallicMaterial);
        bottomTaperMesh.position.y = -canHeight / 2 - bottomTaperHeight / 2;
        group.add(bottomTaperMesh);

        // 7. Bottom Base Cap
        const bottomCapGeo = new THREE.CylinderGeometry(bottomRadius, bottomRadius, 0.03, 64);
        const bottomCapMesh = new THREE.Mesh(bottomCapGeo, metallicMaterial);
        bottomCapMesh.position.y = -canHeight / 2 - bottomTaperHeight;
        group.add(bottomCapMesh);
      }
    },
    [createProductTexture]
  );

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.1, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const glowLight = new THREE.PointLight(currentFlavor.accentColor, 3.8, 8);
    glowLight.position.set(0, -0.4, 2.2);
    scene.add(glowLight);
    glowLightRef.current = glowLight;

    // Model Group
    const group = new THREE.Group();
    group.rotation.x = 0.14;
    group.rotation.y = 0.45;
    group.rotation.z = -0.05;
    modelGroupRef.current = group;
    scene.add(group);

    // Initial Geometry
    buildGeometry(group, modelType, currentFlavor);

    // Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (modelGroupRef.current) {
        modelGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.07;
        if (!isDraggingRef.current) {
          modelGroupRef.current.rotation.y += rotationSpeed;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse & Touch Drag Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !modelGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      modelGroupRef.current.rotation.y += deltaX * 0.008;
      modelGroupRef.current.rotation.x += deltaY * 0.008;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !modelGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      modelGroupRef.current.rotation.y += deltaX * 0.008;
      modelGroupRef.current.rotation.x += deltaY * 0.008;

      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domElement.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("resize", handleResize);

      scene.clear();
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-build geometry on modelType change or flavor update
  useEffect(() => {
    if (modelGroupRef.current) {
      buildGeometry(modelGroupRef.current, modelType, currentFlavor);
    }
    if (glowLightRef.current) {
      glowLightRef.current.color = new THREE.Color(currentFlavor.accentColor);
    }
  }, [modelType, currentFlavor, buildGeometry]);

  const handleResetAngle = () => {
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.x = 0.14;
      modelGroupRef.current.rotation.y = 0.45;
      modelGroupRef.current.rotation.z = -0.05;
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-[380px] sm:h-[460px] md:h-[520px] cursor-grab active:cursor-grabbing relative flex items-center justify-center touch-none"
      />

      {/* Top Floating Badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-[#00FF66] animate-pulse" />
        <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-300 font-semibold">
          Interactive 3D {modelType === "bottle" ? "Bottle" : "Can"} • Drag To Rotate
        </span>
      </div>

      {/* Model Type Switcher (3D Bottle vs 3D Can) & Reset */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-black/70 border border-white/15 rounded-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setModelType("bottle")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              modelType === "bottle"
                ? "bg-[#00FF66] text-black shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            3D Bottle
          </button>
          <button
            type="button"
            onClick={() => setModelType("can")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              modelType === "can"
                ? "bg-[#00FF66] text-black shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            3D Can
          </button>
        </div>

        <button
          onClick={handleResetAngle}
          type="button"
          title="Reset Angle"
          className="p-2 rounded-xl bg-black/70 border border-white/15 backdrop-blur-md text-muted-foreground hover:text-[#00FF66] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Flavor Selector Strip */}
      <div className="w-full max-w-xl mx-auto px-4 z-20 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
              style={{ backgroundColor: currentFlavor.accentColor }}
            />
            {currentFlavor.name}
          </span>
          <span className="text-[10px] font-mono">
            {modelType === "bottle" ? "500ml Bottle • ₹199" : "330ml Can • ₹149"}
          </span>
        </div>

        {/* 8 Flavor Chips */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar">
          {VYRA_FLAVORS.map((flavor) => {
            const isSelected = flavor.id === selectedFlavorId;
            return (
              <button
                key={flavor.id}
                onClick={() => setSelectedFlavorId(flavor.id)}
                type="button"
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border flex items-center gap-2 ${
                  isSelected
                    ? "bg-white/10 border-white text-foreground shadow-lg scale-105"
                    : "bg-surface/50 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/30"
                }`}
                style={{
                  borderColor: isSelected ? flavor.accentColor : undefined,
                  boxShadow: isSelected ? `0 0 16px -2px ${flavor.accentColor}55` : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: flavor.accentColor }}
                />
                <span className="text-[11px]">{flavor.flavor.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

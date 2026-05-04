"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Heart3DProps {
  /** Optional uniform scale applied on top of the heartbeat animation. */
  scale?: number;
  /** Surface color of the heart. */
  color?: string;
  /** Emissive base color used for the inner glow. */
  emissive?: string;
}

type PointTuple = [number, number, number];

const createTubeGeometry = (path: PointTuple[], radius: number, tubularSegments = 80) =>
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(path.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    tubularSegments,
    radius,
    12,
    false
  );

/**
 * Procedural glossy 3D heart for the landing hero.
 *
 * Single responsibility: render one professional-looking beating heart. Scene
 * composition, camera, lights and canvas configuration live in Hero3DScene.
 */
export function Heart3D({ scale = 1, color = "#e15c5c", emissive = "#5c1414" }: Heart3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const geometries = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const samples = 220;

    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * Math.PI * 2;
      points.push(
        new THREE.Vector2(
          16 * Math.pow(Math.sin(t), 3),
          13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
        )
      );
    }

    const heartShape = new THREE.Shape(points);
    const body = new THREE.ExtrudeGeometry(heartShape, {
      depth: 8,
      bevelEnabled: true,
      bevelSegments: 24,
      bevelSize: 2.2,
      bevelThickness: 2.1,
      curveSegments: 128,
      steps: 2,
    });
    body.center();
    body.computeVertexNormals();

    const inner = body.clone();
    inner.scale(0.82, 0.82, 0.92);
    inner.computeVertexNormals();

    const outlineCurve = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(point.x, point.y, 5.35)),
      true,
      "catmullrom",
      0.45
    );

    return {
      body,
      inner,
      outline: new THREE.TubeGeometry(outlineCurve, 260, 0.18, 10, true),
      vessels: [
        createTubeGeometry(
          [
            [-2.4, 11.5, 4.7],
            [-5.7, 15.2, 4.4],
            [-7.6, 19.2, 3.8],
            [-5.4, 22.5, 3.1],
          ],
          0.58
        ),
        createTubeGeometry(
          [
            [2.2, 11.7, 4.9],
            [5.5, 15.1, 4.5],
            [7.4, 19.3, 3.9],
            [5.3, 22.7, 3.2],
          ],
          0.58
        ),
        createTubeGeometry(
          [
            [0.2, 10.6, 5.2],
            [0.6, 15.4, 5.7],
            [2.7, 19.2, 5.3],
            [4.8, 21.6, 4.4],
          ],
          0.4
        ),
        createTubeGeometry(
          [
            [-6.1, 2.8, 5.7],
            [-3.4, -1.1, 6.0],
            [-1.4, -5.2, 6.1],
            [-0.7, -10.8, 5.7],
          ],
          0.23
        ),
        createTubeGeometry(
          [
            [6.4, 2.4, 5.7],
            [3.2, -1.7, 6.0],
            [1.6, -5.8, 6.1],
            [0.8, -10.9, 5.7],
          ],
          0.23
        ),
      ],
      ecg: createTubeGeometry(
        [
          [-17, -1.2, 6.45],
          [-9, -1.2, 6.45],
          [-7.2, 2.0, 6.55],
          [-5.7, -5.0, 6.62],
          [-3.8, 6.3, 6.72],
          [-1.8, -3.4, 6.62],
          [0.5, -1.2, 6.5],
          [4.0, -1.2, 6.45],
          [6.6, 2.0, 6.55],
          [8.4, -1.2, 6.45],
          [17, -1.2, 6.45],
        ],
        0.13,
        120
      ),
    };
  }, []);

  const materials = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({
        color,
        emissive,
        emissiveIntensity: 0.33,
        roughness: 0.18,
        metalness: 0.08,
        clearcoat: 0.85,
        clearcoatRoughness: 0.16,
        sheen: 0.45,
        sheenColor: new THREE.Color("#ffd4d4"),
      }),
      inner: new THREE.MeshPhysicalMaterial({
        color: "#8f232a",
        emissive: "#3f0508",
        emissiveIntensity: 0.42,
        roughness: 0.22,
        metalness: 0.08,
        clearcoat: 0.72,
        clearcoatRoughness: 0.2,
        transparent: true,
        opacity: 0.52,
      }),
      vessel: new THREE.MeshPhysicalMaterial({
        color: "#b82434",
        emissive: "#7b1018",
        emissiveIntensity: 0.35,
        roughness: 0.24,
        metalness: 0.05,
        clearcoat: 0.55,
      }),
      outline: new THREE.MeshBasicMaterial({
        color: "#ff9aa4",
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      }),
      ecg: new THREE.MeshBasicMaterial({
        color: "#fff1f1",
        transparent: true,
        opacity: 0.92,
      }),
    }),
    [color, emissive]
  );

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const t = state.clock.elapsedTime;
    const cycle = t % 1.4;
    const lub = Math.exp(-Math.pow(cycle / 0.12, 2));
    const dub = Math.exp(-Math.pow((cycle - 0.32) / 0.14, 2));
    const pulse = 1 + 0.085 * (lub + dub * 0.65);

    group.scale.set(pulse * scale, pulse * scale, pulse * scale);
    group.rotation.y = -0.38 + Math.sin(t * 0.34) * 0.18;
    group.rotation.x = 0.1 + Math.cos(t * 0.42) * 0.055;
    group.rotation.z = Math.sin(t * 0.25) * 0.035;
  });

  return (
    <group ref={groupRef} rotation={[0.1, -0.38, 0]} scale={scale}>
      <mesh geometry={geometries.body} material={materials.body} castShadow receiveShadow />
      <mesh
        geometry={geometries.inner}
        material={materials.inner}
        position={[0, -0.3, 0.42]}
        castShadow
      />
      <mesh geometry={geometries.outline} material={materials.outline} />
      {geometries.vessels.map((geometry, index) => (
        <mesh
          key={index}
          geometry={geometry}
          material={materials.vessel}
          castShadow
          receiveShadow
        />
      ))}
      <mesh geometry={geometries.ecg} material={materials.ecg} />
    </group>
  );
}

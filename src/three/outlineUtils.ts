import * as THREE from 'three';

export const OUTLINE_COLOR = 0x432b1d;

let sharedGradientMap: THREE.DataTexture | null = null;
let sharedOutlineMat: THREE.MeshBasicMaterial | null = null;

export function getToonGradientMap(): THREE.DataTexture {
  if (!sharedGradientMap) {
    // 4-band soft pastel cel-shading ramp: warm bright shadow -> mid -> lit -> highlight
    const ramp = new Uint8Array([175, 215, 245, 255]);
    sharedGradientMap = new THREE.DataTexture(ramp, 4, 1, THREE.RedFormat);
    sharedGradientMap.minFilter = THREE.NearestFilter;
    sharedGradientMap.magFilter = THREE.NearestFilter;
    sharedGradientMap.generateMipmaps = false;
    sharedGradientMap.needsUpdate = true;
  }
  return sharedGradientMap;
}

export function createCelMaterial(
  color: number | string,
  options: { emissive?: number; emissiveIntensity?: number } = {},
): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradientMap(),
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

export function getSharedOutlineMaterial(): THREE.MeshBasicMaterial {
  if (!sharedOutlineMat) {
    sharedOutlineMat = new THREE.MeshBasicMaterial({
      color: OUTLINE_COLOR,
      side: THREE.BackSide,
    });
  }
  return sharedOutlineMat;
}

/**
 * Generates an inverted-hull outline geometry by averaging normals across shared
 * vertex positions so even hard-edged cylinders/extrudes have seamless borders.
 */
export function createSmoothOutlineGeometry(
  source: THREE.BufferGeometry,
  thickness = 0.048,
): THREE.BufferGeometry {
  const geo = source.clone();
  if (!geo.attributes.normal) {
    geo.computeVertexNormals();
  }

  const posAttr = geo.attributes.position;
  const normAttr = geo.attributes.normal;
  const count = posAttr.count;

  const accumNormals = new Map<string, THREE.Vector3>();
  const keys = new Array<string>(count);

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const key = `${Math.round(x * 2000)}_${Math.round(y * 2000)}_${Math.round(z * 2000)}`;
    keys[i] = key;

    let acc = accumNormals.get(key);
    if (!acc) {
      acc = new THREE.Vector3();
      accumNormals.set(key, acc);
    }
    acc.x += normAttr.getX(i);
    acc.y += normAttr.getY(i);
    acc.z += normAttr.getZ(i);
  }

  for (const vec of accumNormals.values()) {
    if (vec.lengthSq() > 1e-8) {
      vec.normalize();
    } else {
      vec.set(0, 1, 0);
    }
  }

  for (let i = 0; i < count; i++) {
    const n = accumNormals.get(keys[i])!;
    posAttr.setXYZ(
      i,
      posAttr.getX(i) + n.x * thickness,
      posAttr.getY(i) + n.y * thickness,
      posAttr.getZ(i) + n.z * thickness,
    );
  }

  posAttr.needsUpdate = true;
  return geo;
}

/**
 * Creates a Mesh wrapped in a Group alongside its crisp BackSide ink outline.
 * Geometry should already be pre-scaled to its final proportions so border width stays uniform.
 */
export function createOutlinedPart(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  outlineThickness = 0.048,
  options: { castShadow?: boolean; receiveShadow?: boolean } = {},
): THREE.Group {
  const group = new THREE.Group();

  const mainMesh = new THREE.Mesh(geometry, material);
  mainMesh.castShadow = options.castShadow ?? true;
  mainMesh.receiveShadow = options.receiveShadow ?? true;
  group.add(mainMesh);

  if (outlineThickness > 0) {
    const outlineGeo = createSmoothOutlineGeometry(geometry, outlineThickness);
    const outlineMesh = new THREE.Mesh(outlineGeo, getSharedOutlineMaterial());
    outlineMesh.castShadow = false;
    outlineMesh.receiveShadow = false;
    group.add(outlineMesh);
  }

  return group;
}

export function disposeObject3D(root: THREE.Object3D) {
  const disposedGeos = new Set<THREE.BufferGeometry>();
  const disposedMats = new Set<THREE.Material>();

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry && !disposedGeos.has(obj.geometry)) {
        disposedGeos.add(obj.geometry);
        obj.geometry.dispose();
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m && m !== sharedOutlineMat && !disposedMats.has(m)) {
          disposedMats.add(m);
          m.dispose();
        }
      }
    }
  });
}

import * as THREE from 'three';
import { CarpetId } from '../types/game';
import { OUTLINE_COLOR, createCelMaterial, createOutlinedPart } from './outlineUtils';

export interface EnvironmentRig {
  clouds: { group: THREE.Group; speed: number; baseY: number; phase: number }[];
  flowers: THREE.Group[];
  spotlightRing: THREE.Mesh;
  picnicSpot: THREE.Vector3;
  setCarpetPattern: (carpetId: CarpetId) => void;
  update: (dt: number, elapsed: number, feverActive: boolean) => void;
}

function createCheckeredBlanketTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const size = 32;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const even = (x + y) % 2 === 0;
      ctx.fillStyle = even ? '#FFF8F3' : '#F88394';
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
  // Subtle espresso border frame
  ctx.strokeStyle = '#432B1D';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 248);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSkyGradientTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#FFD6E2');
  grad.addColorStop(0.48, '#FFEBF0');
  grad.addColorStop(1, '#FFF7F4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildOutlinedTree(scale = 1): THREE.Group {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 1.3 * scale, 12);
  const trunk = createOutlinedPart(trunkGeo, createCelMaterial(0xa77452), 0.04);
  trunk.position.y = 0.65 * scale;
  tree.add(trunk);

  const canopyMat = createCelMaterial(0x7ccf78);
  const puffs: [number, number, number, number][] = [
    [0, 1.55 * scale, 0, 0.72 * scale],
    [-0.45 * scale, 1.32 * scale, 0.08 * scale, 0.52 * scale],
    [0.45 * scale, 1.32 * scale, -0.06 * scale, 0.52 * scale],
  ];
  for (const [px, py, pz, r] of puffs) {
    const puffGeo = new THREE.SphereGeometry(r, 18, 14);
    const puff = createOutlinedPart(puffGeo, canopyMat, 0.045);
    puff.position.set(px, py, pz);
    tree.add(puff);
  }

  return tree;
}

function buildOutlinedCloud(scale = 1): THREE.Group {
  const cloud = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 0.52 * scale],
    [-0.46 * scale, -0.1 * scale, 0, 0.38 * scale],
    [0.46 * scale, -0.12 * scale, 0, 0.4 * scale],
    [0.18 * scale, 0.22 * scale, 0.05 * scale, 0.34 * scale],
  ];
  for (const [px, py, pz, r] of puffs) {
    const geo = new THREE.SphereGeometry(r, 14, 12);
    geo.scale(1.15, 0.85, 0.7);
    const part = createOutlinedPart(geo, mat, 0.032, {
      castShadow: false,
      receiveShadow: false,
    });
    part.position.set(px, py, pz);
    cloud.add(part);
  }
  return cloud;
}

function buildCuteFlower(petalColor: number): THREE.Group {
  const f = new THREE.Group();
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd166 }),
  );
  center.position.y = 0.22;
  f.add(center);

  const petalMat = createCelMaterial(petalColor);
  const petalGeo = new THREE.SphereGeometry(0.085, 8, 8);
  petalGeo.scale(1.1, 0.55, 1.1);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = new THREE.Mesh(petalGeo, petalMat);
    p.position.set(Math.cos(a) * 0.14, 0.21, Math.sin(a) * 0.14);
    f.add(p);
  }

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6),
    new THREE.MeshBasicMaterial({ color: 0x5ab866 }),
  );
  stem.position.y = 0.11;
  f.add(stem);

  return f;
}

export function buildEnvironment(
  scene: THREE.Scene,
  isSoftwareGl: boolean,
): EnvironmentRig {
  // Sky backdrop & matching fog
  scene.background = new THREE.Color(0xffe8ec);
  scene.fog = new THREE.Fog(0xffe8ec, 24, 52);

  const skyGeo = new THREE.PlaneGeometry(80, 42);
  const skyMat = new THREE.MeshBasicMaterial({
    map: createSkyGradientTexture(),
    depthWrite: false,
  });
  const skyBackdrop = new THREE.Mesh(skyGeo, skyMat);
  skyBackdrop.position.set(0, 12, -20);
  scene.add(skyBackdrop);

  // 3-Point Pastel Studio Lighting
  const hemiLight = new THREE.HemisphereLight(0xfff0f5, 0x8fd694, 0.92);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.35);
  keyLight.position.set(7, 14, 10);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 36;
  keyLight.shadow.camera.left = -12;
  keyLight.shadow.camera.right = 12;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -12;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffe2ec, 0.5);
  rimLight.position.set(-6, 8, -8);
  scene.add(rimLight);

  // Ground meadow plane
  const groundGeo = new THREE.PlaneGeometry(90, 50);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = createCelMaterial(0xa9e09b);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // Playable soft cream/sand picnic lane (offset Y=0.006 to avoid Z-fighting)
  const laneGeo = new THREE.BoxGeometry(15.6, 0.06, 2.8);
  const laneMat = createCelMaterial(0xf7ebd9);
  const lane = new THREE.Mesh(laneGeo, laneMat);
  lane.position.set(0, -0.015, 0);
  lane.receiveShadow = true;
  scene.add(lane);

  // Equippable Karpet Pola overlay on top of the playable stage
  const carpetGeo = new THREE.PlaneGeometry(15.3, 2.55);
  carpetGeo.rotateX(-Math.PI / 2);
  const carpetMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const carpetMesh = new THREE.Mesh(carpetGeo, carpetMat);
  carpetMesh.position.set(0, 0.017, 0);
  carpetMesh.visible = false;
  scene.add(carpetMesh);

  let activeCarpetTex: THREE.CanvasTexture | null = null;
  const setCarpetPattern = (carpetId: CarpetId) => {
    if (activeCarpetTex) {
      activeCarpetTex.dispose();
      activeCarpetTex = null;
    }
    if (carpetId === 'default') {
      carpetMesh.visible = false;
      carpetMat.map = null;
      carpetMat.opacity = 0;
      carpetMat.needsUpdate = true;
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    if (carpetId === 'carpet_checker') {
      const cell = 32;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 24; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#FFF8F3' : '#F88394';
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    } else if (carpetId === 'carpet_polka') {
      ctx.fillStyle = '#B7EED3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const colors = ['#FFF6CC', '#FF9EB5', '#FFFFFF'];
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 24; col++) {
          ctx.fillStyle = colors[(row + col) % colors.length];
          ctx.beginPath();
          ctx.arc(
            col * 32 + (row % 2 === 0 ? 16 : 0),
            row * 32 + 16,
            7,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    } else if (carpetId === 'carpet_stars') {
      ctx.fillStyle = '#EAD8FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFD166';
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 18; col++) {
          const cx = col * 44 + (row % 2 === 0 ? 22 : 6);
          const cy = row * 40 + 24;
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const aOuter = (s * 2 * Math.PI) / 5 - Math.PI / 2;
            const aInner = aOuter + Math.PI / 5;
            const ox = cx + Math.cos(aOuter) * 9;
            const oy = cy + Math.sin(aOuter) * 9;
            const ix = cx + Math.cos(aInner) * 4;
            const iy = cy + Math.sin(aInner) * 4;
            if (s === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            ctx.lineTo(ix, iy);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Crisp espresso stitched border around the patterned carpet
    ctx.strokeStyle = '#432B1D';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    activeCarpetTex = tex;
    carpetMat.map = tex;
    carpetMat.opacity = 1;
    carpetMat.needsUpdate = true;
    carpetMesh.visible = true;
  };

  // Crisp espresso border trim along front edge of playable lane
  const laneRimGeo = new THREE.BoxGeometry(15.72, 0.075, 0.09);
  const laneRim = new THREE.Mesh(
    laneRimGeo,
    new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR }),
  );
  laneRim.position.set(0, -0.01, 1.42);
  scene.add(laneRim);

  // Cute wooden stage posts marking left & right playable edges
  const postMat = createCelMaterial(0xb88660);
  for (const side of [-1, 1]) {
    const postGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.85, 12);
    const post = createOutlinedPart(postGeo, postMat, 0.035);
    post.position.set(side * 7.85, 0.42, 0);
    scene.add(post);

    const capGeo = new THREE.SphereGeometry(0.2, 12, 10);
    const cap = createOutlinedPart(capGeo, createCelMaterial(0xffb5c2), 0.035);
    cap.position.set(side * 7.85, 0.9, 0);
    scene.add(cap);
  }

  // Rolling 2.5D pastel background hills
  const hillConfigs: [number, number, number, number, number][] = [
    [-9.5, -1.6, -8.5, 6.2, 0x8fd689],
    [8.8, -1.8, -9.2, 6.8, 0x8fd689],
    [0.5, -2.5, -12.5, 9.5, 0x7ec97a],
  ];
  for (const [hx, hy, hz, hr, hcol] of hillConfigs) {
    const hillGeo = new THREE.SphereGeometry(hr, 28, 18);
    hillGeo.scale(1.5, 0.58, 0.8);
    const hill = createOutlinedPart(hillGeo, createCelMaterial(hcol), 0.06, {
      castShadow: false,
      receiveShadow: true,
    });
    hill.position.set(hx, hy, hz);
    scene.add(hill);
  }

  // Outlined trees framing the meadow
  const treePositions: [number, number, number][] = [
    [-9.4, -3.5, 1.18],
    [-6.6, -6.2, 0.95],
    [9.2, -3.8, 1.15],
    [6.4, -6.0, 0.92],
  ];
  for (const [tx, tz, ts] of treePositions) {
    const tree = buildOutlinedTree(ts);
    tree.position.set(tx, 0, tz);
    scene.add(tree);
  }

  // Checkered picnic blanket in background-right where partner cheers!
  const blanketGeo = new THREE.PlaneGeometry(3.2, 2.3);
  blanketGeo.rotateX(-Math.PI / 2);
  const blanketMat = new THREE.MeshBasicMaterial({
    map: createCheckeredBlanketTexture(),
  });
  const blanket = new THREE.Mesh(blanketGeo, blanketMat);
  blanket.position.set(5.2, 0.02, -3.3);
  blanket.rotation.y = -0.18;
  scene.add(blanket);

  // Cute picnic basket on the blanket
  const basketGeo = new THREE.BoxGeometry(0.75, 0.48, 0.54);
  const basket = createOutlinedPart(basketGeo, createCelMaterial(0xd49a6a), 0.035);
  basket.position.set(6.05, 0.24, -3.55);
  basket.rotation.y = -0.25;
  scene.add(basket);

  // Flowers scattered around edges
  const flowers: THREE.Group[] = [];
  const flowerSpots: [number, number, number][] = [
    [-6.2, 1.8, 0xff8fab],
    [-4.8, -2.4, 0xffd166],
    [-8.2, 0.9, 0xffffff],
    [3.8, -2.2, 0xff8fab],
    [7.1, 1.6, 0xffe066],
    [8.3, -1.2, 0xffa6c1],
  ];
  for (const [fx, fz, col] of flowerSpots) {
    const flower = buildCuteFlower(col);
    flower.position.set(fx, 0, fz);
    scene.add(flower);
    flowers.push(flower);
  }

  // Fluffy outlined clouds drifting across the sky
  const clouds: EnvironmentRig['clouds'] = [];
  const cloudSpots: [number, number, number, number, number][] = [
    [-9.5, 7.6, -8.5, 1.15, 0.42],
    [-3.2, 8.8, -11.0, 1.35, 0.28],
    [3.8, 7.8, -9.0, 1.05, 0.36],
    [9.8, 8.5, -10.5, 1.25, 0.32],
    [-12.5, 6.2, -12.0, 0.95, 0.24],
  ];
  for (let i = 0; i < cloudSpots.length; i++) {
    const [cx, cy, cz, cs, speed] = cloudSpots[i];
    const group = buildOutlinedCloud(cs);
    group.position.set(cx, cy, cz);
    scene.add(group);
    clouds.push({ group, speed, baseY: cy, phase: i * 1.3 });
  }

  // Spotlight pedestal ring for Character Selection Menu
  const ringGeo = new THREE.RingGeometry(0.95, 1.22, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const spotlightRing = new THREE.Mesh(ringGeo, ringMat);
  spotlightRing.position.set(-1.35, 0.03, 0.5);
  scene.add(spotlightRing);

  const feverBgColor = new THREE.Color(0xfff1c9);
  const normalBgColor = new THREE.Color(0xffe8ec);

  const update = (dt: number, elapsed: number, feverActive: boolean) => {
    for (const c of clouds) {
      c.group.position.x += c.speed * dt;
      c.group.position.y = c.baseY + Math.sin(elapsed * 0.9 + c.phase) * 0.14;
      if (c.group.position.x > 16) {
        c.group.position.x = -16;
      }
    }

    for (let i = 0; i < flowers.length; i++) {
      flowers[i].rotation.z = Math.sin(elapsed * 2.1 + i) * 0.08;
    }

    // Subtle warm golden glow shift during Fever Mode
    const targetBg = feverActive ? feverBgColor : normalBgColor;
    (scene.background as THREE.Color).lerp(targetBg, Math.min(1, dt * 4));
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(scene.background as THREE.Color);
    }
  };

  return {
    clouds,
    flowers,
    spotlightRing,
    picnicSpot: new THREE.Vector3(5.0, 0, -3.1),
    setCarpetPattern,
    update,
  };
}

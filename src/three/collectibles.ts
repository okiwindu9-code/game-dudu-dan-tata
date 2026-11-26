import * as THREE from 'three';
import { CollectibleType } from '../types/game';
import { OUTLINE_COLOR, createCelMaterial, createOutlinedPart } from './outlineUtils';

export interface CollectibleMetadata {
  type: CollectibleType;
  label: string;
  points: number;
  bonusTime: number;
  color: number;
  radius: number;
  isHazard: boolean;
  isRare: boolean;
}

export const COLLECTIBLE_INFO: Record<CollectibleType, CollectibleMetadata> = {
  strawberry: {
    type: 'strawberry',
    label: 'Stroberi',
    points: 10,
    bonusTime: 0,
    color: 0xff5a6e,
    radius: 0.45,
    isHazard: false,
    isRare: false,
  },
  peach: {
    type: 'peach',
    label: 'Persik Manis',
    points: 15,
    bonusTime: 0,
    color: 0xff9f68,
    radius: 0.46,
    isHazard: false,
    isRare: false,
  },
  watermelon: {
    type: 'watermelon',
    label: 'Semangka',
    points: 25,
    bonusTime: 0,
    color: 0xff6b7a,
    radius: 0.5,
    isHazard: false,
    isRare: false,
  },
  donut: {
    type: 'donut',
    label: 'Donat Krim',
    points: 35,
    bonusTime: 0,
    color: 0xff8fb1,
    radius: 0.5,
    isHazard: false,
    isRare: false,
  },
  boba: {
    type: 'boba',
    label: 'Boba Susu',
    points: 50,
    bonusTime: 0,
    color: 0xf7cb77,
    radius: 0.52,
    isHazard: false,
    isRare: true,
  },
  clock: {
    type: 'clock',
    label: 'Waktu Ekstra',
    points: 20,
    bonusTime: 5,
    color: 0xffe066,
    radius: 0.5,
    isHazard: false,
    isRare: true,
  },
  bomb: {
    type: 'bomb',
    label: 'Bom Gosong',
    points: -15,
    bonusTime: 0,
    color: 0x5c4d4d,
    radius: 0.48,
    isHazard: true,
    isRare: false,
  },
};

function buildStrawberryPrototype(): THREE.Group {
  const g = new THREE.Group();
  const berryGeo = new THREE.SphereGeometry(0.36, 20, 16);
  berryGeo.scale(0.95, 1.15, 0.9);
  const berryMat = createCelMaterial(0xff5268);
  g.add(createOutlinedPart(berryGeo, berryMat, 0.04));

  // Green leafy crown
  const leafMat = createCelMaterial(0x5ec975);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + 0.3;
    const leafGeo = new THREE.SphereGeometry(0.14, 10, 8);
    leafGeo.scale(1.4, 0.35, 0.8);
    const leaf = createOutlinedPart(leafGeo, leafMat, 0.025);
    leaf.position.set(Math.cos(angle) * 0.14, 0.36, Math.sin(angle) * 0.14);
    leaf.rotation.y = -angle;
    leaf.rotation.z = -0.25;
    g.add(leaf);
  }

  // Cute seed speckles
  const seedGeo = new THREE.SphereGeometry(0.032, 6, 6);
  const seedMat = new THREE.MeshBasicMaterial({ color: 0xffe896 });
  const seedOffsets: [number, number, number][] = [
    [-0.14, 0.08, 0.29],
    [0.14, 0.08, 0.29],
    [0, -0.05, 0.32],
    [-0.12, -0.18, 0.25],
    [0.12, -0.18, 0.25],
  ];
  for (const [sx, sy, sz] of seedOffsets) {
    const s = new THREE.Mesh(seedGeo, seedMat);
    s.position.set(sx, sy, sz);
    g.add(s);
  }
  return g;
}

function buildPeachPrototype(): THREE.Group {
  const g = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(0.38, 22, 16);
  bodyGeo.scale(1.06, 0.96, 0.96);
  const bodyMat = createCelMaterial(0xff9b6a);
  g.add(createOutlinedPart(bodyGeo, bodyMat, 0.04));

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.18, 8);
  const stem = createOutlinedPart(stemGeo, createCelMaterial(0x7c5338), 0.02);
  stem.position.set(0, 0.4, 0);
  g.add(stem);

  // Leaf
  const leafGeo = new THREE.SphereGeometry(0.15, 10, 8);
  leafGeo.scale(1.4, 0.45, 0.7);
  const leaf = createOutlinedPart(leafGeo, createCelMaterial(0x6bd47f), 0.025);
  leaf.position.set(0.16, 0.43, 0.03);
  leaf.rotation.z = 0.4;
  g.add(leaf);

  return g;
}

function buildWatermelonPrototype(): THREE.Group {
  const g = new THREE.Group();

  // Wedge triangle profile
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.38);
  shape.lineTo(-0.38, -0.24);
  shape.quadraticCurveTo(0, -0.38, 0.38, -0.24);
  shape.closePath();

  const fleshGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  fleshGeo.center();
  const flesh = createOutlinedPart(fleshGeo, createCelMaterial(0xff5e72), 0.04);
  g.add(flesh);

  // Green rind bottom arc
  const rindGeo = new THREE.BoxGeometry(0.74, 0.12, 0.34);
  const rind = createOutlinedPart(rindGeo, createCelMaterial(0x52c46d), 0.03);
  rind.position.set(0, -0.26, 0);
  g.add(rind);

  // Seeds
  const seedGeo = new THREE.SphereGeometry(0.032, 6, 6);
  seedGeo.scale(0.8, 1.3, 0.6);
  const seedMat = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR });
  for (const [sx, sy] of [
    [-0.12, 0.0],
    [0.12, 0.0],
    [0, 0.14],
  ]) {
    const s1 = new THREE.Mesh(seedGeo, seedMat);
    s1.position.set(sx, sy, 0.165);
    const s2 = new THREE.Mesh(seedGeo, seedMat);
    s2.position.set(sx, sy, -0.165);
    g.add(s1, s2);
  }
  return g;
}

function buildDonutPrototype(): THREE.Group {
  const g = new THREE.Group();
  const doughGeo = new THREE.TorusGeometry(0.28, 0.145, 16, 26);
  const dough = createOutlinedPart(doughGeo, createCelMaterial(0xf2ba76), 0.038);
  g.add(dough);

  // Pink frosting ring sitting slightly forward
  const icingGeo = new THREE.TorusGeometry(0.28, 0.132, 14, 24);
  const icing = createOutlinedPart(icingGeo, createCelMaterial(0xff8cb3), 0.03);
  icing.position.z = 0.038;
  g.add(icing);

  // Cute sprinkles
  const sprinkleColors = [0xfff07c, 0x7ce8ff, 0xffffff, 0xa8f59d];
  const sprinkleGeo = new THREE.CapsuleGeometry(0.024, 0.06, 4, 8);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sp = new THREE.Mesh(
      sprinkleGeo,
      new THREE.MeshBasicMaterial({ color: sprinkleColors[i % sprinkleColors.length] }),
    );
    sp.position.set(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0.165);
    sp.rotation.z = a + 0.6;
    g.add(sp);
  }
  g.rotation.x = 0.32;
  return g;
}

function buildBobaPrototype(): THREE.Group {
  const g = new THREE.Group();
  const cupGeo = new THREE.CylinderGeometry(0.27, 0.21, 0.56, 18);
  const cup = createOutlinedPart(cupGeo, createCelMaterial(0xf7d294), 0.038);
  cup.position.y = -0.04;
  g.add(cup);

  // Cream foam lid
  const lidGeo = new THREE.SphereGeometry(0.27, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const lid = createOutlinedPart(lidGeo, createCelMaterial(0xfff9f2), 0.032);
  lid.position.y = 0.24;
  g.add(lid);

  // Straw
  const strawGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.42, 10);
  const straw = createOutlinedPart(strawGeo, createCelMaterial(0xff6b8b), 0.025);
  straw.position.set(0.06, 0.46, 0);
  straw.rotation.z = -0.18;
  g.add(straw);

  // Boba pearls at bottom front
  const pearlGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const pearlMat = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR });
  for (let i = -1; i <= 1; i++) {
    const p = new THREE.Mesh(pearlGeo, pearlMat);
    p.position.set(i * 0.11, -0.2, 0.19);
    g.add(p);
  }
  return g;
}

function buildClockPrototype(): THREE.Group {
  const g = new THREE.Group();

  // Golden clock body
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.18, 22);
  bodyGeo.rotateX(Math.PI / 2);
  const body = createOutlinedPart(bodyGeo, createCelMaterial(0xffd452), 0.04);
  g.add(body);

  // Cream dial face
  const dialGeo = new THREE.CircleGeometry(0.26, 20);
  const dial = new THREE.Mesh(dialGeo, new THREE.MeshBasicMaterial({ color: 0xfffcf5 }));
  dial.position.z = 0.098;
  g.add(dial);

  // Clock hands
  const darkMat = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR });
  const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.02), darkMat);
  h1.position.set(0, 0.05, 0.105);
  const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.02), darkMat);
  h2.position.set(0.04, 0, 0.105);
  g.add(h1, h2);

  // Two cute alarm bells on top
  const bellGeo = new THREE.SphereGeometry(0.12, 12, 10);
  const bellMat = createCelMaterial(0xff7b89);
  const bellL = createOutlinedPart(bellGeo, bellMat, 0.028);
  bellL.position.set(-0.27, 0.3, 0);
  const bellR = createOutlinedPart(bellGeo, bellMat, 0.028);
  bellR.position.set(0.27, 0.3, 0);
  g.add(bellL, bellR);

  return g;
}

function buildBombPrototype(): THREE.Group {
  const g = new THREE.Group();

  // Charcoal core
  const coreGeo = new THREE.SphereGeometry(0.34, 18, 16);
  const core = createOutlinedPart(coreGeo, createCelMaterial(0x4b4246), 0.04);
  g.add(core);

  // Spikes so players recognize hazard immediately
  const spikeGeo = new THREE.ConeGeometry(0.09, 0.22, 8);
  const spikeMat = createCelMaterial(0xff595e);
  const dirs: [number, number, number][] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  for (const [dx, dy, dz] of dirs) {
    const spike = createOutlinedPart(spikeGeo, spikeMat, 0.025);
    spike.position.set(dx * 0.36, dy * 0.36, dz * 0.36);
    spike.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx, dy, dz),
    );
    g.add(spike);
  }

  // Fuse & glowing ember tip
  const fuseGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8);
  const fuse = createOutlinedPart(fuseGeo, createCelMaterial(0x9a7b56), 0.02);
  fuse.position.set(0, 0.36, 0);
  g.add(fuse);

  const sparkGeo = new THREE.SphereGeometry(0.1, 10, 10);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
  const spark = new THREE.Mesh(sparkGeo, sparkMat);
  spark.position.set(0, 0.49, 0);
  spark.name = 'spark';
  g.add(spark);

  return g;
}

export class CollectibleFactory {
  private prototypes = new Map<CollectibleType, THREE.Group>();
  private shadowGeo: THREE.CircleGeometry;

  constructor() {
    this.prototypes.set('strawberry', buildStrawberryPrototype());
    this.prototypes.set('peach', buildPeachPrototype());
    this.prototypes.set('watermelon', buildWatermelonPrototype());
    this.prototypes.set('donut', buildDonutPrototype());
    this.prototypes.set('boba', buildBobaPrototype());
    this.prototypes.set('clock', buildClockPrototype());
    this.prototypes.set('bomb', buildBombPrototype());

    this.shadowGeo = new THREE.CircleGeometry(0.42, 18);
    this.shadowGeo.rotateX(-Math.PI / 2);
  }

  public createMesh(type: CollectibleType): THREE.Group {
    const proto = this.prototypes.get(type)!;
    return proto.clone(true);
  }

  public createShadowMarker(isHazard: boolean): THREE.Mesh {
    const mat = new THREE.MeshBasicMaterial({
      color: isHazard ? 0xd9384a : OUTLINE_COLOR,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.shadowGeo, mat);
    mesh.position.y = 0.02;
    return mesh;
  }

  public dispose() {
    this.shadowGeo.dispose();
  }
}

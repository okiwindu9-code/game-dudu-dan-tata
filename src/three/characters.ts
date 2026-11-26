import * as THREE from 'three';
import {
  CharacterId,
  CostumeId,
  EquippedLoadout,
  GlassesId,
  HatId,
  ShirtId,
} from '../types/game';
import {
  OUTLINE_COLOR,
  createCelMaterial,
  createOutlinedPart,
  disposeObject3D,
} from './outlineUtils';

export interface CharacterRig {
  id: CharacterId;
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  tongueGroup: THREE.Group;
  contactShadow: THREE.Mesh;
  hatSlot: THREE.Group;
  glassesSlot: THREE.Group;
  shirtSlot: THREE.Group;
  maskSlot: THREE.Group;
  uniformSlot: THREE.Group;
  // Animation state
  squashY: number;
  squashVel: number;
  blinkTimer: number;
  isBlinking: boolean;
  happyTimer: number;
  dizzyTimer: number;
  walkCycle: number;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(67, 43, 29, 0.36)');
  grad.addColorStop(0.65, 'rgba(67, 43, 29, 0.14)');
  grad.addColorStop(1, 'rgba(67, 43, 29, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let sharedShadowTexture: THREE.CanvasTexture | null = null;
function getShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadowTexture) {
    sharedShadowTexture = createContactShadowTexture();
  }
  return sharedShadowTexture;
}

function createFaceFeatures(
  headGroup: THREE.Group,
  blushColor: number,
  darkMat: THREE.MeshBasicMaterial,
): {
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  tongueGroup: THREE.Group;
} {
  // Eyes: crisp wide-set dark espresso ovals sitting cleanly on the front face
  const eyeGeo = new THREE.SphereGeometry(0.072, 16, 12);
  eyeGeo.scale(1.0, 1.08, 0.45);
  const leftEye = new THREE.Mesh(eyeGeo, darkMat);
  leftEye.position.set(-0.29, -0.03, 0.565);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo.clone(), darkMat);
  rightEye.position.set(0.29, -0.03, 0.565);
  headGroup.add(rightEye);

  // Subtle cute eye shine micro-dots
  const shineGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftShine = new THREE.Mesh(shineGeo, shineMat);
  leftShine.position.set(-0.27, -0.005, 0.598);
  headGroup.add(leftShine);

  const rightShine = new THREE.Mesh(shineGeo, shineMat);
  rightShine.position.set(0.31, -0.005, 0.598);
  headGroup.add(rightShine);

  // Big soft circular blush cheeks matching the attached illustration
  const blushGeo = new THREE.CircleGeometry(0.175, 24);
  const blushMat = new THREE.MeshBasicMaterial({
    color: blushColor,
    transparent: true,
    opacity: 0.92,
  });

  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(-0.52, -0.21, 0.46);
  leftBlush.rotation.y = -0.52;
  leftBlush.rotation.x = 0.14;
  headGroup.add(leftBlush);

  const rightBlush = new THREE.Mesh(blushGeo, blushMat);
  rightBlush.position.set(0.52, -0.21, 0.46);
  rightBlush.rotation.y = 0.52;
  rightBlush.rotation.x = 0.14;
  headGroup.add(rightBlush);

  // Cute ":3" w-shaped mouth + open pink tongue with espresso border
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.14, 0.578);

  const arcGeo = new THREE.TorusGeometry(0.048, 0.016, 8, 16, Math.PI * 0.95);
  const leftArc = new THREE.Mesh(arcGeo, darkMat);
  leftArc.position.set(-0.045, 0.02, 0);
  leftArc.rotation.z = Math.PI * 1.02;
  mouthGroup.add(leftArc);

  const rightArc = new THREE.Mesh(arcGeo, darkMat);
  rightArc.position.set(0.045, 0.02, 0);
  rightArc.rotation.z = Math.PI * 1.02;
  mouthGroup.add(rightArc);

  // Open pink tongue with espresso rim
  const tongueGroup = new THREE.Group();
  tongueGroup.position.set(0, -0.048, -0.004);

  const tongueRimGeo = new THREE.SphereGeometry(0.068, 16, 12);
  tongueRimGeo.scale(0.85, 1.15, 0.35);
  const tongueRim = new THREE.Mesh(tongueRimGeo, darkMat);
  tongueGroup.add(tongueRim);

  const tongueInnerGeo = new THREE.SphereGeometry(0.049, 16, 12);
  tongueInnerGeo.scale(0.82, 1.12, 0.45);
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf18f8e });
  const tongueInner = new THREE.Mesh(tongueInnerGeo, tongueMat);
  tongueInner.position.set(0, -0.002, 0.012);
  tongueGroup.add(tongueInner);

  mouthGroup.add(tongueGroup);
  headGroup.add(mouthGroup);

  return { leftEye, rightEye, tongueGroup };
}

export function createCharacter(id: CharacterId): CharacterRig {
  const isTata = id === 'tata';
  const primaryColor = isTata ? 0xc5936e : 0xfdfaf6;
  const blushColor = isTata ? 0xf8c971 : 0xf9b2b7;

  const primaryMat = createCelMaterial(primaryColor);
  const darkMat = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR });
  const darkToonMat = createCelMaterial(OUTLINE_COLOR);

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // 1. Contact shadow at ground y = 0.015
  const shadowGeo = new THREE.PlaneGeometry(1.75, 1.25);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.9,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.015;
  root.add(contactShadow);

  // 2. Chubby rounded torso (bottom-up placement)
  const torsoGeo = new THREE.SphereGeometry(0.62, 28, 22);
  torsoGeo.scale(1.06, 0.92, 0.84);
  const torsoPart = createOutlinedPart(torsoGeo, primaryMat, 0.052);
  torsoPart.position.set(0, 0.66, 0);
  bodyPivot.add(torsoPart);

  // 3. Legs / Feet (resting flush at y = 0)
  const makeLeg = (xPos: number): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xPos, 0.25, 0.04);

    const legGeo = new THREE.CapsuleGeometry(0.155, 0.12, 8, 16);
    legGeo.scale(1.05, 1.0, 1.15);
    const legMat = isTata ? primaryMat : darkToonMat;
    const legOutline = isTata ? 0.048 : 0.015;
    const legPart = createOutlinedPart(legGeo, legMat, legOutline);
    legPart.position.set(0, -0.05, 0);
    legPivot.add(legPart);

    return legPivot;
  };

  const leftLeg = makeLeg(-0.3);
  const rightLeg = makeLeg(0.3);
  bodyPivot.add(leftLeg, rightLeg);

  // 4. Chubby stubby arms sticking out playfully
  const makeArm = (side: -1 | 1): THREE.Group => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.55, 0.84, 0.03);

    const armGeo = new THREE.CapsuleGeometry(0.145, 0.18, 8, 16);
    armGeo.rotateZ(side * 1.15);
    const armPart = createOutlinedPart(armGeo, primaryMat, 0.048);
    armPart.position.set(side * 0.14, -0.04, 0);
    armPivot.add(armPart);

    return armPivot;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  bodyPivot.add(leftArm, rightArm);

  // 5. Dudu's signature dark espresso collar & cute bowtie!
  if (!isTata) {
    const collarGeo = new THREE.TorusGeometry(0.51, 0.038, 10, 28);
    collarGeo.rotateX(Math.PI / 2);
    collarGeo.scale(1.06, 1.0, 0.88);
    const collar = new THREE.Mesh(collarGeo, darkMat);
    collar.position.set(0, 1.05, 0.02);
    bodyPivot.add(collar);

    const bowtieGroup = new THREE.Group();
    bowtieGroup.position.set(0, 1.0, 0.49);

    const lobeGeo = new THREE.SphereGeometry(0.1, 14, 10);
    lobeGeo.scale(1.2, 0.85, 0.55);
    const leftLobe = new THREE.Mesh(lobeGeo, darkMat);
    leftLobe.position.set(-0.1, 0, 0);
    leftLobe.rotation.z = 0.22;
    const rightLobe = new THREE.Mesh(lobeGeo, darkMat);
    rightLobe.position.set(0.1, 0, 0);
    rightLobe.rotation.z = -0.22;
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), darkMat);
    bowtieGroup.add(leftLobe, rightLobe, knot);
    bodyPivot.add(bowtieGroup);
  }

  // 6. Big adorable wide squished head matching the attached artwork
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.62, 0.02);
  bodyPivot.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.76, 32, 24);
  headGeo.scale(1.18, 0.94, 0.82);
  const headPart = createOutlinedPart(headGeo, primaryMat, 0.054);
  headGroup.add(headPart);

  // 7. Ears (Tata: caramel + dark inner spot; Dudu: solid dark panda ears)
  const makeEar = (side: -1 | 1): THREE.Group => {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.64, 0.56, -0.03);

    const earGeo = new THREE.SphereGeometry(0.225, 20, 16);
    earGeo.scale(1.04, 1.0, 0.62);
    const earMat = isTata ? primaryMat : darkToonMat;
    const earPart = createOutlinedPart(earGeo, earMat, isTata ? 0.05 : 0.015);
    earGroup.add(earPart);

    if (isTata) {
      const innerGeo = new THREE.SphereGeometry(0.115, 14, 12);
      innerGeo.scale(1.0, 0.96, 0.45);
      const innerEar = new THREE.Mesh(innerGeo, darkMat);
      innerEar.position.set(side * -0.01, -0.01, 0.095);
      earGroup.add(innerEar);
    }

    return earGroup;
  };

  const leftEar = makeEar(-1);
  const rightEar = makeEar(1);
  headGroup.add(leftEar, rightEar);

  // 8. Eyes, big pastel blush cheeks, and ":3" open tongue smile
  const { leftEye, rightEye, tongueGroup } = createFaceFeatures(
    headGroup,
    blushColor,
    darkMat,
  );

  const hatSlot = new THREE.Group();
  hatSlot.position.set(0, 0.67, 0.01);
  headGroup.add(hatSlot);

  const glassesSlot = new THREE.Group();
  glassesSlot.position.set(0, -0.02, 0.61);
  headGroup.add(glassesSlot);

  const shirtSlot = new THREE.Group();
  shirtSlot.position.set(0, 0.64, 0);
  bodyPivot.add(shirtSlot);

  const maskSlot = new THREE.Group();
  maskSlot.position.set(0, -0.02, 0.605);
  headGroup.add(maskSlot);

  const uniformSlot = new THREE.Group();
  uniformSlot.position.set(0, 0.64, 0);
  bodyPivot.add(uniformSlot);

  return {
    id,
    root,
    bodyPivot,
    headGroup,
    leftEar,
    rightEar,
    leftEye,
    rightEye,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    tongueGroup,
    contactShadow,
    hatSlot,
    glassesSlot,
    shirtSlot,
    maskSlot,
    uniformSlot,
    squashY: 1,
    squashVel: 0,
    blinkTimer: 1.5 + Math.random() * 2.5,
    isBlinking: false,
    happyTimer: 0,
    dizzyTimer: 0,
    walkCycle: 0,
  };
}

function clearSlot(slot: THREE.Group) {
  while (slot.children.length > 0) {
    const child = slot.children[0];
    slot.remove(child);
    disposeObject3D(child);
  }
}

function buildHatMesh(hatId: HatId): THREE.Group {
  const g = new THREE.Group();

  if (hatId === 'hat_straw') {
    const brimGeo = new THREE.CylinderGeometry(0.68, 0.72, 0.06, 24);
    brimGeo.scale(1.06, 1, 0.92);
    const brim = createOutlinedPart(brimGeo, createCelMaterial(0xf3d28c), 0.036);
    g.add(brim);

    const crownGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.34, 22);
    const crown = createOutlinedPart(crownGeo, createCelMaterial(0xf7dc9e), 0.038);
    crown.position.y = 0.18;
    g.add(crown);

    const ribbonGeo = new THREE.CylinderGeometry(0.425, 0.43, 0.09, 22);
    const ribbon = createOutlinedPart(ribbonGeo, createCelMaterial(0xf26b7a), 0.024);
    ribbon.position.y = 0.08;
    g.add(ribbon);
  } else if (hatId === 'hat_strawberry') {
    const domeGeo = new THREE.SphereGeometry(0.44, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.62);
    domeGeo.scale(1.08, 0.95, 0.94);
    const dome = createOutlinedPart(domeGeo, createCelMaterial(0xff5e78), 0.04);
    dome.position.y = -0.08;
    g.add(dome);

    const cuffGeo = new THREE.TorusGeometry(0.43, 0.085, 10, 24);
    cuffGeo.rotateX(Math.PI / 2);
    cuffGeo.scale(1.06, 1, 0.92);
    const cuff = createOutlinedPart(cuffGeo, createCelMaterial(0xff8ca0), 0.032);
    cuff.position.y = 0.02;
    g.add(cuff);

    const leafMat = createCelMaterial(0x6bd47f);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leafGeo = new THREE.SphereGeometry(0.11, 10, 8);
      leafGeo.scale(1.4, 0.4, 0.8);
      const leaf = createOutlinedPart(leafGeo, leafMat, 0.025);
      leaf.position.set(Math.cos(a) * 0.11, 0.34, Math.sin(a) * 0.11);
      leaf.rotation.y = -a;
      g.add(leaf);
    }
  } else if (hatId === 'hat_crown') {
    const goldMat = createCelMaterial(0xffd166);
    const baseGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.18, 18);
    const base = createOutlinedPart(baseGeo, goldMat, 0.036);
    base.position.y = 0.09;
    g.add(base);

    const tipGeo = new THREE.ConeGeometry(0.11, 0.24, 10);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const tip = createOutlinedPart(tipGeo, goldMat, 0.028);
      tip.position.set(Math.cos(a) * 0.24, 0.25, Math.sin(a) * 0.24);
      g.add(tip);
    }

    const gemGeo = new THREE.SphereGeometry(0.065, 10, 10);
    const gem = createOutlinedPart(gemGeo, createCelMaterial(0xff6b8b), 0.02);
    gem.position.set(0, 0.11, 0.3);
    g.add(gem);
  }

  return g;
}

function buildGlassesMesh(glassesId: GlassesId): THREE.Group {
  const g = new THREE.Group();

  if (glassesId === 'glasses_cool') {
    const frameMat = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR });
    const lensGeo = new THREE.BoxGeometry(0.28, 0.19, 0.05);
    const leftLens = new THREE.Mesh(lensGeo, frameMat);
    leftLens.position.set(-0.27, 0, 0);
    leftLens.rotation.y = -0.18;

    const rightLens = new THREE.Mesh(lensGeo, frameMat);
    rightLens.position.set(0.27, 0, 0);
    rightLens.rotation.y = 0.18;

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), frameMat);
    bridge.position.set(0, 0.03, 0.01);

    // Crisp white specular glint bars
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glintGeo = new THREE.BoxGeometry(0.04, 0.13, 0.015);
    const glintL = new THREE.Mesh(glintGeo, glintMat);
    glintL.position.set(-0.31, 0.01, 0.03);
    glintL.rotation.z = -0.45;
    const glintR = new THREE.Mesh(glintGeo, glintMat);
    glintR.position.set(0.23, 0.01, 0.03);
    glintR.rotation.z = -0.45;

    g.add(leftLens, rightLens, bridge, glintL, glintR);
  } else if (glassesId === 'glasses_round') {
    const rimMat = createCelMaterial(0xf4b942);
    const rimGeo = new THREE.TorusGeometry(0.145, 0.025, 10, 22);
    const leftRim = createOutlinedPart(rimGeo, rimMat, 0.015, { castShadow: false });
    leftRim.position.set(-0.27, 0, 0);
    leftRim.rotation.y = -0.18;

    const rightRim = createOutlinedPart(rimGeo, rimMat, 0.015, { castShadow: false });
    rightRim.position.set(0.27, 0, 0);
    rightRim.rotation.y = 0.18;

    const lensMat = new THREE.MeshBasicMaterial({
      color: 0xbef0ff,
      transparent: true,
      opacity: 0.45,
    });
    const glassGeo = new THREE.CircleGeometry(0.13, 18);
    const glassL = new THREE.Mesh(glassGeo, lensMat);
    glassL.position.set(-0.27, 0, 0.005);
    glassL.rotation.y = -0.18;

    const glassR = new THREE.Mesh(glassGeo, lensMat);
    glassR.position.set(0.27, 0, 0.005);
    glassR.rotation.y = 0.18;

    const bridge = createOutlinedPart(
      new THREE.BoxGeometry(0.16, 0.035, 0.03),
      rimMat,
      0.012,
      { castShadow: false },
    );
    bridge.position.set(0, 0.02, 0.01);

    g.add(leftRim, rightRim, glassL, glassR, bridge);
  }

  return g;
}

function buildShirtMesh(shirtId: ShirtId): THREE.Group {
  const colorMap: Record<ShirtId, number> = {
    shirt_pink: 0xff9eb5,
    shirt_mint: 0x8ce0b4,
    shirt_butter: 0xffe082,
  };
  const collarMap: Record<ShirtId, number> = {
    shirt_pink: 0xffe4ec,
    shirt_mint: 0xdff9ec,
    shirt_butter: 0xfff5cc,
  };

  const g = new THREE.Group();
  const shirtMat = createCelMaterial(colorMap[shirtId]);
  const collarMat = createCelMaterial(collarMap[shirtId]);

  // Snug plain tunic covering torso cleanly
  const tunicGeo = new THREE.SphereGeometry(0.64, 26, 20);
  tunicGeo.scale(1.09, 0.78, 0.87);
  const tunic = createOutlinedPart(tunicGeo, shirtMat, 0.048);
  tunic.position.set(0, -0.02, 0);
  g.add(tunic);

  // Cute round collar trim at top of shirt
  const neckGeo = new THREE.TorusGeometry(0.41, 0.045, 10, 24);
  neckGeo.rotateX(Math.PI / 2);
  neckGeo.scale(1.06, 1, 0.88);
  const neck = createOutlinedPart(neckGeo, collarMat, 0.022);
  neck.position.set(0, 0.34, 0.02);
  g.add(neck);

  // Short sleeve shoulder puffs
  const sleeveGeo = new THREE.SphereGeometry(0.19, 14, 12);
  sleeveGeo.scale(1.15, 0.9, 0.9);
  const sleeveL = createOutlinedPart(sleeveGeo, shirtMat, 0.036);
  sleeveL.position.set(-0.58, 0.2, 0.02);
  const sleeveR = createOutlinedPart(sleeveGeo, shirtMat, 0.036);
  sleeveR.position.set(0.58, 0.2, 0.02);
  g.add(sleeveL, sleeveR);

  return g;
}

function buildMaskMesh(maskId: 'style_mask_cat' | 'style_mask_bunny'): THREE.Group {
  const g = new THREE.Group();

  if (maskId === 'style_mask_cat') {
    const maskMat = createCelMaterial(0x7b2cbf);
    const goldMat = createCelMaterial(0xffd166);

    // Sleek cat domino mask bridging across the eyes
    const barGeo = new THREE.BoxGeometry(0.74, 0.21, 0.055);
    const bar = createOutlinedPart(barGeo, maskMat, 0.022, { castShadow: false });
    bar.position.set(0, 0, -0.01);
    g.add(bar);

    // Pointed cat-mask ear wings on upper outer corners
    const wingGeo = new THREE.ConeGeometry(0.11, 0.22, 6);
    const wingL = createOutlinedPart(wingGeo, maskMat, 0.02, { castShadow: false });
    wingL.position.set(-0.34, 0.16, -0.01);
    wingL.rotation.z = 0.42;
    const wingR = createOutlinedPart(wingGeo, maskMat, 0.02, { castShadow: false });
    wingR.position.set(0.34, 0.16, -0.01);
    wingR.rotation.z = -0.42;
    g.add(wingL, wingR);

    // Golden eye cutouts / rings so eyes shine cleanly
    const ringGeo = new THREE.TorusGeometry(0.115, 0.024, 10, 20);
    const ringL = createOutlinedPart(ringGeo, goldMat, 0.01, { castShadow: false });
    ringL.position.set(-0.27, 0, 0.02);
    ringL.rotation.y = -0.18;
    const ringR = createOutlinedPart(ringGeo, goldMat, 0.01, { castShadow: false });
    ringR.position.set(0.27, 0, 0.02);
    ringR.rotation.y = 0.18;
    g.add(ringL, ringR);

    // Mini gold crest star on forehead bridge
    const gem = createOutlinedPart(
      new THREE.OctahedronGeometry(0.06, 0),
      goldMat,
      0.014,
      { castShadow: false },
    );
    gem.position.set(0, 0.08, 0.025);
    g.add(gem);
  } else {
    const maskMat = createCelMaterial(0xff6b8b);
    const creamMat = createCelMaterial(0xfff3b0);

    // Festive masquerade eye mask lobes
    const lobeGeo = new THREE.SphereGeometry(0.19, 16, 12);
    lobeGeo.scale(1.15, 0.78, 0.24);
    const lobeL = createOutlinedPart(lobeGeo, maskMat, 0.02, { castShadow: false });
    lobeL.position.set(-0.24, 0.01, -0.01);
    lobeL.rotation.y = -0.18;
    const lobeR = createOutlinedPart(lobeGeo, maskMat, 0.02, { castShadow: false });
    lobeR.position.set(0.24, 0.01, -0.01);
    lobeR.rotation.y = 0.18;
    const bridge = createOutlinedPart(
      new THREE.BoxGeometry(0.24, 0.12, 0.045),
      maskMat,
      0.016,
      { castShadow: false },
    );
    bridge.position.set(0, 0.02, -0.005);
    g.add(lobeL, lobeR, bridge);

    // Bunny mask mini ears on brow
    const earGeo = new THREE.CapsuleGeometry(0.055, 0.22, 6, 12);
    earGeo.scale(1, 1, 0.45);
    const earL = createOutlinedPart(earGeo, maskMat, 0.018, { castShadow: false });
    earL.position.set(-0.14, 0.24, -0.01);
    earL.rotation.z = 0.2;
    const earR = createOutlinedPart(earGeo, maskMat, 0.018, { castShadow: false });
    earR.position.set(0.14, 0.24, -0.01);
    earR.rotation.z = -0.2;
    g.add(earL, earR);

    // Bright eye circles + golden trim stars
    const eyeRingGeo = new THREE.TorusGeometry(0.105, 0.022, 8, 18);
    const ringL = createOutlinedPart(eyeRingGeo, creamMat, 0.01, { castShadow: false });
    ringL.position.set(-0.27, 0, 0.022);
    ringL.rotation.y = -0.18;
    const ringR = createOutlinedPart(eyeRingGeo, creamMat, 0.01, { castShadow: false });
    ringR.position.set(0.27, 0, 0.022);
    ringR.rotation.y = 0.18;
    g.add(ringL, ringR);
  }

  return g;
}

function buildUniformMesh(uniformId: 'style_uniform_sailor' | 'style_uniform_royal'): THREE.Group {
  const g = new THREE.Group();

  if (uniformId === 'style_uniform_sailor') {
    const whiteMat = createCelMaterial(0xfffaf0);
    const navyMat = createCelMaterial(0x2b4c7e);
    const redMat = createCelMaterial(0xe63946);

    // Crisp cream sailor tunic
    const tunicGeo = new THREE.SphereGeometry(0.652, 26, 20);
    tunicGeo.scale(1.09, 0.8, 0.88);
    const tunic = createOutlinedPart(tunicGeo, whiteMat, 0.048);
    tunic.position.set(0, -0.02, 0);
    g.add(tunic);

    // Short sleeves with navy cuff bands
    const sleeveGeo = new THREE.SphereGeometry(0.195, 14, 12);
    sleeveGeo.scale(1.15, 0.92, 0.92);
    const sleeveL = createOutlinedPart(sleeveGeo, whiteMat, 0.036);
    sleeveL.position.set(-0.58, 0.2, 0.02);
    const sleeveR = createOutlinedPart(sleeveGeo, whiteMat, 0.036);
    sleeveR.position.set(0.58, 0.2, 0.02);
    g.add(sleeveL, sleeveR);

    // Wide navy sailor collar drape across shoulders & chest
    const collarGeo = new THREE.TorusGeometry(0.45, 0.095, 10, 24);
    collarGeo.rotateX(Math.PI / 2);
    collarGeo.scale(1.08, 1.0, 0.9);
    const collar = createOutlinedPart(collarGeo, navyMat, 0.024);
    collar.position.set(0, 0.31, 0.02);
    g.add(collar);

    // Front navy bib V-flap
    const bibGeo = new THREE.ConeGeometry(0.26, 0.34, 4);
    bibGeo.rotateX(Math.PI);
    bibGeo.rotateY(Math.PI / 4);
    bibGeo.scale(1.15, 1, 0.35);
    const bib = createOutlinedPart(bibGeo, navyMat, 0.02);
    bib.position.set(0, 0.14, 0.54);
    g.add(bib);

    // Bright red front sailor ribbon bow
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, 0.26, 0.59);
    const lobeGeo = new THREE.SphereGeometry(0.088, 12, 10);
    lobeGeo.scale(1.3, 0.85, 0.5);
    const bowL = createOutlinedPart(lobeGeo, redMat, 0.018, { castShadow: false });
    bowL.position.set(-0.085, 0, 0);
    bowL.rotation.z = 0.22;
    const bowR = createOutlinedPart(lobeGeo, redMat, 0.018, { castShadow: false });
    bowR.position.set(0.085, 0, 0);
    bowR.rotation.z = -0.22;
    const knot = createOutlinedPart(new THREE.SphereGeometry(0.052, 10, 10), redMat, 0.015, {
      castShadow: false,
    });
    bowGroup.add(bowL, bowR, knot);
    g.add(bowGroup);
  } else {
    const royalMat = createCelMaterial(0x3a86ff);
    const goldMat = createCelMaterial(0xffd166);
    const crimsonMat = createCelMaterial(0xf26b7a);

    // Royal blue blazer tunic
    const tunicGeo = new THREE.SphereGeometry(0.652, 26, 20);
    tunicGeo.scale(1.09, 0.82, 0.88);
    const tunic = createOutlinedPart(tunicGeo, royalMat, 0.048);
    tunic.position.set(0, -0.02, 0);
    g.add(tunic);

    // Royal sleeves + golden shoulder epaulets
    const sleeveGeo = new THREE.SphereGeometry(0.195, 14, 12);
    sleeveGeo.scale(1.15, 0.92, 0.92);
    const sleeveL = createOutlinedPart(sleeveGeo, royalMat, 0.036);
    sleeveL.position.set(-0.58, 0.2, 0.02);
    const sleeveR = createOutlinedPart(sleeveGeo, royalMat, 0.036);
    sleeveR.position.set(0.58, 0.2, 0.02);
    g.add(sleeveL, sleeveR);

    const epGeo = new THREE.BoxGeometry(0.24, 0.08, 0.22);
    const epL = createOutlinedPart(epGeo, goldMat, 0.02);
    epL.position.set(-0.52, 0.36, 0.02);
    epL.rotation.z = 0.25;
    const epR = createOutlinedPart(epGeo, goldMat, 0.02);
    epR.position.set(0.52, 0.36, 0.02);
    epR.rotation.z = -0.25;
    g.add(epL, epR);

    // Golden collar & diagonal sash
    const collarGeo = new THREE.TorusGeometry(0.42, 0.055, 10, 24);
    collarGeo.rotateX(Math.PI / 2);
    collarGeo.scale(1.06, 1, 0.88);
    const collar = createOutlinedPart(collarGeo, goldMat, 0.022);
    collar.position.set(0, 0.34, 0.02);
    g.add(collar);

    const sashGeo = new THREE.TorusGeometry(0.59, 0.055, 8, 28);
    sashGeo.scale(1.07, 0.84, 0.93);
    const sash = createOutlinedPart(sashGeo, crimsonMat, 0.018);
    sash.position.set(0, 0.02, 0.02);
    sash.rotation.z = -0.58;
    sash.rotation.y = 0.28;
    g.add(sash);

    // 3 Shiny gold front buttons
    const btnGeo = new THREE.SphereGeometry(0.052, 10, 10);
    for (let i = 0; i < 3; i++) {
      const btn = createOutlinedPart(btnGeo, goldMat, 0.014, { castShadow: false });
      btn.position.set(0, 0.19 - i * 0.17, 0.57 - i * 0.015);
      g.add(btn);
    }
  }

  return g;
}

export function applyCharacterLoadout(rig: CharacterRig, loadout: EquippedLoadout) {
  clearSlot(rig.hatSlot);
  clearSlot(rig.glassesSlot);
  clearSlot(rig.shirtSlot);
  clearSlot(rig.maskSlot);
  clearSlot(rig.uniformSlot);

  if (loadout.hat) {
    rig.hatSlot.add(buildHatMesh(loadout.hat));
  }
  if (loadout.glasses) {
    rig.glassesSlot.add(buildGlassesMesh(loadout.glasses));
  }

  const isUniform =
    loadout.costume === 'style_uniform_sailor' ||
    loadout.costume === 'style_uniform_royal';

  if (isUniform && loadout.costume) {
    rig.uniformSlot.add(buildUniformMesh(loadout.costume as 'style_uniform_sailor' | 'style_uniform_royal'));
  } else if (loadout.shirt) {
    rig.shirtSlot.add(buildShirtMesh(loadout.shirt));
  }

  if (
    loadout.costume === 'style_mask_cat' ||
    loadout.costume === 'style_mask_bunny'
  ) {
    rig.maskSlot.add(buildMaskMesh(loadout.costume));
  }
}

export function triggerSquash(rig: CharacterRig, impulse: number) {
  rig.squashVel += impulse;
}

export function animateCharacter(
  rig: CharacterRig,
  dt: number,
  elapsed: number,
  options: {
    vx: number;
    vy: number;
    isGrounded: boolean;
    isCheering?: boolean;
    isSpotlight?: boolean;
  },
) {
  const speedAbs = Math.abs(options.vx);
  const isMoving = speedAbs > 0.35;

  // Spring physics for squash & stretch
  const stiffness = 190;
  const damping = 15;
  const force = -stiffness * (rig.squashY - 1);
  const dampForce = -damping * rig.squashVel;
  rig.squashVel += (force + dampForce) * dt;
  rig.squashY = THREE.MathUtils.clamp(rig.squashY + rig.squashVel * dt, 0.72, 1.32);

  const invScale = 1 / Math.sqrt(rig.squashY);
  rig.bodyPivot.scale.set(invScale, rig.squashY, invScale);

  // Blinking cycle
  rig.blinkTimer -= dt;
  if (rig.blinkTimer <= 0) {
    if (!rig.isBlinking) {
      rig.isBlinking = true;
      rig.blinkTimer = 0.11;
    } else {
      rig.isBlinking = false;
      rig.blinkTimer = 2.0 + Math.random() * 2.8;
    }
  }
  const targetEyeScaleY = rig.isBlinking ? 0.12 : 1.0;
  rig.leftEye.scale.y = THREE.MathUtils.lerp(rig.leftEye.scale.y, targetEyeScaleY, 0.55);
  rig.rightEye.scale.y = THREE.MathUtils.lerp(rig.rightEye.scale.y, targetEyeScaleY, 0.55);

  // Timers
  if (rig.happyTimer > 0) rig.happyTimer = Math.max(0, rig.happyTimer - dt);
  if (rig.dizzyTimer > 0) rig.dizzyTimer = Math.max(0, rig.dizzyTimer - dt);

  // Walk cycle & limb bounce
  if (isMoving && options.isGrounded) {
    rig.walkCycle += dt * (9.5 + speedAbs * 0.55);
  } else {
    rig.walkCycle += dt * (options.isCheering || options.isSpotlight ? 6.2 : 2.6);
  }

  const walkSin = Math.sin(rig.walkCycle);
  const walkAbs = Math.abs(walkSin);

  if (isMoving && options.isGrounded) {
    rig.leftLeg.rotation.x = walkSin * 0.65;
    rig.rightLeg.rotation.x = -walkSin * 0.65;
    rig.leftArm.rotation.z = -0.25 + walkSin * 0.35;
    rig.rightArm.rotation.z = 0.25 + walkSin * 0.35;
    rig.bodyPivot.position.y = walkAbs * 0.1;
  } else if (!options.isGrounded) {
    // Cute airborne jump pose
    rig.leftLeg.rotation.x = 0.42;
    rig.rightLeg.rotation.x = -0.28;
    rig.leftArm.rotation.z = -0.75;
    rig.rightArm.rotation.z = 0.75;
    rig.bodyPivot.position.y = 0;
  } else if (options.isCheering || rig.happyTimer > 0) {
    const cheerWave = Math.sin(elapsed * 9.0 + (rig.id === 'tata' ? 0 : 1.2));
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.leftArm.rotation.z = -0.7 + cheerWave * 0.38;
    rig.rightArm.rotation.z = 0.7 - cheerWave * 0.38;
    rig.bodyPivot.position.y = Math.abs(Math.sin(elapsed * 4.5)) * 0.16;
  } else {
    // Cozy idle breath & gentle wave
    const breath = Math.sin(elapsed * 2.8 + (rig.id === 'tata' ? 0 : 1.4));
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, 0.2);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, 0.2);
    rig.leftArm.rotation.z = -0.08 + breath * 0.08;
    rig.rightArm.rotation.z = 0.08 - breath * 0.08;
    rig.bodyPivot.position.y = (breath + 1) * 0.025;
  }

  // Head tilt into horizontal velocity + dizzy wobble
  const targetTiltZ = isMoving
    ? THREE.MathUtils.clamp(-options.vx * 0.016, -0.18, 0.18)
    : Math.sin(elapsed * 2.2) * 0.04;
  const dizzyShake = rig.dizzyTimer > 0 ? Math.sin(elapsed * 34) * 0.22 : 0;

  rig.headGroup.rotation.z = THREE.MathUtils.damp(
    rig.headGroup.rotation.z,
    targetTiltZ + dizzyShake,
    10,
    dt,
  );

  // Subtle Y turn toward movement direction while keeping cute 2.5D face visible!
  const targetTurnY = isMoving
    ? THREE.MathUtils.clamp(options.vx * 0.032, -0.34, 0.34)
    : options.isSpotlight
      ? Math.sin(elapsed * 1.6) * 0.18
      : 0;
  rig.bodyPivot.rotation.y = THREE.MathUtils.damp(
    rig.bodyPivot.rotation.y,
    targetTurnY,
    10,
    dt,
  );

  // Ear bounce
  const earBounce = Math.sin(elapsed * 4.8) * 0.05 + (rig.happyTimer > 0 ? 0.14 : 0);
  rig.leftEar.rotation.z = earBounce;
  rig.rightEar.rotation.z = -earBounce;

  // Tongue happy wiggle
  rig.tongueGroup.scale.setScalar(rig.happyTimer > 0 ? 1.24 : 1.0);

  // Contact shadow shrinks & softens as character jumps higher
  const heightAboveGround = Math.max(0, rig.root.position.y);
  const shadowScale = Math.max(0.45, 1 - heightAboveGround * 0.16);
  rig.contactShadow.scale.setScalar(shadowScale);
  rig.contactShadow.position.y = 0.015 - rig.root.position.y;
  (rig.contactShadow.material as THREE.MeshBasicMaterial).opacity =
    0.85 * Math.max(0.25, 1 - heightAboveGround * 0.22);
}

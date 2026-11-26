import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import {
  ActiveBoosters,
  CHARACTERS,
  CarpetId,
  CharacterId,
  CollectibleType,
  EquippedLoadout,
  FloatingPopup,
  GamePhase,
  HudSnapshot,
  InGameDuration,
  TIME_MODES,
} from '../types/game';
import {
  CharacterRig,
  animateCharacter,
  applyCharacterLoadout,
  createCharacter,
  triggerSquash,
} from './characters';
import { COLLECTIBLE_INFO, CollectibleFactory } from './collectibles';
import { EnvironmentRig, buildEnvironment } from './environment';
import { disposeObject3D } from './outlineUtils';
import { ParticleSystem } from './particles';

interface FallingItem {
  id: number;
  type: CollectibleType;
  mesh: THREE.Group;
  shadow: THREE.Mesh;
  x: number;
  y: number;
  vy: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  swayPhase: number;
  swayAmp: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onPopup: (popup: FloatingPopup) => void;
  onGameOver: (finalHud: HudSnapshot) => void;
  onHazardHit?: () => void;
}

// Reusable math objects (zero per-frame GC)
const _projVec = new THREE.Vector3();
const _rayVec = new THREE.Vector3();
const _rayDir = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private env: EnvironmentRig;
  private particles: ParticleSystem;
  private collectibleFactory: CollectibleFactory;

  private tataRig: CharacterRig;
  private duduRig: CharacterRig;
  private activeCharacter: CharacterId = 'dudu';
  private durationMode: InGameDuration = 60;
  private phase: GamePhase = 'menu';

  // Loop management
  private clock = new THREE.Clock();
  private elapsed = 0;
  private frameId = 0;
  private disposed = false;

  // Player physics
  private playerX = 0;
  private playerY = 0;
  private playerVx = 0;
  private playerVy = 0;
  private isGrounded = true;
  private stepDustTimer = 0;
  private feverTrailTimer = 0;

  // Input state
  private keys = new Set<string>();
  private virtualMoveDir: -1 | 0 | 1 = 0;
  private pointerActive = false;
  private pointerTargetX: number | null = null;

  // Game state
  private items: FallingItem[] = [];
  private nextItemId = 1;
  private nextPopupId = 1;
  private spawnTimer = 0;
  private score = 0;
  private timeLeft = 60;
  private combo = 0;
  private maxCombo = 0;
  private feverStreak = 0;
  private feverActive = false;
  private feverTimeLeft = 0;
  private itemsCaught = 0;
  private hazardsHit = 0;
  private cameraShake = 0;
  private lastHudPush = 0;
  private lastTickSecond = 6;
  private speedBoosterActive = false;
  private speedTrailTimer = 0;

  // Camera smooth targets
  private camLookAt = new THREE.Vector3(0, 1.5, 0);

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // Procedural RoomEnvironment PMREM for studio reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.5, 100);
    this.camera.position.set(0, 2.55, 8.6);
    this.camera.lookAt(this.camLookAt);

    this.env = buildEnvironment(this.scene, this.isSoftwareGl);
    this.particles = new ParticleSystem(this.scene);
    this.collectibleFactory = new CollectibleFactory();

    this.tataRig = createCharacter('tata');
    this.duduRig = createCharacter('dudu');
    this.tataRig.root.position.set(-1.32, 0, 0.55);
    this.duduRig.root.position.set(1.32, 0, 0);
    this.scene.add(this.tataRig.root, this.duduRig.root);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.tick();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('webglcontextlost', this.handleContextLost);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (
      this.phase === 'playing' &&
      (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')
    ) {
      e.preventDefault();
      this.triggerJump();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private updatePointerWorldX(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    _rayVec.set(ndcX, ndcY, 0.5).unproject(this.camera);
    _rayDir.copy(_rayVec).sub(this.camera.position).normalize();
    if (Math.abs(_rayDir.z) < 0.001) return;
    const t = (0 - this.camera.position.z) / _rayDir.z;
    const worldX = this.camera.position.x + _rayDir.x * t;
    this.pointerTargetX = THREE.MathUtils.clamp(worldX, -6.9, 6.9);
  }

  private handlePointerDown = (e: PointerEvent) => {
    soundEngine.unlock();
    if (this.phase !== 'playing') return;
    this.pointerActive = true;
    this.updatePointerWorldX(e.clientX, e.clientY);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.pointerActive || this.phase !== 'playing') return;
    this.updatePointerWorldX(e.clientX, e.clientY);
  };

  private handlePointerUp = () => {
    this.pointerActive = false;
    this.pointerTargetX = null;
  };

  public setVirtualMove(dir: -1 | 0 | 1) {
    this.virtualMoveDir = dir;
  }

  public triggerJump() {
    if (this.phase !== 'playing' || !this.isGrounded) return;
    this.playerVy = 11.4;
    this.isGrounded = false;
    const rig = this.getActiveRig();
    triggerSquash(rig, 3.2);
    this.particles.spawnStepDust(this.playerX, 0, 0, 0xfff0e6);
    soundEngine.playJump();
  }

  public setSelectedCharacter(id: CharacterId) {
    if (this.activeCharacter !== id) {
      this.activeCharacter = id;
      const rig = this.getActiveRig();
      triggerSquash(rig, 2.8);
      rig.happyTimer = 0.65;
      this.particles.burst(
        rig.root.position.x,
        1.2,
        rig.root.position.z + 0.3,
        CHARACTERS[id].id === 'tata' ? 0xf8c971 : 0xf9b2b7,
        10,
      );
    }
  }

  public setDurationMode(mode: InGameDuration) {
    this.durationMode = mode;
  }

  public applyLoadouts(
    equippedByChar: Record<CharacterId, EquippedLoadout>,
    carpetId: CarpetId,
    burstChar?: CharacterId,
  ) {
    applyCharacterLoadout(this.duduRig, equippedByChar.dudu);
    applyCharacterLoadout(this.tataRig, equippedByChar.tata);
    this.env.setCarpetPattern(carpetId);

    if (burstChar) {
      const rig = burstChar === 'tata' ? this.tataRig : this.duduRig;
      triggerSquash(rig, 2.6);
      rig.happyTimer = 0.7;
      this.particles.burst(
        rig.root.position.x,
        1.4,
        rig.root.position.z + 0.35,
        0xffd166,
        12,
      );
    }
  }

  public startGame(
    characterId: CharacterId,
    durationMode: InGameDuration,
    activeBoosters: ActiveBoosters = { speedBoost: false, time2xBoost: false },
  ) {
    soundEngine.unlock();
    this.activeCharacter = characterId;
    this.durationMode = durationMode;
    this.clearItems();
    this.particles.clear();

    const cfg = TIME_MODES[durationMode];
    this.score = 0;
    this.timeLeft = activeBoosters.time2xBoost
      ? cfg.durationSec * 2
      : cfg.durationSec;
    this.speedBoosterActive = activeBoosters.speedBoost;
    this.speedTrailTimer = 0;
    this.lastTickSecond = 6;
    this.combo = 0;
    this.maxCombo = 0;
    this.feverStreak = 0;
    this.feverActive = false;
    this.feverTimeLeft = 0;
    this.itemsCaught = 0;
    this.hazardsHit = 0;
    this.spawnTimer = 0.25;
    this.cameraShake = 0;

    this.playerX = 0;
    this.playerY = 0;
    this.playerVx = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.pointerTargetX = null;
    this.pointerActive = false;

    const activeRig = this.getActiveRig();
    const partnerRig = this.getPartnerRig();

    activeRig.root.position.set(0, 0, 0);
    activeRig.root.rotation.set(0, 0, 0);
    activeRig.root.scale.setScalar(1);

    // Partner cheers from the cozy checkered picnic blanket!
    partnerRig.root.position.copy(this.env.picnicSpot);
    partnerRig.root.rotation.set(0, -0.35, 0);
    partnerRig.root.scale.setScalar(0.86);

    this.env.spotlightRing.visible = false;
    this.phase = 'playing';
    soundEngine.startBgm(false);
    this.pushHud(true);
  }

  public setPaused(paused: boolean) {
    if (this.phase === 'playing' && paused) {
      this.phase = 'paused';
      soundEngine.stopBgm();
    } else if (this.phase === 'paused' && !paused) {
      this.phase = 'playing';
      this.clock.getDelta();
      soundEngine.startBgm(this.feverActive);
    }
  }

  public returnToMenu() {
    soundEngine.stopBgm();
    this.clearItems();
    this.particles.clear();
    this.phase = 'menu';
    this.feverActive = false;
    this.tataRig.root.scale.setScalar(1);
    this.duduRig.root.scale.setScalar(1);
    this.tataRig.root.rotation.set(0, 0.08, 0);
    this.duduRig.root.rotation.set(0, -0.08, 0);
    this.env.spotlightRing.visible = true;
  }

  private getActiveRig(): CharacterRig {
    return this.activeCharacter === 'tata' ? this.tataRig : this.duduRig;
  }

  private getPartnerRig(): CharacterRig {
    return this.activeCharacter === 'tata' ? this.duduRig : this.tataRig;
  }

  private clearItems() {
    for (const item of this.items) {
      this.scene.remove(item.mesh);
      this.scene.remove(item.shadow);
      (item.shadow.material as THREE.Material).dispose();
    }
    this.items.length = 0;
  }

  private pickRandomCollectibleType(): CollectibleType {
    const cfg = TIME_MODES[this.durationMode];
    const r = Math.random();

    if (!this.feverActive && r < cfg.bombChance) {
      return 'bomb';
    }

    const roll = Math.random();
    if (roll < 0.055 && this.timeLeft < 75) return 'clock';
    if (roll < 0.14) return 'boba';
    if (roll < 0.30) return 'donut';
    if (roll < 0.50) return 'watermelon';
    if (roll < 0.74) return 'peach';
    return 'strawberry';
  }

  private spawnFallingItem() {
    const type = this.pickRandomCollectibleType();
    const cfg = TIME_MODES[this.durationMode];
    const mesh = this.collectibleFactory.createMesh(type);
    const info = COLLECTIBLE_INFO[type];
    const shadow = this.collectibleFactory.createShadowMarker(info.isHazard);

    const x = THREE.MathUtils.randFloat(-6.7, 6.7);
    const y = 10.6;
    mesh.position.set(x, y, 0);
    shadow.position.set(x, 0.02, 0);

    this.scene.add(mesh, shadow);

    const speedBoost = this.feverActive ? 1.25 : 1.0;
    const vy =
      THREE.MathUtils.randFloat(cfg.fallSpeedMin, cfg.fallSpeedMax) *
      speedBoost *
      (info.isRare ? 1.15 : 1.0);

    this.items.push({
      id: this.nextItemId++,
      type,
      mesh,
      shadow,
      x,
      y,
      vy,
      rotSpeedY: (Math.random() - 0.5) * 2.6,
      rotSpeedZ: (Math.random() - 0.5) * 1.4,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: info.isHazard ? 0.15 : 0.35,
    });
  }

  private emitPopup(
    worldX: number,
    worldY: number,
    label: string,
    variant: FloatingPopup['variant'],
  ) {
    _projVec.set(worldX, worldY, 0.5);
    _projVec.project(this.camera);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const sx = ((_projVec.x + 1) / 2) * width;
    const sy = ((-_projVec.y + 1) / 2) * height;

    this.callbacks.onPopup({
      id: this.nextPopupId++,
      x: THREE.MathUtils.clamp(sx, 50, width - 50),
      y: THREE.MathUtils.clamp(sy, 70, height - 80),
      label,
      variant,
    });
  }

  private getMultiplier(): number {
    const base = 1 + Math.min(4, Math.floor(this.combo / 4));
    return this.feverActive ? base * 2 : base;
  }

  private pushHud(force = false) {
    if (!force && this.elapsed - this.lastHudPush < 0.06) return;
    this.lastHudPush = this.elapsed;
    this.callbacks.onHudUpdate(this.buildHudSnapshot());
  }

  private buildHudSnapshot(): HudSnapshot {
    return {
      score: this.score,
      timeLeft: Math.max(0, Math.ceil(this.timeLeft)),
      combo: this.combo,
      maxCombo: this.maxCombo,
      multiplier: this.getMultiplier(),
      feverActive: this.feverActive,
      feverProgress: this.feverActive ? this.feverTimeLeft / 6.0 : this.feverStreak / 10,
      feverTimeLeft: Math.max(0, this.feverTimeLeft),
      itemsCaught: this.itemsCaught,
      hazardsHit: this.hazardsHit,
    };
  }

  private updateMenuScene(dt: number) {
    const isTata = this.activeCharacter === 'tata';

    // Tata & Dudu stand side by side like the attached portrait!
    const tataTargetZ = isTata ? 0.72 : -0.1;
    const duduTargetZ = !isTata ? 0.72 : -0.1;
    const tataScale = isTata ? 1.07 : 0.94;
    const duduScale = !isTata ? 1.07 : 0.94;

    this.tataRig.root.position.x = THREE.MathUtils.damp(this.tataRig.root.position.x, -1.28, 8, dt);
    this.tataRig.root.position.z = THREE.MathUtils.damp(this.tataRig.root.position.z, tataTargetZ, 8, dt);
    this.tataRig.root.position.y = 0;
    this.tataRig.root.scale.setScalar(
      THREE.MathUtils.damp(this.tataRig.root.scale.x, tataScale, 8, dt),
    );
    this.tataRig.root.rotation.y = 0.08;

    this.duduRig.root.position.x = THREE.MathUtils.damp(this.duduRig.root.position.x, 1.28, 8, dt);
    this.duduRig.root.position.z = THREE.MathUtils.damp(this.duduRig.root.position.z, duduTargetZ, 8, dt);
    this.duduRig.root.position.y = 0;
    this.duduRig.root.scale.setScalar(
      THREE.MathUtils.damp(this.duduRig.root.scale.x, duduScale, 8, dt),
    );
    this.duduRig.root.rotation.y = -0.08;

    const spotX = isTata ? -1.28 : 1.28;
    this.env.spotlightRing.position.x = THREE.MathUtils.damp(
      this.env.spotlightRing.position.x,
      spotX,
      10,
      dt,
    );
    this.env.spotlightRing.position.z = 0.72;
    this.env.spotlightRing.scale.setScalar(1 + Math.sin(this.elapsed * 4) * 0.05);

    animateCharacter(this.tataRig, dt, this.elapsed, {
      vx: 0,
      vy: 0,
      isGrounded: true,
      isSpotlight: isTata,
    });
    animateCharacter(this.duduRig, dt, this.elapsed, {
      vx: 0,
      vy: 0,
      isGrounded: true,
      isSpotlight: !isTata,
    });

    // Camera frames both characters cleanly above the bottom character selection cards
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, 0, 6, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 2.55, 6, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, 8.9, 6, dt);
    this.camLookAt.x = THREE.MathUtils.damp(this.camLookAt.x, 0, 6, dt);
    this.camLookAt.y = THREE.MathUtils.damp(this.camLookAt.y, 0.85, 6, dt);
    this.camLookAt.z = THREE.MathUtils.damp(this.camLookAt.z, 0.3, 6, dt);
    this.camera.lookAt(this.camLookAt);
  }

  private updateGameplay(dt: number) {
    const profile = CHARACTERS[this.activeCharacter];
    const cfg = TIME_MODES[this.durationMode];
    const activeRig = this.getActiveRig();
    const partnerRig = this.getPartnerRig();

    // Countdown timer + final 5s urgency tick
    this.timeLeft -= dt;
    const ceilSec = Math.ceil(this.timeLeft);
    if (ceilSec > 0 && ceilSec <= 5 && ceilSec < this.lastTickSecond) {
      this.lastTickSecond = ceilSec;
      soundEngine.playTick();
    } else if (ceilSec > 5) {
      this.lastTickSecond = 6;
    }

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.phase = 'gameover';
      this.clearItems();
      soundEngine.playGameOver();
      const snap = this.buildHudSnapshot();
      this.callbacks.onHudUpdate(snap);
      this.callbacks.onGameOver(snap);
      return;
    }

    // Fever timer
    if (this.feverActive) {
      this.feverTimeLeft -= dt;
      if (this.feverTimeLeft <= 0) {
        this.feverActive = false;
        this.feverTimeLeft = 0;
        this.feverStreak = 0;
        soundEngine.setBgmFever(false);
      }
    }

    // Player horizontal movement (keyboard + touch buttons + pointer glide)
    let moveInput = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) moveInput -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) moveInput += 1;
    if (this.virtualMoveDir !== 0) moveInput = this.virtualMoveDir;

    const speedBonus = (this.feverActive ? 1.18 : 1.0) * (this.speedBoosterActive ? 1.35 : 1.0);
    const maxSpeed = profile.moveSpeed * speedBonus;

    if (moveInput !== 0) {
      this.pointerTargetX = null;
      this.playerVx = THREE.MathUtils.damp(this.playerVx, moveInput * maxSpeed, 14, dt);
    } else if (this.pointerTargetX !== null) {
      const diff = this.pointerTargetX - this.playerX;
      const desiredVx = THREE.MathUtils.clamp(diff * 11, -maxSpeed, maxSpeed);
      this.playerVx = THREE.MathUtils.damp(
        this.playerVx,
        Math.abs(diff) < 0.08 ? 0 : desiredVx,
        16,
        dt,
      );
    } else {
      this.playerVx = THREE.MathUtils.damp(this.playerVx, 0, 14, dt);
    }

    this.playerX = THREE.MathUtils.clamp(this.playerX + this.playerVx * dt, -6.9, 6.9);
    if (Math.abs(this.playerX) >= 6.89) {
      this.playerVx = 0;
    }

    // Vertical jump & gravity
    if (!this.isGrounded) {
      this.playerVy -= 30.0 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isGrounded = true;
        triggerSquash(activeRig, -3.4);
        this.particles.spawnStepDust(this.playerX, 0, 0, 0xfff0e6);
        soundEngine.playLand();
      }
    }

    // Footstep dust, speed booster trail & fever sparkle trail
    if (this.isGrounded && Math.abs(this.playerVx) > 3.0) {
      this.stepDustTimer -= dt;
      if (this.stepDustTimer <= 0) {
        this.stepDustTimer = 0.14;
        this.particles.spawnStepDust(this.playerX, 0, -0.1, 0xf7ebd9);
      }
    }

    if (this.speedBoosterActive && Math.abs(this.playerVx) > 1.5) {
      this.speedTrailTimer -= dt;
      if (this.speedTrailTimer <= 0) {
        this.speedTrailTimer = 0.07;
        this.particles.spawnStepDust(
          this.playerX,
          this.playerY + 0.55,
          -0.08,
          0x90e0ef,
        );
      }
    }

    if (this.feverActive) {
      this.feverTrailTimer -= dt;
      if (this.feverTrailTimer <= 0) {
        this.feverTrailTimer = 0.08;
        this.particles.spawnStepDust(
          this.playerX + (Math.random() - 0.5) * 0.6,
          this.playerY + 0.8 + Math.random() * 0.7,
          0.1,
          0xffe066,
        );
      }
    }

    activeRig.root.position.set(this.playerX, this.playerY, 0);
    animateCharacter(activeRig, dt, this.elapsed, {
      vx: this.playerVx,
      vy: this.playerVy,
      isGrounded: this.isGrounded,
    });

    // Cheering partner on picnic blanket
    animateCharacter(partnerRig, dt, this.elapsed, {
      vx: 0,
      vy: 0,
      isGrounded: true,
      isCheering: true,
    });

    // Spawn falling fruits/snacks
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const interval = this.feverActive ? cfg.spawnInterval * 0.62 : cfg.spawnInterval;
      this.spawnTimer = interval * THREE.MathUtils.randFloat(0.75, 1.2);
      this.spawnFallingItem();
    }

    // Update falling items & check collisions
    const catchHalfW = profile.catchRadius;
    const playerBottom = this.playerY - 0.1;
    const playerTop = this.playerY + 2.35;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const info = COLLECTIBLE_INFO[item.type];

      item.y -= item.vy * dt;
      const swayX = Math.sin(this.elapsed * 2.5 + item.swayPhase) * item.swayAmp * dt;
      item.x = THREE.MathUtils.clamp(item.x + swayX, -6.9, 6.9);

      item.mesh.position.set(item.x, item.y, 0);
      item.mesh.rotation.y += item.rotSpeedY * dt;
      item.mesh.rotation.z += item.rotSpeedZ * dt;

      // Update landing shadow scale & opacity based on height
      item.shadow.position.x = item.x;
      const hNorm = THREE.MathUtils.clamp(1 - item.y / 11, 0.15, 1);
      item.shadow.scale.setScalar(0.45 + hNorm * 0.75);
      (item.shadow.material as THREE.MeshBasicMaterial).opacity = 0.08 + hNorm * 0.25;

      // Check collision with character
      const dx = Math.abs(item.x - this.playerX);
      const hitX = dx <= catchHalfW + info.radius * 0.55;
      const hitY = item.y >= playerBottom && item.y <= playerTop;

      if (hitX && hitY) {
        this.handleCatch(item);
        this.scene.remove(item.mesh);
        this.scene.remove(item.shadow);
        (item.shadow.material as THREE.Material).dispose();
        this.items.splice(i, 1);
        continue;
      }

      // Missed item hits ground
      if (item.y <= 0.28) {
        if (!info.isHazard && !info.isRare && this.combo > 0) {
          // Gentle combo reset if player misses a normal fruit
          this.combo = 0;
          this.feverStreak = Math.max(0, this.feverStreak - 2);
        }
        this.particles.spawnStepDust(item.x, 0.05, 0, info.isHazard ? 0x6c584c : 0xf7ebd9);
        this.scene.remove(item.mesh);
        this.scene.remove(item.shadow);
        (item.shadow.material as THREE.Material).dispose();
        this.items.splice(i, 1);
      }
    }

    // Subtle camera follow & shake decay
    this.cameraShake = Math.max(0, this.cameraShake - dt * 2.8);
    const shakeX = (Math.random() - 0.5) * this.cameraShake * 0.35;
    const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.35;

    const targetCamX = this.playerX * 0.22;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 5, dt) + shakeX;
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 4.7, 5, dt) + shakeY;
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, 14.8, 5, dt);

    this.camLookAt.x = THREE.MathUtils.damp(this.camLookAt.x, targetCamX * 0.5, 6, dt);
    this.camLookAt.y = THREE.MathUtils.damp(this.camLookAt.y, 2.45, 6, dt);
    this.camLookAt.z = THREE.MathUtils.damp(this.camLookAt.z, 0, 6, dt);
    this.camera.lookAt(this.camLookAt);

    this.pushHud(false);
  }

  private handleCatch(item: FallingItem) {
    const info = COLLECTIBLE_INFO[item.type];
    const rig = this.getActiveRig();

    if (info.isHazard) {
      this.score = Math.max(0, this.score + info.points);
      this.combo = 0;
      this.feverStreak = 0;
      this.feverActive = false;
      this.feverTimeLeft = 0;
      soundEngine.setBgmFever(false);
      this.hazardsHit += 1;
      this.cameraShake = 1.25;
      rig.dizzyTimer = 0.7;
      triggerSquash(rig, -4.5);
      this.particles.burst(item.x, item.y, 0.2, info.color, 18, true);
      this.emitPopup(item.x, item.y + 0.8, `${info.points} Aduh!`, 'hazard');
      soundEngine.playHazard();
      this.callbacks.onHazardHit?.();
      this.pushHud(true);
      return;
    }

    this.itemsCaught += 1;
    this.combo += 1;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    if (!this.feverActive) {
      this.feverStreak += 1;
      if (this.feverStreak >= 10) {
        this.feverActive = true;
        this.feverTimeLeft = 6.0;
        this.cameraShake = 0.55;
        this.emitPopup(this.playerX, this.playerY + 2.6, 'PESTA MANIS x2!', 'fever');
        soundEngine.playFeverStart();
        soundEngine.setBgmFever(true);
      }
    }

    const mult = this.getMultiplier();
    const earned = info.points * mult;
    this.score += earned;

    if (info.bonusTime > 0) {
      this.timeLeft += info.bonusTime;
      this.cameraShake = Math.max(this.cameraShake, 0.25);
      this.emitPopup(item.x, item.y + 0.8, `+${info.bonusTime} Detik!`, 'time');
      soundEngine.playClockBonus();
    } else {
      const suffix = mult > 1 ? ` (x${mult})` : '';
      this.cameraShake = Math.max(this.cameraShake, info.isRare ? 0.28 : 0.12);
      this.emitPopup(
        item.x,
        item.y + 0.7,
        `+${earned}${suffix}`,
        info.isRare ? 'bonus' : 'points',
      );
      soundEngine.playCatch(this.combo, info.isRare);
    }

    rig.happyTimer = 0.45;
    triggerSquash(rig, 2.6);
    this.particles.burst(item.x, item.y, 0.2, info.color, info.isRare ? 18 : 12, false);
    this.pushHud(true);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    if (this.phase !== 'paused') {
      this.elapsed += dt;
      this.env.update(dt, this.elapsed, this.feverActive);
      this.particles.update(dt);

      if (this.phase === 'menu') {
        this.updateMenuScene(dt);
      } else if (this.phase === 'playing') {
        this.updateGameplay(dt);
      } else if (this.phase === 'gameover') {
        animateCharacter(this.getActiveRig(), dt, this.elapsed, {
          vx: 0,
          vy: 0,
          isGrounded: true,
          isCheering: true,
        });
        animateCharacter(this.getPartnerRig(), dt, this.elapsed, {
          vx: 0,
          vy: 0,
          isGrounded: true,
          isCheering: true,
        });
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    dom.removeEventListener('webglcontextlost', this.handleContextLost);

    this.clearItems();
    this.particles.dispose();
    this.collectibleFactory.dispose();
    disposeObject3D(this.scene);

    if (this.scene.environment) {
      this.scene.environment.dispose();
    }
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}

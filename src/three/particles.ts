import * as THREE from 'three';

interface ParticleItem {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
  age: number;
  life: number;
  baseScale: number;
  gravity: number;
}

export class ParticleSystem {
  private group = new THREE.Group();
  private active: ParticleItem[] = [];
  private pool: THREE.Mesh[] = [];
  private starGeo: THREE.OctahedronGeometry;
  private puffGeo: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.starGeo = new THREE.OctahedronGeometry(0.16, 0);
    this.puffGeo = new THREE.SphereGeometry(0.14, 10, 8);
    scene.add(this.group);
  }

  private acquireMesh(isPuff: boolean, color: number): THREE.Mesh {
    let mesh = this.pool.pop();
    if (!mesh) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      mesh = new THREE.Mesh(isPuff ? this.puffGeo : this.starGeo, mat);
    } else {
      mesh.geometry = isPuff ? this.puffGeo : this.starGeo;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(color);
      mat.opacity = 1;
    }
    mesh.visible = true;
    this.group.add(mesh);
    return mesh;
  }

  public burst(
    x: number,
    y: number,
    z: number,
    color: number,
    count = 12,
    isHazard = false,
  ) {
    const palette = isHazard
      ? [0xff595e, 0x4b4246, 0xffca3a]
      : [color, 0xffe066, 0xffffff, 0xff8fab];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 2.4 + Math.random() * 3.8;
      const c = palette[i % palette.length];
      const mesh = this.acquireMesh(i % 3 === 0, c);
      mesh.position.set(x, y, z);
      const scale = 0.65 + Math.random() * 0.75;
      mesh.scale.setScalar(scale);

      this.active.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2.2 + Math.random() * 4.2,
        vz: Math.sin(angle) * speed * 0.65,
        rotSpeed: (Math.random() - 0.5) * 12,
        age: 0,
        life: 0.42 + Math.random() * 0.28,
        baseScale: scale,
        gravity: 11.5,
      });
    }
  }

  public spawnStepDust(x: number, y: number, z: number, color = 0xfff5eb) {
    const mesh = this.acquireMesh(true, color);
    mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + 0.08, z);
    const scale = 0.55 + Math.random() * 0.4;
    mesh.scale.setScalar(scale);

    this.active.push({
      mesh,
      vx: (Math.random() - 0.5) * 1.1,
      vy: 0.6 + Math.random() * 0.6,
      vz: (Math.random() - 0.5) * 0.5,
      rotSpeed: 2,
      age: 0,
      life: 0.34,
      baseScale: scale,
      gravity: -0.4,
    });
  }

  public update(dt: number) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.age += dt;
      if (p.age >= p.life) {
        p.mesh.visible = false;
        this.group.remove(p.mesh);
        this.pool.push(p.mesh);
        this.active.splice(i, 1);
        continue;
      }

      const t = p.age / p.life;
      p.vy -= p.gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.z += p.rotSpeed * dt;
      p.mesh.rotation.x += p.rotSpeed * 0.6 * dt;

      const s = p.baseScale * (1 - t * 0.85);
      p.mesh.scale.setScalar(Math.max(0.05, s));
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t * t;
    }
  }

  public clear() {
    for (const p of this.active) {
      p.mesh.visible = false;
      this.group.remove(p.mesh);
      this.pool.push(p.mesh);
    }
    this.active.length = 0;
  }

  public dispose() {
    this.clear();
    this.starGeo.dispose();
    this.puffGeo.dispose();
    for (const m of this.pool) {
      (m.material as THREE.Material).dispose();
    }
    this.pool.length = 0;
  }
}

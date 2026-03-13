import * as THREE from 'three'

export const TILE_LEN = 60
export const TILE_COUNT = 12

export function buildStaticWorld(scene: THREE.Scene) {
  // Ground
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(600, 4000),
    new THREE.MeshStandardMaterial({ color: 0x080f18, roughness: 0.95 }))
  gnd.rotation.x = -Math.PI / 2; gnd.position.y = -0.02; gnd.receiveShadow = true; scene.add(gnd)

  // Buildings
  const billColors = [0xff2d78, 0x00fff7, 0xffe600, 0x39ff14]
  for (let i = 0; i < 40; i++) {
    const h = 14 + Math.random() * 44, s = i % 2 === 0 ? 1 : -1
    const bld = new THREE.Mesh(new THREE.BoxGeometry(7 + Math.random() * 6, h, 8 + Math.random() * 6),
      new THREE.MeshStandardMaterial({ color: 0x070e1b, roughness: 0.9 }))
    bld.position.set(s * (24 + Math.random() * 18), h / 2, -400 + i * 22 + Math.random() * 10)
    scene.add(bld)
    for (let wy = 4; wy < h - 2; wy += 3.4) {
      if (Math.random() > 0.38) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75),
          new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: new THREE.Color(0xffffaa), emissiveIntensity: Math.random() * 1 + 0.1 }))
        win.position.set(s * (24 + Math.random() * 16) - s * 3, wy, -398 + i * 22)
        scene.add(win)
      }
    }
  }

  // Neon billboards
  ;[-18, 18].forEach((x, bi) => {
    for (let i = 0; i < 6; i++) {
      const bh = 4 + Math.random() * 3
      const bill = new THREE.Mesh(new THREE.BoxGeometry(0.4, bh, 6),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a }))
      bill.position.set(x, bh / 2, -50 - i * 90); scene.add(bill)
      const face = new THREE.Mesh(new THREE.PlaneGeometry(5.8, bh - 0.6),
        new THREE.MeshStandardMaterial({
          color: billColors[(bi + i) % 4],
          emissive: new THREE.Color(billColors[(bi + i) % 4]),
          emissiveIntensity: 0.5
        }))
      face.position.set(x + (x < 0 ? 0.21 : -0.21), bh / 2, -50 - i * 90)
      face.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(face)
      const bl = new THREE.PointLight(billColors[(bi + i) % 4], 0.8, 14)
      bl.position.set(x, bh + 1, -50 - i * 90); scene.add(bl)
    }
  })
}

export function buildRoadTiles(scene: THREE.Scene): THREE.Group[] {
  const tiles: THREE.Group[] = []
  const trackMat  = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.88 })
  const dashMat   = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.8 })
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: new THREE.Color(0xffcc00), emissiveIntensity: 0.8 })
  const barrierR  = new THREE.MeshStandardMaterial({ color: 0xee2200, roughness: 0.6 })
  const barrierW  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
  const lampMat   = new THREE.MeshStandardMaterial({ color: 0x555555 })
  const lampHead  = new THREE.MeshStandardMaterial({ color: 0xffffdd, emissive: new THREE.Color(0xffffdd), emissiveIntensity: 2.0 })

  for (let ti = 0; ti < TILE_COUNT; ti++) {
    const tg = new THREE.Group()
    // Track surface
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(14, TILE_LEN), trackMat)
    surf.rotation.x = -Math.PI / 2; surf.position.set(0, 0.01, 0); surf.receiveShadow = true; tg.add(surf)
    // Center dashes
    for (let d = 0; d < TILE_LEN; d += 10) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 5.5), dashMat)
      dash.rotation.x = -Math.PI / 2; dash.position.set(0, 0.02, -TILE_LEN / 2 + d + 5); tg.add(dash)
    }
    // Edge lines
    ;[-6.0, 6.0].forEach(x => {
      const yl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, TILE_LEN), yellowMat)
      yl.rotation.x = -Math.PI / 2; yl.position.set(x, 0.02, 0); tg.add(yl)
    })
    // Barriers
    ;[-7.5, 7.5].forEach((x, bi) => {
      const m1 = ti % 2 === 0 ? (bi === 0 ? barrierR : barrierW) : (bi === 0 ? barrierW : barrierR)
      const m2 = ti % 2 === 0 ? (bi === 0 ? barrierW : barrierR) : (bi === 0 ? barrierR : barrierW)
      for (let seg = 0; seg < TILE_LEN; seg += 8) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 8.1), seg % 16 < 8 ? m1 : m2)
        bar.position.set(x, 0.4, -TILE_LEN / 2 + seg + 4); bar.castShadow = true; tg.add(bar)
      }
    })
    // Street lamps every 20m
    for (let lp = 0; lp < TILE_LEN; lp += 20) {
      ;[-9, 9].forEach(x => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 9.5, 8), lampMat)
        pole.position.set(x, 4.75, -TILE_LEN / 2 + lp); tg.add(pole)
        const lh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.24, 0.75), lampHead)
        lh.position.set(x, 9.6, -TILE_LEN / 2 + lp); tg.add(lh)
        const pl = new THREE.PointLight(0xffcc88, 3.5, 30)
        pl.position.set(x, 9.5, -TILE_LEN / 2 + lp); tg.add(pl)
      })
    }
    tg.position.z = -ti * TILE_LEN
    scene.add(tg); tiles.push(tg)
  }

  // Start/finish line
  const fin = new THREE.Mesh(new THREE.PlaneGeometry(14, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xffffff }))
  fin.rotation.x = -Math.PI / 2; fin.position.set(0, 0.03, 0); scene.add(fin)
  for (let xi = 0; xi < 7; xi++) for (let zi = 0; zi < 2; zi++) {
    if ((xi + zi) % 2 === 0) {
      const sq = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x111111 }))
      sq.rotation.x = -Math.PI / 2; sq.position.set(-6 + xi * 2 + 1, 0.04, -0.55 + zi * 1.1); scene.add(sq)
    }
  }
  return tiles
}

export function createRain(scene: THREE.Scene): THREE.Points {
  const count = 2800, geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 100
    pos[i * 3 + 1] = Math.random() * 55
    pos[i * 3 + 2] = (Math.random() - 0.5) * 160
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ color: 0x88aacc, size: 0.1, transparent: true, opacity: 0.45 })
  const rain = new THREE.Points(geo, mat); scene.add(rain); return rain
}

export function spawnSparks(scene: THREE.Scene, pos: THREE.Vector3) {
  const sparks: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = []
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0xffbb00, emissive: new THREE.Color(0xff6600), emissiveIntensity: 2.5 }))
    m.position.copy(pos)
    const v = new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10)
    scene.add(m); sparks.push({ mesh: m, vel: v, life: 0.7 })
  }
  return sparks
}

export function buildAICar(color: number): THREE.Group {
  const g = new THREE.Group()

  // ── MATERIALS ──────────────────────────────────────────────
  const bodyMat  = new THREE.MeshStandardMaterial({ color, metalness: 0.92, roughness: 0.08 })
  const bodyDark = new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.15 })
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.75, metalness: 0.25 })
  const chromeMat= new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 1.0, roughness: 0.03 })
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, transparent: true, opacity: 0.3, roughness: 0.0 })
  const redGlow  = new THREE.MeshStandardMaterial({ color: 0xff1500, emissive: new THREE.Color(0xff0800), emissiveIntensity: 1.8 })
  const whiteGlow= new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 2.0 })
  const orangeMat= new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: new THREE.Color(0xff4400), emissiveIntensity: 0.9 })
  const rubberMat= new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1.0 })
  const rimMat   = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.98, roughness: 0.04 })

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px=0,py=0,pz=0,rx=0,ry=0,rz=0) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(px,py,pz); m.rotation.set(rx,ry,rz)
    m.castShadow = true; m.receiveShadow = true; g.add(m); return m
  }

  // ── SAME EXTRUDED BODY PROFILE as GT-R R34 ─────────────────
  const s = new THREE.Shape()
  s.moveTo(2.28, 0.14); s.lineTo(2.38, 0.18); s.lineTo(2.42, 0.30)
  s.bezierCurveTo(2.32, 0.42, 2.08, 0.54, 1.82, 0.60)
  s.bezierCurveTo(1.38, 0.64, 0.88, 0.66, 0.52, 0.73)
  s.lineTo(0.45, 0.73)
  s.bezierCurveTo(0.32, 0.84, 0.12, 1.04, -0.1, 1.13)
  s.bezierCurveTo(-0.42, 1.19, -0.72, 1.19, -1.02, 1.17)
  s.bezierCurveTo(-1.28, 1.13, -1.52, 1.01, -1.66, 0.86)
  s.bezierCurveTo(-1.8, 0.78, -1.9, 0.74, -2.0, 0.72)
  s.lineTo(-2.08, 0.72)
  s.bezierCurveTo(-2.2, 0.70, -2.32, 0.64, -2.4, 0.56)
  s.lineTo(-2.45, 0.36); s.lineTo(-2.45, 0.20); s.lineTo(-2.38, 0.14); s.lineTo(2.28, 0.14)
  const fa = new THREE.Path(); fa.absarc(1.42, 0.33, 0.41, 0, Math.PI*2, true); s.holes.push(fa)
  const ra = new THREE.Path(); ra.absarc(-1.42, 0.33, 0.41, 0, Math.PI*2, true); s.holes.push(ra)

  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.88, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.05, bevelSegments: 4 })
  bodyGeo.center()
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
  bodyMesh.rotation.y = Math.PI / 2; bodyMesh.position.set(0, 0.02, 0)
  bodyMesh.castShadow = true; bodyMesh.receiveShadow = true; g.add(bodyMesh)

  // Floor + roof
  add(new THREE.BoxGeometry(1.86, 0.09, 4.55), darkMat, 0, 0.09, 0)
  add(new THREE.BoxGeometry(1.44, 0.07, 1.58), bodyDark, 0, 1.13, -0.12)

  // ── FRONT BUMPER ─────────────────────────────────────────────
  add(new THREE.BoxGeometry(1.1, 0.18, 0.06), darkMat, 0, 0.24, 2.36)
  for (let i=0;i<4;i++) add(new THREE.BoxGeometry(1.06,0.022,0.04), new THREE.MeshStandardMaterial({color:0x1a1a22,metalness:0.5}), 0, 0.17+i*0.048, 2.35)
  for (let i=0;i<7;i++) add(new THREE.BoxGeometry(0.022,0.18,0.04), new THREE.MeshStandardMaterial({color:0x1a1a22,metalness:0.5}), -0.5+i*0.17, 0.24, 2.35)
  add(new THREE.BoxGeometry(0.86,0.11,0.05), darkMat, 0, 0.46, 2.34)
  add(new THREE.BoxGeometry(1.98,0.065,0.55), darkMat, 0, 0.065, 2.12, 0.22)
  ;[-0.72, 0.72].forEach(x => {
    add(new THREE.BoxGeometry(0.28,0.14,0.055), darkMat, x, 0.24, 2.34)
    add(new THREE.BoxGeometry(0.2,0.08,0.038), new THREE.MeshStandardMaterial({color:0x222230,metalness:0.6}), x, 0.24, 2.35)
  })

  // ── HEADLIGHTS (same R34 style) ──────────────────────────────
  ;[[-0.64,0.56,2.31],[0.64,0.56,2.31]].forEach(([x,y,z]) => {
    add(new THREE.BoxGeometry(0.44,0.2,0.066), darkMat, x, y, z)
    add(new THREE.BoxGeometry(0.46,0.22,0.038), chromeMat, x, y, z-0.018)
    add(new THREE.BoxGeometry(0.2,0.09,0.048), whiteGlow, x+(x<0?-0.09:0.09), y+0.01, z+0.01)
    const proj = new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,0.036,14), whiteGlow)
    proj.rotation.x = Math.PI/2; proj.position.set(x+(x<0?0.1:-0.1), y+0.01, z+0.02); g.add(proj)
    add(new THREE.BoxGeometry(0.38,0.028,0.038), whiteGlow, x, y-0.074, z+0.01)
    add(new THREE.BoxGeometry(0.38,0.055,0.038), orangeMat, x, y+0.075, z+0.01)
    const sl = new THREE.SpotLight(0xfff5cc, 3.0, 55, Math.PI/6.5, 0.2)
    sl.position.set(x,y,z+0.5); sl.target.position.set(x*0.3,y-0.5,z+28)
    g.add(sl); g.add(sl.target)
  })

  // ── HOOD BULGE + VENTS ────────────────────────────────────────
  add(new THREE.BoxGeometry(0.32,0.042,1.12), bodyDark, 0, 0.67, 1.18, 0.11)
  ;[-0.44, 0.44].forEach(x => {
    add(new THREE.BoxGeometry(0.28,0.035,0.38), darkMat, x, 0.69, 1.16, 0.11)
    for (let vi=0;vi<3;vi++) add(new THREE.BoxGeometry(0.24,0.016,0.028), new THREE.MeshStandardMaterial({color:0x1a1a22}), x, 0.70, 1.06+vi*0.11, 0.11)
  })

  // ── WINDOWS ──────────────────────────────────────────────────
  add(new THREE.PlaneGeometry(1.48,0.68), glassMat, 0, 0.93, 0.66, -0.56)
  add(new THREE.PlaneGeometry(1.4,0.56), glassMat, 0, 0.93, -0.88, 0.53)
  ;[-0.84,0.84].forEach((x,i) => {
    add(new THREE.PlaneGeometry(0.66,0.34), glassMat, x, 0.92, 0.1, 0, i===0?Math.PI/2:-Math.PI/2)
    add(new THREE.PlaneGeometry(0.54,0.32), glassMat, x, 0.90, -0.58, 0, i===0?Math.PI/2:-Math.PI/2)
    add(new THREE.PlaneGeometry(0.24,0.28), glassMat, x, 0.90, -0.96, 0, i===0?Math.PI/2:-Math.PI/2)
  })

  // ── PILLARS + ROOF RAILS ──────────────────────────────────────
  ;[-0.77, 0.77].forEach(x => {
    add(new THREE.BoxGeometry(0.065,0.54,0.065), darkMat, x, 0.83, 0.56, -0.56)
    add(new THREE.BoxGeometry(0.055,0.5,0.055), darkMat, x, 0.82, -0.3)
    add(new THREE.BoxGeometry(0.065,0.45,0.065), darkMat, x, 0.81, -0.92, 0.5)
  })
  ;[-0.72, 0.72].forEach(x => add(new THREE.BoxGeometry(0.038,0.038,1.52), darkMat, x, 1.16, -0.1))

  // ── REAR FASCIA ───────────────────────────────────────────────
  add(new THREE.BoxGeometry(1.98,0.3,0.066), darkMat, 0, 0.22, -2.32)
  add(new THREE.BoxGeometry(1.84,0.13,0.6), darkMat, 0, 0.09, -2.12, -0.32)
  for (let fi=-3;fi<=3;fi++) add(new THREE.BoxGeometry(0.028,0.1,0.56), new THREE.MeshStandardMaterial({color:0x222230,metalness:0.5}), fi*0.27, 0.08, -2.14, -0.32)

  // ── TAILLIGHTS (same R34 round cluster) ──────────────────────
  ;[[-0.6,0.52,-2.32],[0.6,0.52,-2.32]].forEach(([x,y,z]) => {
    add(new THREE.BoxGeometry(0.54,0.18,0.062), darkMat, x, y, z)
    add(new THREE.BoxGeometry(0.34,0.12,0.048), redGlow, x, y, z+0.01)
    const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.038,14), redGlow)
    cl.rotation.x = Math.PI/2; cl.position.set(x+(x<0?-0.15:0.15), y, z+0.02); g.add(cl)
    const rev = new THREE.Mesh(new THREE.CylinderGeometry(0.044,0.044,0.038,12), whiteGlow)
    rev.rotation.x = Math.PI/2; rev.position.set(x+(x<0?0.19:-0.19), y, z+0.02); g.add(rev)
    add(new THREE.BoxGeometry(0.56,0.2,0.038), chromeMat, x, y, z-0.02)
    const tl = new THREE.PointLight(0xff2200,1.4,5); tl.position.set(x,y,z); g.add(tl)
  })
  add(new THREE.BoxGeometry(0.8,0.05,0.038), redGlow, 0, 0.67, -2.31)
  add(new THREE.BoxGeometry(0.22,0.065,0.028), chromeMat, 0, 0.56, -2.31)

  // ── SPOILER (same GT-R wing) ──────────────────────────────────
  add(new THREE.BoxGeometry(1.92,0.072,0.44), darkMat, 0, 1.18, -2.0)
  add(new THREE.BoxGeometry(1.87,0.032,0.09), chromeMat, 0, 1.13, -2.22)
  ;[-0.89,0.89].forEach(x => {
    add(new THREE.BoxGeometry(0.052,0.25,0.4), darkMat, x, 1.08, -2.0)
    add(new THREE.BoxGeometry(0.038,0.052,0.052), chromeMat, x, 1.2, -2.0)
  })
  ;[-0.72,0.72].forEach(x => add(new THREE.BoxGeometry(0.052,0.28,0.052), darkMat, x, 0.96, -2.0))

  // ── EXHAUSTS ─────────────────────────────────────────────────
  ;[[-0.42,0.14,-2.32],[0.42,0.14,-2.32]].forEach(([x,y,z]) => {
    const ep = new THREE.Mesh(new THREE.CylinderGeometry(0.064,0.07,0.33,16), chromeMat)
    ep.rotation.x=Math.PI/2; ep.position.set(x,y,z); g.add(ep)
    const ei = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.07,12), darkMat)
    ei.rotation.x=Math.PI/2; ei.position.set(x,y,z-0.15); g.add(ei)
  })

  // ── MIRRORS ──────────────────────────────────────────────────
  ;[-0.9,0.9].forEach((x,i) => {
    const mg = new THREE.Group()
    const mh = new THREE.Mesh(new THREE.BoxGeometry(0.148,0.115,0.22), bodyMat)
    mh.position.set(0,0,-0.07); mg.add(mh)
    const mgl = new THREE.Mesh(new THREE.PlaneGeometry(0.105,0.088), glassMat)
    mgl.position.set(i===0?-0.074:0.074, 0, -0.07); mgl.rotation.y = i===0?-Math.PI/2:Math.PI/2; mg.add(mgl)
    mg.position.set(x, 0.86, 0.56); g.add(mg)
  })

  // ── DOOR HANDLES ─────────────────────────────────────────────
  ;[-0.89,0.89].forEach((x,i) => add(new THREE.BoxGeometry(0.04,0.036,0.18), chromeMat, x+(i===0?-0.01:0.01), 0.74, -0.1, 0, i===0?0.08:-0.08))

  // ── FRONT SPLITTER ────────────────────────────────────────────
  add(new THREE.BoxGeometry(1.94,0.035,0.42), chromeMat, 0, 0.055, 2.2)

  // ── WHEELS (identical to player) ─────────────────────────────
  ;[[-1.06,0.33,1.44],[1.06,0.33,1.44],[-1.06,0.33,-1.44],[1.06,0.33,-1.44]].forEach(([x,y,z]) => {
    const wg = new THREE.Group()
    // Tire
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.302,0.112,24,48), rubberMat)
    tire.rotation.y=Math.PI/2; wg.add(tire)
    // Sidewall
    const swl = new THREE.Mesh(new THREE.CylinderGeometry(0.298,0.298,0.155,28), new THREE.MeshStandardMaterial({color:0x080808,roughness:0.98}))
    swl.rotation.z=Math.PI/2; wg.add(swl)
    // Rim face
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.255,0.255,0.048,28), rimMat)
    rf.rotation.z=Math.PI/2; wg.add(rf)
    // 5 spokes with fins
    for (let si=0;si<5;si++) {
      const ang=(si/5)*Math.PI*2
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.058,0.4,0.055), rimMat); sp.rotation.z=ang; wg.add(sp)
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.34,0.025), rimMat)
      fl.rotation.z=ang; fl.position.set(Math.cos(ang+0.18)*0.02, Math.sin(ang+0.18)*0.02, 0.038); wg.add(fl)
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.34,0.025), rimMat)
      fr.rotation.z=ang; fr.position.set(Math.cos(ang-0.18)*0.02, Math.sin(ang-0.18)*0.02, -0.038); wg.add(fr)
    }
    // Barrel + cap
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.185,0.205,0.21,24), new THREE.MeshStandardMaterial({color:0xbbbbbb,metalness:0.95,roughness:0.06}))
    barrel.rotation.z=Math.PI/2; wg.add(barrel)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.054,18), chromeMat); cap.rotation.z=Math.PI/2; wg.add(cap)
    const logo = new THREE.Mesh(new THREE.CylinderGeometry(0.042,0.042,0.056,12), new THREE.MeshStandardMaterial({color:0xcc0000,roughness:0.4})); logo.rotation.z=Math.PI/2; wg.add(logo)
    // Brake disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.02,24), new THREE.MeshStandardMaterial({color:0x5a6677,metalness:0.65,roughness:0.5}))
    disc.rotation.z=Math.PI/2; disc.position.x=x<0?0.052:-0.052; wg.add(disc)
    // Caliper
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.082,0.18,0.135), new THREE.MeshStandardMaterial({color:0xff1100,roughness:0.35,metalness:0.3}))
    caliper.position.set(x<0?0.108:-0.108, 0.165, 0); wg.add(caliper)
    // Lug nuts
    for (let li=0;li<5;li++) {
      const ang=(li/5)*Math.PI*2
      const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.028,6), chromeMat)
      lug.rotation.z=Math.PI/2; lug.position.set(0, Math.sin(ang)*0.175, Math.cos(ang)*0.175); wg.add(lug)
    }
    wg.position.set(x,y,z); g.add(wg)
  })

  g.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow=true; (o as THREE.Mesh).receiveShadow=true } })
  g.rotation.y = Math.PI
  return g
}

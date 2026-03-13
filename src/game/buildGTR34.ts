import * as THREE from 'three'

function mesh(
  group: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material,
  px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0
) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(px, py, pz); m.rotation.set(rx, ry, rz)
  m.castShadow = true; m.receiveShadow = true
  group.add(m); return m
}

function makeR34Profile(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(2.28, 0.14)
  s.lineTo(2.38, 0.18)
  s.lineTo(2.42, 0.30)
  s.bezierCurveTo(2.32, 0.42, 2.08, 0.54, 1.82, 0.60)
  s.bezierCurveTo(1.38, 0.64, 0.88, 0.66, 0.52, 0.73)
  s.lineTo(0.45, 0.73)
  s.bezierCurveTo(0.32, 0.84, 0.12, 1.04, -0.1, 1.13)
  s.bezierCurveTo(-0.42, 1.19, -0.72, 1.19, -1.02, 1.17)
  s.bezierCurveTo(-1.28, 1.13, -1.52, 1.01, -1.66, 0.86)
  s.bezierCurveTo(-1.8, 0.78, -1.9, 0.74, -2.0, 0.72)
  s.lineTo(-2.08, 0.72)
  s.bezierCurveTo(-2.2, 0.70, -2.32, 0.64, -2.4, 0.56)
  s.lineTo(-2.45, 0.36)
  s.lineTo(-2.45, 0.20)
  s.lineTo(-2.38, 0.14)
  s.lineTo(2.28, 0.14)
  // Front wheel arch
  const frontArch = new THREE.Path()
  frontArch.absarc(1.42, 0.33, 0.41, 0, Math.PI * 2, true)
  s.holes.push(frontArch)
  // Rear wheel arch
  const rearArch = new THREE.Path()
  rearArch.absarc(-1.42, 0.33, 0.41, 0, Math.PI * 2, true)
  s.holes.push(rearArch)
  return s
}

export function buildGTR34() {
  const car = new THREE.Group()

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7ec8e3, metalness: 0.94, roughness: 0.06 })
  const bodyDark = new THREE.MeshStandardMaterial({ color: 0x5cb0cc, metalness: 0.9, roughness: 0.1 })
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, transparent: true, opacity: 0.32, metalness: 0.05, roughness: 0.0 })
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.75, metalness: 0.25 })
  const chromeMat= new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 1.0, roughness: 0.02 })
  const redGlow  = new THREE.MeshStandardMaterial({ color: 0xff1500, emissive: new THREE.Color(0xff0800), emissiveIntensity: 1.8 })
  const whiteGlow= new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 2.2 })
  const orangeMat= new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: new THREE.Color(0xff4400), emissiveIntensity: 1.0 })
  const rubberMat= new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1.0 })
  const rimMat   = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.98, roughness: 0.04 })
  const neonMat  = new THREE.MeshStandardMaterial({ color: 0x00fff7, emissive: new THREE.Color(0x00fff7), emissiveIntensity: 3.0 })
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.9 })
  const seatMat  = new THREE.MeshStandardMaterial({ color: 0x120808, roughness: 0.85 })

  // ── EXTRUDED BODY SHELL ──────────────────────────────────────
  const bodyProfile = makeR34Profile()
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 1.88,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.055,
    bevelSegments: 5,
  }
  const bodyGeo = new THREE.ExtrudeGeometry(bodyProfile, extrudeSettings)
  bodyGeo.center()
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
  bodyMesh.rotation.y = Math.PI / 2
  bodyMesh.position.set(0, 0.02, 0)
  bodyMesh.castShadow = true
  bodyMesh.receiveShadow = true
  car.add(bodyMesh)

  // Floor pan
  mesh(car, new THREE.BoxGeometry(1.86, 0.09, 4.55), darkMat, 0, 0.09, 0)
  // Roof reinforcement
  mesh(car, new THREE.BoxGeometry(1.44, 0.07, 1.58), bodyDark, 0, 1.13, -0.12)

  // ── FRONT BUMPER ─────────────────────────────────────────────
  mesh(car, new THREE.BoxGeometry(1.1, 0.18, 0.06), darkMat, 0, 0.24, 2.36)
  for (let i = 0; i < 4; i++) mesh(car, new THREE.BoxGeometry(1.06, 0.022, 0.04), new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.5 }), 0, 0.17 + i * 0.048, 2.35)
  for (let i = 0; i < 7; i++) mesh(car, new THREE.BoxGeometry(0.022, 0.18, 0.04), new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.5 }), -0.5 + i * 0.17, 0.24, 2.35)
  mesh(car, new THREE.BoxGeometry(0.86, 0.11, 0.05), darkMat, 0, 0.46, 2.34)
  mesh(car, new THREE.BoxGeometry(1.98, 0.065, 0.55), darkMat, 0, 0.065, 2.12, 0.22)
  ;[-0.72, 0.72].forEach(x => {
    mesh(car, new THREE.BoxGeometry(0.28, 0.14, 0.055), darkMat, x, 0.24, 2.34)
    mesh(car, new THREE.BoxGeometry(0.2, 0.08, 0.038), new THREE.MeshStandardMaterial({ color: 0x222230, metalness: 0.6 }), x, 0.24, 2.35)
  })

  // ── HEADLIGHTS ───────────────────────────────────────────────
  ;[[-0.64, 0.56, 2.31], [0.64, 0.56, 2.31]].forEach(([x, y, z]) => {
    mesh(car, new THREE.BoxGeometry(0.44, 0.2, 0.066), darkMat, x, y, z)
    mesh(car, new THREE.BoxGeometry(0.46, 0.22, 0.038), chromeMat, x, y, z - 0.018)
    mesh(car, new THREE.BoxGeometry(0.2, 0.09, 0.048), whiteGlow, x + (x < 0 ? -0.09 : 0.09), y + 0.01, z + 0.01)
    const proj = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.036, 14), whiteGlow)
    proj.rotation.x = Math.PI / 2; proj.position.set(x + (x < 0 ? 0.1 : -0.1), y + 0.01, z + 0.02); car.add(proj)
    mesh(car, new THREE.BoxGeometry(0.38, 0.028, 0.038), whiteGlow, x, y - 0.074, z + 0.01)
    mesh(car, new THREE.BoxGeometry(0.38, 0.055, 0.038), orangeMat, x, y + 0.075, z + 0.01)
    const sl = new THREE.SpotLight(0xfff5cc, 5.0, 70, Math.PI / 6.5, 0.18)
    sl.position.set(x, y, z + 0.5); sl.target.position.set(x * 0.3, y - 0.5, z + 28)
    car.add(sl); car.add(sl.target)
  })

  // ── HOOD VENTS ───────────────────────────────────────────────
  mesh(car, new THREE.BoxGeometry(0.32, 0.042, 1.12), bodyDark, 0, 0.67, 1.18, 0.11)
  ;[-0.44, 0.44].forEach(x => {
    mesh(car, new THREE.BoxGeometry(0.28, 0.035, 0.38), darkMat, x, 0.69, 1.16, 0.11)
    for (let vi = 0; vi < 3; vi++) mesh(car, new THREE.BoxGeometry(0.24, 0.016, 0.028), new THREE.MeshStandardMaterial({ color: 0x1a1a22 }), x, 0.70, 1.06 + vi * 0.11, 0.11)
  })

  // ── WINDOWS ──────────────────────────────────────────────────
  mesh(car, new THREE.PlaneGeometry(1.48, 0.68), glassMat, 0, 0.93, 0.66, -0.56)
  mesh(car, new THREE.PlaneGeometry(1.4, 0.56), glassMat, 0, 0.93, -0.88, 0.53)
  ;[-0.84, 0.84].forEach((x, i) => {
    mesh(car, new THREE.PlaneGeometry(0.66, 0.34), glassMat, x, 0.92, 0.1, 0, i === 0 ? Math.PI/2 : -Math.PI/2)
    mesh(car, new THREE.PlaneGeometry(0.54, 0.32), glassMat, x, 0.90, -0.58, 0, i === 0 ? Math.PI/2 : -Math.PI/2)
    mesh(car, new THREE.PlaneGeometry(0.24, 0.28), glassMat, x, 0.90, -0.96, 0, i === 0 ? Math.PI/2 : -Math.PI/2)
  })

  // ── PILLARS ───────────────────────────────────────────────────
  ;[-0.77, 0.77].forEach(x => {
    mesh(car, new THREE.BoxGeometry(0.065, 0.54, 0.065), darkMat, x, 0.83, 0.56, -0.56)
    mesh(car, new THREE.BoxGeometry(0.055, 0.5, 0.055), darkMat, x, 0.82, -0.3)
    mesh(car, new THREE.BoxGeometry(0.065, 0.45, 0.065), darkMat, x, 0.81, -0.92, 0.5)
  })
  ;[-0.72, 0.72].forEach(x => mesh(car, new THREE.BoxGeometry(0.038, 0.038, 1.52), darkMat, x, 1.16, -0.1))

  // ── REAR ─────────────────────────────────────────────────────
  mesh(car, new THREE.BoxGeometry(1.98, 0.3, 0.066), darkMat, 0, 0.22, -2.32)
  mesh(car, new THREE.BoxGeometry(1.84, 0.13, 0.6), darkMat, 0, 0.09, -2.12, -0.32)
  for (let fi = -3; fi <= 3; fi++) mesh(car, new THREE.BoxGeometry(0.028, 0.1, 0.56), new THREE.MeshStandardMaterial({ color: 0x222230, metalness: 0.5 }), fi * 0.27, 0.08, -2.14, -0.32)

  // ── TAILLIGHTS ────────────────────────────────────────────────
  ;[[-0.6, 0.52, -2.32], [0.6, 0.52, -2.32]].forEach(([x, y, z]) => {
    mesh(car, new THREE.BoxGeometry(0.54, 0.18, 0.062), darkMat, x, y, z)
    mesh(car, new THREE.BoxGeometry(0.34, 0.12, 0.048), redGlow, x, y, z + 0.01)
    const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.038, 14), redGlow)
    cl.rotation.x = Math.PI/2; cl.position.set(x + (x < 0 ? -0.15 : 0.15), y, z + 0.02); car.add(cl)
    const rev = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.038, 12), whiteGlow)
    rev.rotation.x = Math.PI/2; rev.position.set(x + (x < 0 ? 0.19 : -0.19), y, z + 0.02); car.add(rev)
    mesh(car, new THREE.BoxGeometry(0.56, 0.2, 0.038), chromeMat, x, y, z - 0.02)
    const tl = new THREE.PointLight(0xff2200, 1.6, 5); tl.position.set(x, y, z); car.add(tl)
  })
  mesh(car, new THREE.BoxGeometry(0.8, 0.05, 0.038), redGlow, 0, 0.67, -2.31)
  mesh(car, new THREE.BoxGeometry(0.34, 0.19, 0.038), new THREE.MeshStandardMaterial({ color: 0xffffff }), 0, 0.32, -2.33)
  mesh(car, new THREE.BoxGeometry(0.22, 0.065, 0.028), chromeMat, 0, 0.56, -2.31)

  // ── SPOILER ───────────────────────────────────────────────────
  mesh(car, new THREE.BoxGeometry(1.92, 0.072, 0.44), darkMat, 0, 1.18, -2.0)
  mesh(car, new THREE.BoxGeometry(1.87, 0.032, 0.09), chromeMat, 0, 1.13, -2.22)
  ;[-0.89, 0.89].forEach(x => {
    mesh(car, new THREE.BoxGeometry(0.052, 0.25, 0.4), darkMat, x, 1.08, -2.0)
    mesh(car, new THREE.BoxGeometry(0.038, 0.052, 0.052), chromeMat, x, 1.2, -2.0)
  })
  ;[-0.72, 0.72].forEach(x => mesh(car, new THREE.BoxGeometry(0.052, 0.28, 0.052), darkMat, x, 0.96, -2.0))

  // ── EXHAUSTS ──────────────────────────────────────────────────
  ;[[-0.42, 0.14, -2.32], [0.42, 0.14, -2.32]].forEach(([x, y, z]) => {
    const ep = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.07, 0.33, 16), chromeMat)
    ep.rotation.x = Math.PI/2; ep.position.set(x, y, z); car.add(ep)
    const ei = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 12), darkMat)
    ei.rotation.x = Math.PI/2; ei.position.set(x, y, z - 0.15); car.add(ei)
    const eh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.065, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x7a5533, metalness: 0.7, roughness: 0.3 }))
    eh.rotation.x = Math.PI/2; eh.position.set(x, y, z + 0.1); car.add(eh)
  })

  // ── MIRRORS ───────────────────────────────────────────────────
  ;[-0.9, 0.9].forEach((x, i) => {
    const mg = new THREE.Group()
    mesh(mg, new THREE.BoxGeometry(0.052, 0.052, 0.19), darkMat)
    mesh(mg, new THREE.BoxGeometry(0.148, 0.115, 0.22), new THREE.MeshStandardMaterial({ color: 0x7ec8e3, metalness: 0.92, roughness: 0.08 }), 0, 0, -0.07)
    const mgl = new THREE.Mesh(new THREE.PlaneGeometry(0.105, 0.088), glassMat)
    mgl.position.set(i === 0 ? -0.074 : 0.074, 0, -0.07); mgl.rotation.y = i === 0 ? -Math.PI/2 : Math.PI/2; mg.add(mgl)
    mg.position.set(x, 0.86, 0.56); car.add(mg)
  })

  // ── DOOR HANDLES ──────────────────────────────────────────────
  ;[-0.89, 0.89].forEach((x, i) => mesh(car, new THREE.BoxGeometry(0.04, 0.036, 0.18), chromeMat, x + (i===0?-0.01:0.01), 0.74, -0.1, 0, i===0?0.08:-0.08))

  // ── INTERIOR ──────────────────────────────────────────────────
  mesh(car, new THREE.BoxGeometry(1.46, 0.15, 0.5), interiorMat, 0, 0.79, 0.64)
  mesh(car, new THREE.BoxGeometry(1.42, 0.065, 0.18), new THREE.MeshStandardMaterial({ color: 0x0a0a12 }), 0, 0.87, 0.54)
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.021, 8, 24), darkMat)
  sw.position.set(-0.28, 0.83, 0.5); sw.rotation.set(-0.44, 0.18, 0); car.add(sw)
  mesh(car, new THREE.BoxGeometry(0.018, 0.28, 0.018), darkMat, -0.28, 0.83, 0.5, -0.44, 0.18)
  mesh(car, new THREE.BoxGeometry(0.25, 0.018, 0.018), darkMat, -0.28, 0.83, 0.5, -0.44, 0.18)
  mesh(car, new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), darkMat, -0.28, 0.73, 0.6, 0.44)
  ;[-0.32, 0.32].forEach(x => {
    mesh(car, new THREE.BoxGeometry(0.34, 0.38, 0.38), seatMat, x, 0.59, -0.18)
    mesh(car, new THREE.BoxGeometry(0.32, 0.42, 0.072), seatMat, x, 0.82, -0.38)
    mesh(car, new THREE.BoxGeometry(0.052, 0.4, 0.068), new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.8 }), x, 0.82, -0.375)
  })
  mesh(car, new THREE.BoxGeometry(0.18, 0.22, 0.66), interiorMat, 0, 0.57, -0.02)
  mesh(car, new THREE.CylinderGeometry(0.016, 0.013, 0.17, 8), chromeMat, 0, 0.73, -0.12)
  mesh(car, new THREE.SphereGeometry(0.036, 12, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }), 0, 0.82, -0.12)

  // ── NEON UNDERCAR ─────────────────────────────────────────────
  mesh(car, new THREE.BoxGeometry(1.7, 0.009, 4.0), neonMat, 0, 0.037, 0)
  ;[[0,0.037,0,2.5,4.5],[0,0.037,1.8,1.2,3],[0,0.037,-1.8,1.2,3]].forEach(([x,y,z,i,d])=>{
    const l = new THREE.PointLight(0x00fff7, i, d); l.position.set(x,y,z); car.add(l)
  })

  // ── WHEELS ────────────────────────────────────────────────────
  const wheels: THREE.Group[] = []
  ;[[-1.06,0.33,1.44],[1.06,0.33,1.44],[-1.06,0.33,-1.44],[1.06,0.33,-1.44]].forEach(([x,y,z])=>{
    const wg = new THREE.Group()
    // Tire
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.302, 0.112, 24, 48), rubberMat)
    tire.rotation.y = Math.PI/2; wg.add(tire)
    // Sidewall
    const swl = new THREE.Mesh(new THREE.CylinderGeometry(0.298, 0.298, 0.155, 28), new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.98 }))
    swl.rotation.z = Math.PI/2; wg.add(swl)
    // Rim face
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.048, 28), rimMat)
    rf.rotation.z = Math.PI/2; wg.add(rf)
    // 5 spokes
    for (let si = 0; si < 5; si++) {
      const ang = (si/5)*Math.PI*2
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.4, 0.055), rimMat)
      sp.rotation.z = ang; wg.add(sp)
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.025), rimMat)
      fl.rotation.z = ang; fl.position.set(Math.cos(ang+0.18)*0.02, Math.sin(ang+0.18)*0.02, 0.038); wg.add(fl)
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.025), rimMat)
      fr.rotation.z = ang; fr.position.set(Math.cos(ang-0.18)*0.02, Math.sin(ang-0.18)*0.02, -0.038); wg.add(fr)
    }
    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.205, 0.21, 24), new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.95, roughness: 0.06 }))
    barrel.rotation.z = Math.PI/2; wg.add(barrel)
    // Center cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.054, 18), chromeMat)
    cap.rotation.z = Math.PI/2; wg.add(cap)
    const logo = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.056, 12), new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 }))
    logo.rotation.z = Math.PI/2; wg.add(logo)
    // Brake disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0x5a6677, metalness: 0.65, roughness: 0.5 }))
    disc.rotation.z = Math.PI/2; disc.position.x = x < 0 ? 0.052 : -0.052; wg.add(disc)
    for (let vi = 0; vi < 10; vi++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.13, 0.022), new THREE.MeshStandardMaterial({ color: 0x222233 }))
      slot.rotation.z = (vi/10)*Math.PI*2; slot.position.x = x < 0 ? 0.052 : -0.052; wg.add(slot)
    }
    // Caliper
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.18, 0.135), new THREE.MeshStandardMaterial({ color: 0xff1100, roughness: 0.35, metalness: 0.3 }))
    caliper.position.set(x < 0 ? 0.108 : -0.108, 0.165, 0); wg.add(caliper)
    ;[-0.048, 0.048].forEach(bz => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.048, 6), chromeMat)
      bolt.rotation.z = Math.PI/2; bolt.position.set(x < 0 ? 0.128 : -0.128, 0.165, bz); wg.add(bolt)
    })
    // Lug nuts
    for (let li = 0; li < 5; li++) {
      const ang = (li/5)*Math.PI*2
      const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.028, 6), chromeMat)
      lug.rotation.z = Math.PI/2; lug.position.set(0, Math.sin(ang)*0.175, Math.cos(ang)*0.175); wg.add(lug)
    }
    wg.position.set(x, y, z); car.add(wg); wheels.push(wg)
  })

  car.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; (o as THREE.Mesh).receiveShadow = true } })
  car.rotation.y = Math.PI

  return { car, wheels }
}

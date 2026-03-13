import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AudioEngine } from "./AudioEngine";
import { buildGTR34 } from "./buildGTR34";
import {
  buildAICar,
  buildRoadTiles,
  buildStaticWorld,
  createRain,
  TILE_COUNT,
  TILE_LEN,
} from "./buildWorld";

const MAX_SPEED_MS = 111; // 400 km/h
const LAP_DIST = 500;

interface UIState {
  phase: string;
  speed: number;
  gear: number;
  lap: number;
  lapTime: string;
  bestLap: string | null;
  nitro: number;
  position: number;
  showHUD: boolean;
  titleAlpha: number;
  showStart: boolean;
  finish: boolean;
  place: number;
  countdown: string;
  hit: boolean;
  cameraMode: number;
  raceTime: string;
  raceTimeLow: boolean;
}

export default function SkylineRacing() {
  const mountRef = useRef<HTMLDivElement>(null);
  const audio = useRef(new AudioEngine());
  const [ui, setUi] = useState<UIState>({
    phase: "intro",
    speed: 0,
    gear: 1,
    lap: 1,
    lapTime: "0.00",
    bestLap: null,
    nitro: 100,
    position: 1,
    showHUD: false,
    titleAlpha: 0,
    showStart: false,
    finish: false,
    place: 1,
    countdown: "",
    hit: false,
    cameraMode: 0,
    raceTime: "2:00",
    raceTimeLow: false,
  });

  useEffect(() => {
    const au = audio.current;
    const W = mountRef.current!.clientWidth;
    const H = mountRef.current!.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountRef.current!.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1a2e, 120, 400);
    scene.background = new THREE.Color(0x0a1a2e);

    scene.add(new THREE.AmbientLight(0x223355, 1.6));
    const dir = new THREE.DirectionalLight(0x99bbdd, 1.8);
    dir.position.set(14, 30, 15);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.far = 400;
    dir.shadow.camera.left = -80;
    dir.shadow.camera.right = 80;
    dir.shadow.camera.top = 80;
    dir.shadow.camera.bottom = -80;
    scene.add(dir);
    const fillLight = new THREE.DirectionalLight(0x6688aa, 1.2);
    fillLight.position.set(-10, 15, 20);
    scene.add(fillLight);
    scene.add(new THREE.HemisphereLight(0x334466, 0x111122, 1.0));

    buildStaticWorld(scene);
    const roadTiles = buildRoadTiles(scene);
    const rain = createRain(scene);
    let sparks: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

    const { car: playerCar, wheels } = buildGTR34();
    playerCar.position.set(0, 0, 0);
    scene.add(playerCar);

    const AI_CFG = [
      { color: 0xff3333, name: "GHOST", base: 21, lane: -4.0 },
      { color: 0x33ee88, name: "RYUJI", base: 20, lane: -2.0 },
      { color: 0xffaa00, name: "MAKO", base: 22, lane: 0.5 },
      { color: 0xff44ff, name: "KEN", base: 19, lane: 2.2 },
      { color: 0x44ddff, name: "TSURU", base: 20, lane: 4.0 },
    ];
    const aiCars = AI_CFG.map((c, i) => {
      const g = buildAICar(c.color);
      const az = -(i + 1) * 7;
      g.position.set(c.lane, 0, az);
      scene.add(g);
      return {
        group: g,
        x: c.lane,
        z: az,
        speed: c.base,
        targetX: c.lane,
        turnTimer: Math.random() * 1.5,
        base: c.base,
        name: c.name,
      };
    });

    const camera = new THREE.PerspectiveCamera(68, W / H, 0.1, 600);
    camera.position.set(0, 3.5, 10);
    camera.lookAt(0, 0, -10);

    let phase = "intro",
      introClock = 0,
      titleAlpha = 0;
    let carX = 0,
      carZ = 0,
      carSpeed = 0;
    let nitro = 100,
      nitroActive = false,
      lastNitroPop = 0;
    let lapTime = 0,
      bestLap: number | null = null,
      lap = 1;
    let lapProgress = 0;
    let cameraMode = 0,
      keys: Record<string, boolean> = {};
    let raceStarted = false,
      engineStarted = false;
    // ✅ FIX 1: play intro music on first user interaction (browser blocks autoplay before click)
    const startIntroMusic = () => {
      au.boot();
      au.playIntroMusic();
    };
    window.addEventListener("click", startIntroMusic, { once: true });
    window.addEventListener("keydown", startIntroMusic, { once: true });
    let raceTimeLeft = 120;

    // ── CHANGE 1: handle Enter on lap1cinematic to resume racing ──
    const kd = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Enter" && (phase === "intro" || phase === "menu"))
        triggerStart();
      if (e.code === "Enter" && phase === "lap1cinematic")
        resumeFromCinematic();
      if (e.code === "KeyC" && phase === "racing") {
        cameraMode = (cameraMode + 1) % 3;
        setUi((u) => ({ ...u, cameraMode }));
      }
    };
    const ku = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    function triggerStart() {
      if (phase === "countdown" || phase === "racing") return;
      // ✅ FIX 2: remove first-interaction listeners so music cant restart
      window.removeEventListener("click", startIntroMusic);
      window.removeEventListener("keydown", startIntroMusic);
      au.stopIntroMusic();
      phase = "countdown";
      setUi((u) => ({
        ...u,
        phase: "countdown",
        showHUD: false,
        countdown: "3",
      }));
      au.boot();
      au.playCountdown(() => {
        phase = "racing";
        raceStarted = true;
        if (!engineStarted) {
          au.startEngine();
          engineStarted = true;
        }
        setUi((u) => ({ ...u, phase: "racing", showHUD: true, countdown: "" }));
      });
      let c = 3;
      const iv = setInterval(() => {
        c--;
        if (c === 0) setUi((u) => ({ ...u, countdown: "GO!" }));
        else if (c < 0) clearInterval(iv);
        else setUi((u) => ({ ...u, countdown: String(c) }));
      }, 900);
    }

    // ── CHANGE 2: resume from lap 1 cinematic back to racing ──
    function resumeFromCinematic() {
      au.stopIntroMusic2(); // fades out Intro2, auto-resumes engine inside AudioEngine
      phase = "racing";
      setUi((u) => ({ ...u, phase: "racing", showHUD: true }));
    }

    let last = 0,
      animId: number;
    function loop(ts: number) {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      const rp = rain.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < rp.count; i++) {
        rp.setY(i, rp.getY(i) - 28 * dt);
        if (rp.getY(i) < -1) rp.setY(i, 55);
      }
      rp.needsUpdate = true;

      sparks = sparks.filter((s) => {
        s.life -= dt;
        if (s.life <= 0) {
          scene.remove(s.mesh);
          return false;
        }
        s.vel.y -= 20 * dt;
        s.mesh.position.addScaledVector(s.vel, dt);
        (s.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          s.life * 3.5;
        return true;
      });

      roadTiles.forEach((tile) => {
        if (tile.position.z - carZ > TILE_LEN * 2)
          tile.position.z -= TILE_COUNT * TILE_LEN;
        if (tile.position.z - carZ < -(TILE_COUNT - 1) * TILE_LEN)
          tile.position.z += TILE_COUNT * TILE_LEN;
      });

      if (phase === "intro") {
        introClock += dt;

        titleAlpha = Math.min(introClock / 1.5, 1);
        const r = 7.5,
          ang = -Math.PI / 2 + introClock * 0.22;
        camera.position.set(
          carX + Math.cos(ang) * r,
          2.5,
          carZ + Math.sin(ang) * r,
        );
        camera.lookAt(carX, 0.8, carZ);
        if (introClock > 8) phase = "menu";
        setUi((u) => ({
          ...u,
          phase: "intro",
          titleAlpha,
          showStart: introClock > 5.5,
        }));
      } else if (phase === "menu") {
        introClock += dt;
        const r = 6,
          ang = -Math.PI / 2 + introClock * 0.18;
        camera.position.set(
          carX + Math.cos(ang) * r,
          2,
          carZ + Math.sin(ang) * r,
        );
        camera.lookAt(carX, 0.7, carZ);
        setUi((u) => ({ ...u, phase: "menu", showStart: true }));
      } else if (phase === "countdown") {
        introClock += dt;
        const r = 7,
          ang = -Math.PI / 2 + introClock * 0.12;
        camera.position.set(
          carX + Math.cos(ang) * r,
          2.8,
          carZ + Math.sin(ang) * r,
        );
        camera.lookAt(carX, 0.8, carZ);
      }

      // ── CHANGE 3: lap1cinematic phase — slow orbit camera around car ──
      else if (phase === "lap1cinematic") {
        introClock += dt;
        const ang = -Math.PI / 2 + introClock * 0.18;
        camera.position.set(
          carX + Math.cos(ang) * 8,
          3.5,
          carZ + Math.sin(ang) * 8,
        );
        camera.lookAt(carX, 0.8, carZ);
        // no setUi needed here — React state already set when we entered this phase
      } else if (phase === "racing") {
        lapTime += dt;
        raceTimeLeft = Math.max(0, raceTimeLeft - dt);

        const accel = keys["ArrowUp"] || keys["KeyW"];
        const brake = keys["ArrowDown"] || keys["KeyS"];
        const left = keys["ArrowLeft"] || keys["KeyA"];
        const right = keys["ArrowRight"] || keys["KeyD"];
        const nitroKey = keys["KeyN"];
        const drift = keys["ShiftLeft"] || keys["ShiftRight"];

        const maxS = nitroActive ? MAX_SPEED_MS : MAX_SPEED_MS * 0.75;
        if (accel) carSpeed = Math.min(carSpeed + 40 * dt, maxS);
        else if (brake) carSpeed = Math.max(carSpeed - 60 * dt, -22);
        else
          carSpeed =
            carSpeed > 0
              ? Math.max(carSpeed - 28 * dt, 0)
              : Math.min(carSpeed + 18 * dt, 0);

        if (nitroKey && nitro > 0) {
          nitroActive = true;
          nitro = Math.max(0, nitro - 32 * dt);
          if (ts - lastNitroPop > 700) {
            au.playNitro();
            lastNitroPop = ts;
          }
        } else {
          nitroActive = false;
          if (!accel) nitro = Math.min(100, nitro + 7 * dt);
        }

        if (drift && Math.abs(carSpeed) > 15) au.playTireScreech();

        const speedFactor = Math.max(
          1 - Math.abs(carSpeed) / (MAX_SPEED_MS * 1.4),
          0.18,
        );
        const turnRate = 3.0 * speedFactor;
        if (left)
          carX = Math.max(
            -5.4,
            carX - turnRate * dt * Math.max(Math.abs(carSpeed), 8) * 0.12,
          );
        if (right)
          carX = Math.min(
            5.4,
            carX + turnRate * dt * Math.max(Math.abs(carSpeed), 8) * 0.12,
          );
        const steerLean =
          (right ? -1 : left ? 1 : 0) *
          Math.min(Math.abs(carSpeed) / (MAX_SPEED_MS * 0.5), 1) *
          0.1;

        carZ -= carSpeed * dt;
        lapProgress += Math.abs(carSpeed) * dt;
        playerCar.position.set(carX, 0, carZ);
        playerCar.rotation.y = Math.PI + steerLean;
        wheels.forEach((w) => {
          w.rotation.x -= carSpeed * dt * 0.6;
        });

        aiCars.forEach((ai) => {
          ai.turnTimer -= dt;
          const dz = carZ - ai.z;
          const tgtSpd =
            ai.base +
            (dz < -12 ? 9 : dz > 30 ? -5 : 0) +
            Math.sin(lapTime * 0.25) * 2;
          ai.speed += (tgtSpd - ai.speed) * dt * 0.4;

          if (ai.turnTimer < 0) {
            const near =
              Math.abs(ai.x - carX) < 2.3 && Math.abs(ai.z - carZ) < 5.5;
            if (near) ai.targetX = carX > 0 ? -2.8 : 2.8;
            else if (dz < -8) ai.targetX = carX + (Math.random() - 0.5) * 3;
            else ai.targetX = ai.x + (Math.random() - 0.5) * 2;
            ai.targetX = Math.max(-5.2, Math.min(5.2, ai.targetX));
            ai.turnTimer = 0.7 + Math.random() * 1.4;
          }
          ai.x += (ai.targetX - ai.x) * dt * 2.2;
          ai.z -= ai.speed * dt;
          if (ai.z > carZ + 65) ai.z = carZ - 80 - Math.random() * 20;
          ai.group.position.set(ai.x, 0, ai.z);
          ai.group.rotation.y = Math.PI + (ai.targetX - ai.x) * 0.13;

          const cx = Math.abs(ai.x - carX);
          const cz2 = Math.abs(ai.z - carZ);
          if (cx < 2.1 && cz2 < 4.3) {
            au.playCollision(Math.max(Math.abs(carSpeed - ai.speed) / 60, 0.4));
            const push = carX > ai.x ? 1 : -1;
            carX = Math.max(-5.4, Math.min(5.4, carX + push * 1.5));
            ai.x = Math.max(-5.2, Math.min(5.2, ai.x - push * 1.0));
            carSpeed *= 0.75;
            ai.speed *= 0.65;
            const sPos = new THREE.Vector3(
              (carX + ai.x) / 2,
              0.5,
              (carZ + ai.z) / 2,
            );
            for (let p = 0; p < 18; p++) {
              const m = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 4, 4),
                new THREE.MeshStandardMaterial({
                  color: 0xffbb00,
                  emissive: new THREE.Color(0xff6600),
                  emissiveIntensity: 2.5,
                }),
              );
              m.position.copy(sPos);
              const v = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 8,
                (Math.random() - 0.5) * 10,
              );
              scene.add(m);
              sparks.push({ mesh: m, vel: v, life: 0.7 });
            }
            setUi((u) => ({ ...u, hit: true }));
            setTimeout(() => setUi((u) => ({ ...u, hit: false })), 280);
          }
        });

        // ── CHANGE 4: lap 1 complete → cinematic instead of continuing ──
        if (lapProgress >= LAP_DIST) {
          lapProgress -= LAP_DIST;
          if (bestLap === null || lapTime < bestLap) bestLap = lapTime;
          lapTime = 0;
          lap++;

          if (lap === 2) {
            // Lap 1 just completed → show cinematic title screen
            phase = "lap1cinematic";
            carSpeed = 0; // stop the car during cinematic
            au.playLapChime();
            au.playIntroMusic2(); // play Intro2.mp3
            introClock = 0; // reset so orbit camera starts fresh
            setUi((u) => ({
              ...u,
              phase: "lap1cinematic",
              showHUD: false,
              lap: 2,
            }));
          } else if (lap > 3 || raceTimeLeft <= 0) {
            phase = "finish";
            au.stopEngine();
            au.playVictory();
            const fp = 1 + aiCars.filter((a) => a.z < carZ).length;
            setUi((u) => ({ ...u, phase: "finish", finish: true, place: fp }));
          } else {
            au.playLapChime();
          }
        }

        if (raceTimeLeft <= 0 && phase === "racing") {
          phase = "finish";
          au.stopEngine();
          au.playVictory();
          const fp = 1 + aiCars.filter((a) => a.z < carZ).length;
          setUi((u) => ({ ...u, phase: "finish", finish: true, place: fp }));
        }

        const spd = Math.abs(carSpeed);

        if (cameraMode === 0) {
          // VERY CLOSE chase camera
          const dist = Math.min(3.2, 2.4 + spd * 0.006);
          const th = 1.55 + spd * 0.001;

          camera.position.lerp(
            new THREE.Vector3(carX * 0.25, th, carZ + dist),
            0.14,
          );

          camera.lookAt(
            carX * 0.7 + (right ? -1.2 : left ? 1.2 : 0),
            0.85,
            carZ - 14,
          );
        } else if (cameraMode === 1) {
          // hood camera
          camera.position.set(carX, 1.1, carZ - 1.2);

          camera.lookAt(carX + (right ? -2 : left ? 2 : 0), 1.0, carZ - 40);
        } else {
          // cinematic camera
          const sw = Math.sin(lapTime * 0.12) > 0 ? 12 : -12;

          camera.position.lerp(new THREE.Vector3(carX + sw, 4.2, carZ), 0.05);

          camera.lookAt(carX, 0.8, carZ - 5);
        }

        au.updateEngine(spd * 3.6, nitroActive);
        const gear =
          spd < 12
            ? 1
            : spd < 26
              ? 2
              : spd < 45
                ? 3
                : spd < 65
                  ? 4
                  : spd < 88
                    ? 5
                    : 6;
        const pos = 1 + aiCars.filter((a) => a.z < carZ).length;
        const mm = Math.floor(raceTimeLeft / 60);
        const ss = String(Math.floor(raceTimeLeft % 60)).padStart(2, "0");
        setUi((u) => ({
          ...u,
          speed: Math.round(spd * 3.6),
          gear,
          lap: Math.min(lap, 3),
          lapTime: lapTime.toFixed(2),
          bestLap: bestLap ? bestLap.toFixed(2) : null,
          nitro: Math.round(nitro),
          position: pos,
          showHUD: true,
          raceTime: `${mm}:${ss}`,
          raceTimeLow: raceTimeLeft < 30,
        }));
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      const w = mountRef.current?.clientWidth || window.innerWidth;
      const h = mountRef.current?.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("click", startIntroMusic);
      window.removeEventListener("keydown", startIntroMusic);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", onResize);
      au.stopEngine();
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
  }, []);

  const camLabels = ["Chase Cam", "Hood Cam", "Cinematic"];
  const aiColors = ["#ff5555", "#44ff99", "#ffaa33", "#ff55ff", "#44ddff"];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Film grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.022) 2px,rgba(0,0,0,0.022) 4px)",
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* INTRO / MENU */}
      {(ui.phase === "intro" || ui.phase === "menu") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "8%",
              background: "#000",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "8%",
              background: "#000",
            }}
          />
          <div
            style={{
              opacity: ui.titleAlpha,
              transition: "opacity 0.5s",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "clamp(46px,9vw,104px)",
                fontWeight: 900,
                letterSpacing: "0.32em",
                color: "#87ceeb",
                textShadow: "0 0 50px #87ceeb,0 0 100px #00cfff,0 5px 2px #000",
                textTransform: "uppercase",
              }}
            >
              SKYLINE
            </div>
            <div
              style={{
                fontSize: "clamp(11px,2vw,19px)",
                letterSpacing: "0.56em",
                color: "#aaddff",
                textShadow: "0 0 20px #00cfff",
                marginTop: "-6px",
                fontWeight: 300,
                textTransform: "uppercase",
              }}
            >
              STREET &nbsp; CHRONICLES
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: "clamp(9px,1.3vw,13px)",
                color: "#2a3a4a",
                letterSpacing: "0.3em",
              }}
            >
              NISSAN GT-R R34 &nbsp;·&nbsp; TOKYO DOCKS &nbsp;·&nbsp; 3 LAPS
              &nbsp;·&nbsp; 2 MIN
            </div>
          </div>
          {ui.showStart && (
            <div
              style={{
                marginTop: 54,
                fontSize: "clamp(11px,1.7vw,16px)",
                letterSpacing: "0.45em",
                color: "#fff",
                textShadow: "0 0 14px #87ceeb",
                animation: "blink 1.1s infinite",
                pointerEvents: "auto",
                cursor: "pointer",
              }}
              onClick={() => {
                audio.current.boot();
                window.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    code: "Enter",
                    bubbles: true,
                  }),
                );
              }}
            >
              PRESS ENTER / CLICK TO RACE
            </div>
          )}
        </div>
      )}

      {/* COUNTDOWN */}
      {ui.phase === "countdown" && ui.countdown && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize:
                ui.countdown === "GO!"
                  ? "clamp(62px,12vw,135px)"
                  : "clamp(84px,16vw,200px)",
              fontWeight: 900,
              color: ui.countdown === "GO!" ? "#39ff14" : "#ffffff",
              textShadow: `0 0 80px ${ui.countdown === "GO!" ? "#39ff14" : "#fff"}`,
              animation: "pop 0.24s ease-out",
            }}
          >
            {ui.countdown}
          </div>
        </div>
      )}

      {/* ── LAP 1 CINEMATIC TITLE SCREEN ── */}
      {ui.phase === "lap1cinematic" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            pointerEvents: "none",
          }}
        >
          {/* Cinematic black bars */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "12%",
              background: "#000",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "12%",
              background: "#000",
            }}
          />
          <div
            style={{
              textAlign: "center",
              animation: "fadeInUp 1.2s ease-out both",
            }}
          >
            <div
              style={{
                fontSize: "clamp(9px,1.4vw,13px)",
                letterSpacing: "0.65em",
                color: "#556677",
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              Round 2 Begins
            </div>
            <div
              style={{
                fontSize: "clamp(46px,9vw,104px)",
                fontWeight: 900,
                letterSpacing: "0.32em",
                color: "#87ceeb",
                textShadow:
                  "0 0 50px #87ceeb, 0 0 100px #00cfff, 0 5px 2px #000",
                textTransform: "uppercase",
              }}
            >
              SKYLINE
            </div>
            <div
              style={{
                fontSize: "clamp(11px,2vw,19px)",
                letterSpacing: "0.56em",
                color: "#aaddff",
                textShadow: "0 0 20px #00cfff",
                marginTop: "-6px",
                fontWeight: 300,
                textTransform: "uppercase",
              }}
            >
              STREET &nbsp; CHRONICLES
            </div>
            <div
              style={{
                marginTop: 24,
                fontSize: "clamp(9px,1.3vw,13px)",
                color: "#2a3a4a",
                letterSpacing: "0.3em",
              }}
            >
              LAP 1 COMPLETE &nbsp;·&nbsp; 2 LAPS REMAINING
            </div>
          </div>
          <div
            style={{
              marginTop: 52,
              fontSize: "clamp(11px,1.6vw,15px)",
              letterSpacing: "0.45em",
              color: "#fff",
              textShadow: "0 0 14px #87ceeb",
              animation: "blink 1.1s infinite",
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            onClick={() => {
              audio.current.stopIntroMusic2();
              audio.current["resumeEngine"] &&
                (audio.current as any).resumeEngine();
              window.dispatchEvent(
                new KeyboardEvent("keydown", { code: "Enter", bubbles: true }),
              );
            }}
          >
            PRESS ENTER / CLICK TO CONTINUE
          </div>
        </div>
      )}

      {/* HUD */}
      {ui.showHUD && ui.phase === "racing" && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              textAlign: "right",
              lineHeight: 1.1,
            }}
          >
            <div
              style={{
                fontSize: "clamp(38px,6vw,74px)",
                fontWeight: 900,
                color: "#87ceeb",
                textShadow: "0 0 14px #00cfff",
              }}
            >
              {ui.speed}
            </div>
            <div
              style={{
                fontSize: "clamp(9px,1.2vw,13px)",
                letterSpacing: "0.3em",
                color: "#2a4a5a",
              }}
            >
              KM/H
            </div>
            <div
              style={{
                fontSize: "clamp(15px,2.2vw,24px)",
                color: "#667788",
                marginTop: 2,
              }}
            >
              GEAR {ui.gear}
            </div>
            {ui.speed >= 360 && (
              <div
                style={{
                  fontSize: "clamp(9px,1.1vw,12px)",
                  color: "#ff2d78",
                  animation: "blink 0.4s infinite",
                  letterSpacing: "0.2em",
                  marginTop: 2,
                }}
              >
                MAX SPEED
              </div>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              top: 18,
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "clamp(9px,1.2vw,12px)",
                color: "#334455",
                letterSpacing: "0.35em",
                marginBottom: 2,
              }}
            >
              RACE TIME
            </div>
            <div
              style={{
                fontSize: "clamp(22px,3.2vw,38px)",
                fontWeight: 900,
                color: ui.raceTimeLow ? "#ff2d78" : "#ffffff",
                textShadow: ui.raceTimeLow
                  ? "0 0 20px #ff2d78"
                  : "0 0 10px #87ceeb",
                animation: ui.raceTimeLow ? "blink 0.8s infinite" : "none",
              }}
            >
              {ui.raceTime}
            </div>
          </div>
          <div
            style={{ position: "absolute", top: 18, left: 20, lineHeight: 1.5 }}
          >
            <div
              style={{
                fontSize: "clamp(9px,1.2vw,12px)",
                color: "#334455",
                letterSpacing: "0.25em",
              }}
            >
              LAP
            </div>
            <div
              style={{
                fontSize: "clamp(22px,3.2vw,38px)",
                fontWeight: 700,
                color: "#cce0ee",
                textShadow: "0 0 9px #0099ff",
              }}
            >
              {ui.lap}
              <span style={{ fontSize: "0.5em", color: "#2a3a4a" }}>/3</span>
            </div>
            <div
              style={{ fontSize: "clamp(11px,1.4vw,15px)", color: "#87ceeb" }}
            >
              {ui.lapTime}s
            </div>
            {ui.bestLap && (
              <div
                style={{ fontSize: "clamp(9px,1.1vw,12px)", color: "#39ff14" }}
              >
                BEST {ui.bestLap}s
              </div>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 20,
              textAlign: "right",
              lineHeight: 1.4,
            }}
          >
            <div
              style={{
                fontSize: "clamp(9px,1.1vw,12px)",
                color: "#334455",
                letterSpacing: "0.35em",
              }}
            >
              POS
            </div>
            <div
              style={{
                fontSize: "clamp(26px,3.8vw,48px)",
                fontWeight: 900,
                color: "#fff",
                textShadow: "0 0 14px #87ceeb",
              }}
            >
              P{ui.position}
            </div>
            <div
              style={{
                fontSize: "clamp(8px,1.0vw,11px)",
                color: "#223344",
                letterSpacing: "0.2em",
                marginTop: 2,
              }}
            >
              {camLabels[ui.cameraMode]}
            </div>
            <div
              style={{
                fontSize: "clamp(7px,0.9vw,10px)",
                color: "#1a2a38",
                marginTop: 1,
              }}
            >
              C — CAM
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 24, left: 20 }}>
            <div
              style={{
                fontSize: "clamp(8px,1vw,11px)",
                color: "#334455",
                letterSpacing: "0.3em",
                marginBottom: 5,
              }}
            >
              ⚡ NITRO
            </div>
            <div
              style={{
                width: 140,
                height: 12,
                background: "#0a1520",
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: `0 0 10px ${ui.nitro > 30 ? "#00fff7" : "#ff2d78"}`,
              }}
            >
              <div
                style={{
                  width: `${ui.nitro}%`,
                  height: "100%",
                  borderRadius: 6,
                  transition: "width 0.12s",
                  background:
                    ui.nitro > 30
                      ? "linear-gradient(90deg,#00fff7,#0088ff)"
                      : "linear-gradient(90deg,#ff2d78,#ff6600)",
                }}
              />
            </div>
            {ui.nitro === 0 && (
              <div
                style={{
                  fontSize: "clamp(7px,0.9vw,10px)",
                  color: "#ff2d78",
                  letterSpacing: "0.18em",
                  marginTop: 3,
                  animation: "blink 0.5s infinite",
                }}
              >
                RECHARGING
              </div>
            )}
            <div
              style={{
                fontSize: "clamp(7px,0.85vw,10px)",
                color: "#1a2a38",
                marginTop: 4,
                letterSpacing: "0.18em",
              }}
            >
              N-NITRO &nbsp; SHIFT-DRIFT
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
              lineHeight: 1.8,
            }}
          >
            {["GHOST", "RYUJI", "MAKO", "KEN", "TSURU"].map((n, i) => (
              <span
                key={n}
                style={{
                  fontSize: "clamp(7px,0.9vw,10px)",
                  color: aiColors[i],
                  letterSpacing: "0.14em",
                  margin: "0 6px",
                }}
              >
                ● {n}
              </span>
            ))}
          </div>
        </>
      )}

      {/* FINISH */}
      {ui.finish && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.82)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "clamp(10px,1.6vw,15px)",
              letterSpacing: "0.55em",
              color: "#87ceeb",
              marginBottom: 16,
            }}
          >
            RACE COMPLETE
          </div>
          <div
            style={{
              fontSize: "clamp(46px,10vw,108px)",
              fontWeight: 900,
              color:
                ui.place === 1 ? "#ffe600" : ui.place <= 3 ? "#87ceeb" : "#aaa",
              textShadow: `0 0 60px ${ui.place === 1 ? "#ffe600" : "#87ceeb"}`,
            }}
          >
            P{ui.place}
          </div>
          <div
            style={{
              fontSize: "clamp(14px,2.2vw,24px)",
              marginTop: 8,
              color: ui.place === 1 ? "#ffe600" : "#87ceeb",
            }}
          >
            {ui.place === 1
              ? "🏆 CHAMPION!"
              : ui.place === 2
                ? "🥈 2nd PLACE"
                : ui.place === 3
                  ? "🥉 3rd PLACE"
                  : "RACE OVER"}
          </div>
          <div
            style={{
              fontSize: "clamp(12px,1.6vw,18px)",
              color: "#87ceeb",
              marginTop: 12,
            }}
          >
            BEST LAP: {ui.bestLap || "--"}s
          </div>
          <div
            onClick={() => window.location.reload()}
            style={{
              marginTop: 44,
              fontSize: "clamp(11px,1.5vw,16px)",
              letterSpacing: "0.4em",
              color: "#fff",
              border: "1px solid #87ceeb",
              padding: "14px 36px",
              cursor: "pointer",
              textShadow: "0 0 10px #87ceeb",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#87ceeb1a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            RACE AGAIN
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes pop { 0%{transform:scale(1.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeInUp { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

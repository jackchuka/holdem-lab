import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import type { ViewName } from '../settings';
import type { ChipState, Pose } from '../timeline/timeline';
import { CHIP, type FingerPose, type Trick, type Vec3 } from '../tricks/types';
import { FINGER_COLORS, PRESS_COLOR, TABLE_COLOR } from './colors';
import { H_FOV, VIEW_OFFSETS } from './views';

// See-through chips keep the finger markers underneath them visible.
const CHIP_OPACITY = 0.55;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

function CameraRig({ view, focus }: { view: ViewName; focus: Vec3 }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const goal = useMemo(() => new Vector3(), []);
  const target = useMemo(() => new Vector3(), []);

  // Keep the horizontal field of view fixed so chips look the same size on any aspect ratio.
  useEffect(() => {
    const aspect = size.width / size.height;
    camera.fov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(H_FOV) / 2) / aspect));
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((_, dt) => {
    goal.set(...add(focus, VIEW_OFFSETS[view]));
    camera.position.lerp(goal, 1 - Math.exp(-dt * 8));
    camera.lookAt(target.set(...focus));
  });
  return null;
}

function Chip({ state, color }: { state: ChipState; color: string }) {
  return (
    <group position={state.pos} quaternion={state.quat}>
      <mesh>
        <cylinderGeometry args={[CHIP.radius, CHIP.radius, CHIP.thickness, 48]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} transparent opacity={CHIP_OPACITY} depthWrite={false} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, (s * CHIP.thickness) / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[CHIP.radius * 0.72, 1.2, 8, 48]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={CHIP_OPACITY} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// A pressing finger keeps its own colour so it can still be told apart; a translucent halo marks the pressure.
function Marker({ pose, color }: { pose: FingerPose; color: string }) {
  return (
    <group position={pose.pos}>
      <mesh>
        <sphereGeometry args={[4, 24, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {pose.press && (
        <mesh>
          <sphereGeometry args={[6.5, 24, 16]} />
          <meshBasicMaterial color={PRESS_COLOR} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

type Props = { trick: Trick; pose: Pose; view: ViewName; mirror: boolean; label: string };

export function Scene({ trick, pose, view, mirror, label }: Props) {
  return (
    <Canvas role="img" aria-label={label} dpr={[1, 2]} camera={{ position: add(trick.focus, VIEW_OFFSETS[view]), near: 1, far: 2000 }}>
      <hemisphereLight args={['#ffffff', '#224433', 1.6]} />
      <directionalLight position={[60, 120, 80]} intensity={1.4} />
      <CameraRig view={view} focus={trick.focus} />
      <group scale={[mirror ? -1 : 1, 1, 1]}>
        <mesh position={[0, trick.floor, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[140, 64]} />
          <meshStandardMaterial color={TABLE_COLOR} />
        </mesh>
        {trick.chips.map((c) => (
          <Chip key={c.id} state={pose.chips[c.id]} color={c.color} />
        ))}
        {trick.fingers.map((f) => (
          <Marker key={f} pose={pose.fingers[f]!} color={FINGER_COLORS[f]} />
        ))}
      </group>
    </Canvas>
  );
}

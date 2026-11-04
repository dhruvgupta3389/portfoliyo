import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { addGlasses } from "./glasses";
import { addHeadphones } from "./headphones";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        let character: THREE.Object3D;
        loader.load(
          "/models/character_clean.glb",
          async (gltf) => {
            character = gltf.scene;
            await renderer.compileAsync(character, camera, scene);
            // Recolor named parts to define a custom character. Appearance is
            // independent of animation — the clips ride on the skeleton — so
            // these changes give a distinctly different person, same desk + motion.
            const SKIN = "#c68e5d"; // warm medium (Indian) skin tone
            const colorByMesh: Record<string, string> = {
              "BODY.SHIRT": "#7c6cf0", // violet shirt — matches site --accentColor
              "Pant": "#0a0e17",       // dark navy — matches site background
              "Hair": "#1a1a1a",       // black hair
              "Face.002": SKIN,        // face
              "Hand": SKIN,            // hands
              "Neck": SKIN,            // neck
              "Ear.001": SKIN,         // ears
            };

            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;

                const hex = colorByMesh[mesh.name];
                if (mesh.material && hex) {
                  const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                  newMat.color = new THREE.Color(hex);
                  mesh.material = newMat;
                }

                child.castShadow = true;
                child.receiveShadow = true;
                mesh.frustumCulled = true;
              }
            });

            // Build glasses in code and attach to the head bone so they
            // track the face through all animations / mouse head-rotation.
            addGlasses(character);
            addHeadphones(character);

            resolve(gltf);
            setCharTimeline(character, camera);
            setAllTimeline();
            character!.getObjectByName("footR")!.position.y = 3.36;
            character!.getObjectByName("footL")!.position.y = 3.36;

            // Monitor scale is handled by GsapScroll.ts animations

            dracoLoader.dispose();
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };


  return { loadCharacter };
};

export default setCharacter;

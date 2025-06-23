import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { meshScale, landscapeScale, droneMass } from './UsedConstants';
import { GLTFLoader, DRACOLoader } from 'three/examples/jsm/Addons.js';

export const load = (handleLoadModels, setLoading) => {
  const droneLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  dracoLoader.preload(); 
  droneLoader.setDRACOLoader(dracoLoader);
  

  const landscapeLoader = new GLTFLoader();
  
  const loadLandscape = () => {
    return new Promise((resolve, reject) => {
      landscapeLoader.load(
        '/landscapes/landscape1.glb',
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(landscapeScale, landscapeScale, landscapeScale);
          resolve(model);
        },
        undefined,
        (error) => {
          console.error("Error loading landscape:", error);
          reject(error);
        }
      );
    });
  };

  const loadDrone = () => {
    return new Promise((resolve, reject) => {
      const droneMaterial = new THREE.MeshStandardMaterial({
      // map: diffuseTexture,
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1,
      });

      droneLoader.load(
        '/9drone_draco.glb',
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(meshScale, meshScale, meshScale);

          model.traverse((child) => {
          if (child.isMesh) {
            child.material = droneMaterial;
            child.material.needsUpdate = true;
          }
          });

          let mixer = null;
          if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              mixer.clipAction(clip).play();
            });
          }

          const droneBody = new CANNON.Body({
            mass: droneMass,
            shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.41, 0.25)),
            position: new CANNON.Vec3(0, 2.5, 0),
          });

          droneBody.fixedRotation = false;
          droneBody.linearDamping = 0.5;
          droneBody.angularDamping = 0.8;
          droneBody.updateMassProperties();

          resolve({ model, droneBody, mixer });
        },
        (xhr) => {
          console.log(`Drone Load Progress: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`);
          if (xhr.loaded >= xhr.total) {
            setTimeout(() => setLoading(false), 500);
          }
        },
        (error) => {
          console.error("Error loading drone:", error);
          reject(error);
        }
      );
    });
  };

  // Wait for both to finish
  Promise.all([loadLandscape(), loadDrone()])
    .then(([landscapeMesh, { model: droneMesh, droneBody, mixer }]) => {
      handleLoadModels(landscapeMesh, droneMesh, droneBody, mixer);
    })
    .catch((err) => {
      console.error("Model loading failed:", err);
      setLoading(false);
    });
};


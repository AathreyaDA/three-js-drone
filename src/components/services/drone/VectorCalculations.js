import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const calculateTiltAxis = (vector, droneBody) => {
    if (!droneBody) {
        return vector;
    }
    
    const quaternion = droneBody.quaternion; // CANNON.Quat from the body

    if (vector instanceof THREE.Vector3) {
        // Convert CANNON.Quat to THREE.Quaternion
        const threeQuat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

        // Rotate the vector using quaternion
        return vector.applyQuaternion(threeQuat);
    } 
    else if (vector instanceof CANNON.Vec3) {
        const rotated = new CANNON.Vec3();
        quaternion.vmult(vector, rotated); // Rotate the CANNON.Vec3
        return rotated;
    }

    throw new Error("Unsupported vector type");
}


export const calculateYawCameraOffset = (vector, droneBody) =>  {
    if (!droneBody) {
            return vector;
        }
    
        const quaternion = droneBody.quaternion; // CANNON.Quaternion from the body
    
        // Convert the full quaternion to a THREE.Euler to extract the yaw
        const threeQuat = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        const euler = new THREE.Euler();
        euler.setFromQuaternion(threeQuat, "YXZ"); // Extract yaw (Y rotation)
    
        // Create a new quaternion with only the Y rotation
        const yawQuat = new THREE.Quaternion();
        yawQuat.setFromEuler(new THREE.Euler(0, euler.y, 0)); // Only Yaw
    
        if (vector instanceof THREE.Vector3) {
            return vector.applyQuaternion(yawQuat);
        } 
        else if (vector instanceof CANNON.Vec3) {
            const rotated = new CANNON.Vec3();
            const cannonYawQuat = new CANNON.Quaternion(yawQuat.x, yawQuat.y, yawQuat.z, yawQuat.w);
            cannonYawQuat.vmult(vector, rotated);
            return rotated;
        }
    
        throw new Error("Unsupported vector type");
}

export const convertVector = (threeVector) => {
    return new CANNON.Vec3(threeVector.x, threeVector.y, threeVector.z);
  }
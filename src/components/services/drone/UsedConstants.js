//Note: Some constants are equilvalent, but this is to maintain the ability to change them independently if required

//Drone animation constant
const rotationFactor = 10; //To control rotor spin animation

//Thrust calculation constants
const airDensity = 1.12;
const kValue = 0.002;
const rotorDiameter = 0.600;

//World scaling constants, both physical and visual
const scale = 5; //Overall physics scale
const meshScale = 0.02; //Mesh size scale
const relativeArrowScale = 10; //Depreciated, was used for arrow creation logic to represent RPM
const landscapeScale = 500; //Scaling landscape glb model

//Speed limiting contants
const maxVelocity = 1*scale; 
const stableMaxRPM = 2000; //Stable RPM for hovering
const upMaxRPM = 2373; //Max RPM of a rotor which goes up while the drone is moving in the opposite direction
const downMaxRPM = 1627; //Max RPM of a rotor which goes down while the drone is moving in the same direction

const droneMass = 11.35;

//Takeoff rpm rates and limitters
const rpmIncreaseSpeed = 500;// RPM increase per second

//Constants for balancing rpms when no input is provided
const maxRPMReduction = 100; 
const RPMReductionRate = 500;
const resetReduction = maxRPMReduction; //How fast resetting RPMs should take place. Equivalent for now.

const rotorBodyDistance = 0.78; //Distance between the center of the rotors and the center of the drone.

export {
  rotationFactor,
  airDensity,
  kValue,
  rotorDiameter,
  scale,
  meshScale,
  landscapeScale,
  relativeArrowScale,
  maxVelocity,
  stableMaxRPM,
  upMaxRPM,
  downMaxRPM,
  rpmIncreaseSpeed,
  maxRPMReduction,
  RPMReductionRate,
  resetReduction,
  droneMass,
  rotorBodyDistance
};
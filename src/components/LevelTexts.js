// LevelTexts.js
export const LevelData = [
  {
    id: 1,
    title: "First Flight",
    instruction: "Take off-> press F to turn on rotors, Q to take off",
    objectives: [
      { id: "rotors_on", description: "Turn on rotors", completed: false },
      { id: "takeoff", description: "Take off successfully", completed: false }
    ],
    maxScore: 100,
    timeLimit: 60, // in seconds
    achievements: [
      { id: "quick_learner", name: "Quick Learner", description: "Complete level in under 30 seconds", awarded: false },
      { id: "smooth_operator", name: "Smooth Operator", description: "Take off without any abrupt movements", awarded: false }
    ]
  },
  {
    id: 2,
    title: "Safe Landing",
    instruction: "Landing-> press F to turn on rotors, Q to take off. Then press E to land. Now toggle rotors off with F",
    objectives: [
      { id: "rotors_on", description: "Turn on rotors", completed: false },
      { id: "takeoff", description: "Take off successfully", completed: false },
      { id: "landing", description: "Land safely", completed: false },
      { id: "rotors_off", description: "Turn off rotors", completed: false }
    ],
    maxScore: 150,
    timeLimit: 90,
    achievements: [
      { id: "precision_landing", name: "Precision Landing", description: "Land within the designated area", awarded: false },
      { id: "efficiency_expert", name: "Efficiency Expert", description: "Complete all objectives under 60 seconds", awarded: false }
    ]
  },
  {
    id: 3,
    title: "Basic Navigation",
    instruction: "Navigate through checkpoints-> Turn on rotors with F, take off with Q, fly through the 3 checkpoints, then land with E and turn off rotors",
    objectives: [
      { id: "rotors_on", description: "Turn on rotors", completed: false },
      { id: "takeoff", description: "Take off successfully", completed: false },
      { id: "checkpoint_1", description: "Pass through checkpoint 1", completed: false },
      { id: "checkpoint_2", description: "Pass through checkpoint 2", completed: false },
      { id: "checkpoint_3", description: "Pass through checkpoint 3", completed: false }
    ],
    maxScore: 200,
    timeLimit: 120,
    achievements: [
      { id: "speed_demon", name: "Speed Demon", description: "Complete all checkpoints in under 60 seconds", awarded: false },
      { id: "perfect_run", name: "Perfect Run", description: "Complete all objectives without any mistakes", awarded: false }
    ]
  },
  {
    id: 4,
    title: "Weather Challenge",
    instruction: "Navigate through checkpoints in windy conditions. Use F to toggle rotors, Q for takeoff, WASD to move, Z and X to rotate. Complete all checkpoints to finish the level.",
    objectives: [
      { id: "rotors_on", description: "Turn on rotors", completed: false },
      { id: "takeoff", description: "Take off successfully", completed: false },
      { id: "weather_checkpoint_1", description: "Pass through checkpoint 1", completed: false },
      { id: "weather_checkpoint_2", description: "Pass through checkpoint 2", completed: false },
      { id: "weather_checkpoint_3", description: "Pass through checkpoint 3", completed: false }
    ],
    maxScore: 300,
    timeLimit: 180,
    achievements: [
      { id: "storm_navigator", name: "Storm Navigator", description: "Complete level in under 90 seconds", awarded: false },
      { id: "wind_master", name: "Wind Master", description: "Maintain stable flight through all checkpoints", awarded: false }
    ]
  },
  {
    id: 5,
    title: "Time Trial",
    instruction: "Press M to begin mission. Complete the race course as quickly as possible. Press H to toggle HUD display.",
    objectives: [
      { id: "rotors_on", description: "Turn on rotors", completed: false },
      { id: "takeoff", description: "Take off successfully", completed: false },
      { id: "time_trial_checkpoints", description: "Pass through all time trial checkpoints", completed: false },
      { id: "time_trial_complete", description: "Complete the course", completed: false }
    ],
    maxScore: 1000,
    timeLimit: 240,
    achievements: [
      { id: "speed_racer", name: "Speed Racer", description: "Complete the course in under 60 seconds", awarded: false },
      { id: "fuel_efficient", name: "Fuel Efficient", description: "Complete with more than 50% battery remaining", awarded: false }
    ]
  },
  {
    id: 6,
    title: "Obstacle Course",
    instruction: "Press M to begin mission. Navigate through the obstacles to reach all checkpoints. Press H to toggle HUD display.",
    objectives: [
      { id: "rotors_on", description: "Turn on rotors", completed: false },
      { id: "takeoff", description: "Take off successfully", completed: false },
      { id: "obstacle_checkpoints", description: "Pass through all checkpoints", completed: false },
      { id: "obstacle_complete", description: "Complete the course", completed: false }
    ],
    maxScore: 1000,
    timeLimit: 300,
    achievements: [
      { id: "precision_pilot", name: "Precision Pilot", description: "Complete without any collisions", awarded: false },
      { id: "obstacle_master", name: "Obstacle Master", description: "Complete the course in under 2 minutes", awarded: false }
    ]
  },
  {
    id: 7,
    title: "Collection Mission",
    instruction: "Press M to begin mission. Collect all items and return to base. Press H to toggle HUD display.",
    objectives: [
      { id: "rotors_on", description: "Turn on rotors", completed: false },
      { id: "takeoff", description: "Take off successfully", completed: false },
      { id: "collect_items", description: "Collect all items", completed: false },
      { id: "return_to_base", description: "Return to base", completed: false }
    ],
    maxScore: 1000,
    timeLimit: 360,
    achievements: [
      { id: "collector", name: "Master Collector", description: "Collect all items in under 3 minutes", awarded: false },
      { id: "efficient_path", name: "Efficient Path", description: "Complete with more than 40% battery remaining", awarded: false }
    ]
  }
];

// Original level texts for backward compatibility
export const LevelTexts = [
  "Level 1: Take off-> press F to turn on rotors, Q to take off",
  "Level 2: Landing-> press F to turn on rotors, Q to take off. Then press E to land. Now toggle rotors off with F",
  "Level 3: Navigate through checkpoints-> Use W A S D to move, fly through the 3 checkpoints",
  "Level 4: Weather Challenge-> Navigate through checkpoints in windy conditions",
  "Level 5: Time Trial-> Complete the race course as quickly as possible",
  "Level 6: Obstacle Course-> Navigate through obstacles to reach checkpoints",
  "Level 7: Collection Mission-> Collect all items and return to base"
];

// Drone types with different characteristics
export const DroneTypes = [
{
  id: "trainer",
  name: "Trainer Drone",
  description: "Stable and easy to control, perfect for beginners",
  stats: {
    stability: 9,
    speed: 5,
    maneuverability: 6,
    batteryLife: 8
  },
  unlockLevel: 1,
  price: 0
},
{
  id: "racer",
  name: "Racing Drone",
  description: "High speed but less stable, for experienced pilots",
  stats: {
    stability: 4,
    speed: 9,
    maneuverability: 8,
    batteryLife: 6
  },
  unlockLevel: 3,
  price: 1000
},
{
  id: "heavy",
  name: "Heavy Lifter",
  description: "Slow but extremely stable with long battery life",
  stats: {
    stability: 10,
    speed: 3,
    maneuverability: 4,
    batteryLife: 10
  },
  unlockLevel: 2,
  price: 800
},
{
  id: "professional",
  name: "Professional Drone",
  description: "Well-balanced performance for serious missions",
  stats: {
    stability: 7,
    speed: 7,
    maneuverability: 7,
    batteryLife: 7
  },
  unlockLevel: 4,
  price: 1500
},
{
  id: "stealth",
  name: "Stealth Drone",
  description: "Quiet and agile, perfect for precise navigation",
  stats: {
    stability: 6,
    speed: 8,
    maneuverability: 9,
    batteryLife: 5
  },
  unlockLevel: 5,
  price: 2000
}
];

// Upgrades that can be purchased and applied to drones
export const DroneUpgrades = [
{
  id: "battery",
  name: "Enhanced Battery",
  description: "Increases battery life by 20%",
  effect: { batteryLife: 2 },
  price: 500,
  unlockLevel: 2
},
{
  id: "motors",
  name: "High-Performance Motors",
  description: "Increases speed and acceleration by 15%",
  effect: { speed: 1.5, maneuverability: 1 },
  price: 750,
  unlockLevel: 3
},
{
  id: "stabilizers",
  name: "Advanced Stabilizers",
  description: "Improves stability in difficult conditions",
  effect: { stability: 2 },
  price: 600,
  unlockLevel: 2
},
{
  id: "carbonFiber",
  name: "Carbon Fiber Frame",
  description: "Lighter frame improves all performance aspects",
  effect: { speed: 1, maneuverability: 1, stability: 1 },
  price: 1200,
  unlockLevel: 4
},
{
  id: "windShield",
  name: "Aerodynamic Wind Shield",
  description: "Reduces impact of wind by 30%",
  effect: { windResistance: 3 },
  price: 850,
  unlockLevel: 4
}
];

// Missions with different objectives and rewards
export const Missions = [
{
  id: "time_trial",
  name: "Time Trial",
  description: "Complete the course as quickly as possible",
  minLevel: 1,
  rewards: {
    xp: 100,
    currency: 200
  },
  highScores: []
},
{
  id: "obstacle_course",
  name: "Obstacle Course",
  description: "Navigate through obstacles to reach all checkpoints",
  minLevel: 2,
  rewards: {
    xp: 150,
    currency: 300
  },
  highScores: []
},
{
  id: "collection",
  name: "Collection Mission",
  description: "Collect all items and return to base",
  minLevel: 3,
  rewards: {
    xp: 200,
    currency: 400
  },
  highScores: []
},
{
  id: "precision_flight",
  name: "Precision Flight Challenge",
  description: "Navigate through narrow passages without touching walls",
  minLevel: 4,
  rewards: {
    xp: 250,
    currency: 500
  },
  highScores: []
},
{
  id: "weather_challenge",
  name: "Extreme Weather Challenge",
  description: "Complete course in severe wind conditions",
  minLevel: 5,
  rewards: {
    xp: 300,
    currency: 600
  },
  highScores: []
}
];

// Player achievements to unlock
export const Achievements = [
{
  id: "first_flight",
  name: "First Flight",
  description: "Complete your first takeoff",
  reward: 50,
  unlocked: false
},
{
  id: "checkpoint_master",
  name: "Checkpoint Master",
  description: "Pass through 50 checkpoints total",
  reward: 200,
  progress: 0,
  target: 50,
  unlocked: false
},
{
  id: "battery_optimizer",
  name: "Battery Optimizer",
  description: "Complete a mission with more than 70% battery remaining",
  reward: 150,
  unlocked: false
},
{
  id: "speed_demon",
  name: "Speed Demon",
  description: "Reach a speed of 25 m/s",
  reward: 100,
  unlocked: false
},
{
  id: "precision_expert",
  name: "Precision Expert",
  description: "Complete the obstacle course without any collisions",
  reward: 300,
  unlocked: false
},
{
  id: "collection_king",
  name: "Collection King",
  description: "Collect all items in under 2 minutes",
  reward: 250,
  unlocked: false
},
{
  id: "marathon_pilot",
  name: "Marathon Pilot",
  description: "Fly continuously for 10 minutes",
  reward: 200,
  progress: 0,
  target: 600,
  unlocked: false
},
{
  id: "all_drones",
  name: "Drone Collector",
  description: "Unlock all drone types",
  reward: 500,
  progress: 1,
  target: 5,
  unlocked: false
},
{
  id: "master_pilot",
  name: "Master Pilot",
  description: "Complete all missions with a perfect score",
  reward: 1000,
  progress: 0,
  target: 5,
  unlocked: false
}
];
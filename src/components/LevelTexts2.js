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
        { id: "checkpoint_3", description: "Pass through checkpoint 3", completed: false },
        // { id: "landing", description: "Land safely", completed: false },
        // { id: "rotors_off", description: "Turn off rotors", completed: false }
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
    }
  ];
  
  // Original level texts for backward compatibility
  export const LevelTexts = [
    "Level 1: Take off-> press F to turn on rotors, Q to take off",
    "Level 2: Landing-> press F to turn on rotors, Q to take off. Then press E to land. Now toggle rotors off with F",
    "Level 3: Navigate through checkpoints-> Use W A S D to move, fly through the 3 checkpoints",
    "Level 4: Weather Challenge-> Navigate through checkpoints in windy conditions"
  ];
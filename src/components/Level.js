import { useRef, useState, useEffect } from "react";
import ThreeScene from "./ThreeScene";
import { LevelData } from "./LevelTexts";
import LevelProgress from "./LevelProgress";
import LevelComplete from "./LevelComplete";
import './Level.css';
import WeatherDisplay from "./WeatherDisplay";
import TelemetryData from "./WebsocketComponents/TelemetryData";

const Level = () => {
    const [loading, setLoading] = useState(true);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [levelComplete, setLevelComplete] = useState(false);
    const [score, setScore] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentObjectives, setCurrentObjectives] = useState([]);
    const [achievementsEarned, setAchievementsEarned] = useState([]);
    const [gameState, setGameState] = useState('playing'); // 'playing', 'complete', 'failed'
    const [sceneKey, setSceneKey] = useState(0); // Key to force ThreeScene remount
    
    const threeSceneRef = useRef(null);
    const [droneBody, setDroneBody] = useState(null);
    const resetLevel = () =>{
        setLoading(true);
        setSceneKey(prevKey => prevKey + 1);
        setStartTime(Date.now());
        setGameState('playing');
        setCurrentObjectives(currentLevelData.objectives.map(obj => ({...obj})));
    }
    
    // Initialize level data when level changes
    useEffect(() => {
        // Reset states for new level
        setLevelComplete(false);
        setScore(0);
        setTimeElapsed(0);
        setGameState('playing');
        setAchievementsEarned([]);
        
        // Get current level data
        const levelIndex = currentLevel - 1;
        if (levelIndex >= 0 && levelIndex < LevelData.length) {
            const levelData = LevelData[levelIndex];
            // Clone objectives to track completion
            setCurrentObjectives(levelData.objectives.map(obj => ({...obj})));
            setTimeRemaining(levelData.timeLimit);
            setStartTime(Date.now());
        }
        
        // Force ThreeScene to remount with a new key
        setSceneKey(prevKey => prevKey + 1);
        setLoading(true);
    }, [currentLevel]);
    
    // Timer effect
    useEffect(() => {
        if (gameState !== 'playing' || !startTime) return;
        
        const timer = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            setTimeElapsed(elapsed);
            
            const levelIndex = currentLevel - 1;
            const remaining = LevelData[levelIndex].timeLimit - elapsed;
            setTimeRemaining(Math.max(0, remaining));
            
            // Check for time limit
            if (remaining <= 0) {
                clearInterval(timer);
                if (gameState === 'playing') {
                    setGameState('failed');
                }
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [startTime, gameState, currentLevel]);
    
    // Function to mark an objective as complete
    const markObjectiveComplete = (objectiveId) => {
        setCurrentObjectives(prev => {
            const newObjectives = [...prev];
            const objIndex = newObjectives.findIndex(obj => obj.id === objectiveId);
            
            if (objIndex !== -1 && !newObjectives[objIndex].completed) {
                newObjectives[objIndex].completed = true;
                
                // Add points for completing objective
                const levelIndex = currentLevel - 1;
                const pointsPerObjective = LevelData[levelIndex].maxScore / LevelData[levelIndex].objectives.length;
                setScore(prevScore => prevScore + pointsPerObjective);
                
                // Check if all objectives are complete
                if (newObjectives.every(obj => obj.completed)) {
                    completeLevelWithAchievements();
                }
            }
            
            return newObjectives;
        });
    };
    
    // Handle level completion and check achievements
    const completeLevelWithAchievements = () => {
        const levelIndex = currentLevel - 1;
        const levelData = LevelData[levelIndex];
        const earned = [];
        
        // Check achievements based on performance
        levelData.achievements.forEach(achievement => {
            let awarded = false;
            
            switch (achievement.id) {
                case 'quick_learner':
                    awarded = timeElapsed < 30;
                    break;
                case 'efficiency_expert':
                    awarded = timeElapsed < 60;
                    break;
                case 'speed_demon':
                    awarded = timeElapsed < 60;
                    break;
                case 'perfect_run':
                    // This would be checked in ThreeScene based on flying without crashing
                    awarded = score >= levelData.maxScore * 0.9;
                    break;
                // More achievement checks would go here
                default:
                    // For other achievements that might be checked directly in ThreeScene
                    break;
            }
            
            if (awarded) {
                earned.push({...achievement, awarded: true});
            }
        });
        
        setAchievementsEarned(earned);
        setLevelComplete(true);
        setGameState('complete');
    };
    
    // Move to next level
    const handleNextLevel = () => {
        if (currentLevel < LevelData.length) {
            setCurrentLevel(prev => prev + 1);
        } else {
            // Game complete - perhaps show an end game screen
            alert("Congratulations! You've completed all levels!");
        }
    };
    
    // Current level data
    const levelIndex = currentLevel - 1;
    const currentLevelData = LevelData[levelIndex];
    
    return (
        <div className="game-container">
            {
            // loading && (
            //     <div className="loading-screen" >
            //     <div className="loader"></div>
            //     <p>Loading...</p>
            //     </div>
            // )

            loading && (
                <div className="circle-loader-container" >
                <div className="circle-loader"></div>
                {/* <p>Loading...</p> */}
                </div>
            )
            }
            {gameState === 'playing' && (
                <LevelProgress 
                    levelData={currentLevelData}
                    currentObjectives={currentObjectives}
                    score={score}
                    timeRemaining={timeRemaining}
                    handleResetLevel={()=>resetLevel()}
                />
            )}
            
            <ThreeScene 
                key={sceneKey} // This forces the component to remount when the level changes
                ref={threeSceneRef}
                levelNumber={currentLevel}
                markObjectiveComplete={markObjectiveComplete}
                setLevelComplete={(levelNum) => {
                    // This is a compatibility function for the old system
                    if (levelNum === currentLevel) {
                        setGameState('complete');
                        setLevelComplete(true);
                    }
                }}
                loading={loading}
                setLoading={setLoading}
            />
            
            {gameState === 'complete' && (
                <LevelComplete 
                    levelData={currentLevelData}
                    score={score}
                    timeTaken={timeElapsed}
                    achievementsEarned={achievementsEarned}
                    onNextLevel={handleNextLevel}
                />
            )}
            
            {gameState === 'failed' && (
                <div className="level-failed-overlay">
                    <div className="level-failed-modal">
                        <h2>Time's Up!</h2>
                        <p>You didn't complete all objectives in time.</p>
                        <button onClick={() => resetLevel()}>Try Again</button>
                    </div>
                </div>
            )}
            <WeatherDisplay/>
            <TelemetryData />
        </div>
    );
};

export default Level;

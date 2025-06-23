import React from 'react';
import './LevelProgress.css';

const LevelProgress = ({ levelData, currentObjectives, score, timeRemaining, handleResetLevel }) => {
  const completionPercentage = currentObjectives.filter(obj => obj.completed).length / currentObjectives.length * 100;
  
  return (
    <div className="level-progress">
      <div className="level-header">
        <h2>Level {levelData.id}: {levelData.title}</h2>
        <div className="level-stats">
          <button onClick={()=>{handleResetLevel()}} style={{background:"green", color:"white"}}>Reset</button>
          <div className="score">Score: {Math.min(levelData.maxScore, score)}/{levelData.maxScore}</div>
          <div className="timer">Time: {timeRemaining}s</div>
        </div>
      </div>
      
      <div className="instruction-panel">
        {levelData.instruction}
      </div>
      
      <div className="objectives-panel">
        <h3>Objectives:</h3>
        <ul>
          {currentObjectives.map(objective => (
            <li key={objective.id} className={objective.completed ? 'completed' : ''}>
              {objective.description}
              {objective.completed && <span className="checkmark">✓</span>}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="progress-bar">
        <div className="progress" style={{ width: `${completionPercentage}%` }}></div>
        <span className="progress-text">{Math.round(completionPercentage)}% Complete</span>
      </div>
    </div>
  );
};

export default LevelProgress;
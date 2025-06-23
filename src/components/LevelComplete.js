import React from 'react';
import './LevelComplete.css';
import { LevelData } from './LevelTexts';

const LevelComplete = ({ levelData, score, timeTaken, achievementsEarned, onNextLevel }) => {
  const starRating = Math.min(3, Math.max(1, Math.floor(score / levelData.maxScore * 3) + 1));
  
  return (
    <div className="level-complete-overlay">
      <div className="level-complete-modal">
        <h2>Level {levelData.id} Complete!</h2>
        
        <div className="star-rating">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`star ${i < starRating ? 'filled' : ''}`}>★</span>
          ))}
        </div>
        
        <div className="completion-stats">
          <div className="stat">
            <span className="label">Score:</span>
            <span className="value">{Math.min(score, levelData.maxScore)}/{levelData.maxScore}</span>
          </div>
          <div className="stat">
            <span className="label">Time:</span>
            <span className="value">{timeTaken}s</span>
          </div>
        </div>
        
        {achievementsEarned.length > 0 && (
          <div className="achievements-earned">
            <h3>Achievements Earned:</h3>
            <ul>
              {achievementsEarned.map(achievement => (
                <li key={achievement.id}>
                  <div className="achievement">
                    <span className="achievement-icon">🏆</span>
                    <div className="achievement-details">
                      <span className="achievement-name">{achievement.name}</span>
                      <span className="achievement-description">{achievement.description}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <button className="next-level-button" onClick={onNextLevel}>
          {levelData.id < LevelData.length ? "Next Level" : "Finish Game"}
        </button>
      </div>
    </div>
  );
};

export default LevelComplete;

import React, { useEffect, useState } from 'react';
import { useMining } from '@/contexts/MiningContext';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

export const MiningVisualizer = () => {
  const { isMining, miningRate, miningBoost, sessionMined } = useMining();
  const [animationFrame, setAnimationFrame] = useState(0);
  const [miningProgress, setMiningProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, size: number, duration: number }>>([]);

  // Calculate effective mining rate with boosts
  const effectiveRate = miningRate * (1 + miningBoost / 100);
  
  // Mining animation timing - reset every 60 seconds
  useEffect(() => {
    if (!isMining) {
      setMiningProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setMiningProgress(prev => {
        const newProgress = prev + (100 / 60); // Full cycle every 60 seconds
        return newProgress >= 100 ? 0 : newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining]);

  // Particle animation
  useEffect(() => {
    if (!isMining) {
      setParticles([]);
      return;
    }

    // Create new particles at intervals based on mining rate
    const interval = setInterval(() => {
      const newParticle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 2 + 1
      };
      
      setParticles(prev => [...prev, newParticle]);
      
      // Limit to a reasonable number of particles
      if (particles.length > 15) {
        setParticles(prev => prev.slice(1));
      }
    }, 1000 / Math.max(effectiveRate, 0.5));

    // Animation frame counter
    const animationTimer = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 4);
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(animationTimer);
    };
  }, [isMining, effectiveRate, particles.length]);

  return (
    <div className="relative h-64 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden">
      {/* Mining Animation Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isMining ? (
          <div className={`transform transition-transform duration-1000 ${animationFrame % 2 === 0 ? 'scale-95' : 'scale-100'}`}>
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 animate-ping"></div>
              <div className="absolute inset-0 bg-orange-400 rounded-full opacity-40 animate-pulse"></div>
              <div className="absolute inset-2 bg-orange-300 rounded-full flex items-center justify-center">
                <Sparkles size={32} className="text-white animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-lg font-medium">Mining Inactive</div>
        )}
      </div>

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute bg-yellow-300 rounded-full opacity-70"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `float ${particle.duration}s linear forwards`,
          }}
        ></div>
      ))}

      {/* Mining Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 text-white">
        <div className="flex justify-between items-center mb-2">
          <span>Mining Progress</span>
          <span>{Math.round(miningProgress)}%</span>
        </div>
        <Progress value={miningProgress} className="h-2" />
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs text-gray-300">Rate</div>
            <div className="font-medium">{effectiveRate.toFixed(2)}/min</div>
          </div>
          <div>
            <div className="text-xs text-gray-300">This Session</div>
            <div className="font-medium">{sessionMined.toFixed(2)} $WAVES</div>
          </div>
        </div>
      </div>
    </div>
  );
};

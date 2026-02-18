import React from 'react';
import { Icon } from './Icon';

interface EqualizerProps {
  onClose: () => void;
  gains: number[];
  setGains: React.Dispatch<React.SetStateAction<number[]>>;
  frequencies: number[];
}

const presets = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0],
  'Rock': [5, 4, 2, -3, -2, 1, 4, 6],
  'Pop': [-2, -1, 0, 2, 4, 4, 2, -1],
  'Jazz': [4, 3, 1, 2, -2, -2, 0, 2],
  'Classical': [5, 4, 3, 0, -2, -3, -4, -5],
};

type PresetName = keyof typeof presets;

export const Equalizer: React.FC<EqualizerProps> = ({ onClose, gains, setGains, frequencies }) => {
  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
  };
  
  const handlePreset = (name: PresetName) => {
    setGains(presets[name]);
  };

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-3xl max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-cyan-400">그래픽 이퀄라이저</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="닫기">
            <Icon name="close" className="w-8 h-8" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
          {/* Sliders Container */}
          <div className="flex p-6 bg-black/30 rounded-xl border border-gray-700 space-x-8 overflow-x-auto pb-8">
            {gains.map((gain, i) => (
              <div key={i} className="flex flex-col items-center space-y-4 min-w-[3rem]">
                <span className="text-sm font-mono font-bold text-cyan-300">{gain > 0 ? '+' : ''}{gain.toFixed(1)}</span>
                <div className="relative h-48 md:h-64 flex items-center">
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      step="0.1"
                      value={gain}
                      onChange={(e) => handleGainChange(i, parseFloat(e.target.value))}
                      className="w-12 h-48 md:h-64 appearance-none bg-gray-700 rounded-full cursor-pointer slider-vertical accent-cyan-400"
                    />
                </div>
                <span className="text-xs text-gray-400 font-bold whitespace-nowrap bg-gray-900/50 px-2 py-1 rounded">
                    {frequencies[i] >= 1000 ? `${frequencies[i] / 1000}k` : frequencies[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="flex flex-row md:flex-col flex-wrap md:flex-nowrap gap-3 justify-center md:justify-start min-w-[120px]">
             <h3 className="text-lg font-bold mb-2 text-center w-full md:text-left text-gray-300">프리셋</h3>
             {Object.keys(presets).map((name) => (
               <button key={name} onClick={() => handlePreset(name as PresetName)} className="px-5 py-3 text-sm font-semibold bg-gray-700 hover:bg-cyan-500 hover:text-black rounded-xl transition-all active:scale-95 flex-grow md:flex-grow-0">
                 {name}
               </button>
             ))}
              <button onClick={() => handlePreset('Flat')} className="px-5 py-3 text-sm font-bold bg-gray-600 hover:bg-red-500 rounded-xl transition-all mt-4 flex-grow md:flex-grow-0 active:scale-95">
                 초기화
               </button>
          </div>
        </div>

        <style>{`
          .slider-vertical {
            writing-mode: bt-lr; /* IE */
            -webkit-appearance: slider-vertical; /* WebKit */
          }
        `}</style>
      </div>
    </div>
  );
};

import React, { useRef, useEffect } from 'react';

export type VisualizerMode = 'line' | 'bars' | 'circle' | 'wave' | 'dots';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  mode: VisualizerMode;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyserNode, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;

    const resizeCanvas = () => {
      if(canvas.parentElement){
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      // CPU 및 배터리 절약을 위해 화면이 숨겨진 경우(백그라운드 등) 그리기 중단
      if (document.hidden) return;

      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#fde047');
      gradient.addColorStop(0.2, '#f97316');
      gradient.addColorStop(0.4, '#ec4899');
      gradient.addColorStop(0.6, '#8b5cf6');
      gradient.addColorStop(0.8, '#3b82f6');
      gradient.addColorStop(1, '#14b8a6');
      
      const width = canvas.width;
      const height = canvas.height;

      switch(mode) {
        case 'bars': {
          const barWidth = (width / bufferLength) * 2.5;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] * (height / 255);
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
          break;
        }
        case 'circle': {
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) / 4;
          const bars = 180;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          for (let i = 0; i < bars; i++) {
            const angle = (i / bars) * 2 * Math.PI;
            const barHeight = (dataArray[i] / 255) * radius * 0.8;
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          break;
        }
        case 'wave': {
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const sliceWidth = width * 1.0 / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            if (i === 0) {
              ctx.moveTo(x, height / 2);
            } else {
              ctx.lineTo(x, height / 2 - y / 2);
            }
            x += sliceWidth;
          }
          ctx.lineTo(width, height / 2);
          ctx.stroke();
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            if (i === 0) {
              ctx.moveTo(x, height / 2);
            } else {
              ctx.lineTo(x, height / 2 + y / 2);
            }
            x += sliceWidth;
          }
          ctx.lineTo(width, height / 2);
          ctx.stroke();
          break;
        }
        case 'dots': {
          const dotsX = 32;
          const dotsY = 18;
          const stepX = width / dotsX;
          const stepY = height / dotsY;
          for (let i = 0; i < dotsX; i++) {
            for (let j = 0; j < dotsY; j++) {
              const dataIndex = (i * dotsY + j) % bufferLength;
              const radius = (dataArray[dataIndex] / 255) * (Math.min(stepX, stepY) / 2) * 0.8;
              ctx.beginPath();
              ctx.arc(i * stepX + stepX/2, j * stepY + stepY/2, radius, 0, 2 * Math.PI);
              ctx.fillStyle = gradient;
              ctx.fill();
            }
          }
          break;
        }
        case 'line':
        default: {
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const sliceWidth = width * 1.0 / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 128.0;
              const y = v * height / 2;
              if (i === 0) {
                  ctx.moveTo(x, height/2);
              } else {
                  ctx.lineTo(x, y);
              }
              x += sliceWidth;
          }
          ctx.lineTo(width, height/2);
          ctx.stroke();
          break;
        }
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyserNode, mode]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

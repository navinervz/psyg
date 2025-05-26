import React, { useEffect, useRef } from 'react';

const LEDBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const ledCellSize = 10;
    const letters = {
      'P': ["11110","10001","10001","11110","10000","10000","10000"],
      'S': ["01111","10000","10000","01110","00001","00001","11110"],
      'Y': ["10001","10001","01010","00100","00100","00100","00100"],
      'G': ["01110","10001","10000","10111","10001","10001","01110"]
    };
    
    const message = "PSYG";
    const spacing = 2;
    const tailSpacing = 3;
    const rowsCount = 7;
    
    let matrix = Array.from({length: rowsCount}, () => []);
    
    for (let i = 0; i < message.length; i++) {
      letters[message[i]].forEach((row, r) => {
        row.split('').forEach(bit => matrix[r].push(bit==='1'?1:0));
        if (i < message.length-1) 
          for (let s=0; s<spacing; s++) matrix[r].push(0);
      });
    }
    
    matrix.forEach(r => { 
      for (let s=0; s<tailSpacing; s++) r.push(0); 
    });
    
    const msgW = matrix[0].length * ledCellSize;
    let offset = 0;
    
    function drawLED() {
      ctx.fillStyle = "#111"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.shadowColor = "rgba(0,255,0,0.7)"; 
      ctx.shadowBlur = 5; 
      ctx.fillStyle = "#39ff14";
      
      const mod = offset % msgW;
      
      for (let copy=0; copy<2; copy++) {
        const baseX = -mod + copy*msgW;
        matrix.forEach((row,r) => {
          row.forEach((bit,c) => {
            if (bit) {
              const x = baseX + c*ledCellSize, y = r*ledCellSize;
              if (x+ledCellSize>0 && x<canvas.width) {
                ctx.beginPath();
                ctx.arc(x+ledCellSize/2, y+ledCellSize/2, ledCellSize/2, 0, Math.PI*2);
                ctx.fill();
              }
            }
          });
        });
      }
      
      ctx.shadowBlur = 0;
    }
    
    function animateLED() {
      offset++;
      drawLED();
      requestAnimationFrame(animateLED);
    }
    
    animateLED();
    
    return () => {};
  }, []);

  return (
    <div className="relative mx-auto w-[300px] h-[70px] bg-black/80 border-[3px] border-[#0f0] rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,255,0,0.8)]">
      <canvas ref={canvasRef} width={300} height={70} className="block w-[300px] h-[70px] bg-[#111]" />
    </div>
  );
};

export default LEDBoard;
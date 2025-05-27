import React, { useState, useEffect, useCallback } from 'react';

const AnimalMatch3Game = () => {
  const animals = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
  const BOARD_SIZE = 8;
  const COLORS = {
    '🐶': 'bg-yellow-200',
    '🐱': 'bg-orange-200', 
    '🐭': 'bg-gray-200',
    '🐹': 'bg-pink-200',
    '🐰': 'bg-green-200',
    '🦊': 'bg-red-200',
    '🐻': 'bg-amber-200',
    '🐼': 'bg-slate-200'
  };

  const [board, setBoard] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [score, setScore] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [matchedTiles, setMatchedTiles] = useState([]);
  const [animatingTiles, setAnimatingTiles] = useState([]);

  // 보드 초기화
  const initializeBoard = useCallback(() => {
    const newBoard = [];
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      newBoard.push(animals[Math.floor(Math.random() * animals.length)]);
    }
    setBoard(newBoard);
  }, []);

  // 매치 찾기
  const findMatches = useCallback((currentBoard) => {
    const matches = new Set();
    
    // 가로 매치 찾기
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 2; col++) {
        const index = row * BOARD_SIZE + col;
        const animal = currentBoard[index];
        if (animal && 
            currentBoard[index + 1] === animal && 
            currentBoard[index + 2] === animal) {
          matches.add(index);
          matches.add(index + 1);
          matches.add(index + 2);
          
          // 연속된 매치 확장
          let extendCol = col + 3;
          while (extendCol < BOARD_SIZE && currentBoard[row * BOARD_SIZE + extendCol] === animal) {
            matches.add(row * BOARD_SIZE + extendCol);
            extendCol++;
          }
        }
      }
    }
    
    // 세로 매치 찾기
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let row = 0; row < BOARD_SIZE - 2; row++) {
        const index = row * BOARD_SIZE + col;
        const animal = currentBoard[index];
        if (animal && 
            currentBoard[index + BOARD_SIZE] === animal && 
            currentBoard[index + BOARD_SIZE * 2] === animal) {
          matches.add(index);
          matches.add(index + BOARD_SIZE);
          matches.add(index + BOARD_SIZE * 2);
          
          // 연속된 매치 확장
          let extendRow = row + 3;
          while (extendRow < BOARD_SIZE && currentBoard[extendRow * BOARD_SIZE + col] === animal) {
            matches.add(extendRow * BOARD_SIZE + col);
            extendRow++;
          }
        }
      }
    }
    
    return Array.from(matches);
  }, []);

  // 타일 떨어뜨리기
  const dropTiles = useCallback((currentBoard, matchedIndices) => {
    const newBoard = [...currentBoard];
    
    // 매치된 타일 제거
    matchedIndices.forEach(index => {
      newBoard[index] = null;
    });
    
    // 각 열에 대해 타일 떨어뜨리기
    for (let col = 0; col < BOARD_SIZE; col++) {
      const column = [];
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        const index = row * BOARD_SIZE + col;
        if (newBoard[index] !== null) {
          column.push(newBoard[index]);
        }
      }
      
      // 빈 공간을 새로운 랜덤 동물로 채우기
      while (column.length < BOARD_SIZE) {
        column.push(animals[Math.floor(Math.random() * animals.length)]);
      }
      
      // 열을 다시 보드에 배치
      for (let row = 0; row < BOARD_SIZE; row++) {
        const index = row * BOARD_SIZE + col;
        newBoard[index] = column[BOARD_SIZE - 1 - row];
      }
    }
    
    return newBoard;
  }, []);

  // 매치 처리
  const processMatches = useCallback(() => {
    setBoard(currentBoard => {
      const matches = findMatches(currentBoard);
      if (matches.length > 0) {
        // 매치된 타일에 애니메이션 효과 적용
        setMatchedTiles(matches);
        setAnimatingTiles(matches);
        
        setTimeout(() => {
          setScore(prevScore => prevScore + matches.length * 10);
          const newBoard = dropTiles(currentBoard, matches);
          setMatchedTiles([]);
          setAnimatingTiles([]);
          setBoard(newBoard);
          
          // 연쇄 매치를 위해 다시 체크
          setTimeout(() => processMatches(), 300);
        }, 600); // 애니메이션 시간
        
        return currentBoard;
      }
      return currentBoard;
    });
  }, [findMatches, dropTiles]);

  // 타일 클릭 처리
  const handleTileClick = (index) => {
    if (isSwapping) return;
    
    if (selectedTiles.length === 0) {
      setSelectedTiles([index]);
    } else if (selectedTiles.length === 1) {
      const firstIndex = selectedTiles[0];
      if (firstIndex === index) {
        setSelectedTiles([]);
        return;
      }
      
      // 인접한 타일인지 확인
      const firstRow = Math.floor(firstIndex / BOARD_SIZE);
      const firstCol = firstIndex % BOARD_SIZE;
      const secondRow = Math.floor(index / BOARD_SIZE);
      const secondCol = index % BOARD_SIZE;
      
      const isAdjacent = 
        (Math.abs(firstRow - secondRow) === 1 && firstCol === secondCol) ||
        (Math.abs(firstCol - secondCol) === 1 && firstRow === secondRow);
      
      if (isAdjacent) {
        setIsSwapping(true);
        
        // 타일 교환
        const newBoard = [...board];
        [newBoard[firstIndex], newBoard[index]] = [newBoard[index], newBoard[firstIndex]];
        
        // 교환 후 매치가 있는지 확인
        const matches = findMatches(newBoard);
        
        if (matches.length > 0) {
          setBoard(newBoard);
          setTimeout(() => {
            processMatches();
            setIsSwapping(false);
          }, 200);
        } else {
          // 매치가 없으면 원래대로 되돌리기
          setTimeout(() => {
            setIsSwapping(false);
          }, 200);
        }
      }
      
      setSelectedTiles([]);
    }
  };

  // 게임 초기화
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  // 초기 매치 제거
  useEffect(() => {
    if (board.length > 0) {
      const timer = setTimeout(() => {
        processMatches();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [board.length, processMatches]);

  const resetGame = () => {
    setScore(0);
    setSelectedTiles([]);
    setIsSwapping(false);
    setMatchedTiles([]);
    setAnimatingTiles([]);
    initializeBoard();
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-2 sm:mb-4 text-purple-800">
          🎮 동물 매칭 게임
        </h1>
        
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <div className="text-lg sm:text-xl font-semibold text-blue-600">
            점수: {score}
          </div>
          <button
            onClick={resetGame}
            className="px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            새 게임
          </button>
        </div>
        
        <div className="grid grid-cols-8 gap-0.5 sm:gap-1 bg-gray-300 p-1 sm:p-2 rounded-lg mx-auto" 
             style={{ width: 'min(100%, 90vw, 500px)', aspectRatio: '1' }}>
          {board.map((animal, index) => (
            <div
              key={index}
              onClick={() => handleTileClick(index)}
              className={`
                aspect-square flex items-center justify-center cursor-pointer
                rounded transition-all duration-200 hover:scale-105 relative overflow-hidden
                text-xs sm:text-sm md:text-base lg:text-lg
                ${COLORS[animal] || 'bg-white'}
                ${selectedTiles.includes(index) ? 'ring-1 sm:ring-2 ring-blue-500 scale-110' : ''}
                ${isSwapping ? 'pointer-events-none' : ''}
                ${matchedTiles.includes(index) ? 'animate-pulse' : ''}
                ${animatingTiles.includes(index) ? 'animate-bounce' : ''}
              `}
            >
              <span 
                className={`
                  transition-all duration-500 transform
                  ${matchedTiles.includes(index) ? 
                    'scale-150 opacity-0 rotate-180' : 
                    'scale-100 opacity-100 rotate-0'
                  }
                `}
              >
                {animal}
              </span>
              
              {/* 매치 효과 */}
              {matchedTiles.includes(index) && (
                <>
                  {/* 반짝이는 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 opacity-75 animate-ping"></div>
                  
                  {/* 폭발 효과 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full animate-ping absolute top-0.5 sm:top-1 left-0.5 sm:left-1"></div>
                    <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full animate-ping absolute top-0.5 sm:top-1 right-0.5 sm:right-1"></div>
                    <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full animate-ping absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1"></div>
                    <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full animate-ping absolute bottom-0.5 sm:bottom-1 right-0.5 sm:right-1"></div>
                  </div>
                  
                  {/* 점수 표시 */}
                  <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2 text-yellow-500 font-bold text-xs animate-bounce">
                    +10
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2 sm:mt-4 text-center text-xs sm:text-sm text-gray-600 px-2">
          <p>💡 인접한 두 동물을 클릭하여 교환하세요!</p>
          <p className="hidden sm:block">같은 동물 3개 이상을 연결하면 점수를 얻습니다.</p>
          <p className="sm:hidden">같은 동물 3개 이상 연결로 점수 획득!</p>
        </div>
      </div>
    </div>
  );
};

export default AnimalMatch3Game;
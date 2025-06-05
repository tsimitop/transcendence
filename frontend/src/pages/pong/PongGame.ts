

export interface GameStateData {
  game: {
      id: string;
      status: string;
      ball: {
          x: number;  // floats as string
          y: number;  // top left corner is (0/0)
      };
      leftPaddle: {
          topPoint: {
              x: number;
              y: number;
          };
          height: number;  // percentage of window height (0-1)
      };
      rightPaddle: {
          topPoint: {
              x: number;
              y: number;
          };
          height: number;  // percentage of window height (0-1)
      };
      lastUpdateTime: number;
      maxScore: number;
    scores: Array<{
      alias: string;
      score: number;
    }>;
      countdown: number; // Only relevant during countdown
  }
}

export interface GameOverData {
    gameId: string;
    winnerId: string;
    message: string;
    finalScore: {
        left: number;
        right: number;
    }
}
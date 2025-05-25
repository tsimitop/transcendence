
export interface LocalGame {
    mode: string, 
    players: [string, string]
}


export interface PongMessage {
    type: string;
    pong_data?: any;  // json data
}

export interface KeyboardInputData {
    userId: string;
    up: boolean;
    paddle: string;
}

export interface GameByIdData {
    gameId: string;
}

export interface JoinGameData {
    OpponentName: string;
    OpponentAlias: string;
    gameId: string;
}

export interface CreateGameData {
    playerAlias: string;
    gameMode: string;
    localOpponent: string;
}

    export interface GameStateData {
        game: {
            id: string;
            status: string;
            ball: {
                x: number;
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
            gameMode: string;
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

export interface PongErrorData {
    message: string;
    code: number;
}
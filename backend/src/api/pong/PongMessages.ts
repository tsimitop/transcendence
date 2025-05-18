export interface PongMessage {
    type: string;
    pong_data: any;  // json data
}

export interface KeyboardInputData {
    userId: string;
    up: boolean;
}

export interface GameByIdData {
    id: string;
}

export interface JoinGameData {
    id: string;
}

export interface CreateGameData {
    userId: string;
    gameMode: string;
    isPrivate: boolean;
    maxScore: number;
}

export interface GameStateData {
    game: {
        id: string;
        status: string;
        ball: {
            x: string;  // floats as string
            y: string;  // top left corner is (0/0)
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
        scores: {
            [playerId: string]: number;  // player IDs mapped to their scores
        };
        countdown: number; // Only relevant during countdown
    }
}

export interface GameOverData {
    gameId: string;
    winnerId: string;
    finalScore: {
        left: number;
        right: number;
    }
}

export interface PongErrorData {
    message: string;
    code: number;
}
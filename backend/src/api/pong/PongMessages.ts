

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
            x: number;
            y: number;
            radius: number;
            dx: number;
            dy: number;
            speed: number;
        };
        leftPaddle: {
            x: any; // TODO: Define the type
        }
        rightPaddle: {
            x: any; // TODO: Define the type
        }
        width: number;
        height: number;
        lastUpdateTime: number;
        gameMode: string;
        isPrivate: boolean;
        maxScore: number;
        countdown: number;
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
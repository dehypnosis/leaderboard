class BadRequestError extends Error {
    public readonly code = 400;
}

export class AlreadyExistingPlayerError extends BadRequestError {
    public readonly message = "given player id already exists";
}

export class NotFoundPlayerError extends Error {
    public readonly code = 404;
    public readonly message = "cannot find the player with given id";
}

class ValidationError extends Error {
    public readonly code = 422;
}

export class PlayerIdValidationError extends ValidationError {
    public readonly message = "'id' should be an integer either equal or greater than zero.";
}

export class PlayerMMRValidationError extends ValidationError {
    public readonly message = "'mmr' should be either an integer greater than zero.";
}

export class PlayerLeaderBoardGetStrategyError extends ValidationError {
    public readonly message = "'strategy' should be either 'around_player' or 'rank'.";
}

export class PlayerLeaderBoardGetOffsetError extends ValidationError {
    public readonly message = "'offset' should be an integer either equal or greater than zero.";
}

export class PlayerLeaderBoardGetLimitError extends ValidationError {
    public readonly message = "'limit' should be an integer either equal or greater than zero and smaller than 100.";
}

export class PlayerLeaderBoardGetRangeError extends ValidationError {
    public readonly message = "'range' should be an integer either equal or greater than zero and smaller than 50.";
}

export class PlayerLeaderBoardGetPlayerIdError extends ValidationError {
    public readonly message = "'player_id' should be an existing player's id.";
}

export class InternalError extends Error {
    public readonly code = 500;
}


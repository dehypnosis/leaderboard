export class ValidationError extends Error {
    public readonly code = 422;
}

export class BadRequestError extends Error {
    public readonly code = 400;
}
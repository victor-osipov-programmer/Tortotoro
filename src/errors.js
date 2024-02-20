class GeneralError extends Error {
    constructor(code, message) {
        super(message)
        this.code = code;
    }
}

class ValidationError extends GeneralError {
    constructor(errors, code, message) {
        super(code ?? 422, message ?? 'Validation error');
        this.errors = errors;
    }
}
class LoginFailed extends GeneralError {
    constructor() {
        super(403, 'Login failed');
    }
}
class ForbiddenForYou extends GeneralError {
    constructor() {
        super(403, 'Forbidden for you');
    }
}
class AuthenticationFailed extends GeneralError {
    constructor() {
        super(401, 'Authentication failed');
    }
}

function Validator(body, errors = {}) {
    const addError = (key, message) => {
        if (!errors.hasOwnProperty(key)) {
            errors[key] = [];
        }

        errors[key].push(message);
    }

    const validation = (key, message) => {
        if (errors[key]?.some(el => el.endsWith('is required'))) return;

        if (message == 'required' && !body.hasOwnProperty(key)) {
            message = `${key} is required`;
        } else if (message == 'number' && isNaN(body[key])) {
            message = `${key} need number`;
        } else {
            return;
        }

        addError(key, message);
    }

    const reportError = (next) => {
        if (Object.keys(errors).length !== 0) {
            next(new ValidationError(errors));
            return true;
        }

        return false;
    }

    return { validation, addError, reportError }
}

module.exports = {
    GeneralError,
    ValidationError,
    LoginFailed,
    ForbiddenForYou,
    AuthenticationFailed,
    Validator,
}
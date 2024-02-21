const errors = require('./errors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const secret_key = process.env.SECRET_KEY;

function auth(roles) {
    return async (req, res, next) => {
        try {
            const token = req.get('Authorization')?.split(' ')[1];
            if (!token) {
                if (roles.length !== 0) {
                    return next(new errors.LoginFailed());
                }
            }
            
            const paylod = jwt.verify(token, secret_key);
            
            const [user] = await db.users.getOne(paylod.user_id, true);
            if (!user || token != user.token) {
                return next(new errors.LoginFailed());
            }
            if (!roles.includes('all') && !roles.includes(user.group)) {
                console.log(roles)
                console.log('!roles.includes(all) && !roles.includes(user.group)', user)
                return next(new errors.LoginFailed());
            }

            req.user = user;
            req.roles = roles;
            next()
        } catch (err) {
            console.log('auth middleware error' , err);
            return next(new errors.LoginFailed());
        }
    }
}

function handleErrors(err, req, res, next) {
    if (err instanceof errors.ValidationError) {
        return res.status(err.code).json({
            error: {
                code: err.code,
                errors: err.errors
            }
        });
    }
    if (err instanceof errors.GeneralError) {
        return res.status(err.code).json({
            error: {
                code: err.code,
                message: err.message
            }
        });
    }
    
    return res.status(500).json(err);
}

module.exports = {
    auth,
    handleErrors
}
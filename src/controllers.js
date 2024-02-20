const errors = require('./errors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const secret_key = process.env.SECRET_KEY;

async function login(req, res, next) {
    const body = req.body;
    const { login, password } = body;

    const { validation, reportError } = errors.Validator(body);
    validation('login', 'required');
    validation('password', 'required');
    if (reportError(next)) return;

    const [user] = await db.users.login(login, password);
    if (!user) {
        return next(new errors.AuthenticationFailed())
    }
    

    const new_token = jwt.sign({ user_id: user.user_id }, secret_key);
    await db.users.setToken(user.user_id, new_token);
    
    res.json({
        data: {
            user_token: new_token
        }
    });
}

async function logout(req, res, next) {
    await db.users.setToken(req.user.user_id, null);

    res.json({
        data: {
            message: 'logout'
        }
    });
}

async function getUsers(req, res, next) {
    
}

module.exports = {
    login,
    logout,
    getUsers
}
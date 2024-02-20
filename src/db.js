const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'module_b',
    port: 3307
})

async function query(sql , params) {
    const [response, test] = await pool.query(sql, params);
    return response;
}

const users = {
    getOne(id, full = false) {
        if (full) {
            return query(
            `SELECT u.user_id, u.name, u.surname, u.patronymic, u.login, u.password, u.photo_file, g.name as \`group\`, s.name as status, u.token 
            FROM users u
            JOIN \`groups\` g ON u.group_id = g.group_id
            JOIN user_statuses s ON u.status_id = s.status_id
            WHERE u.user_id = ?`, [id]);
        } else {
            return query('SELECT * FROM users WHERE user_id = ?', [id]);
        }  
    },
    login(login, password) {
        return query('SELECT * FROM users WHERE login = ? AND password = ?', [login, password]);
    },
    setToken(id, new_token) {
        return query('UPDATE users SET token = ? WHERE user_id = ?', [new_token, id]);
    }
}

module.exports = {
    users,
    query,
    pool
}
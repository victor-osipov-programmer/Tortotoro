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
    getAll() {
        return query(`
        SELECT u.user_id as id, u.name, u.login, g.name as \`group\`, s.name as status 
        FROM users u
        JOIN \`groups\` g ON u.group_id = g.group_id
        JOIN user_statuses s ON u.status_id = s.status_id`);
    },
    login(login, password) {
        return query('SELECT * FROM users WHERE login = ? AND password = ?', [login, password]);
    },
    setToken(id, new_token) {
        return query('UPDATE users SET token = ? WHERE user_id = ?', [new_token, id]);
    },
    createUser(user) {
        return query('INSERT INTO users SET ?', [user]);
    }
}

const work_shifts = {
    create(start, end) {
        return query('INSERT INTO work_shifts(start, end) VALUES (?, ?)', [start, end]);
    },
    getOpens() {
        return query('SELECT * FROM work_shifts WHERE active = 1')
    },
    setActive(id, value) {
        return query('UPDATE work_shifts SET active = ? WHERE work_shift_id = ?', [value, id]);
    },
    getOne(id) {
        return query('SELECT * FROM work_shifts WHERE work_shift_id = ?', [id]);
    },
    getUser(work_shift_id, user_id) {
        return query(`
        SELECT * FROM employees_at_work_shift
        WHERE work_shift_id = ? AND user_id = ?`, [work_shift_id, user_id]);
    },
    getUsers(work_shift_id) {
        return query(`SELECT * FROM employees_at_work_shift
        WHERE work_shift_id = ?`, [work_shift_id]);
    },
    addUser(work_shift_id, user_id, id_user) {
        return query(`INSERT INTO employees_at_work_shift(work_shift_id, user_id, id_user) VALUES (?, ?, ?)`, [work_shift_id, user_id, id_user]);
    },
    getOrders(work_shift_id) {
        return query(`
        SELECT w.work_shift_id as id, CONCAT('Столик №', o.table_id) as \`table\`, u.name as shift_workers, o.create_at, os.name, o.price
        FROM orders o
        JOIN work_shifts w ON w.work_shift_id = o.work_shift_id
        JOIN users u ON u.user_id = o.user_id
        JOIN order_statuses os ON os.order_status_id = o.order_status_id
        WHERE w.work_shift_id = ?`, [work_shift_id]);
    }
}

const orders = {
    getOne(id) {
        return query(`
        SELECT o.order_id, CONCAT('Столик №', o.table_id) as \`table\`, u.name as shift_workers, o.create_at, os.name, o.price, os.name as status, o.work_shift_id
        FROM orders o
        JOIN work_shifts w ON w.work_shift_id = o.work_shift_id
        JOIN users u ON u.user_id = o.user_id
        JOIN order_statuses os ON os.order_status_id = o.order_status_id
        WHERE order_id = ?`, [id]);
    },
    createOrder(order) {
        return query(`INSERT INTO orders SET ?`, order);
    },
    getPositions(order_id) {
        return query(`SELECT position_id as id, count, position, price FROM positions
        WHERE order_id = ?`, [order_id]);
    },
    getUser(user_id) {
        return query(`SELECT * FROM orders WHERE user_id = ?`, [user_id])
    },
    setStatus(order_id, new_status) {
        return query(`UPDATE orders SET order_status_id = ? WHERE order_id = ?`, [new_status, order_id]);
    },
    getOrdersByStatus(status) {
        return query(`SELECT * FROM orders
        WHERE order_status_id = ?`, [status]);
    }
}

const order_statuses = {
    getIdByName(name) {
        return query(`SELECT order_status_id as id FROM order_statuses WHERE name = ?`, [name]);
    }
}

module.exports = {
    users,
    work_shifts,
    orders,
    order_statuses,
    query,
    pool
}
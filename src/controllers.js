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
    const users = await db.users.getAll();
    res.json(users);
}
async function createUser(req, res, next) {
    const body = req.body;
    const { name, surname, patronymic, login, password, photo_file, role_id } = body;

    console.log(body)
    const { validation, reportError } = errors.Validator(body);
    validation('name', 'required');
    validation('login', 'required');
    validation('password', 'required');
    validation('role_id', 'required');
    if (reportError(next)) return;
    console.log(req.file)

    let response;
    try {
        response = await db.users.createUser({ name, surname, patronymic, login, password, photo_file: req.file?.filename, group_id: role_id });
    } catch (err) {
        return next(err);
    }
    
    res.json({
        data: {
            id: response.insertId,
            status: 'created'
        }
    });
}
async function createWorkShift(req, res, next) {
    const body = req.body;
    const { start, end } = body;

    const { validation, reportError } = errors.Validator(body);
    validation('start', 'required');
    validation('end', 'required');
    if (reportError(next)) return;

    const response = await db.work_shifts.create(start, end);
 
    res.json({
        id: response.insertId,
        start,
        end
    });
}
async function openWorkShift(req, res, next) {
    const work_shift_id = req.params.id;
    const opens_work_shift = await db.work_shifts.getOpens();
    if (opens_work_shift.length !== 0) {
        return next(new errors.ForbiddenForYou("Forbidden. There are open shifts!"));
    }

    await db.work_shifts.setActive(work_shift_id, true);
    const [work_shift] = await db.work_shifts.getOne(work_shift_id);

    res.json({
        id: work_shift.work_shift_id,
        start: work_shift.start,
        end: work_shift.end,
        active: work_shift.active ? true : false
    })
}
async function closeWorkShift(req, res, next) {
    const work_shift_id = req.params.id;
    const [work_shift] = await db.work_shifts.getOne(work_shift_id);
    if (!work_shift.active) {
        return next(new errors.ForbiddenForYou("Forbidden. The shift is already closed!"));
    }

    await db.work_shifts.setActive(work_shift_id, false);
    
    res.json({
        id: work_shift.work_shift_id,
        start: work_shift.start,
        end: work_shift.end,
        active: work_shift.active ? true : false
    })
}
async function addUserToOnWorkShift(req, res, next) {
    const work_shift_id = req.params.id;
    const body = req.body;
    const { user_id } = body;

    const { validation, reportError } = errors.Validator(body);
    validation('user_id', 'required');
    if (reportError(next)) return;

    const [work_shift_user] = await db.work_shifts.getUser(work_shift_id, user_id);
    if (work_shift_user) {
        return next(new errors.ForbiddenForYou("Forbidden. The worker is already on shift!"));
    }
    const work_shift_users = await db.work_shifts.getUsers(work_shift_id);
    const user_number = work_shift_users.length + 1;
    
    const response = await db.work_shifts.addUser(work_shift_id, user_id, user_number);

    res.json({
        data: {
            id_user: user_number,
            status: 'added'
        }
    });
}

async function getOrdersWorkShift(req, res, next) {
    const work_shift_id = req.params.id;
    const [work_shift] = await db.work_shifts.getOne(work_shift_id);
    const orders = await db.work_shifts.getOrders(work_shift_id);
    const orders_amount_all = orders.reduce((sum, order) => sum + order.price, 0);

    if (req.roles.includes('Waiter')) {
        const [user] = await db.work_shifts.getUser(work_shift_id, req.user.user_id);
        if (!user) {
            return next(new errors.ForbiddenForYou("Forbidden. You did not accept this order!"));
        }
    }

    res.json({
        id: work_shift.work_shift_id,
        start: work_shift.start,
        end: work_shift.end,
        active: work_shift.active ? true : false,
        orders: orders,
        amount_for_all: orders_amount_all
    });
}

async function createOrder(req, res, next) {
    const body = req.body;
    const { work_shift_id, table_id, number_of_person } = body;

    const { validation, reportError } = errors.Validator(body);
    validation('work_shift_id', 'required');
    validation('table_id', 'required');
    if (reportError(next)) return;

    const [work_shift] = await db.work_shifts.getOne(work_shift_id);
    if (!work_shift.active) {
        return next(new errors.ForbiddenForYou("Forbidden. The shift must be active!"));
    }
    const [work_shift_user] = await db.work_shifts.getUser(work_shift_id, req.user.user_id);
    if (!work_shift_user) {
        return next(new errors.ForbiddenForYou("Forbidden. You don't work this shift!"));
    }

    const create_at = new Date();
    const response = await db.orders.createOrder({
        ...body,
        create_at,
        user_id: req.user.user_id
    });

    res.json({
        data: {
            id: response.insertId,
            table: "Столик №" + table_id,
            shift_workers: req.user.name,
            create_at,
            status: 'Принят',
            price: 0
        }
    })
}

async function getDetailsOrder(req, res, next) {
    const order_id = req.params.id;
    const positions = await db.orders.getPositions(order_id);
    const [order] = await db.orders.getOne(order_id);
    const price_all = positions.reduce((sum, position) => sum + position.price, 0);
    const [user] = await db.orders.getUser(req.user.user_id);
    if (!user) {
        return next(new errors.ForbiddenForYou("Forbidden. You did not accept this order!"));
    }

    console.log(order)
    res.json({
        id: order.order_id,
        table: order.table,
        shift_workers: order.shift_workers,
        create_at: order.create_at,
        status: order.status,
        positions,
        price_all
    });
}

async function updateOrderStatus(req, res, next) {
    const order_id = req.params.id;
    const body = req.body;
    const { status } = body;

    const { validation, reportError } = errors.Validator(body);
    validation('status', 'required');
    if (reportError(next)) return;

    const [order] = await db.orders.getOne(order_id);
    if (!order) {
        return next(new errors.ForbiddenForYou("Order not found!"));
    }
    const old_status = order.status;
    const new_status = status;

    const [user] = await db.orders.getUser(req.user.user_id);
    if (!user) {
        return next(new errors.ForbiddenForYou("Forbidden. You did not accept this order!"));
    }

    const [work_shift] = await db.work_shifts.getOne(order.work_shift_id);
    console.log(work_shift)
    if (!work_shift) {
        return next(new errors.ForbiddenForYou("work_shift not found!"));
    }
    if (!work_shift.active) {
        return next(new errors.ForbiddenForYou("You cannot change the order status of a closed shift!"));
    }
    
    if (
        old_status == 'accepted' && new_status == 'canceled' ||
        old_status == 'ready' && new_status == 'paid-up'
    ) {
        const [status_id] = await db.order_statuses.getIdByName(new_status);
        const new_status_id = status_id.id;
        console.log(new_status_id);
        await db.orders.setStatus(order_id, new_status_id);

        res.json({
            data: {
                id: order.order_id,
                status: new_status
            }
        });
    } else {
        return next(new errors.ForbiddenForYou("Forbidden! Can't change existing order status"));
    }
}

async function getOrdersCurrentWorkShift(req, res, next) {
    const accepted_orders = await db.orders.getOrdersByStatus('accepted');
    const prepare_orders = await db.orders.getOrdersByStatus('prepare');

    res.json({
        data: [
            ...accepted_orders,
            ...prepare_orders
        ]
    })
}

module.exports = {
    login,
    logout,
    getUsers,
    createUser,
    createWorkShift,
    openWorkShift,
    closeWorkShift,
    addUserToOnWorkShift,
    getOrdersWorkShift,
    createOrder,
    getDetailsOrder,
    updateOrderStatus,
    getOrdersCurrentWorkShift
}
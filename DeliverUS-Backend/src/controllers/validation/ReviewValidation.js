import { check } from 'express-validator'

const create = [
    check('raiting').exists().isInt({ min:1, max:5 }).toInt(),
    check('comment').optional({ checkNull: true, checkFalsy: true }).isString().isLength({ max: 500 }).trim()
]

const update = [
    check('raiting').exists().isInt({ min:1, max:5 }).toInt(),
    check('comment').optional({ checkNull: true, checkFalsy: true }).isString().isLength({ max: 500 }).trim()
]

export { create, update }

import { check } from 'express-validator'

const create = [

]

const update = [

]

const updateRiderComments = [
  check('riderComments').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 500 }).trim()
]

export { create, update, updateRiderComments }

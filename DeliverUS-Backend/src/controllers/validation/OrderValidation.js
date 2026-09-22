const create = [

]

const update = [

]

const applyCoupon = [
    check('code').exists().notEmpty().isString().trim()
]

const updateCustomerComments = [
    check('customerComments').optional({ nullable: true }).isString().isLength({ max: 500 }).trim()
]

export { create, update, applyCoupon, updateCustomerComments }

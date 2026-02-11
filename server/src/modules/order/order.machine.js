const { createMachine } = require('xstate');

const orderMachine = createMachine({
  id: 'order',
  initial: 'Draft',
  predictableActionArguments: true,
  states: {
    Draft: {
      on: { CHECKOUT: 'Pending' }
    },
    Pending: {
      on: {
        PAYMENT_SUCCESS: 'Paid',
        TIMEOUT: 'Expired'
      }
    },
    Paid: {
      on: {
        PREPARE: 'Prepared'
      }
    },
    Expired: {
      on: {
        PAYMENT_SUCCESS: 'Conflict' // Zombie Payment handling
      }
    },
    Conflict: {
      on: {
        REFUND: 'Refunded'
      }
    },
    Refunded: { type: 'final' },
    Prepared: { on: { SHIP: 'Shipped' } },
    Shipped: { type: 'final' }
  }
});

module.exports = orderMachine;

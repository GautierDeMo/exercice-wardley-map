const orderMachine = require('../../src/modules/order/order.machine');

describe('Order State Machine', () => {
  it('should start in Draft state', () => {
    expect(orderMachine.initialState.value).toBe('Draft');
  });

  it('should transition from Draft to Pending on CHECKOUT', () => {
    const nextState = orderMachine.transition('Draft', 'CHECKOUT');
    expect(nextState.value).toBe('Pending');
  });

  it('should transition from Pending to Paid on PAYMENT_SUCCESS', () => {
    const nextState = orderMachine.transition('Pending', 'PAYMENT_SUCCESS');
    expect(nextState.value).toBe('Paid');
  });

  it('should transition from Pending to Expired on TIMEOUT', () => {
    const nextState = orderMachine.transition('Pending', 'TIMEOUT');
    expect(nextState.value).toBe('Expired');
  });

  it('should handle Zombie Payment (Expired -> Conflict)', () => {
    const nextState = orderMachine.transition('Expired', 'PAYMENT_SUCCESS');
    expect(nextState.value).toBe('Conflict');
  });

  it('should NOT allow Draft to Paid directly', () => {
    const nextState = orderMachine.transition('Draft', 'PAYMENT_SUCCESS');
    expect(nextState.changed).toBe(false);
  });
});

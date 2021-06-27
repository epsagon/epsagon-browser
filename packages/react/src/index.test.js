import Epsagon from '.';

describe('Sanity test', () => {
  it('init function exists', () => {
    expect(typeof Epsagon.init === 'function').toEqual(true);
  });
});

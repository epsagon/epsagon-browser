import { init } from './web-tracer'

describe('Sanity test', () => {

  it('init function exists', () => {
    console.log(init)
    expect(typeof init === 'function').toEqual(true);
  })
})

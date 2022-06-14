import {notion} from '../src/notion.js';

describe('notion client', () => {
  it('notion client is valid', () => {
    expect(notion).toBeDefined();
  });
});

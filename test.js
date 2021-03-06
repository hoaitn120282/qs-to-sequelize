const queryLib = require('./index')();
const expect = require('must');

describe('query', () => {
  it('must transform per_page into limit', () => {
    const result = queryLib({ per_page: 20 });
    expect(result.limit).to.equal(20);
  });

  it('must transform page into offset', () => {
    const result = queryLib({ per_page: 20, page: 3 });
    expect(result.offset).to.equal(40);

    const result2 = queryLib({ per_page: 10, page: 3 });
    expect(result2.offset).to.equal(20);
  });

  it('must throw if passed a page without a per_page', () => {
    let thrown = false;

    try {
      queryLib({ page: 3 });
    } catch (e) {
      thrown = true;
      expect(e.message).to.equal('Cannot calculate page without per_page');
    }

    if (!thrown) throw new Error('did not throw');
  });

  it('must set a max per_page if asked', () => {
    const innerLib = require('./index')({max_per_page: 10});
    const result = innerLib({ per_page: 20 });
    expect(result.limit).to.equal(10);
  });

  it('must set a default per_page if asked', () => {
    const innerLib = require('./index')({default_per_page: 20});
    const result = innerLib({});
    expect(result.limit).to.equal(20);
  });

  it('must use the default_per_page for offset calculation if a specific per_page is not set', () => {
    const innerLib = require('./index')({default_per_page: 20});
    const result = innerLib({page: 2});
    expect(result.offset).to.equal(20);
  });

  it('must not let the default_per_page override the specific per_page in offset calculation', () => {
    const innerLib = require('./index')({default_per_page: 20});
    const result = innerLib({page: 2, per_page: 10});
    expect(result.offset).to.equal(10);
  });

  it('must transmute sort', () => {
    const result = queryLib({ sort: 'created_at' });
    expect(Array.isArray(result.order));
    expect(result.order[0]).to.eql(['created_at', 'ASC']);
  });

  it('must allow desc sort', () => {
    const result = queryLib({ sort: '-created_at' });
    expect(Array.isArray(result.order));
    expect(result.order[0]).to.eql(['created_at', 'DESC']);
  });

  it('must barf on csv sort props', () => {
    let thrown = false;

    try {
      queryLib({ sort: '-created_at,foo' });
    } catch (e) {
      thrown = true;
      expect(e.message).to.equal('Cannot sort by multiple properties');
    }

    if (!thrown) throw new Error('did not throw');
  });

  it('must transmute created_since', () => {
    const ts = '2016-12-07T00:28:40.480Z';
    const result = queryLib({ created_since: ts });
    expect(result.where.created_at).to.eql({ $gt: ts });
  });

  it('must transmute updated_since', () => {
    const ts = '2016-12-07T00:28:40.480Z';
    const result = queryLib({ updated_since: ts });
    expect(result.where.updated_at).to.eql({ $gt: ts });
  });

  it('must transmute created_before', () => {
    const ts = '2016-12-07T00:28:40.480Z';
    const result = queryLib({ created_before: ts });
    expect(result.where.created_at).to.eql({ $lt: ts });
  });

  it('must transmute updated_before', () => {
    const ts = '2016-12-07T00:28:40.480Z';
    const result = queryLib({ updated_before: ts });
    expect(result.where.updated_at).to.eql({ $lt: ts });
  });

  it('must handle updated_before AND updated_since', () => {
    const ts = '2016-12-07T00:28:40.480Z';
    const result = queryLib({ updated_since: ts, updated_before: ts });
    expect(result.where.updated_at).to.eql({ $lt: ts, $gt: ts });
  });

  it('must transmute filter[user_id]', () => {
    const result = queryLib({ filter: {user_id: 'fred' }});
    expect(result.where.user_id).to.eql('fred');
  });

  it('must transmute multiple filter params', () => {
    const result = queryLib({ filter: {user_id: 'fred', foo: 'bar' }});
    expect(result.where.user_id).to.eql('fred');
    expect(result.where.foo).to.eql('bar');
  });
});

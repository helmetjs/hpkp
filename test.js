const hpkp = require(".");

const connect = require("connect");
const request = require("supertest");
const assert = require("node:assert/strict");
const test = require("node:test");

test('sets header with a multi-value array key called "sha256s"', () => {
  return makeRequestWith({ maxAge: 10, sha256s: ["abc123", "xyz456"] }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10',
  );
});

test("can include subdomains with the includeSubdomains option", () => {
  return makeRequestWith({
    maxAge: 10,
    sha256s: ["abc123", "xyz456"],
    includeSubdomains: true,
  }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; includeSubDomains',
  );
});

test("can include subdomains with the includeSubDomains option", () => {
  return makeRequestWith({
    maxAge: 10,
    sha256s: ["abc123", "xyz456"],
    includeSubDomains: true,
  }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; includeSubDomains',
  );
});

test("can set a report-uri", () => {
  return makeRequestWith({
    maxAge: 10,
    sha256s: ["abc123", "xyz456"],
    reportUri: "http://example.com",
  }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; report-uri="http://example.com"',
  );
});

test("can enable Report-Only header", () => {
  return makeRequestWith({
    maxAge: 10,
    sha256s: ["abc123", "xyz456"],
    reportUri: "http://example.com",
    reportOnly: true,
  }).expect(
    "Public-Key-Pins-Report-Only",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; report-uri="http://example.com"',
  );
});

test("can use a report URI and include subdomains", () => {
  return makeRequestWith({
    maxAge: 10,
    sha256s: ["abc123", "xyz456"],
    reportUri: "http://example.com",
    includeSubDomains: true,
  }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; includeSubDomains; report-uri="http://example.com"',
  );
});

test("rounds down to the nearest second", () => {
  return makeRequestWith({
    maxAge: 1.234,
    sha256s: ["abc123", "xyz456"],
  }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=1',
  );
});

test("rounds up to the nearest second", () => {
  return makeRequestWith({
    maxAge: 1.567,
    sha256s: ["abc123", "xyz456"],
  }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=2',
  );
});

test("set the header when the condition is true", () => {
  return makeRequestWith({
    maxAge: 10,
    sha256s: ["abc123", "xyz456"],
    setIf: () => true,
  }).expect(
    "Public-Key-Pins",
    'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10',
  );
});

test("doesn't set the header when the condition is false", () => {
  return makeRequestWith({
    maxAge: 10,
    sha256s: ["abc123", "xyz456"],
    setIf: () => false,
  }).expect((res) => {
    assert(!("public-key-pins" in res.headers));
  });
});

test("names its function and middleware", () => {
  assert.strictEqual(hpkp.name, "hpkp");
  assert.strictEqual(
    hpkp.name,
    hpkp({ maxAge: 10000, sha256s: ["abc123", "xyz456"] }).name,
  );
});

test("fails if called with no arguments", () => {
  assert.throws(callWith());
});

test("fails if called with an empty object", () => {
  assert.throws(callWith({}));
});

test("fails if called without a max-age", () => {
  assert.throws(callWith({ sha256s: ["abc123", "xyz456"] }));
});

test('fails if called with a lowercase "maxage" option', () => {
  assert.throws(
    callWith({
      maxage: 10,
      sha256s: ["abc123", "xyz456"],
    }),
  );
});

test("fails if called with fewer than 2 SHAs", () => {
  [undefined, null, "abc123", [], ["abc123"]].forEach((value) => {
    assert.throws(callWith({ maxAge: 10, sha256s: value }));
  });
});

test("fails if called with a zero maxAge", () => {
  assert.throws(callWith({ maxAge: 0, sha256s: ["abc123", "xyz456"] }));
});

test("fails if called with a negative maxAge", () => {
  assert.throws(callWith({ maxAge: -10, sha256s: ["abc123", "xyz456"] }));
});

test("fails if called with both types of maxAge argument", () => {
  assert.throws(
    callWith({ maxAge: 10, maxage: 10, sha256s: ["abc123", "xyz456"] }),
  );
});

test("fails if called with reportOnly: true but no reportUri", () => {
  assert.throws(
    callWith({
      maxAge: 10,
      sha256s: ["abc123", "xyz456"],
      reportOnly: true,
    }),
  );
});

test("fails if called with no function", () => {
  [123, true].forEach((value) => {
    assert.throws(
      callWith({ maxAge: 10, sha256s: ["abc123", "xyz456"], setIf: value }),
    );
  });
});

function makeRequestWith(...args) {
  const app = connect();
  app.use(hpkp(...args));
  app.use((_req, res) => {
    res.end("Hello world!");
  });
  return request(app).get("/");
}

function callWith(...args) {
  return () => hpkp.apply(this, args);
}

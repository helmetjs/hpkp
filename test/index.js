var hpkp = require("..");

var connect = require("connect");
var request = require("supertest");
var assert = require("assert");

describe("hpkp", function () {
  describe("with proper input", function () {
    function test() {
      var app = connect();
      app.use(hpkp.apply(null, arguments));
      app.use(function (req, res) {
        res.end("Hello world!");
      });
      return request(app).get("/");
    }

    it('sets header with a multi-value array key called "sha256s"', function () {
      return test({ maxAge: 10, sha256s: ["abc123", "xyz456"] }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10'
      );
    });

    it("can include subdomains with the includeSubdomains option", function () {
      return test({
        maxAge: 10,
        sha256s: ["abc123", "xyz456"],
        includeSubdomains: true,
      }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; includeSubDomains'
      );
    });

    it("can include subdomains with the includeSubDomains option", function () {
      return test({
        maxAge: 10,
        sha256s: ["abc123", "xyz456"],
        includeSubDomains: true,
      }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; includeSubDomains'
      );
    });

    it("can set a report-uri", function () {
      return test({
        maxAge: 10,
        sha256s: ["abc123", "xyz456"],
        reportUri: "http://example.com",
      }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; report-uri="http://example.com"'
      );
    });

    it("can enable Report-Only header", function () {
      return test({
        maxAge: 10,
        sha256s: ["abc123", "xyz456"],
        reportUri: "http://example.com",
        reportOnly: true,
      }).expect(
        "Public-Key-Pins-Report-Only",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; report-uri="http://example.com"'
      );
    });

    it("can use a report URI and include subdomains", function () {
      return test({
        maxAge: 10,
        sha256s: ["abc123", "xyz456"],
        reportUri: "http://example.com",
        includeSubDomains: true,
      }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10; includeSubDomains; report-uri="http://example.com"'
      );
    });

    it("rounds down to the nearest second", function () {
      return test({ maxAge: 1.234, sha256s: ["abc123", "xyz456"] }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=1'
      );
    });

    it("rounds up to the nearest second", function () {
      return test({ maxAge: 1.567, sha256s: ["abc123", "xyz456"] }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=2'
      );
    });

    it("set the header when the condition is true", function () {
      return test({
        maxAge: 10,
        sha256s: ["abc123", "xyz456"],
        setIf: function () {
          return true;
        },
      }).expect(
        "Public-Key-Pins",
        'pin-sha256="abc123"; pin-sha256="xyz456"; max-age=10'
      );
    });

    it("doesn't set the header when the condition is false", function () {
      return test({
        maxAge: 10,
        sha256s: ["abc123", "xyz456"],
        setIf: function () {
          return false;
        },
      }).expect(function (res) {
        assert(!("public-key-pins" in res.headers));
      });
    });
  });

  it("names its function and middleware", function () {
    assert.strictEqual(hpkp.name, "hpkp");
    assert.strictEqual(
      hpkp.name,
      hpkp({ maxAge: 10000, sha256s: ["abc123", "xyz456"] }).name
    );
  });

  describe("with improper input", function () {
    function callWith() {
      var args = arguments;
      return function () {
        return hpkp.apply(this, args);
      };
    }

    it("fails if called with no arguments", function () {
      assert.throws(callWith());
    });

    it("fails if called with an empty object", function () {
      assert.throws(callWith({}));
    });

    it("fails if called without a max-age", function () {
      assert.throws(callWith({ sha256s: ["abc123", "xyz456"] }));
    });

    it('fails if called with a lowercase "maxage" option', function () {
      assert.throws(
        callWith({
          maxage: 10,
          sha256s: ["abc123", "xyz456"],
        })
      );
    });

    it("fails if called with fewer than 2 SHAs", function () {
      [undefined, null, "abc123", [], ["abc123"]].forEach(function (value) {
        assert.throws(callWith({ maxAge: 10, sha256s: value }));
      });
    });

    it("fails if called with a zero maxAge", function () {
      assert.throws(callWith({ maxAge: 0, sha256s: ["abc123", "xyz456"] }));
    });

    it("fails if called with a negative maxAge", function () {
      assert.throws(callWith({ maxAge: -10, sha256s: ["abc123", "xyz456"] }));
    });

    it("fails if called with both types of maxAge argument", function () {
      assert.throws(
        callWith({ maxAge: 10, maxage: 10, sha256s: ["abc123", "xyz456"] })
      );
    });

    it("fails if called with reportOnly: true but no reportUri", function () {
      assert.throws(
        callWith({
          maxAge: 10,
          sha256s: ["abc123", "xyz456"],
          reportOnly: true,
        })
      );
    });

    it("fails if called with no function", function () {
      [123, true].forEach(function (value) {
        assert.throws(
          callWith({ maxAge: 10, sha256s: ["abc123", "xyz456"], setIf: value })
        );
      });
    });
  });
});

# HTTP Public Key Pinning (HPKP) middleware

**This header has been deprecated citing risks of misuse, and therefore is not recommeded.** This module (`hpkp`) will not receive any new feature development but will still be maintained.

Adds Public Key Pinning headers to Express/Connect applications. To learn more about HPKP, check out [the spec](https://tools.ietf.org/html/rfc7469), [the article on MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Public_Key_Pinning), and [this tutorial](https://timtaubert.de/blog/2014/10/http-public-key-pinning-explained/).

**Be very careful when deploying this**—you can easily misuse this header and cause problems. Chrome has dropped support for HPKP citing risks of misuse.

Usage:

```js
const express = require("express");
const hpkp = require("hpkp");

const app = express();

const ninetyDaysInSeconds = 7776000;
app.use(
  hpkp({
    maxAge: ninetyDaysInSeconds,
    sha256s: ["AbCdEf123=", "ZyXwVu456="],
    includeSubDomains: true, // optional
    reportUri: "http://example.com", // optional
    reportOnly: false, // optional

    // Set the header based on a condition.
    // This is optional.
    setIf(req, res) {
      return req.secure;
    },
  })
);
```

Setting `reportOnly` to `true` will change the header from `Public-Key-Pins` to `Public-Key-Pins-Report-Only`.

Don't let these get out of sync with your certs! It's also recommended to test your HPKP deployment in `reportOnly` mode, or alternatively, to use a very short `maxAge` until you're confident your deployment is correct.

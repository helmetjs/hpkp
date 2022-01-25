module.exports = function hpkp(passedOptions) {
  var options = parseOptions(passedOptions);
  var headerName = getHeaderName(options);
  var headerValue = getHeaderValue(options);

  return function hpkp(req, res, next) {
    if (options.setIf(req, res)) {
      res.setHeader(headerName, headerValue);
    }
    next();
  };
};

function parseOptions(options) {
  var badArgumentsError = new Error(
    "hpkp must be called with a maxAge and at least two SHA-256s (one actually used and another kept as a backup)."
  );

  if (
    !options ||
    (options.maxage && options.maxAge) ||
    (options.reportOnly && !options.reportUri)
  ) {
    throw badArgumentsError;
  }

  var maxAge = options.maxAge;
  var sha256s = options.sha256s;
  var setIf =
    options.setIf ||
    function () {
      return true;
    };

  if (!maxAge || maxAge <= 0 || !sha256s || sha256s.length < 2) {
    throw badArgumentsError;
  }
  if (typeof setIf !== "function") {
    throw new TypeError("setIf must be a function.");
  }

  return {
    maxAge: maxAge,
    sha256s: sha256s,
    includeSubDomains: options.includeSubDomains || options.includeSubdomains,
    reportUri: options.reportUri,
    reportOnly: options.reportOnly,
    setIf: setIf,
  };
}

function getHeaderName(options) {
  var header = "Public-Key-Pins";
  if (options.reportOnly) {
    header += "-Report-Only";
  }
  return header;
}

function getHeaderValue(options) {
  var result = options.sha256s.map(function (sha) {
    return 'pin-sha256="' + sha + '"';
  });
  result.push("max-age=" + Math.round(options.maxAge));
  if (options.includeSubDomains) {
    result.push("includeSubDomains");
  }
  if (options.reportUri) {
    result.push('report-uri="' + options.reportUri + '"');
  }
  return result.join("; ");
}

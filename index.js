module.exports = function hpkp(passedOptions) {
  const options = parseOptions(passedOptions);
  const headerName = getHeaderName(options);
  const headerValue = getHeaderValue(options);

  return function hpkp(req, res, next) {
    if (options.setIf(req, res)) {
      res.setHeader(headerName, headerValue);
    }
    next();
  };
};

function parseOptions(options) {
  const badArgumentsError = new Error(
    "hpkp must be called with a maxAge and at least two SHA-256s (one actually used and another kept as a backup).",
  );

  if (
    !options ||
    (options.maxage && options.maxAge) ||
    (options.reportOnly && !options.reportUri)
  ) {
    throw badArgumentsError;
  }

  const {
    maxAge,
    sha256s,
    setIf = () => true,
    reportUri,
    reportOnly,
  } = options;

  if (!maxAge || maxAge <= 0 || !sha256s || sha256s.length < 2) {
    throw badArgumentsError;
  }
  if (typeof setIf !== "function") {
    throw new TypeError("setIf must be a function.");
  }

  return {
    maxAge,
    sha256s,
    includeSubDomains: options.includeSubDomains || options.includeSubdomains,
    reportUri,
    reportOnly,
    setIf,
  };
}

function getHeaderName({ reportOnly }) {
  const result = "Public-Key-Pins";
  if (reportOnly) return result + "-Report-Only";
  return result;
}

function getHeaderValue({ sha256s, maxAge, includeSubDomains, reportUri }) {
  const result = sha256s.map((sha) => 'pin-sha256="' + sha + '"');
  result.push("max-age=" + Math.round(maxAge));
  if (includeSubDomains) result.push("includeSubDomains");
  if (reportUri) result.push('report-uri="' + reportUri + '"');
  return result.join("; ");
}

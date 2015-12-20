/*
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted, provided that the above
  copyright notice and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
  WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
  MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
  ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
  WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
  ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
  OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

/**
 * @fileoverview Utilities for web scraping with http and xmldom
 *
 * @author Takanori Nagahara <takanori.nagahara@gmail.com>
 * @preserve Copyright (c) 2015, Takanori Nagahara.
 **/

var request = require('request'),
    Iconv = require('iconv').Iconv,
    dom = require('xmldom');

var e = exports;

/**
 * Call http get with `url`.
 * @param {String} url This is a url to get.
 * @param {String} encoding This is an encoding for the response body. (Ex.
 *     Shift_JIS.)
 * @param {success} This callback handles response when the status code is 200.
 * @param {failure} This callback handles failure case. It is called when the
 *     request failed or the response code is not 200.
 **/
e.get = function(url, encoding, success, failure) {
    request({ uri: url, encoding: null },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    success(e.convert(body, encoding));
                } else {
                    failure(statusCode, error, url);
                }
            });
};

/**
 * @callback success
 * @param {String} response This is an encoded response body.
 **/

/**
 * @callback failure
 * @param {number} code This is a status code of response.
 * @param {String} url This is a requested url.
 **/

/**
 * Convert string with `encoding`.
 * @param {String} body This is an original data.
 * @param {String} encoding This is an encoding. (Ex. Shift_JIS.)
 * @return {String} Converted value.
 **/
e.convert = function(body, encoding) {
    var iconv = new Iconv(encode, 'UTF-8//TRANSLIT//IGNORE');
    return iconv.convert(body).toString();
};

/**
 * Search a node whose local name is `localName` in sliblings of `node`.
 * @param {Node} node This is a node as a basis.
 * @param {String} localName This is a local name to search
 * @param {siblingsCallback} This callback handles a sibling of `node`.
 **/
e.searchSiblings = function(node, localName, callback) {
    while (node != undefined) {
        if (node.localName == localName) {
            if (callback(node)) {
                break;
            }
        }

        node = node.nextSibling;
    }
};

/**
 * @callback siblingsCallback
 * @param {Node} node This is the found node.
 * @return {Boolean} true: continue to search, false: stop searching.
 **/

/**
 * Get nodes identified in `localName` from childNodes of `node`.
 * @param {Node} node This is a node as a basis.
 * @param {String} localName This is a local name to search
 * @return {Array.<Node>} Array of nodes
 **/
e.getChilds = function(node, localName) {
    var arr = [];
    var n = node.firstChild;
    while (n != undefined) {
        if (n.localName == localName) {
            arr.push(n);
        }

        n = n.nextSibling;
    }

    return arr;
};
var parse = e.monad(function() {
    return [null, "abcdef"] }).bind(function(_) {
    return item.bind(function(x) {
        return item.bind(function(_) {
            return item.bind(function(y) {
                return [[x[0], y[0]], y[1]];
            }, _[1]);
        }, x[1]);
    }, _[1]);
});
console.log(parse);


/**
 * Get monad from Function `f`.
 * @param {Function} f - This is a function (ex. parser function)
 * @return {Function} - Return a monad value including f
 *
 * @see doParse
 * @code {
 * // returns [['a', 'c'], 'def']
 * var parse = e.monad(function() {
 *    return [null, "abcdef"] }).bind(function(_) {
 *    return item.bind(function(x) {
 *        return item.bind(function(_) {
 *            return item.bind(function(y) {
 *                return [[x[0], y[0]], y[1]];
 *            }, _[1]);
 *        }, x[1]);
 *    }, _[1]);
 * });
 * console.log(parse);
 * }
 **/
e.monad = function(f) {
    f.bind = function(g, val) { return g(this(val)); };
    f.get = function() { return this(); };
    return f;
};

/**
 * Execute several parsers sequentially.
 * @param {Any} va_args - This has a pair and an utput function. The pair is an
 *     Array which consits of a variable name and a parser function (ex. ['x',
 *     parser]). The output function use the variables.
 * @return {Function} - Return a monad that is identified in last of arguments.
 *
 * @code {
 * // returns [['a', 'c'], 'def']
 * var p = doParse(['x', item], [null, item], ['y', item],
 *         function(scope) { return unit([scope.x, scope.y]); });
 * console.log(p("abcdef"));
 * }
 **/
e.doParse = function() {
    var args = arguments;
    return function(input) {
        return (function() {
            var ret = {};
            var rec = function(i, val) {
                if (i == args.length - 1) {
                    return [args[i](ret), val];
                } else {
                    return args[i][1].bind(function(_) {
                        var name = args[i][0];
                        if (name != null) { ret[name] = _[0]; };
                        return rec(i + 1, _[1]);
                    }, val);
                }
            }

            return rec(0, input);
        })();
    };
};


/**
 * A parser sample to return "as is" strings.
 * @param {Object} val - This is a value
 * @return {Function} - Return a monad value
 **/
var unit = e.monad(function(val) {
    return val;
});

/**
 * A parser sample to pick up first characters.
 * @param {Object} val - This is a value
 * @return {Function} - Return a monad value
 **/
var item = e.monad(function(val) {
    if (val === null) {
        return null;
    } else {
        return [val.charAt(0), val.slice(1)];
    }
});

/**
 * A parser sample to return null.
 * @param {Object} val - This is a value
 * @return {Function} - Return a monad value
 **/
var failure = e.monad(function(val) {
    return null;
});


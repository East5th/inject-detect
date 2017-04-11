import { Tinytest } from "meteor/tinytest";
import { anonymize } from "meteor/east5th:inject-detect";

Tinytest.add('inject-detect - example', function (test) {
    test.equal(anonymize({foo: "bar"}), {foo: "string"});
    test.equal(anonymize({foo: 123}), {foo: "number"});
    test.equal(anonymize({foo: true}), {foo: "boolean"});
    test.equal(anonymize({foo: /bar/}), {foo: "regexp"});
    test.equal(anonymize({foo: function() {}}), {foo: "function"});
    test.equal(anonymize({foo: new Date()}), {foo: "date"});
    test.equal(anonymize({foo: {bar: "baz"}}), {foo: {bar: "string"}});
    test.equal(anonymize({foo: {bar: {baz: "abc"}}}), {foo: {bar: {baz: "string"}}});
    test.equal(anonymize({foo: {$in: [1, 2, 3]}}), {foo: {$in: "array"}});
    test.equal(anonymize({foo: {$or: [{bar: "baz"}]}}), {foo: {$or: [{bar: "string"}]}});
});

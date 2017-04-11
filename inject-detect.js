import _ from "lodash";
import { HTTP } from "meteor/http";
import { MongoInternals } from "meteor/mongo";

// https://github.com/meteor/meteor/blob/devel/packages/mongo/mongo_driver.js#L78-L101

export function anonymize(value, key) {
    if (_.isString(value)) {
        return "string";
    }
    else if (_.isNumber(value)) {
        return "number";
    }
    else if (_.isBoolean(value)) {
        return "boolean";
    }
    else if (_.isRegExp(value)) {
        return "regexp";
    }
    else if (_.isFunction(value)) {
        return "function";
    }
    else if (_.isDate(value)) {
        return "date";
    }
    else if (_.isArray(value)) {
        switch (_.toLower(key)) {
            case "$and":
            case "$or":
            case "$nor":
                return _.map(value, anonymize);
            default:
                return "array";
        }
    }
    else if (_.isObject(value)) {
        return _.mapValues(value, anonymize);
    }
}

const _find = MongoInternals.Connection.prototype.find;
MongoInternals.Connection.prototype.find = function(collection, selector, mod, options) {
    if (collection !== "oplog.rs") {
        HTTP.post("http://localhost:4000/api/ingest", {
            data: {
                collection,
                query: anonymize(selector),
                type: "find"
            }
        });
    }
    return _find.apply(this, arguments);
};

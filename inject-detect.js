import _ from 'lodash';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

let queries = [];

// https://github.com/meteor/meteor/blob/devel/packages/mongo/mongo_driver.js#L78-L101

export function anonymize(value, key) {
    if (_.isString(value)) {
        return 'string';
    } else if (_.isNumber(value)) {
        return 'number';
    } else if (_.isBoolean(value)) {
        return 'boolean';
    } else if (_.isRegExp(value)) {
        return 'regexp';
    } else if (_.isFunction(value)) {
        return 'function';
    } else if (_.isDate(value)) {
        return 'date';
    } else if (value instanceof Meteor.Collection.ObjectID) {
        return 'objectId';
    } else if (_.isArray(value)) {
        switch (_.toLower(key)) {
            case '$and':
            case '$or':
            case '$nor':
                return _.map(value, anonymize);
            default:
                return 'array';
        }
    } else if (_.isObject(value)) {
        return _.mapValues(value, anonymize);
    }
}

const post = () => {
    HTTP.post(
        _.get(Meteor.settings, 'inject-detect.url') || 'https://app.injectdetect.com/api/ingest',
        {
            data: {
                application_token: _.get(Meteor.settings, 'inject-detect.secret'),
                queries: queries.splice(0, queries.length)
            }
        },
        (err, res) => {
            if (err && _.get(Meteor.settings, 'inject-detect.debug')) {
                console.error('Inject Detect: Error ingesting queries: ', err);
            } else if (_.get(Meteor.settings, 'inject-detect.debug')) {
                console.log(`Inject Detect: Ingested queries.`);
            }
        }
    );
};

const throttledPost = _.throttle(Meteor.bindEnvironment(post), 1000 * 10);

function ingest(collection, query, type) {
    if (collection !== 'oplog.rs') {
        queries.push({
            collection,
            queried_at: new Date(),
            query: anonymize(query),
            type
        });
        throttledPost();
    }
}

['find', 'findOne', 'upsert', 'update', 'remove'].map(function(type) {
    const original = MongoInternals.Connection.prototype[type];
    MongoInternals.Connection.prototype[type] = function(collection, selector) {
        try {
            ingest(collection, selector, type);
        } catch (err) {
            if (_.get(Meteor.settings, 'inject-detect.debug')) {
                console.error('Unable to ingest query', err);
            }
        }
        return original.apply(this, arguments);
    };
});

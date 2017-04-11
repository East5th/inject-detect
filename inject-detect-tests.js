// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by inject-detect.js.
import { name as packageName } from "meteor/east5th:inject-detect";

// Write your tests here!
// Here is an example.
Tinytest.add('inject-detect - example', function (test) {
  test.equal(packageName, "inject-detect");
});

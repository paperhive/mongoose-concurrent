'use strict';

function concurrentPlugin(schema, options) {
  schema.add({_rev: String});
}

module.exports = concurrentPlugin;

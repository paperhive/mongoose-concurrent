'use strict';

var _ = require('lodash');

function concurrentPlugin(schema, pluginOptions) {
  // default plugin options
  pluginOptions = _.assign({
    fieldName: '_revision'
  }, pluginOptions);

  // add revision field
  var schemaObj = {};
  schemaObj[pluginOptions.fieldName] = {type: Number, default: 0};
  schema.add(schemaObj);

  // add index on _id and revision field
  var schemaIndex = {_id: 1};
  schemaIndex[pluginOptions.fieldName] = 1;
  schema.index(schemaIndex);

  schema.methods.concurrentUpdate = function(_revision, options, done) {
    // handle optional argument 'options'
    if (done === undefined) {
      done = options;
      options = {};
    }

    // overwrite default options
    options = _.assign({
      new: true,
      overwrite: true,
      runValidators: true
    }, options);

    var doc = this;
    var obj = doc.toObject();
    obj._revision++;

    doc.constructor.findOneAndUpdate(
      {_id: doc.id, _revision: _revision},
      obj,
      options,
      function(err, updatedDoc) {
        if (err) {return done(err);}

        // not found -> document does not exist or revision mismatch
        if (!updatedDoc) {
          return done(new Error(
            'update failed: document does not exist or the provided revision ' +
            'does not match the revision of the stored document. Maybe the ' +
            'document was updated by someone else after you fetched it?'
          ));
        }

        done(null, updatedDoc);
      }
    );
  };

  schema.methods.concurrentRemove = function(_revision, options, done) {
    // handle optional argument 'options'
    if (done === undefined) {
      done = options;
      options = {};
    }

    // overwrite default options
    options = _.assign({}, options);

    var doc = this;

    doc.constructor.findOneAndRemove(
      {_id: doc.id, _revision: _revision},
      options,
      function(err, removedDoc) {
        if (err) {return done(err);}

        // not found -> document does not exist or revision mismatch
        if (!removedDoc) {
          return done(new Error(
            'remove failed: document does not exist or the provided revision ' +
            'does not match the revision of the stored document. Maybe the ' +
            'document was updated by someone else after you fetched it?'
          ));
        }

        done(null, removedDoc);
      }
    );
  };
}

module.exports = concurrentPlugin;

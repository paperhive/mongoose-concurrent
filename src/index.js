'use strict';

var _ = require('lodash');

function concurrentPlugin(schema, pluginOptions) {
  // default plugin options
  pluginOptions = _.assign({
    fieldName: '_revision'
  }, pluginOptions);

  var schemaObj = {};
  schemaObj[pluginOptions.fieldName] = {type: Number, default: 0};
  schema.add(schemaObj);
  schema.index({_id: 1, _revision: 1});

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
}

module.exports = concurrentPlugin;

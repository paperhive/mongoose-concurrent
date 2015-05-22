'use strict';

var mongoose = require('mongoose');
var erase = require('mongoose-erase');
var async = require('async');

var concurrentPlugin = require('../');

describe('concurrentPlugin()', function() {

  beforeEach(erase.connectAndErase(
    mongoose, 'mongodb://localhost/concurrentPluginTests'
  ));

  function registerArticleSchema() {
    var articleSchema = new mongoose.Schema({
      title: String
    });
    // register concurrentPlugin
    articleSchema.plugin(concurrentPlugin);
    return mongoose.model('Article', articleSchema);
  }

  it('should allow saving if revision matches', function(done) {
    var Article = registerArticleSchema();
    done();
  });

});

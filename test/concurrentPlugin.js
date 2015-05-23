'use strict';

var mongoose = require('mongoose');
var erase = require('mongoose-erase');
var async = require('async');
var should = require('should');

var concurrentPlugin = require('../');

describe('concurrentPlugin()', function() {

  beforeEach(erase.connectAndErase(
    mongoose, 'mongodb://localhost/concurrentPluginTests'
  ));

  function registerUserSchema(options) {
    var userSchema = new mongoose.Schema({
      name: String,
      age: Number
    });
    // register concurrentPlugin
    userSchema.plugin(concurrentPlugin, options);
    return mongoose.model('User', userSchema);
  }

  it('should use the provided revision field name', function(done) {
    var User = registerUserSchema({fieldName: '_rev'});
    User.create({name: 'Darth'}, function(err, darth) {
      darth.should.have.property('_rev').which.is.exactly(0);
      done();
    });
  });

  it('should allow saving if revision matches', function(done) {
    var User = registerUserSchema();

    async.waterfall([
      function(cb) {
        User.create({name: 'Darth', age: 42}, cb);
      },
      function(darth, cb) {
        darth.name = 'Darth Vader';
        darth.concurrentUpdate(darth._revision, cb);
      }
    ], function(err, darth) {
      if (err) {return done(err);}
      darth.should.have.property('_revision').which.is.exactly(1);
      done();
    });
  });

});

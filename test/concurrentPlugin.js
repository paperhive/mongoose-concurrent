/*jshint expr: true*/
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
      age: {type: Number, min: 0}
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

  describe('concurrentUpdate()', function() {

    it('should allow saving if revision matches', function(done) {
      var User = registerUserSchema();

      async.waterfall([
        function(cb) {
          User.create({name: 'Darth', age: 42}, cb);
        },
        function(darth, cb) {
          darth.name = 'Darth Vader';
          darth.concurrentUpdate(darth._revision, cb);
        },
        function(darth, cb) {
          darth.should.have.properties({
            _revision: 1,
            name: 'Darth Vader',
            age: 42
          });
          cb();
        }
      ], done);
    });

    it('should deny saving if revision does not match', function(done) {
      var User = registerUserSchema();
      var darthOrig;

      async.waterfall([
        function(cb) {
          User.create({name: 'Darth', age: 42}, cb);
        },
        function(darth, cb) {
          darthOrig = darth;
          darth.name = 'Darth Vader';
          darth.concurrentUpdate(darth._revision - 1, cb);
        }
      ], function(err, darth) {
        should(err).be.Error;
        should.not.exist(darth);
        // check if document is unchanged in db
        User.findById(darthOrig._id, function(err, darth) {
          should.not.exist(err);
          darth.should.have.properties({
            _revision: 0,
            name: 'Darth',
            age: 42
          });
          done();
        });
      });
    });

    it('should run validators', function(done) {
      var User = registerUserSchema();
      var darthOrig;

      async.waterfall([
        function(cb) {
          User.create({name: 'Darth', age: 42}, cb);
        },
        function(darth, cb) {
          darthOrig = darth;
          darth.age = -1;
          darth.concurrentUpdate(darth._revision, cb);
        }
      ], function(err, darth) {
        should(err).be.Error;
        should.not.exist(darth);
        // check if document is unchanged in db
        User.findById(darthOrig._id, function(err, darth) {
          should.not.exist(err);
          darth.should.have.properties({
            _revision: 0,
            name: 'Darth',
            age: 42
          });
          done();
        });
      });
    });

  }); // concurrentUpdate()

  describe('concurrentRemove()', function() {

    it('should allow removing if revision matches', function(done) {
      var User = registerUserSchema();

      async.waterfall([
        function(cb) {
          User.create({name: 'Darth', age: 42}, cb);
        },
        function(darth, cb) {
          darth.concurrentRemove(darth._revision, cb);
        },
        function(darth, cb) {
          darth.should.have.properties({
            _revision: 0,
            name: 'Darth',
            age: 42
          });
          cb();
        }
      ], done);
    });

    it('should deny removing if revision does not match', function(done) {
      var User = registerUserSchema();
      var darthOrig;

      async.waterfall([
        function(cb) {
          User.create({name: 'Darth', age: 42}, cb);
        },
        function(darth, cb) {
          darthOrig = darth;
          darth.concurrentRemove(darth._revision - 1, cb);
        }
      ], function(err, darth) {
        should(err).be.Error;
        should.not.exist(darth);
        // check if document is unchanged in db
        User.findById(darthOrig._id, function(err, darth) {
          should.not.exist(err);
          darth.should.have.properties({
            _revision: 0,
            name: 'Darth',
            age: 42
          });
          done();
        });
      });
    });

  }); // concurrentRemove()

});

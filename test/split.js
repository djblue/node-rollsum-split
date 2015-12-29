 var es = require('event-stream');

var crypto = require('crypto');
var tap = require('tap');
var split = require('../');

var buff1 = crypto.randomBytes(65536);
var buff2 = crypto.randomBytes(1024);


var input = function () {
  return es.readArray([buff1, buff2]);
};

var sha1 = function (data) {
  return crypto.createHash('sha1').update(data).digest('hex');
};

var hash = function () {
  var bytes = 0;

  return es.through(function (data) {
    this.emit('data', {
      start: bytes,
      end: bytes + data.length,
      hash: sha1(data)
    });

    bytes += data.length;
  });
};

var computedHashes = null;

tap.test('data integrity', function (t) {

  t.plan(1);

  var h = crypto.createHash('sha1')
            .update(buff1)
            .update(buff2)
            .digest('hex');

  input().pipe(split()).pipe(crypto.createHash('sha1'))
    .on('data', function (hash) {
      t.equal(hash.toString('hex'), h);
    });

});

tap.test('check computed hashes', function(t) {

  var output = es.writeArray(function (err, array) {

    computedHashes = array;
    t.end();

  });

  input().pipe(split()).pipe(hash()).pipe(output);

});

tap.test('check 1 byte change at front of buff1', function (t) {

  t.plan(2);

  buff1[0]++;

  var output = es.writeArray(function (err, array) {

    buff1[0]--;

    var filter = array.filter(function (o, i) {
      return o.hash !== computedHashes[i].hash;
    });

    t.equal(filter.length, 1, 'only a single hash has changed');
    t.equal(filter[0].start, 0, 'the first hash changed');
  });


  input().pipe(split()).pipe(hash()).pipe(output);

});

tap.test('check 1 byte change at end of buff1', function (t) {

  t.plan(2);

  buff2[buff2.length - 1]++;

  var output = es.writeArray(function (err, array) {

    buff2[buff2.length - 1]--;

    var filter = array.filter(function (o, i) {
      return o.hash !== computedHashes[i].hash;
    });

    t.equal(filter.length, 1, 'only a single hash has changed');
    t.equal(filter[0].end, buff1.length + buff2.length,
        'the last hash changed');
  });


  input().pipe(split()).pipe(hash()).pipe(output);

});

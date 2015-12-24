 var es = require('event-stream');

var crypto = require('crypto');
var tap = require('tap');
var split = require('../');

var buff = crypto.randomBytes(65536);

var hash = function () {
  var bytes = 0;

  return es.through(function (data) {
    this.emit('data', {
      start: bytes,
      end: bytes + data.length,
      hash: crypto.createHash('sha1').update(data).digest('hex')
    });

    bytes += data.length;
  });
};

var computedHashes = null;

tap.test('check computed hashes', function(t) {

  var input = es.readArray([buff]);

  var output = es.writeArray(function (err, array) {

    computedHashes = array;
    t.end();

  });

  input.pipe(split()).pipe(hash()).pipe(output);

});

tap.test('check 1 byte change at front of buff', function (t) {

  t.plan(2);

  buff[0]++;

  var input = es.readArray([buff]);

  var output = es.writeArray(function (err, array) {

    buff[0]--;

    var filter = array.filter(function (o, i) {
      return o.hash !== computedHashes[i].hash;
    });

    t.equal(filter.length, 1, 'only a single hash has changed');
    t.equal(filter[0].start, 0, 'the first hash changed');
  });


  input.pipe(split()).pipe(hash()).pipe(output);

});

tap.test('check 1 byte change at end of buff', function (t) {

  t.plan(2);

  buff[buff.length - 1]++;

  var input = es.readArray([buff]);

  var output = es.writeArray(function (err, array) {

    buff[buff.length - 1]--;

    var filter = array.filter(function (o, i) {
      return o.hash !== computedHashes[i].hash;
    });

    t.equal(filter.length, 1, 'only a single hash has changed');
    t.equal(filter[0].end, buff.length, 'the last hash changed');
  });


  input.pipe(split()).pipe(hash()).pipe(output);

});

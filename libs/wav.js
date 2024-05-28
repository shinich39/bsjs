'use strict';

// https://github.com/andreasgal/node-wav
const data_decoders = {
  pcm8: (buffer, offset, output, channels, samples) => {
    let input = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let data = input[pos++] - 128;
        output[ch][i] = data < 0 ? data / 128 : data / 127;
      }
    }
  },
  pcm16: (buffer, offset, output, channels, samples) => {
    let input = new Int16Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let data = input[pos++];
        output[ch][i] = data < 0 ? data / 32768 : data / 32767;
      }
    }
  },
  pcm24: (buffer, offset, output, channels, samples) => {
    let input = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let x0 = input[pos++];
        let x1 = input[pos++];
        let x2 = input[pos++];
        let xx = (x0 + (x1 << 8) + (x2 << 16));
        let data = xx > 0x800000 ? xx - 0x1000000 : xx;
        output[ch][i] = data < 0 ? data / 8388608 : data / 8388607;
      }
    }
  },
  pcm32: (buffer, offset, output, channels, samples) => {
    let input = new Int32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let data = input[pos++];
        output[ch][i] = data < 0 ? data / 2147483648 : data / 2147483647;
      }
    }
  },
  pcm32f: (buffer, offset, output, channels, samples) => {
    let input = new Float32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch)
        output[ch][i] = input[pos++];
    }
  },
  pcm64f: (buffer, offset, output, channels, samples) => {
    let input = new Float64Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch)
        output[ch][i] = input[pos++];
    }
  },
};

const data_encoders = {
  pcm8: (buffer, offset, input, channels, samples) => {
    let output = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let v = Math.max(-1, Math.min(input[ch][i], 1));
        v = ((v * 0.5 + 0.5) * 255) | 0;
        output[pos++] = v;
      }
    }
  },
  pcm16: (buffer, offset, input, channels, samples) => {
    let output = new Int16Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let v = Math.max(-1, Math.min(input[ch][i], 1));
        v = ((v < 0) ? v * 32768 : v * 32767) | 0;
        output[pos++] = v;
      }
    }
  },
  pcm24: (buffer, offset, input, channels, samples) => {
    let output = new Uint8Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let v = Math.max(-1, Math.min(input[ch][i], 1));
        v = ((v < 0) ? 0x1000000 + v * 8388608 : v * 8388607) | 0;
        output[pos++] = (v >> 0) & 0xff;
        output[pos++] = (v >> 8) & 0xff;
        output[pos++] = (v >> 16) & 0xff;
      }
    }
  },
  pcm32: (buffer, offset, input, channels, samples) => {
    let output = new Int32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let v = Math.max(-1, Math.min(input[ch][i], 1));
        v = ((v < 0) ? v * 2147483648 : v * 2147483647) | 0;
        output[pos++] = v;
      }
    }
  },
  pcm32f: (buffer, offset, input, channels, samples) => {
    let output = new Float32Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let v = Math.max(-1, Math.min(input[ch][i], 1));        
        output[pos++] = v;
      }
    }
  },
  pcm64f: (buffer, offset, input, channels, samples) => {
    let output = new Float64Array(buffer, offset);
    let pos = 0;
    for (let i = 0; i < samples; ++i) {
      for (let ch = 0; ch < channels; ++ch) {
        let v = Math.max(-1, Math.min(input[ch][i], 1));        
        output[pos++] = v;
      }
    }
  },
};

function lookup(table, bitDepth, floatingPoint) {
  let name = 'pcm' + bitDepth + (floatingPoint ? 'f' : '');
  let fn = table[name];
  if (!fn)
    throw new TypeError('Unsupported data format: ' + name);
  return fn;
}

function decode(buffer) {
  let pos = 0, end = 0;
  if (buffer.buffer) {
    // If we are handed a typed array or a buffer, then we have to consider the
    // offset and length into the underlying array buffer.
    pos = buffer.byteOffset;
    end = buffer.length;
    buffer = buffer.buffer;
  } else {
    // If we are handed a straight up array buffer, start at offset 0 and use
    // the full length of the buffer.
    pos = 0;
    end = buffer.byteLength;
  }

  let v = new DataView(buffer);

  function u8() {
    let x = v.getUint8(pos);
    pos++;
    return x;
  }

  function u16() {
    let x = v.getUint16(pos, true);
    pos += 2;
    return x;
  }

  function u32() {
    let x = v.getUint32(pos, true);
    pos += 4;
    return x;
  }

  function string(len) {
    let str = '';
    for (let i = 0; i < len; ++i)
      str += String.fromCharCode(u8());
    return str;
  }

  if (string(4) !== 'RIFF')
    throw new TypeError('Invalid WAV file');
  u32();
  if (string(4) !== 'WAVE')
    throw new TypeError('Invalid WAV file');

  let fmt;
  
  while (pos < end) {
    let type = string(4);
    let size = u32();
    let next = pos + size;
    switch (type) {
    case 'fmt ':
      let formatId = u16();
      if (formatId !== 0x0001 && formatId !== 0x0003 && formatId !== 0xFFFE)
        throw new TypeError(`Unsupported format in WAV file: ${formatId.toString(16)}`);
      fmt = {
        format: 'lpcm',
        floatingPoint: formatId === 0x0003,
        channels: u16(),
        sampleRate: u32(),
        byteRate: u32(),
        blockSize: u16(),
        bitDepth: u16(),
      };
      break;
    case 'data':
      if (!fmt)
        throw new TypeError('Missing "fmt " chunk.');
      let samples = Math.floor(size / fmt.blockSize);
      let channels = fmt.channels;
      let sampleRate = fmt.sampleRate;
      let channelData = [];
      for (let ch = 0; ch < channels; ++ch)
        channelData[ch] = new Float32Array(samples);
      lookup(data_decoders, fmt.bitDepth, fmt.floatingPoint)(buffer, pos, channelData, channels, samples);
      let duration = getDuration(channelData, sampleRate);
      return Object.assign(fmt, {
        sampleRate: sampleRate,
        channelData: channelData,
        duration: duration,
      });
      break;
    }
    pos = next;
  }
}

function encode(channelData, opts) {
  let sampleRate = opts.sampleRate || 16000;
  let floatingPoint = !!(opts.float || opts.floatingPoint);
  let bitDepth = floatingPoint ? 32 : ((opts.bitDepth | 0) || 16);
  let channels = channelData.length;
  let samples = channelData[0].length;
  let buffer = new ArrayBuffer(44 + (samples * channels * (bitDepth >> 3)));

  let v = new DataView(buffer);
  let pos = 0;

  function u8(x) {
    v.setUint8(pos++, x);
  }

  function u16(x) {
    v.setUint16(pos, x, true);
    pos += 2;
  }

  function u32(x) {
    v.setUint32(pos, x, true);
    pos += 4;
  }
  
  function string(s) {
    for (var i = 0; i < s.length; ++i)
      u8(s.charCodeAt(i));
  }

  // write header
  string('RIFF');
  u32(buffer.byteLength - 8);
  string('WAVE');

  // write 'fmt ' chunk
  string('fmt ');
  u32(16);
  u16(floatingPoint ? 0x0003 : 0x0001);
  u16(channels);
  u32(sampleRate);
  u32(sampleRate * channels * (bitDepth >> 3));
  u16(channels * (bitDepth >> 3));
  u16(bitDepth);

  // write 'data' chunk
  string('data');
  u32(buffer.byteLength - 44);
  lookup(data_encoders, bitDepth, floatingPoint)(buffer, pos, channelData, channels, samples);

  return Buffer(buffer);
}

function getDuration(samples, sampleRate) {
  return samples[0].length / sampleRate;
}

function getSamples(channels) {
  let samples = new Float32Array(channels[0].length).fill(0);
  for (let i = 0; i < channels.length; i++) {
    for (let j = 0; j < channels[i].length; j++) {
      const value = Math.abs(channels[i][j]);
      if (samples[j] < value) {
        samples[j] = value;
      }
    }
  }
  return samples;
}

// https://github.com/JMPerez/beats-audio-api/
// http://joesul.li/van/beat-detection-using-web-audio/
function analyze(channelData, sampleRate, bufferSize) {

  function getBeats(samples, sampleRate, bufferSize) {
    let beats = [];
    for (let i = 0; i < samples.length; i += bufferSize) {
      let value = 0,
          index = -1, 
          startIndex = i,
          endIndex = Math.min(i + bufferSize, samples.length);

      for (let j = startIndex; j < endIndex; j++) {
        if (value < samples[j]) {
          value = samples[j];
          index = j;
        }
      }

      if (index > -1) {
        beats.push({
          index: index,
          value: value,
          time: index / sampleRate,
        });
      }
    }

    return beats;
  }

  function getTempo(beats, sampleRate) {
    let MIN_TEMPO = 90,
        MAX_TEMPO = 180,
        intervals = [],
        count = 0,
        tempo = 0,
        peaks = beats.slice(0, beats.length);

    peaks.sort(function(a, b) {
      return b.value - a.value;
    });
  
    peaks = peaks.slice(0, peaks.length * 0.25);
  
    peaks.sort(function(a, b) {
      return a.index - b.index;
    });

    for (let i = 0; i < peaks.length; i++) {
      let startIndex = i + 1,
          endIndex = Math.min(i + 10, peaks.length);

      for (let j = startIndex; j < endIndex; j++) {
        let t = (sampleRate * 60) / (peaks[j].index - peaks[i].index);

        while (t < MIN_TEMPO) {
          t *= 2;
        }

        while (t > MAX_TEMPO) {
          t /= 2;
        }

        t = Math.round(t);

        let interval = intervals.find(function(item) {
          return item.tempo === t;
        });

        if (!interval) {
          interval = {
            tempo: t,
            count: 0,
          }

          intervals.push(interval);
        }
       
        interval.count += 1;

        if (count < interval.count) {
          count = interval.count;
          tempo = interval.tempo;
        }
      }
    }

    return tempo;
  }
  
  const samples = getSamples(channelData);
  const beats = getBeats(samples, sampleRate, bufferSize || sampleRate * 0.5);
  const tempo = getTempo(beats, sampleRate);

  return {
    beats,
    tempo,
  }
}

// esm
export default {
  decode,
  encode,
  analyze
};

// cjs
// module.exports = {
//   sum: sum,
//   test: test,
// }

// browser
// if (window.myModule === undefined) {
//   window.myModule = {
//     sum: sum,
//     test: test,
//   };
// }
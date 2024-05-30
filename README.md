# bsjs

Generate BeatSaber custom map javascript.

This library for generate pre-map.

Please edit map to beat saber custom map editor when after generate. (e.g. chroMapper)

## Version

- info.dat: v2.1.0
- map: v3.0.0

## Requirement

- [nodejs](https://nodejs.org/en/download/package-manager/current)
- [ffmpeg](https://ffmpeg.org/download.html)

## Usage

#### Check ffmpeg is installed

```console
ffmpeg -version
```

#### Check nodejs is installed

```console
node -v
npm -v
```

#### install modules

```console
git clone https://github.com/shinich39/bsjs.git
cd bsjs
npm install
```

#### Put music files into input directory

/bsjs/input

#### Generate

```console
npm start
```

/bsjs/output

## Updates

- Add obstacle
- Add slider
- Less digonal direction
- Less center note (head position note)
- Add environments
- Change note speed

## References

- [bsmg.wiki](https://bsmg.wiki/)
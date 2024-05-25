# bsjs

Generate BeatSaber custom map in javascript.

This library for generate pre-map.

Generate v3 map, no bombs, no sliders, no burst sliders, no environments, no lighting...

Please edit map to beat saber custom map editor when after generate. (e.g. chroMapper)

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

## References

- [bsmg.wiki](https://bsmg.wiki/)
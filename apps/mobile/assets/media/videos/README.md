# Topic 1 video

`baybayin-song.mp4` is the single bundled video used on all platforms through
`content/mediaCatalog.ts` and the expo-asset build plugin.

Encoding: H.264 Main level 3.1, yuv420p, 1280x720, AAC stereo, MP4 faststart.
Full duration: approximately 231.49 seconds. File size: approximately 23 MB.

To prepare a future replacement from a source file outside this asset directory:

```sh
ffmpeg -i /path/to/source.mp4 -vf scale=1280:720 -c:v libx264 -preset fast -crf 24 -profile:v main -level 3.1 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart baybayin-song.mp4
```

Native local assets resolve using Asset.fromModule and downloadAsync/localUri.
Expo Go downloads the playback copy from Metro on first use. The phone must
be able to reach the Metro asset URL. Development logs prefixed
[BAYA VIDEO DEBUG] report that URL, resolution status, and download/player
errors; learner-facing fallback text never exposes these details.

Remote sources continue to use HTTPS URLs from content/mediaOrigins.ts.
Changing delivery later requires a data/configuration change, not a screen edit.

Validation performed: complete FFmpeg decode and media resolver/player tests.
Expo Go and installed production playback require testing on physical devices.

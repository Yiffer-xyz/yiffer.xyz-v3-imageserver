# Yiffer.xyz images server

A server to:

- Process uploads from the main site in prod and local dev (resizes, creates variants, then uploads to R2 or local folder)
- Serve images in local dev (from local folder)
- In the future, serve images that need authentication in prod

Why? Because it's simply easier than to figure out how to do it efficiently in CF Workers - especially resizing and so on.

### Installing Sharp

Sharp can be troublesone to install.

- On mac: `SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm_config_arch=arm64 npm_config_platform=darwin yarn add sharp`
- On linux: `yarn add sharp --ignore-engines`

### How to local dev

First, create and set up `.env`. Find the contents on Discord. Run `yarn`. If running doesn't work,try `yarn add sharp --ignore-engines`.

Then simply `yarn dev` and you're golden. The process will run on port `8770`. In the main repo, set the `PAGES_PATH` variable in `.dev.vars` to `http://localhost:8770`.

### How to prod

Set up nginx first, see `nginx-config-file.conf` (to be named after the domain).

Since this one is so simple, we can keep the running very simple too. Get onto the vm this should run on and `yarn build`, and then `yarn start`, which will run it via `pm2`. If building doesn't work, try `yarn add sharp --ignore-engines`.

Make sure to set up persistence across restarts:

```
pm2 startup
```

Then start the processes, and then

```
pm2 save
```

[Full article](https://pm2.keymetrics.io/docs/usage/startup/).

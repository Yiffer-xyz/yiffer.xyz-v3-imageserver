# Yiffer.xyz images server

A server to:

- Process uploads from the main site in prod and local dev (resizes, creates variants, then uploads to R2 or local folder)
- Serve images in local dev (from local folder - `data` in project root)
- Store a very basic error log, served at `/error-log`
- In the future, serve images that need authentication in prod

Why? Because it's simply easier than to figure out how to do it efficiently in CF Workers - especially resizing and so on. The CF workers runtime does not support Sharp.

### Installing Sharp

Sharp can be troublesone to install.

- On mac: `SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm_config_arch=arm64 npm_config_platform=darwin yarn add sharp`
- On linux: `yarn add sharp --ignore-engines`

### How to local dev

First, create and set up `.env`. Ask Melon for contents. Run `yarn`. If running doesn't work, try `yarn add sharp --ignore-engines`.

Then simply `yarn dev` and you're good to go. The process will run on port `8770`. In the main repo, set the `PAGES_PATH` variable in `.dev.vars` to `http://localhost:8770`.

### How to prod

Set up nginx first, see `nginx-config-file.conf` (to be named after the domain).

Since this one is so simple, we can keep the running very simple too. Get onto the vm this should run on and `yarn redeploy`. This simply runs on `pm2`. If building doesn't work, try `yarn add sharp --ignore-engines`.

Make sure to set up persistence across restarts:

```
pm2 startup
```

Then start the processes, and then

```
pm2 save
```

[Full article](https://pm2.keymetrics.io/docs/usage/startup/).

## Setup tips for new vm

When setting up a new vm, here are some things to remember/check, if things don't work:

- Disable firewall
- Increase nginx' default `client_max_body_size`

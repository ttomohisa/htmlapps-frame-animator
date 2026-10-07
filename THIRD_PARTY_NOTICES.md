# Third-Party Notices

Frame Animator v0.8.0 embeds the following runtime dependency in the generated standalone HTML. It is version-pinned in `dependencies.json` and the npm tarball is pinned by SHA-256 and npm integrity in `dependencies.lock.json`.

## @jsquash/webp 1.5.0

- Package: `@jsquash/webp@1.5.0`
- Project: https://github.com/jamsinclair/jSquash
- License: Apache License 2.0
- Embedded assets:
  - `codec/enc/webp_enc.js`
  - `codec/enc/webp_enc.wasm`

The jSquash WebP wrapper contains code derived from the Squoosh project and uses the libwebp encoder. The JavaScript wrapper source identifies Google Inc. copyright for the Squoosh-derived WebP encoding integration and is licensed under Apache-2.0.

The Apache License 2.0 text distributed by the npm package remains the governing license for the jSquash package.

## libwebp codec notice

The embedded WebP codec includes libwebp code with the following upstream notice:

Copyright (c) 2010, Google Inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that:

1. Redistributions of source code retain the copyright notice, conditions, and disclaimer.
2. Redistributions in binary form reproduce the copyright notice, conditions, and disclaimer in the documentation and/or other materials.
3. Neither the name of Google nor contributor names may be used to endorse or promote derived products without prior written permission.

The software is provided by the copyright holders and contributors "AS IS", without express or implied warranties, including merchantability or fitness for a particular purpose. In no event are the copyright holder or contributors liable for direct, indirect, incidental, special, exemplary, or consequential damages arising from use of the software.

## Build-time / CI tooling

GitHub Actions workflows reference GitHub-maintained actions under the terms published by those projects.

When another runtime dependency is added:

1. Pin the exact package version in `dependencies.json`.
2. Synchronize and commit `dependencies.lock.json` from the actual npm tarball.
3. Record license, homepage, copyright, and redistribution notices here.
4. Embed every required runtime asset in the standalone build.
5. Re-run offline/network, CSP, license, and browser checks before merging.

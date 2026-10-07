# Third-Party Notices

Frame Animator v0.5.0 declares no runtime third-party package dependency in `dependencies.json`.

The app uses browser APIs and system fonts directly. GitHub Actions workflows reference their respective GitHub-maintained actions under the terms published by those projects.

When a future milestone adds an encoder or other package:

1. Pin the exact dependency version in `dependencies.json`.
2. Synchronize and commit `dependencies.lock.json` with the real SHA-256.
3. Record the license, homepage, copyright, and redistribution notices here.
4. Embed every required runtime asset in the standalone build.
5. Re-run the offline/network and license review before merging.

Do not assume that package availability alone makes a dependency compatible with redistribution.

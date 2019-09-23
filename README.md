
<p align="center">
  <img height="256px" width="256px" style="text-align: center;" src="https://cdn.jsdelivr.net/gh/tinesoft/ngx-uptodate@develop/logo.svg">
</p>

# ngx-uptodate

A [Github Action](https://github.com/features/actions) that keeps your Angular CLI-based projects up-to-date via automated pull requests.

The action automatically runs `ng update` for you, updates @angular related dependencies and files, and creates/updates a PR with the changes.
You just have to merge the created PR back into your codebase, once ready.

> **Note**: GitHub Actions is currently in public beta. Please [register for
> access](https://github.com/features/actions) to start using the feature. Until you or your
> GitHub organization has been approved for the beta, the **Actions** tab won't show in
> your repos, and the Actions-related YAML files described below will not be recognized by
> GitHub.

## Usage

To get started add a YAML file under `.github/workflows/ngx-uptodate.yml`, with the following content:

``` yaml
name: "Update Angular Action"
on: # when the action should run, can also be a cron or in response to external events. see https://git.io/JeBz1
  push

jobs:
  ngxUptodate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository # (optinal step) if not provided, the action will automatically perfom the checkout
        uses: actions/checkout@master

      - name: Set-up Node
        uses: actions/setup-node@v1
        with:
          node-version: 10.x

      - name: Installing NPM modules
        run: npm ci

      - name: Updating ng dependencies
        uses: tinesoft/ngx-uptodate@develop
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

```

See [action.yml](action.yml) for complete list of options you can customize.

## Contributing

Contributions are always welcome! Just fork the project, work on your feature/bug fix, and submit it.
You can also contribute by creating issues. Please read the [contribution guidelines](.github/CONTRIBUTING.md) for more information.

## License

Copyright (c) 2019 Tine Kondo. Licensed under the MIT License (MIT)

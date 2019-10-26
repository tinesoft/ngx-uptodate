
<p align="center">
  <img height="256px" width="256px" style="text-align: center;" src="https://cdn.jsdelivr.net/gh/tinesoft/ngx-uptodate@develop/logo.svg">
</p>

# ngx-uptodate

A [Github Action](https://github.com/features/actions) that keeps your Angular CLI-based projects up-to-date via automated pull requests.

The action automatically runs `ng update` for you, updates @angular related dependencies and files, and creates/updates a PR with the changes.
You just have to merge the created PR back into your codebase, once ready.

> **Note**: GitHub Actions are currently in public beta. Please [register for
> access](https://github.com/features/actions) to start using the feature. Until you or your
> GitHub organization has been approved for the beta, the **Actions** tab above won't show in
> your repos, and the Actions-related YAML files described below will not be recognized by
> GitHub.

## Usage

To get started, create a workflow under `.github/workflows/` (eg: `.github/workflows/ngx-uptodate.yml`) see [Creating a Workflow file](https://help.github.com/en/github/automating-your-workflow-with-github-actions/configuring-a-workflow#creating-a-workflow-file), with the following content:

``` yaml
name: "Update Angular Action"
on: # when the action should run. Can also be a CRON or in response to external events. see https://git.io/JeBz1
  push

jobs:
  ngxUptodate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository # (optional step) if not provided, the action will automatically perfom the checkout
        uses: actions/checkout@master

      - name: Set-up Node # (optional steps) if not provided, the action will automatically install node modules before
        uses: actions/setup-node@v1
        with:
          node-version: 10.x
      - name: Installing NPM modules
        run: npm ci

      - name: Updating ng dependencies # here is where the magic happens!
        uses: tinesoft/ngx-uptodate@master
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}

```

See [action.yml](action.yml) for complete list of options you can customize.

## Contributing

Contributions are always welcome! Just fork the project, work on your feature/bug fix, and submit it.
You can also contribute by creating issues. Please read the [contribution guidelines](.github/CONTRIBUTING.md) for more information.

## Inspiration

Kudos 👍🏾to people at [Codestar](https://www.codestar.nl/) and their [blog post](https://medium.com/codestar-blog/how-we-automated-our-angular-updates-9790212aa211) for the original idea 💡that led me to write this Github Action.

## License

Copyright (c) 2019 Tine Kondo. Licensed under the MIT License (MIT)

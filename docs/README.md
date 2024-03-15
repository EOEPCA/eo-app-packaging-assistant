# Welcome to MkDocs of the EO Application Import Tool

The guide is written in Markdown and rendered through the mkdocs tool.

The file mkdocs.yml is the configuration file that describes the organisation and settings for the document generation.

For full documentation visit [mkdocs.org](https://www.mkdocs.org).

## Commands

* `mkdocs serve` - Start the live-reloading docs server.
* `mkdocs build` - Build the documentation site.
* `mkdocs -h` - Print help message and exit.

## GitHub Action

The GitHub Action at `.github/workflows/main.yml` is triggered on each commit pushed to `origin/main` to build the documentation to the branch `gh-pages` from where it is published.

## Publish New Version

To publish the docs under a given version, use this command:
* `mike deploy --push --update-aliases <version_name> <alias>`

To publish for example version 1.1 and use it as the latest version: `mike deploy --push --update-aliases v1.1 latest`

## Docs project layout

    mkdocs.yml    # The configuration file.
    source/
        index.md                        # The documentation homepage
        user-manual/index.md            # The User Manual documentation page
        css/                            # Custom CSS style sheets for the documentation
        assets/                         # Assets (images) used in the documentation
        ...                             # Other markdown pages, images and other files.
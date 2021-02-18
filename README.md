# ⚡ Verify Files Modify

Verify PR files modification.

Currently only `pull_request` and `pull_request_target` triggering is supported.

## How to use ?

```yml
name: Verify Files modify

on:
  pull_request:
    types: [opened, edited, reopened, synchronize, ready_for_review]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: verify-version
        uses: actions-cool/verify-files-modify@v1.0.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          verify-files: 'action.yml, LICENSE'
          verify-paths: '.github/, dist/'
          comment: |
            Please don't modify this.
          close: true
```

| Name | Desc | Type | Required |
| -- | -- | -- | -- |
| token | GitHub token | string | ✔ |
| verify-files | Verify files modification. Support multiple, please pay attention to the format of DEMO | string | ✖ |
| verify-paths | Verify paths modification. Support multiple, please pay attention to the format of DEMO | string | ✖ |
| skip-verify-authority | Skip verify by creator authority. Option: `read` `write` `admin` | string | ✖ |
| comment | Comment when verification success | string | ✖ |
| close | Close PR when verification success | boolean | ✖ |

## Changelog

[CHANGELOG](./CHANGELOG.md)

## LICENSE

[MIT](./LICENSE)

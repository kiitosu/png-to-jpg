# png-to-jpg README

pngファイルをjpgファイルに変換し、参照している箇所も`xxx.png`から`xxx.jpg`に変換します。

## Features

`Shift + Ctrl (Cmd) + P` でコマンドパレットを開いて `png-to-jpg.convert` を実行してください。

## Requirements

特になし

## Extension Settings
以下の設定が必要です。
* "png-to-jpg.images" : "画像が置かれているディレクトリ"
* "png-to-jpg.contents" : "zenn等のコンテンツが置かれているディレクトリ"

以下の設定は任意です。
* "png-to-jpg.excludes" : "置換対象外としたいファイルに含む文字列"

## Known Issues

特になし

## Release Notes

### Added

- 0.0.4 Initial release
- 0.0.5 GithubレポジトリのURLの不備を修正
- 0.0.8 ファイルの除外文字列設定を追加

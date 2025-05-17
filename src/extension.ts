import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";
import * as fsSync from "fs";

/**
 * 指定ディレクトリ以下のPNGファイルを再帰的にJPEGに変換する関数
 * @param dir 変換対象のディレクトリパス
 */
async function convertPngToJpg(dir: string) {
  /**
   * ディレクトリを再帰的に処理し、PNGファイルをJPEGに変換する内部関数
   * @param directory 処理対象のディレクトリパス
   */
  async function processDirectory(directory: string) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (
        entry.isFile() &&
        path.extname(entry.name).toLowerCase() === ".png"
      ) {
        const jpgPath = fullPath.slice(0, -4) + ".jpg";
        try {
          await sharp(fullPath).jpeg({ quality: 30 }).toFile(jpgPath);
          console.log(`Converted: ${fullPath} -> ${jpgPath}`);
        } catch (error) {
          console.error(`Failed to convert ${fullPath}:`, error);
        }
      }
    }
  }
  await processDirectory(dir);
}

/**
 * 指定ディレクトリ以下のMarkdownファイル内のPNG参照をJPG参照に置換する関数
 * @param dir 置換対象のディレクトリパス
 */
async function replacePngReferencesToJpg(dir: string) {
  async function processDirectory(directory: string) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (
        entry.isFile() &&
        path.extname(entry.name).toLowerCase() === ".md"
      ) {
        try {
          let content = await fs.readFile(fullPath, "utf-8");
          // PNG参照をJPG参照に置換
          const replacedContent = content.replace(/\.png/g, ".jpg");
          if (replacedContent !== content) {
            await fs.writeFile(fullPath, replacedContent, "utf-8");
            console.log(`Replaced references in: ${fullPath}`);
          }
        } catch (error) {
          console.error(`Failed to replace references in ${fullPath}:`, error);
        }
      }
    }
  }
  await processDirectory(dir);
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "png-to-jpg" is now active!');

  const packageJsonPath = path.join(context.extensionPath, "package.json");
  const packageJson = JSON.parse(fsSync.readFileSync(packageJsonPath, "utf-8"));
  const images = packageJson.configurations.images;
  const contents = packageJson.configurations.contents;

  const disposable = vscode.commands.registerCommand(
    "png-to-jpg.convert",
    async () => {
        vscode.window.showInformationMessage(`Converting PNG to JPG in configured directory: ${images}`);
        await convertPngToJpg(images);
        // 参照変換も実行
        await replacePngReferencesToJpg(contents);
        vscode.window.showInformationMessage("Conversion completed!");
        return;
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

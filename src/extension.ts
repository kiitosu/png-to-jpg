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

  const config = vscode.workspace.getConfiguration("png-to-jpg");
  const images = config.get<string>("images") || "sample_images";
  const contents = config.get<string>("contents") || "sample_contents";

  const disposable = vscode.commands.registerCommand(
    "png-to-jpg.convert",
    async () => {
      try {
        console.log("Command execution started");
        vscode.window.showInformationMessage(`Converting PNG to JPG in configured directory: ${images}`);
        await convertPngToJpg(images);
        console.log("PNG to JPG conversion completed");
        // 参照変換も実行
        await replacePngReferencesToJpg(contents);
        console.log("Reference replacement completed");
        vscode.window.showInformationMessage("Conversion completed!");
        console.log("Command execution finished successfully");
      } catch (error) {
        vscode.window.showErrorMessage(`Error during conversion: ${error instanceof Error ? error.message : String(error)}`);
        console.error("Error during conversion:", error);
      }
      return;
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

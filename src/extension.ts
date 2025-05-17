import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";

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

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "png-to-jpg" is now active!');

  const disposable = vscode.commands.registerCommand(
    "png-to-jpg.convert",
    async () => {
      const options: vscode.OpenDialogOptions = {
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: "Select folder to convert PNG to JPG",
      };
      const folderUri = await vscode.window.showOpenDialog(options);
      if (folderUri && folderUri[0]) {
        const folderPath = folderUri[0].fsPath;
        vscode.window.showInformationMessage(
          `Converting PNG to JPG in: ${folderPath}`
        );
        await convertPngToJpg(folderPath);
        vscode.window.showInformationMessage("Conversion completed!");
      } else {
        vscode.window.showInformationMessage("No folder selected.");
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

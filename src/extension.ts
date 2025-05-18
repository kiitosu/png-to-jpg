import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";
import * as fsSync from "fs";

/**
 * 指定ディレクトリ以下のPNGファイルを再帰的にJPEGに変換する関数
 * @param dir 変換対象のディレクトリパス
 */
async function convertPngToJpg(dir: string): Promise<string[]> {
  const convertedPngFiles: string[] = [];
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
          convertedPngFiles.push(fullPath);
          try {
            await fs.unlink(fullPath);
            console.log(`Deleted original PNG: ${fullPath}`);
          } catch (unlinkError) {
            console.error(`Failed to delete original PNG ${fullPath}:`, unlinkError);
          }
        } catch (error) {
          console.error(`Failed to convert ${fullPath}:`, error);
        }
      }
    }
  }
  await processDirectory(dir);
  return convertedPngFiles;
}

/**
 * 指定ディレクトリ以下のMarkdownファイル内のPNG参照をJPG参照に置換する関数
 * @param dir 置換対象のディレクトリパス
 */
async function replacePngReferencesToJpg(dir: string, convertedPngFiles: string[]) {
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
          // 変換済みPNGファイルの参照だけをJPG参照に置換
          let replacedContent = content;
          for (const pngFile of convertedPngFiles) {
            const pngFileName = path.basename(pngFile);
            const regex = new RegExp(pngFileName.replace(/\./g, "\\."), "g");
            replacedContent = replacedContent.replace(regex, pngFileName.replace(/\.png$/, ".jpg"));
          }
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
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  let images = config.get<string>("images") || "${workspaceFolder}/";
  let articles = config.get<string>("articles") || "${workspaceFolder}/articles";

  // ${workspaceFolder}が含まれている場合は展開する
  if (images.includes('${workspaceFolder}')) {
    images = images.replace('${workspaceFolder}', workspaceFolder);
  }
  if (articles.includes('${workspaceFolder}')) {
    articles = articles.replace('${workspaceFolder}', workspaceFolder);
  }

  // 拡張機能インストール直後および更新時に再起動を促す通知を表示
  const currentVersion = vscode.extensions.getExtension('kiitosu.png-to-jpg')?.packageJSON.version;
  const previousVersion = context.globalState.get<string>('extensionVersion');
  if (currentVersion !== previousVersion) {
    vscode.window.showInformationMessage(
      '拡張機能がインストールまたは更新されました。再起動してください。',
      'Restart Extension'
    ).then(selection => {
      if (selection === 'Restart Extension') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    });
    context.globalState.update('extensionVersion', currentVersion);
  }

  const disposable = vscode.commands.registerCommand(
    "png-to-jpg.convert",
    async () => {
      try {
        console.log("Command execution started");

        // 画像変換
        const convertPngToJpgMessage = `Converting PNG to JPG in ${images}`
        console.log(convertPngToJpgMessage);
        vscode.window.showInformationMessage(convertPngToJpgMessage);
        const convertedPngFiles = await convertPngToJpg(images);
        console.log("PNG to JPG conversion completed");

        // 参照変換
        const convertReferenceMessage = `Converting reference in ${articles}`
        console.log(convertReferenceMessage);
        vscode.window.showInformationMessage(convertReferenceMessage);
        await replacePngReferencesToJpg(articles, convertedPngFiles);
        console.log("Reference replacement completed");

        console.log("Command execution finished successfully");
        vscode.window.showInformationMessage("Conversion completed!");

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

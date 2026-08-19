use std::path::Path;
use std::process::Command;
use tauri::{command, AppHandle};

use crate::conversion::{check_markitdown, convert_single_file, execute_batch};
use crate::models::{ConversionResult, ConversionTask, DependencyStatus};

#[command]
pub fn check_dependency(custom_path: Option<String>) -> DependencyStatus {
    check_markitdown(custom_path.as_deref())
}

#[command]
pub async fn convert_file(
    file_path: String,
    overwrite: Option<bool>,
    custom_executable_path: Option<String>,
) -> Result<ConversionResult, String> {
    let overwrite_flag = overwrite.unwrap_or(true);
    tokio::task::spawn_blocking(move || {
        convert_single_file(&file_path, overwrite_flag, custom_executable_path.as_deref())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[command]
pub async fn batch_convert(
    app: AppHandle,
    tasks: Vec<ConversionTask>,
    overwrite: Option<bool>,
    concurrency: Option<usize>,
    custom_executable_path: Option<String>,
) -> Result<(), String> {
    let overwrite_flag = overwrite.unwrap_or(true);
    let concurrency_val = concurrency.unwrap_or(4);

    tokio::spawn(async move {
        execute_batch(app, tasks, overwrite_flag, concurrency_val, custom_executable_path).await;
    });

    Ok(())
}

#[command]
pub fn reveal_in_finder(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    #[cfg(target_os = "macos")]
    {
        let status = Command::new("open")
            .arg("-R")
            .arg(&file_path)
            .status()
            .map_err(|e| format!("Failed to run open -R: {}", e))?;

        if status.success() {
            Ok(())
        } else {
            Err(format!("open command exited with status: {:?}", status.code()))
        }
    }

    #[cfg(target_os = "windows")]
    {
        let status = Command::new("explorer")
            .arg(format!("/select,\"{}\"", file_path))
            .status()
            .map_err(|e| format!("Failed to run explorer: {}", e))?;

        if status.success() {
            Ok(())
        } else {
            Err(format!("explorer command exited with status: {:?}", status.code()))
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(parent) = path.parent() {
            let status = Command::new("xdg-open")
                .arg(parent)
                .status()
                .map_err(|e| format!("Failed to run xdg-open: {}", e))?;

            if status.success() {
                Ok(())
            } else {
                Err(format!("xdg-open command exited with status: {:?}", status.code()))
            }
        } else {
            Err("Failed to resolve parent directory".to_string())
        }
    }
}

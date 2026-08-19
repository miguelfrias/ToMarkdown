use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Semaphore;

use crate::models::{ConversionProgress, ConversionResult, ConversionTask, DependencyStatus};

/// Dynamically locates the markitdown executable or bundled sidecar.
pub fn find_markitdown_executable(custom_path: Option<&str>) -> Result<String, String> {
    // 1. User custom override from settings
    if let Some(path) = custom_path {
        let trimmed = path.trim();
        if !trimmed.is_empty() {
            let p = Path::new(trimmed);
            if p.exists() {
                return Ok(trimmed.to_string());
            } else {
                return Err(format!("Custom executable does not exist at: {}", trimmed));
            }
        }
    }

    // 2. Check for Tauri Sidecar in runtime locations
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            // Inside macOS .app bundle: /Contents/MacOS/markitdown
            let bundle_sidecar = exe_dir.join("markitdown");
            if bundle_sidecar.exists() {
                return Ok(bundle_sidecar.to_string_lossy().to_string());
            }

            // In development or target output: ./binaries/markitdown-<target>
            #[cfg(target_arch = "aarch64")]
            let target_triple = "aarch64-apple-darwin";
            #[cfg(target_arch = "x86_64")]
            let target_triple = "x86_64-apple-darwin";
            #[cfg(not(any(target_arch = "aarch64", target_arch = "x86_64")))]
            let target_triple = "";

            let dev_sidecar = exe_dir.join(format!("markitdown-{}", target_triple));
            if dev_sidecar.exists() {
                return Ok(dev_sidecar.to_string_lossy().to_string());
            }
        }
    }

    // Check project relative sidecar directory
    let relative_sidecars = [
        "src-tauri/binaries/markitdown-x86_64-apple-darwin",
        "src-tauri/binaries/markitdown-aarch64-apple-darwin",
        "binaries/markitdown-x86_64-apple-darwin",
        "binaries/markitdown-aarch64-apple-darwin",
    ];
    for rel in relative_sidecars {
        let p = Path::new(rel);
        if p.exists() {
            return Ok(rel.to_string());
        }
    }

    // 3. Dynamic system and user HOME candidate paths
    let mut candidate_paths = vec![
        "/opt/homebrew/bin/markitdown".to_string(), // Apple Silicon Homebrew
        "/usr/local/bin/markitdown".to_string(),    // Intel Homebrew / global
    ];

    if let Ok(home) = std::env::var("HOME") {
        candidate_paths.push(format!("{}/.local/bin/markitdown", home)); // pipx / pip default
        candidate_paths.push(format!("{}/Library/Python/3.14/bin/markitdown", home));
        candidate_paths.push(format!("{}/Library/Python/3.13/bin/markitdown", home));
        candidate_paths.push(format!("{}/Library/Python/3.12/bin/markitdown", home));
        candidate_paths.push(format!("{}/Library/Python/3.11/bin/markitdown", home));
        candidate_paths.push(format!("{}/Library/Python/3.10/bin/markitdown", home));
    }

    for candidate in candidate_paths {
        let p = Path::new(&candidate);
        if p.is_absolute() && p.exists() {
            return Ok(candidate);
        }
    }

    // 4. Check if markitdown is executable in system PATH
    if let Ok(output) = Command::new("which").arg("markitdown").output() {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path_str.is_empty() {
                return Ok(path_str);
            }
        }
    }

    // 5. Default fallback to markitdown
    Ok("markitdown".to_string())
}

/// Checks if markitdown CLI is functional and returns its status
pub fn check_markitdown(custom_path: Option<&str>) -> DependencyStatus {
    let exec_res = find_markitdown_executable(custom_path);
    let exec_path = match exec_res {
        Ok(p) => p,
        Err(e) => {
            return DependencyStatus {
                available: false,
                executable_path: String::new(),
                version: None,
                error: Some(e),
            }
        }
    };

    // Test invoking `markitdown --version` or `markitdown --help`
    match Command::new(&exec_path).arg("--version").output() {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            DependencyStatus {
                available: true,
                executable_path: exec_path,
                version: if version.is_empty() { None } else { Some(version) },
                error: None,
            }
        }
        Ok(_) => {
            match Command::new(&exec_path).arg("--help").output() {
                Ok(help_out) if help_out.status.success() => DependencyStatus {
                    available: true,
                    executable_path: exec_path,
                    version: None,
                    error: None,
                },
                Ok(help_out) => DependencyStatus {
                    available: false,
                    executable_path: exec_path,
                    version: None,
                    error: Some(String::from_utf8_lossy(&help_out.stderr).trim().to_string()),
                },
                Err(e) => DependencyStatus {
                    available: false,
                    executable_path: exec_path,
                    version: None,
                    error: Some(format!("Failed to execute: {}", e)),
                },
            }
        }
        Err(e) => DependencyStatus {
            available: false,
            executable_path: exec_path,
            version: None,
            error: Some(format!("Failed to spawn process: {}", e)),
        },
    }
}

/// Resolves the in-place target markdown path based on collision policy
pub fn resolve_output_path(source: &Path, overwrite: bool) -> PathBuf {
    let parent = source.parent().unwrap_or_else(|| Path::new("."));
    let stem = source.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| "output".into());

    let default_output = parent.join(format!("{}.md", stem));

    if overwrite || !default_output.exists() {
        return default_output;
    }

    // Numbered variant search: "stem (1).md", "stem (2).md", etc.
    let mut counter = 1;
    loop {
        let variant = parent.join(format!("{} ({}).md", stem, counter));
        if !variant.exists() {
            return variant;
        }
        counter += 1;
    }
}

/// Executes single conversion via CLI
pub fn convert_single_file(
    file_path: &str,
    overwrite: bool,
    custom_executable: Option<&str>,
) -> Result<ConversionResult, String> {
    let source = PathBuf::from(file_path);
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", file_path));
    }

    let output_path = resolve_output_path(&source, overwrite);
    let output_str = output_path.to_string_lossy().to_string();

    let executable = find_markitdown_executable(custom_executable)
        .unwrap_or_else(|_| "markitdown".to_string());

    // Execute direct CLI command without shell interpolation
    let output = Command::new(&executable)
        .arg(file_path)
        .arg("-o")
        .arg(&output_str)
        .output();

    match output {
        Ok(out) if out.status.success() => Ok(ConversionResult {
            source_path: file_path.to_string(),
            output_path: output_str,
            success: true,
            error: None,
        }),
        Ok(out) => {
            let stderr_msg = String::from_utf8_lossy(&out.stderr).trim().to_string();
            let err_msg = if !stderr_msg.is_empty() {
                stderr_msg
            } else {
                format!("Process exited with status code: {}", out.status.code().unwrap_or(-1))
            };
            Ok(ConversionResult {
                source_path: file_path.to_string(),
                output_path: output_str,
                success: false,
                error: Some(err_msg),
            })
        }
        Err(e) => Ok(ConversionResult {
            source_path: file_path.to_string(),
            output_path: output_str,
            success: false,
            error: Some(format!("Failed to execute {}: {}", executable, e)),
        }),
    }
}

/// Executes a batch conversion concurrently using a Tokio semaphore
pub async fn execute_batch(
    app: AppHandle,
    tasks: Vec<ConversionTask>,
    overwrite: bool,
    concurrency: usize,
    custom_executable: Option<String>,
) {
    let pool_size = if concurrency == 0 { 4 } else { concurrency };
    let semaphore = Arc::new(Semaphore::new(pool_size));
    let mut handles = Vec::new();

    for task in tasks {
        let sem_clone = Arc::clone(&semaphore);
        let app_clone = app.clone();
        let custom_exec_clone = custom_executable.clone();

        let handle = tokio::spawn(async move {
            let _permit = sem_clone.acquire().await.unwrap();

            // Emit converting status
            let _ = app_clone.emit(
                "conversion-progress",
                ConversionProgress {
                    id: task.id.clone(),
                    source_path: task.source_path.clone(),
                    output_path: None,
                    status: "converting".to_string(),
                    error: None,
                },
            );

            let task_id = task.id.clone();
            let source_path_str = task.source_path.clone();
            let src_path_for_blocking = task.source_path.clone();

            let res = tokio::task::spawn_blocking(move || {
                convert_single_file(
                    &src_path_for_blocking,
                    overwrite,
                    custom_exec_clone.as_deref(),
                )
            })
            .await;

            match res {
                Ok(Ok(conversion_res)) => {
                    let (status, err) = if conversion_res.success {
                        ("success".to_string(), None)
                    } else {
                        ("failed".to_string(), conversion_res.error)
                    };

                    let _ = app_clone.emit(
                        "conversion-progress",
                        ConversionProgress {
                            id: task_id,
                            source_path: conversion_res.source_path,
                            output_path: Some(conversion_res.output_path),
                            status,
                            error: err,
                        },
                    );
                }
                Ok(Err(err_msg)) => {
                    let _ = app_clone.emit(
                        "conversion-progress",
                        ConversionProgress {
                            id: task_id,
                            source_path: source_path_str,
                            output_path: None,
                            status: "failed".to_string(),
                            error: Some(err_msg),
                        },
                    );
                }
                Err(join_err) => {
                    let _ = app_clone.emit(
                        "conversion-progress",
                        ConversionProgress {
                            id: task_id,
                            source_path: source_path_str,
                            output_path: None,
                            status: "failed".to_string(),
                            error: Some(format!("Async task join error: {}", join_err)),
                        },
                    );
                }
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        let _ = handle.await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    #[test]
    fn test_resolve_output_path_overwrite() {
        let source = Path::new("/tmp/test_report.docx");
        let output = resolve_output_path(source, true);
        assert_eq!(output, PathBuf::from("/tmp/test_report.md"));
    }

    #[test]
    fn test_resolve_output_path_collision_variants() {
        let temp_dir = std::env::temp_dir().join("tomarkdown_test_variants");
        let _ = std::fs::create_dir_all(&temp_dir);

        let source = temp_dir.join("financial_report.xlsx");
        let md_base = temp_dir.join("financial_report.md");
        let md_v1 = temp_dir.join("financial_report (1).md");

        // Create base .md
        let _ = File::create(&md_base);

        // When overwrite is false and base exists, should generate (1).md
        let out1 = resolve_output_path(&source, false);
        assert_eq!(out1, md_v1);

        // Create variant 1 .md
        let _ = File::create(&md_v1);

        // Should now generate (2).md
        let out2 = resolve_output_path(&source, false);
        assert_eq!(out2, temp_dir.join("financial_report (2).md"));

        // Clean up
        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}

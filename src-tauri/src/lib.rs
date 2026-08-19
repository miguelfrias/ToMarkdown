pub mod commands;
pub mod conversion;
pub mod models;

use commands::{batch_convert, check_dependency, convert_file, reveal_in_finder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            check_dependency,
            convert_file,
            batch_convert,
            reveal_in_finder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ToMarkdown application");
}

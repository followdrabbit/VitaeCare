// src-tauri/src/lib.rs

use std::{
  fs,
  io::Write,
  path::{Path, PathBuf},
};

// ===================== MODO PENDRIVE: ./data ao lado do executável =====================

/// Retorna a pasta "./data" ao lado do executável (cria se não existir).
fn user_data_dir(_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
  let exe = std::env::current_exe().map_err(|e| format!("current_exe: {e}"))?;
  let base = exe
    .parent()
    .unwrap_or_else(|| Path::new("."))
    .join("data");
  fs::create_dir_all(&base).map_err(|e| format!("create_dir_all {:?}: {e}", base))?;
  Ok(base)
}

fn ensure_parent(path: &PathBuf) -> std::io::Result<()> {
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent)?;
  }
  Ok(())
}

fn atomic_write(path: &PathBuf, contents: &str) -> Result<(), String> {
  ensure_parent(path).map_err(|e| e.to_string())?;
  let tmp = path.with_extension("tmp");
  {
    let mut f = fs::File::create(&tmp).map_err(|e| e.to_string())?;
    f.write_all(contents.as_bytes()).map_err(|e| e.to_string())?;
    let _ = f.sync_all(); // best-effort
  }
  fs::rename(&tmp, path).map_err(|e| e.to_string())
}

// ===================== Comandos Tauri (CRUD JSON) =====================

#[tauri::command]
fn load_user_json(handle: tauri::AppHandle, name: String) -> Result<String, String> {
  let base = user_data_dir(&handle)?;
  let path = base.join(name);
  let s = fs::read_to_string(&path).map_err(|e| format!("read {path:?}: {e}"))?;
  Ok(s)
}

#[tauri::command]
fn save_user_json(handle: tauri::AppHandle, name: String, contents: String) -> Result<(), String> {
  let base = user_data_dir(&handle)?;
  let path = base.join(name);
  atomic_write(&path, &contents)
}

#[tauri::command]
fn export_user_json(handle: tauri::AppHandle, name: String, dest_path: String) -> Result<(), String> {
  let base = user_data_dir(&handle)?;
  let src = base.join(name);
  let dest = PathBuf::from(dest_path);
  ensure_parent(&dest).map_err(|e| e.to_string())?;
  fs::copy(&src, &dest).map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
fn import_user_json(handle: tauri::AppHandle, name: String, src_path: String) -> Result<(), String> {
  let base = user_data_dir(&handle)?;
  let dest = base.join(name);
  let contents = fs::read_to_string(src_path).map_err(|e| e.to_string())?;
  atomic_write(&dest, &contents)
}

/// Retorna para o front o caminho absoluto onde os dados estão sendo salvos.
#[tauri::command]
fn get_data_dir(handle: tauri::AppHandle) -> Result<String, String> {
  Ok(user_data_dir(&handle)?.to_string_lossy().to_string())
}

// ===================== Bootstrap da app =====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // Plugin de log somente em debug (mantém seu comportamento atual)
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    // Descomente a linha abaixo se você adicionou o plugin de diálogos:
    // .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      load_user_json,
      save_user_json,
      export_user_json,
      import_user_json,
      get_data_dir
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

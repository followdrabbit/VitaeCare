// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // Chama o bootstrap definido no lib.rs
  app_lib::run();
}

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

fn toggle_window(window: &WebviewWindow) {
    if let Ok(is_minimized) = window.is_minimized() {
        if is_minimized {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
            return;
        }
    }

    if let Ok(is_visible) = window.is_visible() {
        if is_visible {
            if let Ok(is_focused) = window.is_focused() {
                if is_focused {
                    let _ = window.hide();
                } else {
                    let _ = window.set_focus();
                }
            } else {
                let _ = window.hide();
            }
        } else {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
        }
    } else {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command]
async fn fetch_github_contributions(username: String) -> Result<String, String> {
    if username.trim().is_empty() {
        return Err("Username cannot be empty".into());
    }

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("https://github.com/users/{}/contributions", username.trim());
    let res = client
        .get(&url)
        .header("Accept", "text/html,application/xhtml+xml")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("GitHub returned HTTP {}", res.status()));
    }

    let text = res.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}

#[tauri::command]
fn update_tray_status(
    app: tauri::AppHandle,
    status: String,
    commits_today: u32,
    _text: Option<String>,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main_tray") {
        let status_desc = if status == "green" {
            "Streak Active"
        } else if status == "red" {
            "Pending Push"
        } else {
            "Checking activity"
        };
        let tooltip = format!(
            "GitPulse: {} commit(s) today ({})",
            commits_today, status_desc
        );
        let _ = tray.set_tooltip(Some(tooltip));
    }
    Ok(())
}

#[tauri::command]
fn show_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fetch_github_contributions,
            update_tray_status,
            show_notification
        ])
        .setup(|app| {
            // Build Context Menu for System Tray
            let open_i = MenuItem::with_id(app, "open", "Open GitPulse", true, None::<&str>)?;
            let refresh_i = MenuItem::with_id(app, "refresh", "Refresh Activity Now", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit GitPulse", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &refresh_i, &quit_i])?;

            // Build System Tray
            let tray_icon = app
                .default_window_icon()
                .cloned()
                .or_else(|| tauri::image::Image::from_icon_resource(1u16, 32, 32).ok())
                .expect("failed to load tray icon");

            let _tray = TrayIconBuilder::with_id("main_tray")
                .icon(tray_icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("GitPulse - GitHub Commit Streak Monitor")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "refresh" => {
                        let _ = app.emit("tray-refresh-requested", ());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            toggle_window(&window);
                        }
                    }
                })
                .build(app)?;

            // Register Global Shortcut: CommandOrControl+Shift+G
            let app_handle = app.handle().clone();
            if let Err(err) = app.global_shortcut().on_shortcut("CommandOrControl+Shift+G", move |_app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        toggle_window(&window);
                    }
                }
            }) {
                eprintln!("[GitPulse] Warning: Could not register global shortcut: {err}");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent hard exit on window close - hide to tray instead
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running GitPulse application");
}

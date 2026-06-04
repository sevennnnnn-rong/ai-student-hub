use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Some(ref mut child) = *self.0.lock().unwrap() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

fn is_port_in_use(port: u16) -> bool {
    std::net::TcpListener::bind(("127.0.0.1", port)).is_err()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            // Get the directory where the exe is located
            let exe_dir = std::env::current_exe()
                .expect("failed to get exe path")
                .parent()
                .expect("failed to get exe directory")
                .to_path_buf();

            // Python executable in venv (relative to exe)
            #[cfg(target_os = "windows")]
            let python_exe = exe_dir.join(".venv").join("Scripts").join("python.exe");
            #[cfg(not(target_os = "windows"))]
            let python_exe = exe_dir.join(".venv").join("bin").join("python");

            let backend_dir = exe_dir.join("backend");

            // Check if backend files exist
            if !python_exe.exists() || !backend_dir.exists() {
                eprintln!("warning: backend files not found at {:?}", exe_dir);
                eprintln!("please ensure .venv and backend directories are in the same folder as the exe");
                return Ok(());
            }

            // Check if port 8000 is already in use
            if is_port_in_use(8000) {
                println!("port 8000 already in use, assuming backend is running");
                return Ok(());
            }

            let mut cmd = Command::new(&python_exe);
            cmd.args(["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"])
                .current_dir(&backend_dir);

            // Hide console window on Windows
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                const CREATE_NO_WINDOW: u32 = 0x08000000;
                cmd.creation_flags(CREATE_NO_WINDOW);
            }

            let child = cmd.spawn().expect("failed to start Python backend");

            // Store child process handle
            {
                let state = app.state::<BackendProcess>();
                let mut guard = state.0.lock().unwrap();
                *guard = Some(child);
            }

            // Wait for backend to be ready (max 10 seconds)
            let start = Instant::now();
            let timeout = Duration::from_secs(10);
            let client = reqwest::blocking::Client::new();
            loop {
                if start.elapsed() > timeout {
                    eprintln!("warning: backend did not become ready within 10s, continuing anyway");
                    break;
                }
                match client.get("http://127.0.0.1:8000/health").send() {
                    Ok(resp) if resp.status().is_success() => {
                        println!("backend ready");
                        break;
                    }
                    _ => {
                        std::thread::sleep(Duration::from_millis(200));
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

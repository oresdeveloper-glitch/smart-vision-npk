import os
import sys
import subprocess
import time
import urllib.request
import webbrowser
import socket


BACKEND_URL = "http://localhost:5000"
FRONTEND_URL = "http://localhost:5173"


def is_url_ready(url, timeout=1.0):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return 200 <= response.status < 500
    except Exception:
        return False


def wait_for_url(url, label, seconds=30):
    print(f"Waiting for {label} at {url} ...")
    deadline = time.time() + seconds
    while time.time() < deadline:
        if is_url_ready(url):
            print(f"{label} is ready: {url}")
            return True
        time.sleep(1)
    print(f"Warning: {label} did not respond within {seconds} seconds.")
    return False


def get_lan_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except Exception:
        return "localhost"


def ensure_python_dependencies():
    packages = ["flask", "flask-cors", "tensorflow", "pillow", "numpy"]
    modules = ["flask", "flask_cors", "tensorflow", "PIL", "numpy"]

    missing = []
    for package, module in zip(packages, modules):
        try:
            __import__(module)
        except ImportError:
            missing.append(package)

    if missing:
        print(f"Installing missing Python packages: {', '.join(missing)}")
        subprocess.run([sys.executable, "-m", "pip", "install", *missing], check=True)
    else:
        print("Python dependencies are already installed.")


def ensure_node_dependencies(root_dir):
    node_modules = os.path.join(root_dir, "node_modules")
    if os.path.exists(node_modules):
        print("Node dependencies are already installed.")
        return

    npm = "npm.cmd" if os.name == "nt" else "npm"
    print("Installing Node dependencies...")
    subprocess.run([npm, "install"], cwd=root_dir, check=True)


def model_artifacts_ready(model_dir, meta_path):
    saved_model_path = os.path.join(model_dir, "saved_model.pb")
    variables_dir = os.path.join(model_dir, "variables")
    return (
        os.path.exists(model_dir)
        and os.path.exists(saved_model_path)
        and os.path.isdir(variables_dir)
        and os.path.exists(meta_path)
    )


def main():
    # Determine directories
    ml_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(ml_dir)
    data_dir = os.path.join(root_dir, "data")
    artifacts_dir = os.path.join(ml_dir, "artifacts")
    model_dir = os.path.join(artifacts_dir, "npk_resnet50_export")
    meta_path = os.path.join(artifacts_dir, "meta.json")

    # Validation: Ensure critical files exist before proceeding
    if not os.path.exists(os.path.join(ml_dir, "server.py")):
        print(f"Error: Backend script 'server.py' not found in {ml_dir}")
        return
    if not os.path.exists(os.path.join(root_dir, "package.json")):
        print(f"Error: 'package.json' not found in {root_dir}. Are you in the right directory?")
        return

    lan_ip = get_lan_ip()
    phone_frontend_url = f"http://{lan_ip}:5173"
    phone_backend_url = f"http://{lan_ip}:5000"

    print("=== NPK Detection App Automation ===")

    # 1. Install/check required packages
    print("\n[1/4] Checking dependencies...")
    ensure_python_dependencies()
    ensure_node_dependencies(root_dir)

    # 2. Check model artifacts. Training is opt-in because it can take a long time
    # and should not block opening the web app during development.
    if not model_artifacts_ready(model_dir, meta_path):
        print("\n[2/4] Model artifacts not found.")
        if "--train" in sys.argv:
            print("Training was requested. Checking for dataset...")
            if not os.path.exists(data_dir):
                print(f"Error: Dataset not found at {data_dir}. Please ensure the 'data' folder exists in the root directory.")
                return

            print("Initiating model training (this may take some time)...")
            train_result = subprocess.run([sys.executable, "train_model.py"], cwd=ml_dir)
            if train_result.returncode != 0:
                print("Training failed. Check logs above for details.")
                return
        else:
            print("The app now requires the real trained model for prediction.")
            print(f"Expected model: {model_dir}")
            print(f"Expected metadata: {meta_path}")
            print("Run from the ml folder with: python start.py --train")
            print("Or copy your trained SavedModel into the expected artifacts folder.")
            return
    else:
        print("\n[2/4] Found existing model artifacts. Skipping training.")

    # 3. Start backend and frontend
    print("\n[3/4] Starting app services...")
    processes = []
    npm = "npm.cmd" if os.name == "nt" else "npm"

    if is_url_ready(f"{BACKEND_URL}/health"):
        print(f"Backend is already running: {BACKEND_URL}")
    else:
        print("Starting Flask backend...")
        processes.append(subprocess.Popen([sys.executable, "server.py"], cwd=ml_dir))

    if is_url_ready(FRONTEND_URL):
        print(f"Frontend is already running: {FRONTEND_URL}")
    else:
        print("Starting Vite frontend...")
        frontend_env = os.environ.copy()
        frontend_env["VITE_ML_SERVER_URL"] = phone_backend_url
        processes.append(subprocess.Popen([npm, "run", "dev", "--", "--host", "0.0.0.0"], cwd=root_dir, env=frontend_env))

    # 4. Open browser
    print("\n[4/4] Opening web browser...")
    wait_for_url(f"{BACKEND_URL}/health", "backend")
    wait_for_url(FRONTEND_URL, "frontend")
    webbrowser.open(FRONTEND_URL)
    print(f"\nLive app: {FRONTEND_URL}")
    print(f"Phone link: {phone_frontend_url}")
    print(f"Phone backend: {phone_backend_url}")
    if not processes:
        print("Both services were already running, so there is nothing for this script to stop.")
        return

    print("Press Ctrl+C in this terminal to stop services started by this script.")

    try:
        while True:
            # Check if all processes are still alive
            alive_processes = [p for p in processes if p.poll() is None]
            if not alive_processes and processes:
                print("All started services have stopped.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping app services...")
        for process in processes:
            if process.poll() is None:
                process.terminate()

if __name__ == "__main__":
    main()

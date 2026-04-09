#!/usr/bin/env python3
"""
糖尿病视网膜病变诊断系统 - 一键启动脚本
Usage: python start.py

自动完成：
  1. 检查 Python 版本
  2. 安装依赖
  3. 检查模型权重文件
  4. 初始化数据库
  5. 启动服务（前后端一体）
"""
import subprocess
import sys
import os

PORT = 8000
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "classifier.pt")
REQUIREMENTS = os.path.join(PROJECT_ROOT, "requirements.txt")


def run(cmd, desc, check=True):
    print(f"\n{'='*50}")
    print(f"  {desc}")
    print(f"{'='*50}")
    result = subprocess.run(cmd, shell=True, cwd=PROJECT_ROOT)
    if check and result.returncode != 0:
        print(f"\n[ERROR] {desc} failed (exit code {result.returncode})")
        sys.exit(1)
    return result


def main():
    print("""
    ╔══════════════════════════════════════════════════╗
    ║   糖尿病视网膜病变诊断系统 - 一键启动           ║
    ║   Diabetic Retinopathy Diagnosis System          ║
    ╚══════════════════════════════════════════════════╝
    """)

    # 1. Check Python version
    v = sys.version_info
    print(f"[1/5] Python 版本: {v.major}.{v.minor}.{v.micro}")
    if v.major < 3 or (v.major == 3 and v.minor < 8):
        print("[ERROR] 需要 Python 3.8+")
        sys.exit(1)
    print("      OK")

    # 2. Install dependencies
    print(f"\n[2/5] 安装 Python 依赖...")
    run(
        f"{sys.executable} -m pip install -r {REQUIREMENTS} -q",
        "安装依赖包",
    )

    # 3. Check model weights
    print(f"\n[3/5] 检查模型权重文件...")
    if os.path.exists(MODEL_PATH):
        size_mb = os.path.getsize(MODEL_PATH) / 1024 / 1024
        print(f"      classifier.pt ({size_mb:.0f}MB) OK")
    else:
        print(f"""
      [WARNING] 模型权重文件不存在: {MODEL_PATH}

      请将 classifier.pt 放到 models/ 目录下。
      下载地址: https://www.kaggle.com/souravs17031999/blindness-detection-pretrained-weights-pytorch

      系统仍可启动，但诊断功能不可用。
        """)
        input("按 Enter 继续启动（不含模型），或 Ctrl+C 退出...")

    # 4. Check static files
    print(f"\n[4/5] 检查前端构建文件...")
    static_dir = os.path.join(PROJECT_ROOT, "static")
    if os.path.isdir(static_dir) and os.path.exists(os.path.join(static_dir, "index.html")):
        print("      static/index.html OK")
    else:
        print("      [WARNING] 前端文件未找到，请先构建: cd frontend && npm run build")

    # 5. Start server
    print(f"\n[5/5] 启动服务...")
    print(f"""
    ╔══════════════════════════════════════════════════╗
    ║                                                  ║
    ║   系统启动中...                                  ║
    ║                                                  ║
    ║   访问地址: http://localhost:{PORT}               ║
    ║   默认账号: admin / admin123                     ║
    ║                                                  ║
    ║   按 Ctrl+C 停止服务                             ║
    ║                                                  ║
    ╚══════════════════════════════════════════════════╝
    """)

    os.chdir(PROJECT_ROOT)
    try:
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "backend.app:app",
             "--host", "0.0.0.0", "--port", str(PORT)],
            cwd=PROJECT_ROOT,
        )
    except KeyboardInterrupt:
        print("\n\n服务已停止。")


if __name__ == "__main__":
    main()

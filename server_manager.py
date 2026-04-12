#!/usr/bin/env python3
"""
NEXUS TECH Backend Server - MySQL Edition
Permanent background service with Flask-SQLAlchemy
"""

import subprocess
import sys
import os
from pathlib import Path

class ServerManager:
    def __init__(self):
        self.project_dir = Path(__file__).parent.parent
        self.api_dir = self.project_dir / "api"
        self.venv_python = self.project_dir / ".venv" / "Scripts" / "python.exe"
        self.server_script = self.api_dir / "server.py"
        self.port = 5000
        
    def print_banner(self):
        print("\n" + "="*55)
        print("   NEXUS TECH - Server Manager")
        print("="*55 + "\n")
    
    def start(self):
        """Start the server"""
        self.print_banner()
        print("Starting NEXUS TECH Backend Server...")
        print(f"  Port: {self.port}")
        print(f"  Database: MySQL (laptop_shop)")
        print(f"  Products: JSON (products.json)\n")
        
        try:
            subprocess.Popen(
                [str(self.venv_python), str(self.server_script)],
                cwd=str(self.api_dir)
            )
            print("✓ Server started! Access at: http://127.0.0.1:5000")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    def show_menu(self):
        """Show interactive menu"""
        while True:
            self.print_banner()
            print("1. Start Server")
            print("2. Exit")
            print()
            
            choice = input("Select option (1-2): ").strip()
            
            if choice == '1':
                self.start()
                break
            elif choice == '2':
                print("\nGoodbye!")
                break
            else:
                print("\n✗ Invalid option.")
            
            input("\nPress Enter to continue...")

def main():
    manager = ServerManager()
    manager.show_menu()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting...")
        sys.exit(0)

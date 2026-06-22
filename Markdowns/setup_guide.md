# Project Setup Guide: FastAPI Backend & Next.js Frontend

This guide walks you through setting up the development environments for both the backend (Python/FastAPI) and frontend (Next.js/React/TypeScript) from scratch using terminal commands.

---

## 1. Backend Setup (Python + FastAPI)

We will create a Python virtual environment to keep dependencies isolated, install FastAPI and its server (Uvicorn), and create a minimal "Hello World" endpoint.

### Step-by-Step Commands:

1. **Navigate to the Backend directory** (from the project root):
   ```bash
   cd Backend
   ```

2. **Create a Python virtual environment** (named `.venv`):
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment**:
   * **Windows (PowerShell - recommended)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
     *(Note: If you get an execution policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` in your PowerShell terminal first, then try activating again.)*
   * **Windows (CMD)**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   * **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```
   * *Once activated, you should see `(.venv)` at the beginning of your terminal prompt.*

4. **Install backend dependencies**:
   We will install FastAPI, Uvicorn (the web server), and some libraries for web scraping/API requests (`requests`, `beautifulsoup4`) that will be useful later:
   ```bash
   pip install fastapi uvicorn requests beautifulsoup4
   ```

5. **Generate a `requirements.txt` file**:
   This saves your installed dependencies so you can easily install them later or share them:
   ```bash
   pip freeze > requirements.txt
   ```

6. **Create a minimal FastAPI server file**:
   Create a file named `main.py` in the `Backend` directory with the following content:
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware

   app = FastAPI()

   # Configure CORS so your frontend can communicate with the backend
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # Adjust this in production
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   @app.get("/")
   def read_root():
       return {"message": "Welcome to the political tracker API!"}
   ```

7. **Run the backend server**:
   ```bash
   uvicorn main:app --reload
   ```
   * The `--reload` flag tells Uvicorn to restart the server automatically whenever you modify your Python files.
   * Your API will be live at `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/docs` to see FastAPI's interactive swagger documentation.

---

## 2. Frontend Setup (Next.js + React + TypeScript)

We will use **Next.js** to build our React frontend. Next.js handles server-side rendering (SSR), page routing, and modern React features like Server Components.

### Step-by-Step Commands:

1. **Open a new terminal session** and navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. **Initialize Next.js in the current directory**:
   Run the following command to start the Next.js setup wizard. The `.` tells the installer to create the project directly in the current `Frontend` folder:
   ```bash
   npx create-next-app@latest .
   ```

3. **Configure the interactive setup prompts**:
   When prompted by the wizard, choose the following options:
   * **Would you like to use TypeScript?** → `Yes` (recommended for type safety)
   * **Would you like to use ESLint?** → `Yes` (checks your code for errors)
   * **Would you like to use Tailwind CSS?** → `No` (we will use Vanilla CSS/CSS Modules for layout and styling, or select `Yes` if you want it)
   * **Would you like to use `src/` directory?** → `Yes` (recommended, organizes source files)
   * **Would you like to use App Router? (recommended)** → `Yes` (uses the modern page routing system)
   * **Would you like to customize the default import alias (@/*)?** → `No` (the default configuration is perfect)

   *(Note: The setup wizard will automatically install `react`, `react-dom`, `next`, and other dependencies, so you don't need to run a separate `npm install`.)*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   * Next.js will start the server, typically at `http://localhost:3000`. Open your browser and navigate to this URL to see the default Next.js welcome page.

---

## 3. Viewing the App with VS Code Live Preview

To view your web application and see changes in real-time inside VS Code:

1. **Install the Live Preview Extension**:
   * Open the Extensions view in VS Code (`Ctrl+Shift+X`).
   * Search for **Live Preview** (by Microsoft) and click **Install**.

2. **Run your development servers**:
   * Make sure your Next.js development server is running (`npm run dev` in the `Frontend` directory).

3. **Launch the Live Preview inside VS Code**:
   * Open the VS Code Command Palette (`Ctrl+Shift+P`).
   * Type and select: **Live Preview: Show Preview**.
   * In the address bar of the Live Preview panel that opens, enter the local URL of your frontend server:
     ```text
     http://localhost:3000
     ```
   * Now, you can split your screen to have your code on one side and the Live Preview on the other. Editing files in `Frontend/src/app` will instantly update the preview without you needing to manually refresh.

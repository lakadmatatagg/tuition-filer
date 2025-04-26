# TuitionEZ Filer (NestJS)

A standalone file management service built with **NestJS**, handling file uploads, downloads, and deletions over FTP.

## 🚀 Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Storage:** FTP Server
- **Package Manager:** npm

## ⚙️ Getting Started

### Prerequisites
- Node.js (LTS recommended)
- npm
- FTP Server access (or SFTP if used)

### Installation

```bash
# Clone the repo
git clone https://github.com/lakadmatatagg/tuitionez-filer.git
cd tuitionez-filer

# Install dependencies
npm ci

# Start the development server
npm run start
```

The service will be available at `http://localhost:3000`.

## 📦 Environment Variables

Environment configurations are stored in the `environments/` folder.

You can manage connection details like:
- FTP host
- FTP username and password
- Remote file paths
- App port

## 🗂️ Project Structure

```bash
environments/
src/
├── controller/
├── service/
├── app.module.ts
├── main.ts
templates/
test/
package.json
```

### Explanation

- **`environments/`** – Environment-specific configuration files (e.g., FTP connection details).
- **`src/`** – Main NestJS application source.
  - **`controller/`** – Handles incoming API requests (like file upload, download endpoints).
  - **`service/`** – Business logic and FTP-related services (like uploading, listing files).
  - **`app.module.ts`** – Root module where controllers and services are imported.
  - **`main.ts`** – Application entry point to bootstrap the NestJS app.
- **`templates/`** – Reserved for template files (currently empty).
- **`test/`** – Contains unit and end-to-end test files.


## 🛠️ Available Scripts

| Command                | Description               |
|-------------------------|----------------------------|
| `npm run start`         | Start server               |
| `npm run start:prod`    | Start server in production |
| `npm run build`          | Run build for production                |

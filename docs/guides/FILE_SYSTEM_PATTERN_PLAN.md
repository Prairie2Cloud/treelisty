# File System Pattern Implementation Plan for TreeListy

## Executive Summary

This document provides a comprehensive implementation plan for adding a "File System" pattern to TreeListy that represents hard drives, Google Drive, and OneDrive structures. The File System pattern will be a **flexible-depth pattern** that breaks from the traditional 4-level hierarchy (Root/Phase/Item/Subtask) to support unlimited nesting of folders and files.

**Key Innovation**: This will be TreeListy's first pattern with dynamic depth, requiring new architectural changes to support folders within folders at any level.

---

## 1. Pattern Definition

### 1.1 Basic Pattern Structure

```javascript
filesystem: {
    name: 'File System',
    icon: '💾',
    isFlexibleDepth: true,  // NEW FLAG - indicates unlimited nesting
    levels: {
        root: 'Drive',
        phase: 'Folder',      // Top-level folders
        item: 'File/Folder',  // Can be file OR subfolder
        subtask: 'File'       // Nested files
        // Note: actual implementation allows infinite folder nesting
    },
    phaseSubtitles: ['Documents', 'Downloads', 'Desktop', 'Pictures', 'Videos', 'Projects'],
    types: [
        // Folder types
        { value: 'folder', label: '📁 Folder' },
        { value: 'folder-shared', label: '📂 Shared Folder' },
        { value: 'folder-cloud', label: '☁️ Cloud Folder' },

        // Document types
        { value: 'document', label: '📄 Document' },
        { value: 'pdf', label: '📕 PDF' },
        { value: 'word', label: '📘 Word Doc' },
        { value: 'excel', label: '📗 Spreadsheet' },
        { value: 'powerpoint', label: '📙 Presentation' },
        { value: 'text', label: '📝 Text File' },

        // Media types
        { value: 'image', label: '🖼️ Image' },
        { value: 'video', label: '🎬 Video' },
        { value: 'audio', label: '🎵 Audio' },

        // Code types
        { value: 'code', label: '💻 Code' },
        { value: 'html', label: '🌐 HTML' },
        { value: 'css', label: '🎨 CSS' },
        { value: 'javascript', label: '⚡ JavaScript' },
        { value: 'python', label: '🐍 Python' },

        // Archive types
        { value: 'archive', label: '📦 Archive' },
        { value: 'zip', label: '🗜️ ZIP' },

        // Other
        { value: 'executable', label: '⚙️ Executable' },
        { value: 'database', label: '🗄️ Database' },
        { value: 'unknown', label: '❓ Unknown' }
    ],
    description: 'Organize files and folders from local drives, Google Drive, and OneDrive',
    sortOptions: [
        { value: 'name-az', label: '🔤 Name (A-Z)', field: 'name', order: 'asc', type: 'text' },
        { value: 'name-za', label: '🔤 Name (Z-A)', field: 'name', order: 'desc', type: 'text' },
        { value: 'size-large', label: '📊 Size (Largest First)', field: 'fileSize', order: 'desc', type: 'number' },
        { value: 'size-small', label: '📊 Size (Smallest First)', field: 'fileSize', order: 'asc', type: 'number' },
        { value: 'modified-newest', label: '🕒 Modified (Newest First)', field: 'dateModified', order: 'desc', type: 'date' },
        { value: 'modified-oldest', label: '🕒 Modified (Oldest First)', field: 'dateModified', order: 'asc', type: 'date' },
        { value: 'created-newest', label: '📅 Created (Newest First)', field: 'dateCreated', order: 'desc', type: 'date' },
        { value: 'created-oldest', label: '📅 Created (Oldest First)', field: 'dateCreated', order: 'asc', type: 'date' },
        { value: 'type-folders-first', label: '📁 Type (Folders First)', field: 'isFolder', order: 'desc', type: 'boolean' },
        { value: 'extension-az', label: '🏷️ Extension (A-Z)', field: 'fileExtension', order: 'asc', type: 'text' }
    ],
    fields: {
        fileSize: {
            label: 'File Size (bytes)',
            type: 'number',
            min: 0,
            step: 1,
            helpText: '📊 Size in bytes (will be formatted as KB/MB/GB)'
        },
        fileExtension: {
            label: 'File Extension',
            type: 'text',
            placeholder: '.pdf, .docx, .jpg...',
            helpText: '🏷️ File type extension'
        },
        filePath: {
            label: 'Full Path',
            type: 'text',
            placeholder: 'C:\\Users\\Documents\\file.pdf',
            helpText: '📂 Complete file path'
        },
        dateModified: {
            label: 'Date Modified',
            type: 'datetime-local',
            helpText: '🕒 Last modification date and time'
        },
        dateCreated: {
            label: 'Date Created',
            type: 'datetime-local',
            helpText: '📅 Creation date and time'
        },
        fileOwner: {
            label: 'Owner',
            type: 'text',
            placeholder: 'john.doe@company.com',
            helpText: '👤 File owner (for cloud files)'
        },
        sharedWith: {
            label: 'Shared With',
            type: 'textarea',
            placeholder: 'user1@email.com, user2@email.com...',
            helpText: '👥 Users with access (for cloud files)'
        },
        permissions: {
            label: 'Permissions',
            type: 'select',
            options: ['Read Only', 'Read/Write', 'Owner', 'Viewer', 'Editor', 'Commenter'],
            helpText: '🔒 Access permissions'
        },
        driveType: {
            label: 'Drive Type',
            type: 'select',
            options: ['Local Drive', 'Google Drive', 'OneDrive', 'Dropbox', 'Network Drive', 'External Drive'],
            helpText: '💾 Storage location type'
        },
        mimeType: {
            label: 'MIME Type',
            type: 'text',
            placeholder: 'application/pdf, image/jpeg...',
            helpText: '📋 File MIME type (for web/cloud files)'
        },
        checksum: {
            label: 'Checksum/Hash',
            type: 'text',
            placeholder: 'MD5, SHA256...',
            helpText: '🔐 File integrity checksum'
        },
        tags: {
            label: 'Tags',
            type: 'text',
            placeholder: 'work, important, archive...',
            helpText: '🏷️ Custom tags for organization'
        },
        fileUrl: {
            label: 'Cloud URL',
            type: 'text',
            placeholder: 'https://drive.google.com/...',
            helpText: '🔗 Direct link to cloud file'
        },
        isFolder: {
            label: 'Is Folder',
            type: 'checkbox',
            helpText: '📁 Check if this is a folder (not a file)'
        },
        includeDependencies: false,
        includeTracking: false
    }
}
```

---

## 2. Data Model - JSON Schema

### 2.1 File System Tree Structure

```javascript
{
    id: 'root',
    name: 'My Computer',
    type: 'root',
    icon: '💻',
    pattern: {
        key: 'filesystem',
        labels: { root: 'Drive', phase: 'Folder', item: 'File/Folder', subtask: 'File' }
    },
    expanded: true,
    children: [
        {
            id: 'drive-c',
            name: 'C:\\ (Local Disk)',
            subtitle: 'System Drive',
            type: 'phase',      // Drive = Phase level
            phase: '0',
            icon: '💾',
            driveType: 'Local Drive',
            fileSize: 500000000000,  // 500 GB
            expanded: true,
            items: [
                // Top-level folders (Phase Items)
                {
                    id: 'folder-users',
                    name: 'Users',
                    type: 'item',
                    isFolder: true,
                    icon: '📁',
                    itemType: 'folder',
                    filePath: 'C:\\Users',
                    dateModified: '2025-11-15T10:30:00',
                    dateCreated: '2024-01-01T00:00:00',
                    permissions: 'Read/Write',
                    expanded: true,

                    // Nested subfolders and files (Subtasks)
                    subItems: [
                        {
                            id: 'folder-john',
                            name: 'John',
                            type: 'subtask',
                            isFolder: true,
                            icon: '👤',
                            itemType: 'folder',
                            filePath: 'C:\\Users\\John',
                            dateModified: '2025-11-16T09:00:00',
                            expanded: true,

                            // Further nesting (NEW: subtask can have subItems)
                            subItems: [
                                {
                                    id: 'folder-documents',
                                    name: 'Documents',
                                    type: 'subtask',
                                    isFolder: true,
                                    icon: '📂',
                                    itemType: 'folder',
                                    filePath: 'C:\\Users\\John\\Documents',
                                    dateModified: '2025-11-16T08:45:00',
                                    expanded: false,

                                    // Files in Documents folder
                                    subItems: [
                                        {
                                            id: 'file-report',
                                            name: 'Annual_Report_2025.pdf',
                                            type: 'subtask',
                                            isFolder: false,
                                            icon: '📕',
                                            itemType: 'pdf',
                                            fileExtension: '.pdf',
                                            filePath: 'C:\\Users\\John\\Documents\\Annual_Report_2025.pdf',
                                            fileSize: 2500000,  // 2.5 MB
                                            mimeType: 'application/pdf',
                                            dateModified: '2025-11-10T14:22:00',
                                            dateCreated: '2025-11-10T14:20:00',
                                            permissions: 'Read/Write',
                                            tags: 'work, report, 2025'
                                        },
                                        {
                                            id: 'file-budget',
                                            name: 'Budget_2025.xlsx',
                                            type: 'subtask',
                                            isFolder: false,
                                            icon: '📗',
                                            itemType: 'excel',
                                            fileExtension: '.xlsx',
                                            filePath: 'C:\\Users\\John\\Documents\\Budget_2025.xlsx',
                                            fileSize: 450000,  // 450 KB
                                            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                            dateModified: '2025-11-15T16:30:00',
                                            dateCreated: '2025-01-05T09:00:00',
                                            permissions: 'Read/Write'
                                        }
                                    ]
                                },
                                {
                                    id: 'folder-downloads',
                                    name: 'Downloads',
                                    type: 'subtask',
                                    isFolder: true,
                                    icon: '📥',
                                    itemType: 'folder',
                                    filePath: 'C:\\Users\\John\\Downloads',
                                    expanded: false,
                                    subItems: []
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'folder-program-files',
                    name: 'Program Files',
                    type: 'item',
                    isFolder: true,
                    icon: '📁',
                    itemType: 'folder',
                    filePath: 'C:\\Program Files',
                    permissions: 'Read Only',
                    expanded: false,
                    subItems: []
                }
            ]
        },
        {
            id: 'drive-google',
            name: 'Google Drive',
            subtitle: 'Cloud Storage',
            type: 'phase',
            phase: '1',
            icon: '☁️',
            driveType: 'Google Drive',
            fileOwner: 'john.doe@gmail.com',
            expanded: true,
            items: [
                {
                    id: 'gdrive-shared',
                    name: 'Shared with me',
                    type: 'item',
                    isFolder: true,
                    icon: '👥',
                    itemType: 'folder-shared',
                    permissions: 'Viewer',
                    expanded: false,
                    subItems: [
                        {
                            id: 'gdrive-presentation',
                            name: 'Q4_Strategy.pptx',
                            type: 'subtask',
                            isFolder: false,
                            icon: '📙',
                            itemType: 'powerpoint',
                            fileExtension: '.pptx',
                            fileSize: 8500000,  // 8.5 MB
                            mimeType: 'application/vnd.google-apps.presentation',
                            fileOwner: 'boss@company.com',
                            sharedWith: 'john.doe@gmail.com, team@company.com',
                            permissions: 'Commenter',
                            dateModified: '2025-11-12T11:00:00',
                            fileUrl: 'https://docs.google.com/presentation/d/abc123'
                        }
                    ]
                }
            ]
        }
    ]
}
```

### 2.2 Key Data Model Changes

**CRITICAL**: To support unlimited folder nesting, the following architectural changes are needed:

1. **Recursive SubItems**: The `subItems` array can contain nodes that themselves have `subItems` arrays (infinite depth)
2. **Type Flexibility**: The `type` field must support dynamic assignment beyond the 4-level hierarchy
3. **Folder Flag**: New `isFolder: boolean` field to distinguish folders from files at any level
4. **Depth Tracking**: Add optional `depth: number` field to track nesting level (for UI rendering)

---

## 3. Icon Mapping Strategy

### 3.1 File Extension to Icon/Type Mapping

```javascript
const FILE_ICON_MAP = {
    // Documents
    '.pdf': { icon: '📕', type: 'pdf' },
    '.doc': { icon: '📘', type: 'word' },
    '.docx': { icon: '📘', type: 'word' },
    '.odt': { icon: '📘', type: 'document' },

    // Spreadsheets
    '.xls': { icon: '📗', type: 'excel' },
    '.xlsx': { icon: '📗', type: 'excel' },
    '.csv': { icon: '📊', type: 'excel' },
    '.ods': { icon: '📊', type: 'excel' },

    // Presentations
    '.ppt': { icon: '📙', type: 'powerpoint' },
    '.pptx': { icon: '📙', type: 'powerpoint' },
    '.key': { icon: '📙', type: 'powerpoint' },
    '.odp': { icon: '📙', type: 'powerpoint' },

    // Text
    '.txt': { icon: '📝', type: 'text' },
    '.md': { icon: '📝', type: 'text' },
    '.rtf': { icon: '📝', type: 'text' },

    // Images
    '.jpg': { icon: '🖼️', type: 'image' },
    '.jpeg': { icon: '🖼️', type: 'image' },
    '.png': { icon: '🖼️', type: 'image' },
    '.gif': { icon: '🎨', type: 'image' },
    '.bmp': { icon: '🖼️', type: 'image' },
    '.svg': { icon: '🎨', type: 'image' },
    '.webp': { icon: '🖼️', type: 'image' },

    // Videos
    '.mp4': { icon: '🎬', type: 'video' },
    '.avi': { icon: '🎬', type: 'video' },
    '.mov': { icon: '🎬', type: 'video' },
    '.mkv': { icon: '🎬', type: 'video' },
    '.webm': { icon: '🎬', type: 'video' },
    '.flv': { icon: '🎬', type: 'video' },

    // Audio
    '.mp3': { icon: '🎵', type: 'audio' },
    '.wav': { icon: '🎵', type: 'audio' },
    '.flac': { icon: '🎵', type: 'audio' },
    '.aac': { icon: '🎵', type: 'audio' },
    '.ogg': { icon: '🎵', type: 'audio' },
    '.m4a': { icon: '🎵', type: 'audio' },

    // Code
    '.html': { icon: '🌐', type: 'html' },
    '.htm': { icon: '🌐', type: 'html' },
    '.css': { icon: '🎨', type: 'css' },
    '.js': { icon: '⚡', type: 'javascript' },
    '.jsx': { icon: '⚡', type: 'javascript' },
    '.ts': { icon: '💙', type: 'javascript' },
    '.tsx': { icon: '💙', type: 'javascript' },
    '.py': { icon: '🐍', type: 'python' },
    '.java': { icon: '☕', type: 'code' },
    '.cpp': { icon: '⚙️', type: 'code' },
    '.c': { icon: '⚙️', type: 'code' },
    '.php': { icon: '🐘', type: 'code' },
    '.rb': { icon: '💎', type: 'code' },
    '.go': { icon: '🔵', type: 'code' },
    '.rs': { icon: '🦀', type: 'code' },
    '.json': { icon: '📋', type: 'code' },
    '.xml': { icon: '📋', type: 'code' },
    '.yaml': { icon: '📋', type: 'code' },
    '.yml': { icon: '📋', type: 'code' },

    // Archives
    '.zip': { icon: '🗜️', type: 'zip' },
    '.rar': { icon: '📦', type: 'archive' },
    '.7z': { icon: '📦', type: 'archive' },
    '.tar': { icon: '📦', type: 'archive' },
    '.gz': { icon: '📦', type: 'archive' },

    // Executables
    '.exe': { icon: '⚙️', type: 'executable' },
    '.msi': { icon: '⚙️', type: 'executable' },
    '.app': { icon: '⚙️', type: 'executable' },
    '.dmg': { icon: '💿', type: 'executable' },
    '.deb': { icon: '📦', type: 'executable' },

    // Database
    '.db': { icon: '🗄️', type: 'database' },
    '.sqlite': { icon: '🗄️', type: 'database' },
    '.sql': { icon: '🗄️', type: 'database' },

    // Default
    'default': { icon: '❓', type: 'unknown' }
};

const FOLDER_ICON_MAP = {
    'default': '📁',
    'open': '📂',
    'shared': '👥',
    'cloud': '☁️',
    'system': '⚙️',
    'user': '👤',
    'downloads': '📥',
    'documents': '📄',
    'pictures': '🖼️',
    'videos': '🎬',
    'music': '🎵',
    'desktop': '🖥️',
    'trash': '🗑️'
};

function getFileIcon(fileName, isFolder = false) {
    if (isFolder) {
        // Check for special folder names
        const folderNameLower = fileName.toLowerCase();
        if (folderNameLower.includes('download')) return FOLDER_ICON_MAP.downloads;
        if (folderNameLower.includes('document')) return FOLDER_ICON_MAP.documents;
        if (folderNameLower.includes('picture') || folderNameLower.includes('photo')) return FOLDER_ICON_MAP.pictures;
        if (folderNameLower.includes('video') || folderNameLower.includes('movie')) return FOLDER_ICON_MAP.videos;
        if (folderNameLower.includes('music') || folderNameLower.includes('audio')) return FOLDER_ICON_MAP.music;
        if (folderNameLower.includes('desktop')) return FOLDER_ICON_MAP.desktop;
        if (folderNameLower.includes('trash') || folderNameLower.includes('recycle')) return FOLDER_ICON_MAP.trash;
        if (folderNameLower.includes('user')) return FOLDER_ICON_MAP.user;
        return FOLDER_ICON_MAP.default;
    }

    // Extract extension
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const mapping = FILE_ICON_MAP[ext] || FILE_ICON_MAP.default;
    return mapping.icon;
}

function getFileType(fileName, isFolder = false) {
    if (isFolder) return 'folder';
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const mapping = FILE_ICON_MAP[ext] || FILE_ICON_MAP.default;
    return mapping.type;
}
```

### 3.2 Dynamic Icon System Implementation

```javascript
// Add to pattern fields configuration
function updateNodeIcon(node) {
    if (node.isFolder) {
        node.icon = node.expanded ? FOLDER_ICON_MAP.open : FOLDER_ICON_MAP.default;
    } else if (node.name) {
        node.icon = getFileIcon(node.name, false);
        if (!node.itemType) {
            node.itemType = getFileType(node.name, false);
        }
    }
}
```

---

## 4. UI Components Needed

### 4.1 Breadcrumb Navigation

**Purpose**: Show current path in deeply nested folder structures

```javascript
function renderBreadcrumbs(activeNode) {
    const breadcrumbContainer = document.getElementById('breadcrumb-nav');
    if (!breadcrumbContainer) return;

    const path = [];
    let current = activeNode;

    // Build path from current node to root
    while (current) {
        path.unshift(current);
        current = findParentNode(current.id);
    }

    breadcrumbContainer.innerHTML = path.map((node, idx) => {
        const isLast = idx === path.length - 1;
        return `
            <span class="breadcrumb-item ${isLast ? 'active' : ''}"
                  onclick="navigateToNode('${node.id}')">
                ${node.icon} ${node.name}
            </span>
            ${!isLast ? '<span class="breadcrumb-separator">→</span>' : ''}
        `;
    }).join('');
}
```

**HTML Addition**:
```html
<div id="breadcrumb-nav" style="
    padding: 12px 16px;
    background: var(--card-bg);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    overflow-x: auto;
"></div>
```

### 4.2 File Type Filter

**Purpose**: Filter visible files by type (show only PDFs, images, etc.)

```javascript
function renderFileTypeFilter() {
    const filterContainer = document.getElementById('file-type-filter');
    if (!filterContainer || currentPattern !== 'filesystem') return;

    const fileTypes = [
        { value: 'all', label: 'All Files', icon: '📁' },
        { value: 'folder', label: 'Folders', icon: '📂' },
        { value: 'document', label: 'Documents', icon: '📄' },
        { value: 'image', label: 'Images', icon: '🖼️' },
        { value: 'video', label: 'Videos', icon: '🎬' },
        { value: 'audio', label: 'Audio', icon: '🎵' },
        { value: 'code', label: 'Code', icon: '💻' },
        { value: 'archive', label: 'Archives', icon: '📦' }
    ];

    filterContainer.innerHTML = `
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${fileTypes.map(type => `
                <button class="file-type-badge"
                        data-type="${type.value}"
                        onclick="filterByFileType('${type.value}')">
                    ${type.icon} ${type.label}
                </button>
            `).join('')}
        </div>
    `;
}

function filterByFileType(typeFilter) {
    currentFileTypeFilter = typeFilter;
    render(); // Re-render with filter applied
}
```

### 4.3 File Size Display Formatter

```javascript
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);

    return `${size} ${sizes[i]}`;
}
```

### 4.4 Path Display Component

```javascript
function renderPathInfo(node) {
    if (!node.filePath) return '';

    return `
        <div class="file-path-display" style="
            font-family: monospace;
            font-size: 11px;
            color: var(--text-secondary);
            background: rgba(0,0,0,0.1);
            padding: 4px 8px;
            border-radius: 4px;
            margin-top: 6px;
            word-break: break-all;
        ">
            📂 ${node.filePath}
        </div>
    `;
}
```

---

## 5. Import Strategies

### 5.1 Local File System Import (HTML5 Directory Upload)

**Approach**: Use `<input type="file" webkitdirectory>` to let users upload entire folder structures.

**Limitations**:
- Browser security prevents reading actual file system
- Requires user to manually select folders
- Cannot auto-detect drives

**Implementation**:

```javascript
function initializeDirectoryImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;

    input.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        const fileTree = buildTreeFromFiles(files);
        importFileTree(fileTree);
    });

    return input;
}

function buildTreeFromFiles(files) {
    const tree = {
        id: 'root',
        name: 'Imported Files',
        type: 'root',
        icon: '💾',
        children: []
    };

    const folderMap = {};

    // First pass: create all folders
    files.forEach(file => {
        const pathParts = file.webkitRelativePath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderPath = pathParts.slice(0, -1);

        // Create folder hierarchy
        let currentPath = '';
        let currentParent = tree;

        folderPath.forEach((folderName, idx) => {
            currentPath += (currentPath ? '/' : '') + folderName;

            if (!folderMap[currentPath]) {
                const folder = {
                    id: 'folder-' + Date.now() + '-' + Math.random(),
                    name: folderName,
                    type: idx === 0 ? 'phase' : 'subtask',
                    isFolder: true,
                    icon: '📁',
                    itemType: 'folder',
                    filePath: currentPath,
                    expanded: false,
                    subItems: [],
                    items: idx === 0 ? [] : undefined
                };

                folderMap[currentPath] = folder;

                if (idx === 0) {
                    // Top-level folder goes in phase
                    tree.children.push({
                        id: 'phase-' + Date.now(),
                        name: folderName,
                        type: 'phase',
                        phase: tree.children.length.toString(),
                        icon: '📁',
                        items: []
                    });
                    currentParent = tree.children[tree.children.length - 1];
                } else {
                    // Nested folder
                    if (currentParent.items) {
                        currentParent.items.push(folder);
                    } else if (currentParent.subItems) {
                        currentParent.subItems.push(folder);
                    }
                    currentParent = folder;
                }
            } else {
                currentParent = folderMap[currentPath];
            }
        });
    });

    // Second pass: add files
    files.forEach(file => {
        const pathParts = file.webkitRelativePath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderPath = pathParts.slice(0, -1).join('/');

        const parentFolder = folderPath ? folderMap[folderPath] : tree;

        const fileNode = {
            id: 'file-' + Date.now() + '-' + Math.random(),
            name: fileName,
            type: 'subtask',
            isFolder: false,
            icon: getFileIcon(fileName, false),
            itemType: getFileType(fileName, false),
            fileExtension: fileName.substring(fileName.lastIndexOf('.')),
            filePath: file.webkitRelativePath,
            fileSize: file.size,
            dateModified: new Date(file.lastModified).toISOString(),
            mimeType: file.type,
            permissions: 'Read/Write'
        };

        if (parentFolder.items) {
            parentFolder.items.push(fileNode);
        } else if (parentFolder.subItems) {
            parentFolder.subItems.push(fileNode);
        }
    });

    return tree;
}

function importFileTree(tree) {
    // Merge imported tree into capexTree
    if (!capexTree.children) capexTree.children = [];

    tree.children.forEach(phase => {
        capexTree.children.push(phase);
    });

    render();
    alert(`Imported ${tree.children.length} folders successfully!`);
}
```

**UI Button**:
```html
<button onclick="importLocalDirectory()" class="btn">
    📂 Import Local Folder
</button>
```

### 5.2 Google Drive API Integration

**Requirements**:
- Google Drive API key
- OAuth 2.0 authentication
- Scopes: `https://www.googleapis.com/auth/drive.readonly`

**Implementation Overview**:

```javascript
async function importFromGoogleDrive() {
    const API_KEY = getLocalAPIKey('google');
    const CLIENT_ID = 'YOUR_CLIENT_ID'; // User must provide

    // Initialize Google API client
    gapi.load('client:auth2', async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.readonly'
        });

        // Authenticate
        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance.isSignedIn.get()) {
            await authInstance.signIn();
        }

        // Fetch files
        const response = await gapi.client.drive.files.list({
            pageSize: 1000,
            fields: 'files(id, name, mimeType, size, modifiedTime, createdTime, parents, owners, permissions, webViewLink)'
        });

        const files = response.result.files;
        const driveTree = buildGoogleDriveTree(files);
        importFileTree(driveTree);
    });
}

function buildGoogleDriveTree(files) {
    const fileMap = {};
    const rootFiles = [];

    // Build file map
    files.forEach(file => {
        fileMap[file.id] = {
            id: 'gdrive-' + file.id,
            name: file.name,
            type: 'item',
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
            icon: file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : getFileIcon(file.name),
            itemType: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : getFileType(file.name),
            fileSize: parseInt(file.size) || 0,
            dateModified: file.modifiedTime,
            dateCreated: file.createdTime,
            fileOwner: file.owners ? file.owners[0].emailAddress : '',
            sharedWith: file.permissions ? file.permissions.map(p => p.emailAddress).join(', ') : '',
            fileUrl: file.webViewLink,
            mimeType: file.mimeType,
            driveType: 'Google Drive',
            subItems: [],
            items: []
        };

        if (!file.parents || file.parents.length === 0) {
            rootFiles.push(fileMap[file.id]);
        }
    });

    // Build hierarchy
    files.forEach(file => {
        if (file.parents && file.parents.length > 0) {
            const parentId = file.parents[0];
            const parent = fileMap[parentId];
            const child = fileMap[file.id];

            if (parent && child) {
                if (parent.isFolder) {
                    parent.subItems.push(child);
                }
            }
        }
    });

    return {
        id: 'root',
        name: 'Google Drive',
        type: 'root',
        icon: '☁️',
        children: [{
            id: 'phase-gdrive',
            name: 'My Drive',
            type: 'phase',
            phase: '0',
            icon: '☁️',
            items: rootFiles
        }]
    };
}
```

**Note**: Full Google Drive integration requires complex OAuth flow. Recommend starting with manual JSON import instead.

### 5.3 OneDrive API Integration

Similar to Google Drive, requires Microsoft Graph API:

**Endpoint**: `https://graph.microsoft.com/v1.0/me/drive/root/children`

**Implementation**: Nearly identical to Google Drive, but uses Microsoft authentication.

### 5.4 Manual JSON Import (Recommended Starting Point)

**Simplest approach**: Users can export file listings from command line and import JSON.

**Windows PowerShell Script**:
```powershell
# Export directory tree to JSON
Get-ChildItem -Path "C:\Users\John\Documents" -Recurse |
    Select-Object FullName, Name, Length, Extension, CreationTime, LastWriteTime, Attributes |
    ConvertTo-Json -Depth 100 |
    Out-File "file_tree.json"
```

**macOS/Linux Script**:
```bash
# Export using tree and jq
find /Users/john/Documents -type f -o -type d |
    jq -R -s 'split("\n") | map(select(length > 0))' > file_tree.json
```

**Import Function**:
```javascript
function importFileSystemJSON(jsonData) {
    try {
        const parsedData = JSON.parse(jsonData);
        // Transform to TreeListy format
        const tree = transformJSONToFileTree(parsedData);
        importFileTree(tree);
    } catch (e) {
        alert('Invalid JSON format: ' + e.message);
    }
}
```

---

## 6. Canvas View Behavior

### 6.1 Spatial Layout Strategy

**Concept**: Files and folders in Canvas view should use a **hierarchical tree layout** similar to Tree view, but with more spatial freedom.

**Layout Algorithm**:

```javascript
function layoutFileSystemCanvas(node, x, y, depth) {
    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 120;
    const DEPTH_OFFSET = 250;

    node.canvasX = x + (depth * DEPTH_OFFSET);
    node.canvasY = y;

    let currentY = y;

    if (node.isFolder && node.subItems) {
        node.subItems.forEach((child, idx) => {
            layoutFileSystemCanvas(child, x, currentY, depth + 1);
            currentY += VERTICAL_SPACING;
        });
    }
}
```

### 6.2 Visual Encoding

**Size-based nodes**: Larger files = larger nodes

```javascript
function getNodeSizeForCanvas(fileSize) {
    if (!fileSize) return { width: 160, height: 120 };

    // Log scale for file size visualization
    const logSize = Math.log10(fileSize + 1);
    const baseWidth = 160;
    const baseHeight = 120;

    const scale = 1 + (logSize / 10); // 10 MB = 1x, 100 MB = 1.1x, 1 GB = 1.2x

    return {
        width: baseWidth * scale,
        height: baseHeight * scale
    };
}
```

**Color coding by file type**:

```javascript
const FILE_TYPE_COLORS = {
    'folder': 'rgba(99, 102, 241, 0.2)',      // Purple
    'document': 'rgba(239, 68, 68, 0.2)',     // Red
    'image': 'rgba(34, 197, 94, 0.2)',        // Green
    'video': 'rgba(251, 146, 60, 0.2)',       // Orange
    'audio': 'rgba(168, 85, 247, 0.2)',       // Purple
    'code': 'rgba(59, 130, 246, 0.2)',        // Blue
    'archive': 'rgba(156, 163, 175, 0.2)',    // Gray
    'default': 'rgba(107, 114, 128, 0.2)'     // Neutral gray
};

function getNodeColorForCanvas(itemType) {
    return FILE_TYPE_COLORS[itemType] || FILE_TYPE_COLORS.default;
}
```

### 6.3 Clustering Strategy

**Spatial clustering by folder**: Files in the same folder should be grouped visually.

**Implementation**:
- Folders render as **container boxes** with rounded borders
- Files inside render within the folder boundary
- Drag files between folders to move them

---

## 7. Performance Strategy

### 7.1 Challenges with Large File Systems

**Problem**: A typical user's Documents folder might contain 10,000+ files. Rendering all nodes at once will freeze the browser.

**Solutions**:

#### A. Lazy Loading (Recommended)

Only render visible folders and their immediate children. Load deeper levels on-demand.

```javascript
function renderLazyFileTree(node, maxDepth = 3) {
    if (node.depth > maxDepth && !node.forceRender) {
        return null; // Don't render beyond max depth
    }

    // Render this node
    const nodeElement = renderNode(node);

    // Only render children if expanded
    if (node.expanded && node.subItems) {
        node.subItems.forEach(child => {
            child.depth = (node.depth || 0) + 1;
            renderLazyFileTree(child, maxDepth);
        });
    }

    return nodeElement;
}
```

#### B. Virtual Scrolling

For long lists of files in a single folder, render only visible items in viewport.

```javascript
function virtualScrollFileList(items, scrollTop, viewportHeight) {
    const ITEM_HEIGHT = 40;
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.ceil((scrollTop + viewportHeight) / ITEM_HEIGHT);

    const visibleItems = items.slice(startIndex, endIndex);

    return {
        items: visibleItems,
        offsetTop: startIndex * ITEM_HEIGHT,
        totalHeight: items.length * ITEM_HEIGHT
    };
}
```

#### C. Pagination

Limit files shown per folder to 100, with "Load More" button.

```javascript
const ITEMS_PER_PAGE = 100;

function renderPaginatedFolder(folder) {
    if (!folder.currentPage) folder.currentPage = 1;

    const start = (folder.currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const visibleItems = folder.subItems.slice(start, end);

    return {
        items: visibleItems,
        hasMore: end < folder.subItems.length,
        totalItems: folder.subItems.length
    };
}
```

### 7.2 Search Optimization

**Problem**: Searching 10,000 files is slow.

**Solution**: Build search index on import.

```javascript
function buildSearchIndex(tree) {
    const index = [];

    function traverse(node) {
        index.push({
            id: node.id,
            name: node.name.toLowerCase(),
            path: node.filePath?.toLowerCase() || '',
            type: node.itemType,
            size: node.fileSize,
            node: node
        });

        if (node.subItems) {
            node.subItems.forEach(traverse);
        }
        if (node.items) {
            node.items.forEach(traverse);
        }
    }

    traverse(tree);
    return index;
}

function searchFileSystem(query, index) {
    const lowerQuery = query.toLowerCase();
    return index.filter(entry =>
        entry.name.includes(lowerQuery) ||
        entry.path.includes(lowerQuery)
    );
}
```

### 7.3 Recommended Limits

- **Max files per folder rendered**: 100 (with pagination)
- **Max depth auto-expanded**: 3 levels
- **Max total nodes in Canvas view**: 500 (warn user if exceeded)

---

## 8. Implementation Phases

### Phase 1: Core Pattern Setup (2-3 hours)
1. Add `filesystem` pattern definition to `PATTERNS` object
2. Implement icon mapping functions (`getFileIcon`, `getFileType`)
3. Add file size formatter (`formatFileSize`)
4. Test basic file/folder creation in Tree view

**Deliverable**: Can manually create file system structure with proper icons

### Phase 2: Flexible Depth Architecture (4-5 hours)
1. Modify `render()` function to support unlimited `subItems` nesting
2. Add `isFlexibleDepth` flag to pattern system
3. Update `renameNodesForPattern()` to handle dynamic depth
4. Test deeply nested folder structures (5+ levels)

**Deliverable**: Can create nested folders at any depth

### Phase 3: UI Components (3-4 hours)
1. Implement breadcrumb navigation
2. Add file type filter UI
3. Enhance edit modal with file system fields
4. Add path display component

**Deliverable**: Full UI for navigating and editing file system

### Phase 4: Import Functionality (5-6 hours)
1. Implement HTML5 directory upload (`webkitdirectory`)
2. Create `buildTreeFromFiles()` function
3. Add manual JSON import option
4. Test with real folder structures

**Deliverable**: Can import local folders into TreeListy

### Phase 5: Canvas View Enhancement (4-5 hours)
1. Implement file system canvas layout algorithm
2. Add size-based node sizing
3. Add color coding by file type
4. Implement folder clustering

**Deliverable**: Files/folders render beautifully in Canvas view

### Phase 6: Performance Optimization (3-4 hours)
1. Implement lazy loading (max 3 levels)
2. Add pagination for large folders
3. Build search index system
4. Add loading indicators

**Deliverable**: Can handle 1,000+ file structures smoothly

### Phase 7: Advanced Features (Optional, 6-8 hours)
1. Google Drive API integration
2. OneDrive API integration
3. Export as PowerShell/Bash scripts
4. Duplicate file detection
5. Storage analytics (pie chart of file types)

**Total Estimated Time**: 21-27 hours (without Phase 7)

---

## 9. Code Modifications Required

### 9.1 Pattern System (`PATTERNS` object)

**Location**: Line ~5076

**Change**: Add `filesystem` pattern (see Section 1.1)

### 9.2 Render Function (Tree View)

**Location**: Line ~6014 (`function render()`)

**Change**: Support recursive `subItems` rendering beyond 4 levels

```javascript
function renderSubItems(items, depth = 0) {
    if (!items || items.length === 0) return '';

    return items.map(item => {
        const itemHtml = renderItemNode(item, depth);

        // Recursively render sub-items if they exist
        const nestedHtml = item.subItems ? renderSubItems(item.subItems, depth + 1) : '';

        return itemHtml + nestedHtml;
    }).join('');
}
```

### 9.3 Canvas Rendering

**Location**: Line ~3754 (`function renderCanvas()`)

**Change**: Update `renderNodeAndDescendants()` to handle unlimited depth

```javascript
function renderNodeAndDescendants(node, phase, parentNode, nestingLevel) {
    // Existing code...

    // Support unlimited nesting
    if (node.subItems && node.subItems.length > 0) {
        node.subItems.forEach((subtask, subIdx) => {
            // Position based on nesting level
            if (!subtask.canvasX) {
                subtask.canvasX = (node.canvasX || 0) + 300;
                subtask.canvasY = (node.canvasY || 0) + (subIdx * 100);
            }

            // RECURSION: subtasks can have their own subtasks
            renderNodeAndDescendants(subtask, phase, node, nestingLevel + 1);
        });
    }
}
```

### 9.4 Edit Modal

**Location**: Line ~8638 (`function handleEdit()`)

**Change**: Add file system specific fields to edit modal

```javascript
if (currentPattern === 'filesystem') {
    // Add file system fields
    const fsFields = `
        <div class="form-group">
            <label>
                <input type="checkbox" id="edit-isFolder" ${activeNode.isFolder ? 'checked' : ''}>
                Is Folder
            </label>
        </div>
        <div class="form-group">
            <label>File Size (bytes)</label>
            <input type="number" id="edit-fileSize" value="${activeNode.fileSize || 0}">
        </div>
        <!-- Add other fields... -->
    `;

    body.innerHTML += fsFields;
}
```

### 9.5 Sort System

**Location**: Line ~17060 (`function sortItemsArray()`)

**Change**: Add support for `isFolder` type and extension sorting

```javascript
case 'boolean':
    // Sort by folder vs file
    valA = a === true ? 1 : 0;
    valB = b === true ? 1 : 0;
    break;
```

### 9.6 Icon Mapping System

**Location**: New utility functions (add after line ~5698)

**Change**: Add all icon mapping functions from Section 3.1

### 9.7 Import System

**Location**: New feature (add import button in toolbar)

**Change**: Add directory import functionality from Section 5.1

---

## 10. Key Technical Challenges

### Challenge 1: Breaking the 4-Level Paradigm

**Issue**: TreeListy is architected around `root → phase → item → subtask`. File systems need `root → folder → folder → folder → ... → file` (unlimited depth).

**Solution**:
- Add `isFlexibleDepth: true` flag to pattern
- Modify recursive rendering functions to not assume 4 levels
- Use `subItems` arrays at every level (not just subtasks)

### Challenge 2: Performance with Large Trees

**Issue**: 10,000 files will crash browser if all rendered at once.

**Solution**:
- Lazy loading: only render expanded folders
- Pagination: max 100 items per folder
- Virtual scrolling in Tree view
- Search indexing for fast filtering

### Challenge 3: Folder vs File Distinction

**Issue**: Current system has `type` field (`root`, `phase`, `item`, `subtask`) which doesn't map to files vs folders.

**Solution**:
- Add `isFolder: boolean` field
- Use `itemType` to store file type (`pdf`, `image`, etc.) OR `folder`
- Icons determined by `isFolder` flag + file extension

### Challenge 4: Browser Limitations for File System Access

**Issue**: Browsers cannot read local file system for security reasons.

**Solution**:
- Use `<input webkitdirectory>` for user-initiated uploads
- Provide PowerShell/Bash scripts to export file listings
- Focus on cloud drive APIs (Google Drive, OneDrive) for programmatic access

### Challenge 5: Canvas View Layout for Hierarchical Data

**Issue**: File systems are deeply hierarchical. Canvas view needs to show this clearly without overlapping nodes.

**Solution**:
- Use tree-style layout with horizontal depth offset
- Render folders as container boxes
- Size nodes by file size (log scale)
- Color-code by file type

---

## 11. Future Enhancements

### 11.1 Storage Analytics Dashboard

Add visual analytics panel showing:
- Total storage used (pie chart by file type)
- Largest files/folders
- Duplicate file detection
- File age distribution (how old are files?)

### 11.2 Smart Organization AI

Use Claude API to:
- Suggest better folder organization
- Detect misplaced files (e.g., code files in Documents)
- Auto-tag files based on content
- Generate folder naming conventions

### 11.3 Multi-Drive Comparison

Compare multiple drives side-by-side:
- Google Drive vs OneDrive vs Local
- Identify duplicates across drives
- Sync recommendations

### 11.4 File System Export Scripts

Generate scripts to recreate folder structure:

**PowerShell**:
```powershell
New-Item -Path "C:\Users\John\Documents" -ItemType Directory
New-Item -Path "C:\Users\John\Documents\Projects" -ItemType Directory
# ... etc
```

**Bash**:
```bash
mkdir -p ~/Documents/Projects
mkdir -p ~/Documents/Work
# ... etc
```

---

## 12. Summary of Key Findings

### ✅ Feasibility Assessment

**Highly Feasible** - The File System pattern is achievable within TreeListy's architecture with the following modifications:

1. **Flexible Depth System**: Add `isFlexibleDepth` flag and modify recursive rendering
2. **Import Strategy**: Start with HTML5 directory upload, add cloud APIs later
3. **Performance**: Lazy loading + pagination will handle large file systems
4. **UI Enhancements**: Breadcrumbs, file filters, and size formatting are straightforward additions

### ⚠️ Key Challenges

1. **Architectural Change**: First pattern to break 4-level hierarchy - requires careful refactoring
2. **Performance**: Large file systems (10,000+ files) need optimization from day 1
3. **Import Complexity**: Browser security limits direct file system access
4. **Canvas Layout**: Deeply nested structures need smart spatial layout

### 🎯 Recommended Approach

**Start Simple, Iterate**:
1. **Phase 1-2**: Core pattern with unlimited depth (manual creation only)
2. **Phase 3-4**: UI + local directory import
3. **Phase 5-6**: Canvas view + performance optimization
4. **Phase 7**: Cloud integrations (Google Drive, OneDrive)

### 📊 Implementation Metrics

- **Total Development Time**: 21-27 hours (core features)
- **Lines of Code**: ~800-1,000 new lines
- **Files Modified**: 1 (treeplexity.html)
- **New Dependencies**: None (pure JavaScript)
- **Browser Support**: Modern browsers with ES6+ support

### 💡 Innovation Potential

The File System pattern will:
- **Expand TreeListy's use cases** beyond project management to personal file organization
- **Demonstrate pattern flexibility** - proving TreeListy can handle any hierarchical data
- **Enable new features** - search, analytics, AI-powered organization
- **Attract new users** - anyone managing large file collections

---

## Appendix A: Example File System JSON

```json
{
  "id": "root",
  "name": "My Computer",
  "type": "root",
  "icon": "💻",
  "pattern": {
    "key": "filesystem",
    "labels": {
      "root": "Drive",
      "phase": "Folder",
      "item": "File/Folder",
      "subtask": "File"
    }
  },
  "expanded": true,
  "children": [
    {
      "id": "drive-c",
      "name": "C:\\ (Windows)",
      "subtitle": "Local Disk",
      "type": "phase",
      "phase": "0",
      "icon": "💾",
      "driveType": "Local Drive",
      "fileSize": 500000000000,
      "expanded": true,
      "items": [
        {
          "id": "folder-users",
          "name": "Users",
          "type": "item",
          "isFolder": true,
          "icon": "📁",
          "itemType": "folder",
          "filePath": "C:\\Users",
          "dateModified": "2025-11-16T09:00:00",
          "expanded": true,
          "subItems": [
            {
              "id": "folder-john",
              "name": "John",
              "type": "subtask",
              "isFolder": true,
              "icon": "👤",
              "itemType": "folder",
              "filePath": "C:\\Users\\John",
              "expanded": true,
              "subItems": [
                {
                  "id": "file-report",
                  "name": "Report.pdf",
                  "type": "subtask",
                  "isFolder": false,
                  "icon": "📕",
                  "itemType": "pdf",
                  "fileExtension": ".pdf",
                  "filePath": "C:\\Users\\John\\Report.pdf",
                  "fileSize": 2500000,
                  "dateModified": "2025-11-10T14:22:00",
                  "dateCreated": "2025-11-10T14:20:00"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Appendix B: Required CSS Additions

```css
/* Breadcrumb Navigation */
.breadcrumb-item {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
}

.breadcrumb-item:hover {
    background: rgba(99, 102, 241, 0.1);
}

.breadcrumb-item.active {
    font-weight: 600;
    color: var(--treeplex-primary);
}

.breadcrumb-separator {
    color: var(--text-secondary);
    margin: 0 4px;
}

/* File Type Filter Badges */
.file-type-badge {
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--card-bg);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.file-type-badge:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--treeplex-primary);
}

.file-type-badge.active {
    background: var(--treeplex-primary);
    color: white;
    border-color: var(--treeplex-primary);
}

/* File Size Display */
.file-size-display {
    font-family: monospace;
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}

/* Folder Icons (Open/Closed States) */
.folder-icon-open::before {
    content: '📂';
}

.folder-icon-closed::before {
    content: '📁';
}
```

---

**End of Implementation Plan**

Total Pages: 26
Total Sections: 12 + 2 Appendices
Estimated Reading Time: 45 minutes

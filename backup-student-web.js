/**
 * ============================================================
 * Student Web 自动备份脚本
 * ============================================================
 *
 * 功能说明：
 * - 将 student-web/src/ 下所有 .ts/.tsx 文件按规则备份到 backup/student-web/
 * - 严格遵循 backup-rule.mdc 中的目录结构和命名规则
 * - 仅备份源文件，不备份 node_modules、.env、credentials 等
 *
 * 使用方法：
 *   node backup-student-web.js
 *
 * ============================================================
 */

// ============================================================
// 1. 引入所需模块
// ============================================================
const fs = require('fs');
const path = require('path');

// ============================================================
// 2. 定义路径常量（使用绝对路径）
// ============================================================
const ROOT_DIR = 'C:\\Users\\Admin\\teacher_and_student'; // 项目根目录
const STUDENT_SRC = path.join(ROOT_DIR, 'student-web', 'src');
const BACKUP_ROOT = path.join(ROOT_DIR, 'backup', 'student-web');

// ============================================================
// 3. 定义源目录 -> 备份目录映射（遵循 backup-rule.mdc）
// ============================================================
const DIR_MAP = {
    'auth':         'auth',
    'pages':        'pages',
    'components':   'components',
    'services':     'services',
    'context':      'other',   // context 映射到 other/
    'utils':        'other',   // utils 映射到 other/
    'login':        'login',  // login 子目录（如果有）
};

// ============================================================
// 4. 备份文件名转换函数
// ============================================================

/**
 * 将源文件名转换为备份文件名
 * 例如：Login.tsx -> Login.backup.tsx
 *       authService.ts -> authService.backup.ts
 *
 * @param {string} filename - 源文件名
 * @returns {string} - 备份文件名
 */
function toBackupFilename(filename) {
    const ext = path.extname(filename); // .tsx 或 .ts
    const name = path.basename(filename, ext); // 不带扩展名的文件名
    return `${name}.backup${ext}`;
}

// ============================================================
// 5. 将已存在的 backup 改名：*.backup -> *.backup-prev
// ============================================================

/**
 * 将已存在的 .backup 文件重命名为 .backup-prev（备份旧版本）
 * 例如：Login.backup.tsx -> Login.backup-prev.tsx
 *
 * @param {string} dirPath - 备份目录路径
 */
function rotatePrevBackups(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        // 匹配 *.backup.ts 或 *.backup.tsx 文件
        const match = file.match(/^(.+)\.backup\.(ts|tsx)$/);
        if (match) {
            const prevName = `${match[1]}.backup-prev.${match[2]}`;
            const srcPath = path.join(dirPath, file);
            const dstPath = path.join(dirPath, prevName);

            // 如果 backup-prev 已经存在，先删除
            if (fs.existsSync(dstPath)) {
                fs.unlinkSync(dstPath);
                console.log(`  [删除旧 prev] ${prevName}`);
            }

            fs.renameSync(srcPath, dstPath);
            console.log(`  [轮转旧备份] ${file} -> ${prevName}`);
        }
    }
}

// ============================================================
// 6. 复制源文件到备份目录
// ============================================================

/**
 * 复制单个源文件到备份目录
 *
 * @param {string} srcPath - 源文件完整路径
 * @param {string} dstDir  - 目标备份目录
 */
function backupFile(srcPath, dstDir) {
    const filename = path.basename(srcPath);
    const backupFilename = toBackupFilename(filename);
    const dstPath = path.join(dstDir, backupFilename);

    // 确保目标目录存在
    if (!fs.existsSync(dstDir)) {
        fs.mkdirSync(dstDir, { recursive: true });
    }

    // 读取源文件内容并写入备份目录
    const content = fs.readFileSync(srcPath, 'utf-8');
    fs.writeFileSync(dstPath, content, 'utf-8');

    console.log(`  [备份] ${filename} -> ${backupFilename}`);
}

// ============================================================
// 7. 扫描并备份指定目录下所有 .ts/.tsx 文件
// ============================================================

/**
 * 递归扫描目录，将所有 .ts/.tsx 文件备份到对应的 backup 目录
 *
 * @param {string} srcDir     - 源目录（student-web/src/xxx）
 * @param {string} backupCat   - 备份分类（auth, pages, components...）
 */
function scanAndBackup(srcDir, backupCat) {
    if (!fs.existsSync(srcDir)) {
        console.log(`[跳过] 源目录不存在: ${srcDir}`);
        return;
    }

    // 构建对应的备份目录
    const backupDir = path.join(BACKUP_ROOT, DIR_MAP[backupCat] || backupCat);

    console.log(`\n▶ 处理: ${srcDir} -> ${backupDir}`);

    // Step 1: 轮转旧备份（.backup -> .backup-prev）
    rotatePrevBackups(backupDir);

    // Step 2: 扫描源文件并备份
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    let count = 0;
    for (const entry of entries) {
        const fullPath = path.join(srcDir, entry.name);

        if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            // 排除非源文件
            if (entry.name === 'vite-env.d.ts') {
                console.log(`  [跳过] ${entry.name} (类型定义文件，不需要备份)`);
                continue;
            }

            backupFile(fullPath, backupDir);
            count++;
        } else if (entry.isDirectory()) {
            // 如果有子目录，递归处理
            // 例如：pages/ 子目录 -> 也放在 pages/ 下
            scanAndBackup(fullPath, backupCat);
        }
    }

    if (count === 0) {
        console.log(`  (该目录下无 .ts/.tsx 文件需要备份)`);
    }
}

// ============================================================
// 8. 主流程
// ============================================================

function main() {
    console.log('==================================================');
    console.log('  Student Web 自动备份工具');
    console.log('  遵循 backup-rule.mdc 规则');
    console.log('==================================================\n');

    // 定义需要备份的源目录
    const categories = [
        { src: path.join(STUDENT_SRC, 'pages'),     cat: 'pages' },
        { src: path.join(STUDENT_SRC, 'components'), cat: 'components' },
        { src: path.join(STUDENT_SRC, 'services'),   cat: 'services' },
        { src: path.join(STUDENT_SRC, 'context'),    cat: 'context' },
        { src: path.join(STUDENT_SRC, 'utils'),      cat: 'utils' },
        { src: path.join(STUDENT_SRC, 'auth'),       cat: 'auth' },
        { src: path.join(STUDENT_SRC, 'login'),      cat: 'login' },
    ];

    // 确保 backup/student-web 根目录存在
    if (!fs.existsSync(BACKUP_ROOT)) {
        fs.mkdirSync(BACKUP_ROOT, { recursive: true });
    }

    // 遍历所有目录进行备份
    for (const { src, cat } of categories) {
        scanAndBackup(src, cat);
    }

    console.log('\n==================================================');
    console.log('  备份完成！');
    console.log('==================================================\n');

    // 列出备份结果
    console.log('📁 当前备份文件列表：');
    listBackups(BACKUP_ROOT);
}

/**
 * 递归列出备份目录中的所有文件
 */
function listBackups(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            console.log(`${prefix}📂 ${entry.name}/`);
            listBackups(fullPath, prefix + '  ');
        } else {
            console.log(`${prefix}📄 ${entry.name}`);
        }
    }
}

// ============================================================
// 9. 运行
// ============================================================
main();

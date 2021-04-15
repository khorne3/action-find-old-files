"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = require("fs");
const path_1 = require("path");
const core_1 = require("@actions/core");
const FILES = 'stale-docs.json';
const DIRS = JSON.parse(core_1.getInput('dirs'));
const MIN_AGE = parseInt(core_1.getInput('minAge'));
/**
 * Read files from directory recursively
 */
function getFiles(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dirPath = path_1.join(process.env.GITHUB_WORKSPACE, dir);
            const items = yield fs_1.promises.readdir(dirPath, { withFileTypes: true });
            const files = yield Promise.all(items.map((item) => __awaiter(this, void 0, void 0, function* () {
                const path = `${dir}/${item.name}`;
                const fullPath = path_1.join(process.env.GITHUB_WORKSPACE, dir, item.name);
                const res = yield fs_1.promises.lstat(fullPath);
                return res.isDirectory() ? getFiles(path) : path;
            })));
            return Array.prototype.concat(...files);
        }
        catch (error) {
            console.error(`Get files ${error}`);
        }
    });
}
/**
 * Find docs
 */
function findStaleDocs() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {};
        try {
            for (const dir of DIRS) {
                const files = yield getFiles(dir);
                for (const file of files) {
                    // Skip mirrors, check only Markdown files
                    if (path_1.basename(file).indexOf('mirror') > -1 || !file.endsWith('.md'))
                        continue;
                    const output = parseInt(child_process_1.default.execSync('git log -1 --pretty="format:%ct" ' + file, { encoding: 'utf8' }));
                    const age = Math.round((Date.now() / 1000 - output) / 86400);
                    if (age >= MIN_AGE) {
                        result[file] = age;
                    }
                }
            }
        }
        catch (error) {
            console.error(`Find stale docs ${error}`);
        }
        core_1.debug('result: ' + JSON.stringify(result));
        return result;
    });
}
/**
 * Main function
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield findStaleDocs();
        core_1.debug('files: ' + files);
        core_1.debug('files: ' + JSON.stringify(files));
        yield fs_1.promises.writeFile(FILES, JSON.stringify(files, null, 4));
        core_1.setOutput('files', FILES);
        console.log(`Finished: ${FILES}`);
    });
}
try {
    run();
}
catch (err) {
    console.error(err);
}

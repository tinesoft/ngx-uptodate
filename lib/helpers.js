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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const hash = require("object-hash");
const io_util_1 = require("@actions/io/lib/io-util");
class Helpers {
    static timeout(millis) {
        return new Promise((resolve, reject) => setTimeout(resolve, millis));
    }
    static isFileExists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield io_util_1.exists(filePath);
        });
    }
    static isFolderEmpty(folderPath) {
        return fs.readdirSync(folderPath).length == 0;
    }
    /**
     * Makes sure that the given project as a `node_modules` folder, installs it otherwise
     * @param projectPath project path
     * @param force if true, will always install node modules (via `npm ci`) no matter if one already exits
     */
    static ensureNodeModules(projectPath, force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!force) {
                const nodeModulesPath = path.normalize(path.join(projectPath, 'node_modules'));
                const hasNodeModules = yield io_util_1.exists(nodeModulesPath);
                if (hasNodeModules)
                    return;
            }
            let options = {
                cwd: projectPath
            };
            const useYarn = Helpers.isFileExists(path.join(projectPath, 'yarn.lock'));
            yield (useYarn ? exec.exec('yarn', ['install'], options) : exec.exec('npm', ['ci'], options));
        });
    }
    static getLocalNgExecPath(baseDir) {
        return path.normalize(path.join(baseDir, 'node_modules', '@angular', 'cli', 'bin', 'ng'));
    }
    static getPrBody(body, ngUpdateOutput) {
        return body.replace('${ngUpdateOutput}', ngUpdateOutput);
    }
    static getPrLabels(labels) {
        return Helpers.toList(labels);
    }
    static getPrAssignees(assignees) {
        return Helpers.toList(assignees);
    }
    static getPrReviewers(reviewers) {
        return Helpers.toList(reviewers);
    }
    static toList(value) {
        return value ? value.split(/,\s*/) : [];
    }
    static computeSha1(obj) {
        return hash(obj, { algorithm: 'sha1', unorderedArrays: true });
    }
}
exports.Helpers = Helpers;

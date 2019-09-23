"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
const core = __importStar(require("@actions/core"));
const helpers_1 = require("./helpers");
class PackageToUpdate {
    constructor(name, oldVersion, newVersion) {
        this.name = name;
        this.oldVersion = oldVersion;
        this.newVersion = newVersion;
    }
}
exports.PackageToUpdate = PackageToUpdate;
class NgUpdateService {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    runUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            let ngUpdateOutput = '';
            let ngUpdateErrorOutput = '';
            const ngUpdateOptions = {
                listeners: {
                    stdout: (data) => ngUpdateOutput += data.toString(),
                    stderr: (data) => ngUpdateErrorOutput = data.toString()
                },
                cwd: this.projectPath
            };
            const npmRegistry = core.getInput('npm-registry');
            const ngUpdateArgs = npmRegistry ? [`registry=${npmRegistry}`] : [];
            core.debug(`🤖 Ensuring NPM modules are installed under '${this.projectPath}'...`);
            yield helpers_1.Helpers.ensureNodeModules(this.projectPath, process.env['FORCE_INSTALL_NODE_MODULES'] === 'true');
            core.debug(`🤖 Running initial 'ng update${ngUpdateArgs}'...`);
            const ngExec = helpers_1.Helpers.getNgExecPath(this.projectPath);
            yield exec.exec(`"${ngExec}"`, ['update', ...ngUpdateArgs], ngUpdateOptions);
            if (ngUpdateOutput.indexOf(NgUpdateService.NO_UPDATE_FOUND) > 0) {
                core.info('🤖 Congratulations 👏, you are already using the latest version of Angular!');
                return { packages: [], ngUpdateOutput, ngUpdateErrorOutput };
            }
            else if (ngUpdateOutput.indexOf(NgUpdateService.UPDATE_FOUND) > 0) {
                const ngUpdateRegEx = /\s+([@/a-zA-Z0-9]+)\s+(\d+\.\d+\.\d+)\s+->\s+(\d+\.\d+\.\d+)\s+ng update/gm;
                let pkgsToUpdate = [];
                for (let match; (match = ngUpdateRegEx.exec(ngUpdateOutput));) {
                    pkgsToUpdate.push(new PackageToUpdate(match[1], match[2], match[3]));
                }
                if (pkgsToUpdate.length) {
                    core.debug(`🤖 Updating outdated ng dependencies: ${pkgsToUpdate.map(p => `'${p.name}'`)}...`);
                    const ngUpdatePkgsArgs = [...ngUpdateArgs, ...(pkgsToUpdate.map(p => p.name))];
                    const ngUpdatePkgsOptions = {
                        cwd: this.projectPath
                    };
                    yield exec.exec(`"${ngExec}"`, ['update', ...ngUpdatePkgsArgs], ngUpdatePkgsOptions);
                }
                return { packages: pkgsToUpdate, ngUpdateOutput, ngUpdateErrorOutput };
            }
            if (ngUpdateErrorOutput.length) {
                core.warning('🤖 It looks like the "ng update" command failed.');
                core.warning(ngUpdateErrorOutput);
            }
            return { packages: [], ngUpdateOutput, ngUpdateErrorOutput };
        });
    }
}
NgUpdateService.NO_UPDATE_FOUND = '    We analyzed your package.json and everything seems to be in order. Good work!';
NgUpdateService.UPDATE_FOUND = '    We analyzed your package.json, there are some packages to update:';
exports.NgUpdateService = NgUpdateService;

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
const promise_1 = __importDefault(require("simple-git/promise"));
class GitService {
    constructor(repoDir) {
        this.repoDir = repoDir;
        this.git = promise_1.default(repoDir);
    }
    clone(repoUrl, depth) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.clone(repoUrl, Object.assign({}, (depth && { '--depth': depth })));
        });
    }
    init(remoteUrl, authorName, authorEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.addConfig('user.name', authorName);
            yield this.git.addConfig('user.email', authorEmail);
            yield this.git.remote(['set-url', 'origin', remoteUrl]);
        });
    }
    hasChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.git.status();
            return !status.isClean();
        });
    }
    remoteBranchExists(branch) {
        return __awaiter(this, void 0, void 0, function* () {
            const remotes = yield this.git.branch(['-r']);
            return remotes.all.includes(`origin/${branch}`);
        });
    }
    checkoutBranch(branch) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.checkout(branch);
        });
    }
    cleanCheckoutBranch(branch, baseBranch, remoteExists) {
        return __awaiter(this, void 0, void 0, function* () {
            if (remoteExists) {
                yield this.git.stash(['--include-untracked']);
                yield this.git.checkout(branch);
                yield this.git.reset(['--hard', `origin/${baseBranch}`]);
                try {
                    yield this.git.stash(['pop']);
                }
                catch (e) {
                    console.error(`error when unstashing: ${e.message}`);
                    yield this.git.checkout(['--theirs', '.']);
                    yield this.git.reset();
                }
            }
            else {
                yield this.git.checkoutBranch(branch, `origin/${baseBranch}`);
            }
        });
    }
    raw(commands) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.git.raw(commands);
        });
    }
    shortenSha1(sha1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.git.revparse(['--short', sha1]);
        });
    }
    commit(message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.add("./*");
            yield this.git.commit(message);
        });
    }
    push(branch, force) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.push('origin', branch, Object.assign({ '--set-upstream': null }, (force && { '--force': null })));
        });
    }
}
exports.GitService = GitService;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
    initGit(remoteUrl, authorName, authorEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.addConfig('user.name', authorName);
            yield this.git.addConfig('user.email', authorEmail);
            yield this.git.remote(['set-url', 'origin', remoteUrl]);
        });
    }
    static init(repoDir, remoteUrl, authorName, authorEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new GitService(repoDir);
            yield client.initGit(remoteUrl, authorName, authorEmail);
            return client;
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
            const remotes = yield this.git.getRemotes(false);
            return !!remotes.find(r => r.name == `origin/${branch}`);
        });
    }
    clone() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.clone(this.repoDir);
        });
    }
    checkoutBranch(branch, remoteExists) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.git.fetch("origin");
            if (remoteExists) {
                yield this.git.stash(['--include-untracked']);
                yield this.git.checkout(branch);
                try {
                    this.git.stash(['pop']);
                }
                catch (e) {
                    this.git.checkout(['--theirs', '.']);
                    this.git.reset();
                }
            }
            else if (remoteExists === false)
                this.git.checkoutBranch(branch, 'HEAD');
            else //undefined, simply checkout the existing branch
                this.git.checkout(branch);
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
            yield this.git.push("origin", branch, [...(force ? ['--force'] : []), '--set-upstream']);
        });
    }
}
exports.GitService = GitService;

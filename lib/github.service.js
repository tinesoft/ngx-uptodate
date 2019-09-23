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
const core = __importStar(require("@actions/core"));
class PullRequestService {
    constructor(gbClient, context) {
        this.gbClient = gbClient;
        this.context = context;
        this.repoPath = `${context.repo.owner}/${context.repo.repo}`;
        this.owner = context.repo.owner;
        this.repo = context.repo.repo;
    }
    shouldIgnoreEvent(baseBranch) {
        if (this.context.eventName == "push") {
            if (this.context.ref !== `refs/heads/${baseBranch}`) {
                core.debug(`🤖 Ignoring events not originating from base branch '${baseBranch}' (was '${this.context.ref}').`);
                return true;
            }
            // Ignore push events on deleted branches
            // The event we want to ignore occurs when a PR is created but the repository owner decides
            // not to commit the changes. They close the PR and delete the branch. This creates a
            // "push" event that we want to ignore, otherwise it will create another branch and PR on
            // the same commit.
            const deleted = this.context.payload['deleted'];
            if (deleted === 'true') {
                core.debug('🤖 Ignoring delete branch event.');
                return true;
            }
        }
        return false;
    }
    getOpenPR(base, head) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.gbClient.pulls.list({
                owner: this.owner,
                repo: this.repo,
                state: 'open',
                base,
                head
            });
            for (let i = 0; i < res.data.length; i++)
                return res.data[i].number;
            return null;
        });
    }
    createPR(base, head, title, body, assignees, reviewers, labels) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const createdPR = yield this.gbClient.pulls.create({
                    owner: this.owner,
                    repo: this.repo,
                    head,
                    base,
                    maintainer_can_modify: false,
                    title,
                    body
                });
                const prNumber = createdPR.data.number;
                core.debug(`🤖 [${this.repoPath}]#${prNumber} Created pull request`);
                yield this.gbClient.issues.update({
                    owner: this.owner,
                    repo: this.repo,
                    issue_number: prNumber,
                    assignees,
                    labels,
                    body
                });
                yield this.addReviewers(prNumber, reviewers);
                core.debug(`🤖 [${this.repoPath}]#${prNumber} Updated pull request`);
                return prNumber;
            }
            catch (error) {
                core.error(`🤖 [${this.repoPath}] Create PR from ${head} failed`);
                core.setFailed(error);
                return null;
            }
        });
    }
    addReviewers(prNumber, reviewers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!prNumber || !reviewers || reviewers.length === 0)
                return null;
            return this.gbClient.pulls.createReviewRequest({
                owner: this.owner,
                repo: this.repo,
                pull_number: prNumber,
                reviewers
            });
        });
    }
}
exports.PullRequestService = PullRequestService;

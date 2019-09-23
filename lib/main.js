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
const github = __importStar(require("@actions/github"));
const path = __importStar(require("path"));
const github_service_1 = require("./github.service");
const ngupdate_service_1 = require("./ngupdate.service");
const git_service_1 = require("./git.service");
const helpers_1 = require("./helpers");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const repo = `${context.repo.owner}/${context.repo.repo}`;
            const repoToken = core.getInput('repo-token');
            const baseBranch = core.getInput('base-branch');
            const remoteUrl = `https://x-access-token:${repoToken}@github.com/${repo}`;
            const repoDir = process.env.GITHUB_WORKSPACE || ''; //TODO: if empty, manually checkout project
            const authorName = 'ngx-uptodate[bot]';
            const authorEmail = `ngx-uptodate@users.noreply.github.com`;
            const projectPath = path.normalize(path.join(repoDir, core.getInput('project-path')));
            const gbClient = new github.GitHub(repoToken);
            const ngService = new ngupdate_service_1.NgUpdateService(projectPath);
            const gitService = yield git_service_1.GitService.init(repoDir, remoteUrl, authorName, authorEmail);
            const gbService = new github_service_1.PullRequestService(gbClient, context);
            core.debug(`🤖 Checking if received Github event should be ignored...`);
            if (gbService.shouldIgnoreEvent(baseBranch)) {
                return;
            }
            if (helpers_1.Helpers.isFolderEmpty(repoDir)) {
                core.warning(`🤖 Repo directory at: '${repoDir}' is empty. Did you forget to add a '@actions/checkout' step in your Workflow?`);
                core.debug(`🤖 That's alright, i will check the repository out for you, human friend!`);
                yield gitService.clone();
            }
            core.debug(`🤖 Moving git head to base branch: ${baseBranch}`);
            yield gitService.checkoutBranch(baseBranch);
            const ngFilePath = path.join(projectPath, 'angular.json');
            const isNgProject = yield helpers_1.Helpers.isFileExists(ngFilePath);
            if (!isNgProject) {
                core.warning(`🤖 Could not detect an Angular CLI project under "${projectPath}", exiting`);
                return;
            }
            core.info(`🤖 All prerequisite are done. Trying to ng update your code now...`);
            const ngUpdateResult = yield ngService.runUpdate();
            if (gitService.hasChanges()) {
                const prTitle = core.getInput('pr-title');
                const prBranchPrefix = core.getInput('pr-branch-prefix');
                const prBody = helpers_1.Helpers.getPrBody(core.getInput('pr-body'), ngUpdateResult.ngUpdateOutput);
                const prLabels = helpers_1.Helpers.getPrAssignees(core.getInput('pr-labels'));
                const prAssignees = helpers_1.Helpers.getPrAssignees(core.getInput('pr-assignees'));
                const prReviewers = helpers_1.Helpers.getPrReviewers(core.getInput('pr-reviewers'));
                const ngUpdateSha1 = yield gitService.shortenSha1(helpers_1.Helpers.computeSha1(ngUpdateResult));
                const prBranch = `${prBranchPrefix.substring(0, prBranchPrefix.lastIndexOf('-'))}-${ngUpdateSha1}`;
                core.debug(`🤖 PR branch will be : ${prBranch}`);
                const remotePrBranchExists = yield gitService.remoteBranchExists(prBranch);
                core.debug(`🤖 Moving git head to pr branch: ${prBranch}`);
                yield gitService.checkoutBranch(prBranch, remotePrBranchExists);
                core.debug(`🤖 Committing changes to branch: '${prBranch}'`);
                yield gitService.commit(prTitle);
                core.debug(`🤖 Pushing changes to pr branch: '${prBranch}'`);
                yield gitService.push(prBranch, remotePrBranchExists); // will updated existing pr 
                core.debug(`🤖 Checking for existing open PR from '${prBranch}' to '${baseBranch}'...`);
                let prNumber = yield gbService.getOpenPR(baseBranch, prBranch);
                if (prNumber) {
                    core.debug(`🤖 PR from branch '${prBranch}' to '${baseBranch}' already existed (#${prNumber}). It's been simply updated.`);
                }
                else {
                    core.debug(`🤖 Creating PR from branch '${prBranch}' to '${baseBranch}'`);
                    prNumber = yield gbService.createPR(baseBranch, prBranch, prTitle, prBody, prAssignees, prReviewers, prLabels);
                }
                if (prNumber)
                    core.setOutput('pr-number', `'${prNumber}'`);
            }
            else
                core.info(`🤖 Running 'ng update' has produced no change in your code, you must be up-to-date already 👏!`);
            core.setOutput('ng-update-result', JSON.stringify(ngUpdateResult.packages));
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
